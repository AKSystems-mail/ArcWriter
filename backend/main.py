from fastapi import FastAPI, HTTPException, status, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import json
import os
import shutil
from fastapi.responses import StreamingResponse
from google.oauth2 import service_account
import stripe
from firebase_functions import https_fn
from a2wsgi import ASGIMiddleware
from flask import Response as FlaskResponse

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
        self._vertex_initialized = False

    def _ensure_vertex_init(self):
        if not self._vertex_initialized:
            try:
                import vertexai
                if os.path.exists('serviceAccountKey.json'):
                    vertex_creds = service_account.Credentials.from_service_account_file('serviceAccountKey.json')
                else:
                    vertex_creds = None 
                
                vertexai.init(
                    project=os.getenv('GOOGLE_CLOUD_PROJECT') or "arc-studio-box", 
                    location=os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1'), 
                    credentials=vertex_creds
                )
                self._vertex_initialized = True
                print("Vertex AI Lazy Initialization Complete")
            except Exception as e:
                print(f"Warning: Lazy Vertex AI init failed: {e}")

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
            self._ensure_vertex_init()
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

from app.utils.firebase_auth_utils import verify_token, get_firestore_db, initialize_firebase_admin, get_current_user
from app.routers import onboarding, users, pitchdeck, script

# Initialize Firebase Admin SDK (v2 bridge)
initialize_firebase_admin()

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

# --- Project Management Endpoints ---
class ProjectResponse(BaseModel):
    id: str
    name: str
    logline: Optional[str] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    created_at: Optional[Any] = None
    characters: Optional[List[Dict[str, Any]]] = None

@app.get("/api/project/{universe_name}/{project_id}", response_model=ProjectResponse)
async def get_project_details(universe_name: str, project_id: str, user_id: str = Depends(get_current_user)):
    db = get_firestore_db()
    project_ref = db.collection("universes").document(universe_name).collection("projects").document(project_id)
    project_doc = project_ref.get()
    if not project_doc.exists:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    project_config = project_doc.to_dict()
    return ProjectResponse(
        id=project_id,
        name=project_config.get('title', project_id),
        logline=project_config.get('logline'),
        genre=project_config.get('genre'),
        poster_url=project_config.get('poster_url'),
        created_at=project_config.get('created_at'),
        characters=project_config.get('characters')
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
    cost = 10 # Default cost
    await services.user_service.deduct_credits(user_id, cost)
    
    if request.type == 'poster':
        url = services.asset_studio.generate_poster(
            title=request.title or "Untitled",
            tagline=request.tagline or "",
            genre=request.genre or "Drama",
            style=request.style
        )
        return {"url": url}
    return {"error": "Invalid type"}

class RegenerateRequest(BaseModel):
    universe_id: str
    project_id: str
    type: str # 'poster' | 'character'
    character_name: Optional[str] = None

@app.post("/api/assets/regenerate")
async def regenerate_asset(request: RegenerateRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    cost = 25 # Regeneration is more expensive than initial gen
    await services.user_service.deduct_credits(user_id, cost)
    
    # Fetch project metadata for the prompt
    from app.utils.firebase_auth_utils import get_firestore_db
    db = get_firestore_db()
    project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
    project_doc = project_ref.get()
    
    if not project_doc.exists:
        raise HTTPException(status_code=404, detail="Project not found")
    
    data = project_doc.to_dict()
    
    if request.type == 'poster':
        background_tasks.add_task(
            services.asset_studio.generate_and_update_poster,
            universe_id=request.universe_id,
            project_id=request.project_id,
            title=data.get("title", "Untitled"),
            tagline=data.get("logline", ""),
            genre=data.get("genre", "Drama"),
            style=data.get("vibe", "Cinematic")
        )
        return {"message": "Poster regeneration queued."}
        
    elif request.type == 'character' and request.character_name:
        characters = data.get("characters", [])
        char_data = next((c for c in characters if c.get("name") == request.character_name), None)
        
        if not char_data:
            raise HTTPException(status_code=404, detail="Character not found in project")
            
        background_tasks.add_task(
            services.asset_studio.generate_and_update_character,
            universe_id=request.universe_id,
            project_id=request.project_id,
            character_name=request.character_name,
            description=char_data.get("description", ""),
            style=data.get("vibe", "Cinematic")
        )
        return {"message": f"Character {request.character_name} regeneration queued."}
        
    return {"error": "Invalid regeneration type or missing parameters"}

# Export as Firebase Function
@https_fn.on_request(
    region="us-central1",
    memory=2048,
    timeout_sec=300,
    min_instances=0,
    invoker="public",
    secrets=["GEMINI_API_KEY"]
)
def api(req: https_fn.Request) -> https_fn.Response:
    # Quick health check for Cloud Run
    if req.path == "/health":
        return FlaskResponse("OK", status=200)
    return FlaskResponse.from_app(ASGIMiddleware(app), req.environ)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
