from fastapi import FastAPI, HTTPException, status, Depends, Header, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import json
import os
import shutil
import requests
from fastapi.responses import StreamingResponse
from google.oauth2 import service_account
import stripe
from firebase_functions import https_fn
from a2wsgi import ASGIMiddleware
from flask import Response as FlaskResponse
import logging

logger = logging.getLogger(__name__)

# Lazy Service Registry
class ServiceRegistry:
    def __init__(self):
        self._logic_engine = None
        self._rag_service = None
        self._asset_studio = None
        self._deck_assembler = None
        self._pdf_service = None
        self._user_service = None
        self._stripe_service = None

    @property
    def logic_engine(self):
        if self._logic_engine is None:
            from app.services.logic_engine import LogicEngine
            self._logic_engine = LogicEngine()
        return self._logic_engine

    @property
    def rag_service(self):
        if self._rag_service is None:
            from app.services.rag_service import RagService
            self._rag_service = RagService()
        return self._rag_service

    @property
    def asset_studio(self):
        if self._asset_studio is None:
            from app.services.asset_studio import AssetStudio
            self._asset_studio = AssetStudio()
        return self._asset_studio

    @property
    def deck_assembler(self):
        if self._deck_assembler is None:
            from app.services.deck_assembler import PitchDeckAssembler
            self._deck_assembler = PitchDeckAssembler()
        return self._deck_assembler

    @property
    def pdf_service(self):
        if self._pdf_service is None:
            from app.services.pdf_service import PDFService
            self._pdf_service = PDFService()
        return self._pdf_service

    @property
    def user_service(self):
        if self._user_service is None:
            from app.services.user_service import UserService
            self._user_service = UserService()
        return self._user_service

    @property
    def stripe_service(self):
        if self._stripe_service is None:
            from app.services.stripe_service import StripeService
            self._stripe_service = StripeService(self.user_service)
        return self._stripe_service

services = ServiceRegistry()

from app.utils.firebase_auth_utils import verify_token, get_firestore_db, initialize_firebase_admin, get_current_user, verify_project_ownership
from app.routers import onboarding, users, pitchdeck, script, bible, manual, public, billing

# Initialize Firebase Admin SDK (v2 bridge)
initialize_firebase_admin()

# Arc Studio API - Initialized with Security Hardening
app = FastAPI(title="Arc Studio API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5000",
        "https://arc-studio-box.web.app",
        "https://arc-studio-box.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router)
app.include_router(users.router)
app.include_router(pitchdeck.router)
app.include_router(script.router)
app.include_router(bible.router)
app.include_router(manual.router)
app.include_router(public.router)
app.include_router(billing.router)

@app.get("/")
async def root():
    return {"message": "Hello World - Arc Studio API (FastAPI) is live"}

# --- Universe Management Endpoints ---
class UniverseResponse(BaseModel):
    name: str

@app.get("/api/universes", response_model=List[UniverseResponse])
async def list_universes(user_id: str = Depends(get_current_user)):
    db = get_firestore_db()
    universes_ref = db.collection("universes").where("owner_id", "==", user_id)
    universes = []
    for doc in universes_ref.stream():
        data = doc.to_dict()
        universes.append(UniverseResponse(name=data.get("name", doc.id)))
    if not universes:
        universes.append(UniverseResponse(name="My First Universe"))
    return universes

class UpdateAnchorRequest(BaseModel):
    universe_id: str
    project_id: str
    character_name: str
    anchor_url: str

@app.post("/api/project/character/update_anchor")
async def update_character_anchor(request: UpdateAnchorRequest, user_id: str = Depends(get_current_user)):
    db = get_firestore_db()
    try:
        project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
        project_doc = project_ref.get()
        
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
            
        data = project_doc.to_dict()
        characters = data.get("characters", [])
        
        # Update the specific character's anchor
        updated_characters = []
        for char in characters:
            if char.get("name") == request.character_name:
                char["anchor_url"] = request.anchor_url
            updated_characters.append(char)
            
        project_ref.update({"characters": updated_characters})
        return {"status": "success", "message": f"Anchor locked for {request.character_name}"}
    except Exception as e:
        logger.error(f"Failed to lock anchor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Project Management Endpoints ---
class ProjectResponse(BaseModel):
    id: str
    name: str
    title: Optional[str] = None
    logline: Optional[str] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    teaser_url: Optional[str] = None
    bible_content: Optional[str] = None
    created_at: Optional[Any] = None
    characters: Optional[List[Dict[str, Any]]] = None
    beat_sheet_data: Optional[Dict[str, Any]] = None
    source_material: Optional[str] = None

@app.get("/api/project/{universe_name}/{project_id}", response_model=ProjectResponse)
async def get_project_details(universe_name: str, project_id: str, user_id: str = Depends(get_current_user)):
    project_config = await verify_project_ownership(universe_name, project_id, user_id)
        
    return ProjectResponse(
        id=project_id,
        name=project_config.get('title', project_id),
        title=project_config.get('title', project_id),
        logline=project_config.get('logline'),
        genre=project_config.get('genre'),
        poster_url=project_config.get('poster_url'),
        teaser_url=project_config.get('teaser_url'),
        bible_content=project_config.get('bible_content'),
        created_at=project_config.get('created_at'),
        characters=project_config.get('characters'),
        beat_sheet_data=project_config.get('beat_sheet_data'),
        source_material=project_config.get('source_material')
    )

# --- Scene & Critique Endpoints ---
class SceneRequest(BaseModel):
    scene_text: str
    persona: Optional[str] = "market_viability"
    universe_name: Optional[str] = "default" 
    project_id: Optional[str] = "default" 

@app.post("/api/critique")
async def critique_scene(request: SceneRequest, user_id: str = Depends(get_current_user)):
    if not request.scene_text:
        raise HTTPException(status_code=400, detail="No scene text provided")
    
    from app.services.bible_manager import BibleManager
    bible_manager = BibleManager(universe_name=request.universe_name, project_id=request.project_id) 
    bible_context = bible_manager.get_context_string()

    critique_result = services.logic_engine.critique_scene(
        scene_text=request.scene_text, 
        persona_prompt=request.persona, 
        bible_context=bible_context
    )
    return {
        "critique": critique_result["critique"], 
        "score": critique_result["score"], 
        "persona_used": request.persona,
        "tension_curve": critique_result.get("tension_curve"),
        "analysis_details": critique_result.get("analysis_details")
    }

# --- Asset Generation ---
class AssetRequest(BaseModel):
    type: str 
    description: Optional[str] = None
    title: Optional[str] = None
    style: Optional[str] = None
    tagline: Optional[str] = None
    genre: Optional[str] = None
    universe_id: Optional[str] = None
    project_id: Optional[str] = None

@app.post("/api/assets/generate")
async def generate_asset(request: AssetRequest, user_id: str = Depends(get_current_user)):
    cost = 10 
    await services.user_service.deduct_credits(user_id, cost)
    
    if request.type == 'poster':
        base64_data = services.asset_studio.generate_poster(
            title=request.title or "Untitled",
            tagline=request.tagline or "",
            genre=request.genre or "Drama",
            style=request.style
        )
        if not base64_data:
            raise HTTPException(status_code=500, detail="Generation failed")
        return {"b64_data": base64_data}
        
    elif request.type == 'character_concepts':
        # Step 8: System returns 4 headshots
        variants = services.asset_studio.generate_character_anchor(
            description=request.description or "",
            style=request.style
        )
        if not variants:
            raise HTTPException(status_code=500, detail="Character generation failed")
        
        return {"variants": variants}
        
    return {"error": "Invalid type"}

class RegenerateRequest(BaseModel):
    universe_id: str
    project_id: str
    type: str # 'poster' | 'character'
    character_name: Optional[str] = None

@app.post("/api/assets/regenerate")
async def regenerate_asset(request: RegenerateRequest, user_id: str = Depends(get_current_user)):
    cost = 25 # Regeneration is more expensive
    await services.user_service.deduct_credits(user_id, cost)
    
    try:
        db = get_firestore_db()
        project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
        project_doc = project_ref.get()
        
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        data = project_doc.to_dict()
        
        if request.type == 'poster':
            # Step 9: Consistent Poster Logic
            # 1. Look for locked anchors in the character list
            characters = data.get("characters", [])
            image_references = []
            for char in characters:
                anchor_url = char.get("anchor_url")
                if anchor_url and 'placehold.co' not in anchor_url:
                    # Fetch image and convert to B64 for reference
                    try:
                        resp = requests.get(anchor_url)
                        if resp.ok:
                            image_references.append(base64.b64encode(resp.content).decode('utf-8'))
                    except:
                        logger.warning(f"Failed to fetch anchor for {char.get('name')}")

            base64_data = services.asset_studio.generate_poster(
                title=data.get("title", "Untitled"),
                tagline=data.get("logline", ""),
                genre=data.get("genre", "Drama"),
                style=data.get("vibe", "Cinematic"),
                image_references=image_references
            )
            if not base64_data: raise HTTPException(status_code=500, detail="Poster generation failed")
            return {"b64_data": base64_data}
            
        elif request.type == 'character' and request.character_name:
            characters = data.get("characters", [])
            char_data = next((c for c in characters if c.get("name") == request.character_name), None)
            
            if not char_data:
                raise HTTPException(status_code=404, detail="Character not found")
                
            # Step 8 Sync: Regeneration also returns 4 variants for selection
            variants = services.asset_studio.generate_character_anchor(
                description=char_data.get("description", ""),
                style=data.get("vibe", "Cinematic")
            )
            if not variants: raise HTTPException(status_code=500, detail="Character anchor generation failed")
            return {"variants": variants}
            
        return {"error": "Invalid regeneration type"}
    except Exception as e:
        import traceback
        logger.error(f"Regenerate Asset Failure: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class TeaserRequest(BaseModel):
    universe_id: str
    project_id: str

@app.post("/api/assets/generate_teaser")
async def generate_teaser(request: TeaserRequest, user_id: str = Depends(get_current_user)):
    cost = 50 
    await services.user_service.deduct_credits(user_id, cost)
    
    try:
        db = get_firestore_db()
        project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
        project_doc = project_ref.get()
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        data = project_doc.to_dict()
        prompt = f"Cinematic scene from a {data.get('genre')} film. {data.get('logline')}. Visual vibe: {data.get('vibe')}."
        
        # Async Pivot: Get operation object immediately
        operation = services.asset_studio.generate_teaser(prompt=prompt)
        if not operation:
            raise HTTPException(status_code=500, detail="Failed to initialize motion render")
            
        return {"operation_id": operation.name}
    except Exception as e:
        logger.error(f"Teaser Initialization Failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assets/teaser_status")
async def get_teaser_status(operation_id: str, user_id: str = Depends(get_current_user)):
    """Checks the status of a long-running motion operation via query param."""
    try:
        status = services.asset_studio.get_operation_status(operation_id)
        return status
    except Exception as e:
        logger.error(f"Status Check Failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Export as Firebase Function
@https_fn.on_request(
    region="us-central1",
    memory=4096, 
    timeout_sec=540, # Max timeout for feature-length script analysis
    min_instances=0,
    invoker="public",
    secrets=[
        "GEMINI_API_KEY", 
        "STRIPE_SECRET_KEY", 
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_WR_MONTHLY",
        "STRIPE_PRICE_WR_ANNUAL",
        "STRIPE_PRICE_STUDIO_PASS"
    ]
)
def api(req: https_fn.Request) -> https_fn.Response:
    # Quick health check for Cloud Run
    if req.path == "/health":
        return FlaskResponse("OK", status=200)
    return FlaskResponse.from_app(ASGIMiddleware(app), req.environ)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
