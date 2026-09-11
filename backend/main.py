# Arc Studio Box - Master Studio API
import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from firebase_functions import https_fn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Dependency Management - Registry for heavy AI and Billing services
class ServiceRegistry:
    def __init__(self):
        self._user_service = None
        self._stripe_service = None
        self._logic_engine = None
        self._asset_studio = None
        self._rag_service = None
        self._pdf_service = None

    @property
    def user_service(self):
        if self._user_service is None:
            from app.services.user_service import UserService
            self._user_service = UserService()
        return self._user_service

    @property
    def logic_engine(self):
        if self._logic_engine is None:
            from app.services.logic_engine import LogicEngine
            self._logic_engine = LogicEngine()
        return self._logic_engine

    @property
    def asset_studio(self):
        if self._asset_studio is None:
            from app.services.asset_studio import AssetStudio
            self._asset_studio = AssetStudio(self.user_service)
        return self._asset_studio

    @property
    def rag_service(self):
        if self._rag_service is None:
            from app.services.rag_service import RAGService
            self._rag_service = RAGService()
        return self._rag_service

    @property
    def pdf_service(self):
        if self._pdf_service is None:
            from app.services.pdf_service import PDFService
            self._pdf_service = PDFService()
        return self._pdf_service

    @property
    def stripe_service(self):
        if self._stripe_service is None:
            from app.services.stripe_service import StripeService
            self._stripe_service = StripeService(self.user_service)
        return self._stripe_service

# Global flag to track initialization
_initialized = False
services = None

def lazy_initialize():
    global _initialized, services
    if not _initialized:
        # Check for critical environment variables
        if not os.getenv("GEMINI_API_KEY"):
            print("WARNING: GEMINI_API_KEY is not set in the environment.")
        else:
            print("INFO: GEMINI_API_KEY detected.")

        # Instantiate services here
        services = ServiceRegistry()
        
        # Move heavy imports here
        from app.utils.firebase_auth_utils import initialize_firebase_admin
        initialize_firebase_admin()
        
        # Register Routers inside the initialization flow
        from app.routers import onboarding, users, pitchdeck, script, bible, manual, public, billing, share, projects, public_coverage
        app.include_router(onboarding.router)
        app.include_router(users.router)
        app.include_router(pitchdeck.router)
        app.include_router(script.router)
        app.include_router(bible.router)
        app.include_router(manual.router)
        app.include_router(public.router)
        app.include_router(billing.router)
        app.include_router(share.router)
        app.include_router(projects.router)
        app.include_router(public_coverage.router)
        
        _initialized = True

# Arc Studio API - Initialized with Security Hardening
app = FastAPI(title="Arc Studio API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5000",
        "https://arc-studio-box.web.app",
        "https://arc-studio-box.firebaseapp.com",
        "https://arcwriter.us",
        "https://www.arcwriter.us"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.utils.firebase_auth_utils import get_current_user, get_firestore_db, verify_project_ownership

@app.get("/")
async def root():
    try:
        lazy_initialize()
        return {"message": "Hello World - Arc Studio API (FastAPI) is live"}
    except Exception as e:
        import traceback
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "trace": traceback.format_exc()[-2000:]},
        )

# --- Wrapped Core Endpoints ---
# Note: For production stability, routers are registered in lazy_initialize()
# but these top-level endpoints ensure uvicorn can find the main handlers.

@app.get("/api/universes", response_model=List[Any])
async def list_universes(user_id: str = Depends(get_current_user)):
    lazy_initialize()
    from pydantic import BaseModel
    class UniverseResponse(BaseModel):
        name: str
    
    db = get_firestore_db()
    docs = db.collection("universes").where("owner_id", "==", user_id).stream()
    return [{"name": doc.id} for doc in docs]

class ProjectResponse(BaseModel):
    id: str
    name: str
    title: Optional[str] = None
    logline: Optional[str] = None
    genre: Optional[str] = None
    vibe: Optional[str] = None
    poster_url: Optional[str] = None
    teaser_url: Optional[str] = None
    created_at: Optional[Any] = None
    insights: Optional[Dict[str, Any]] = None
    beat_sheet_data: Optional[Dict[str, Any]] = None
    source_material: Optional[str] = None
    format: Optional[str] = "movie"

@app.get("/api/project/{universe_name}/{project_id}", response_model=ProjectResponse)
async def get_project_details(universe_name: str, project_id: str, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    try:
        project_config = await verify_project_ownership(universe_name, project_id, user_id)
        return project_config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AssetRequest(BaseModel):
    type: str # 'poster' | 'character'
    prompt: Optional[str] = None
    character_name: Optional[str] = None
    universe_id: Optional[str] = None
    project_id: Optional[str] = None

@app.post("/api/assets/generate")
async def generate_asset(request: AssetRequest, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    cost = 10 
    await services.user_service.deduct_credits(user_id, cost)
    
    if request.type == 'poster':
        tagline = await services.logic_engine.generate_one_liner(request.prompt)
        image_data = services.asset_studio.generate_poster(request.prompt, tagline)
        return {"b64_data": image_data, "tagline": tagline}
    else:
        variants = services.asset_studio.generate_character_variants(request.character_name, request.prompt)
        return {"variants": variants}

class RegenerateRequest(BaseModel):
    universe_id: str
    project_id: str
    type: str # 'poster' | 'character'
    character_name: Optional[str] = None

@app.post("/api/assets/regenerate")
async def regenerate_asset(request: RegenerateRequest, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    try:
        db = get_firestore_db()
        project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
        project_doc = project_ref.get()
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_data = project_doc.to_dict()
        prompt = project_data.get("logline", "")
        if request.type == 'character':
            chars = project_data.get("characters", [])
            char = next((c for c in chars if c['name'] == request.character_name), None)
            prompt = char['description'] if char else prompt

        # Charge before generating
        await services.user_service.deduct_credits(user_id, 25)

        if request.type == 'poster':
            tagline = await services.logic_engine.generate_one_liner(project_data.get("synopsis", prompt))
            image_data = services.asset_studio.generate_poster(prompt, tagline)
            return {"b64_data": image_data, "tagline": tagline}
        else:
            variants = services.asset_studio.generate_character_variants(request.character_name, prompt)
            return {"variants": variants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TeaserRequest(BaseModel):
    universe_id: str
    project_id: str

@app.post("/api/assets/generate_teaser")
async def generate_teaser(request: TeaserRequest, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    try:
        db = get_firestore_db()
        project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
        project_doc = project_ref.get()
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_data = project_doc.to_dict()
        prompt = f"{project_data.get('title')}: {project_data.get('logline')}. Visual style: {project_data.get('vibe')}"
        
        await services.user_service.deduct_credits(user_id, 50)
        operation_id = services.asset_studio.generate_teaser_async(prompt)
        return {"operation_id": operation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assets/teaser_status")
async def get_teaser_status(operation_id: str, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    try:
        status = services.asset_studio.get_operation_status(operation_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SceneRequest(BaseModel):
    scene_text: str
    persona: str = "Standard"
    universe_name: Optional[str] = "default" 
    project_id: Optional[str] = "default" 

@app.post("/api/critique")
async def critique_scene(request: SceneRequest, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    if not request.scene_text:
        raise HTTPException(status_code=400, detail="No scene text provided")
    
    from app.services.bible_manager import BibleManager
    bible_manager = BibleManager(universe_name=request.universe_name, project_id=request.project_id) 
    result = services.logic_engine.critique_scene(request.scene_text, request.persona, bible_manager)
    return result

class UpdateAnchorRequest(BaseModel):
    universe_id: str
    project_id: str
    character_name: str
    anchor_url: str

@app.post("/api/project/character/update_anchor")
async def update_character_anchor(request: UpdateAnchorRequest, user_id: str = Depends(get_current_user)):
    lazy_initialize()
    db = get_firestore_db()
    try:
        project_ref = db.collection("universes").document(request.universe_id).collection("projects").document(request.project_id)
        project_doc = project_ref.get()
        if not project_doc.exists: raise HTTPException(status_code=404)
        
        characters = project_doc.to_dict().get("characters", [])
        for c in characters:
            if c['name'] == request.character_name:
                c['anchor_url'] = request.anchor_url
        
        project_ref.update({"characters": characters})
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Register routers at import, not on first request. FastAPI matches routes before running a
# handler, so a cold start used to 404 every router-defined path until some other request
# happened to trigger lazy_initialize(). Placed after the inline routes to preserve their
# precedence. The per-handler lazy_initialize() calls below are now no-ops.
lazy_initialize()

# Export as Firebase Function
@https_fn.on_request(
    region="us-central1",
    memory=4096,
    timeout_sec=300,
    min_instances=0
)
def api(req: https_fn.Request) -> https_fn.Response:
    from asgiref.sync import async_to_sync
    import json
    
    # Simple bridge for function execution
    async def process():
        from fastapi.testclient import TestClient
        client = TestClient(app, raise_server_exceptions=False)
        
        # Build method and headers
        method = req.method
        headers = {k: v for k, v in req.headers.items()}
        path = req.path
        if req.query_string:
            path += f"?{req.query_string.decode()}"
            
        body = req.get_data()
        try:
            response = client.request(method, path, headers=headers, content=body)
        except Exception as e:
            import traceback
            return https_fn.Response(
                traceback.format_exc(),
                status=500,
                headers={"Content-Type": "text/plain"},
            )
        
        return https_fn.Response(
            response.content,
            status=response.status_code,
            headers=dict(response.headers)
        )
        
    return async_to_sync(process)()
