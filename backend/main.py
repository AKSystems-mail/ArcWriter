from fastapi import FastAPI, HTTPException, status, Depends, Header, Request # Added Request for webhook
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import json
import os
import shutil
from fastapi.responses import StreamingResponse
import vertexai
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

from app.utils.firebase_auth_utils import verify_token, get_firestore_db, initialize_firebase_admin, get_current_user
from app.routers import onboarding, users, pitchdeck, script

# Initialize Firebase Admin SDK at application startup (v2 bridge)
initialize_firebase_admin()

# Initialize Vertex AI
# Initialize Vertex AI
try:
    if os.path.exists('serviceAccountKey.json'):
        vertex_creds = service_account.Credentials.from_service_account_file('serviceAccountKey.json')
        print("Loaded Vertex AI credentials from local serviceAccountKey.json")
    else:
        # Use Application Default Credentials (ADC) in production
        vertex_creds = None 
        print("serviceAccountKey.json not found, using Application Default Credentials")
    
    vertexai.init(project=os.getenv('GOOGLE_CLOUD_PROJECT'), location='us-central1', credentials=vertex_creds)
except Exception as e:
    print(f"Warning: Failed to initialize Vertex AI: {e}")

app = FastAPI(title="Arc Studio API")

# Export as Firebase Function
@https_fn.on_request(
    memory=2048,
    timeout_sec=300,
    min_instances=0,
    invoker="public",
    secrets=["GEMINI_API_KEY"]
)
def api(req: https_fn.Request) -> https_fn.Response:
    return FlaskResponse.from_app(ASGIMiddleware(app), req.environ)

# Define base directory for universes
UNIVERSE_BASE_DIR = "universes"
os.makedirs(UNIVERSE_BASE_DIR, exist_ok=True)

# Load Personas
PERSONAS = {}
try:
    with open("app/prompts/personas.json", "r") as f:
        PERSONAS = json.load(f)
    print("Loaded Personas:", list(PERSONAS.keys()))
except FileNotFoundError:
    print("Warning: app/prompts/personas.json not found.")

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

from app.routers.onboarding import analyze_pitch, PitchRequest

@app.post("/api/projects/initialize")
async def initialize_project_legacy(request: PitchRequest, user_id: str = Depends(get_current_user)):
    return await analyze_pitch(request, user_id)

from app.services.bible_manager import BibleManager

# get_current_user imported from firebase_auth_utils

# Credit costs for assets
ASSET_CREDIT_COSTS = {
    'character_concepts': 5,
    'poster': 10,
    'teaser': 20,
    'character': 1 # For single character anchor, if it ever has a cost
}

class SceneRequest(BaseModel):
    scene_text: str
    persona: Optional[str] = "script_doctor"
    universe_name: Optional[str] = "default" 
    project_id: Optional[str] = "operation_blackout" 

class BibleRequest(BaseModel):
    universe_name: str
    project_id: str
    bible_text: str

class BibleUpdateRequest(BaseModel):
    universe_name: str
    project_id: str 
    section_header: str
    content: str
# PitchRequest moved to app.routers.onboarding

# SetupRequest moved to app.routers.onboarding

class AssetRequest(BaseModel):
    type: str 
    description: Optional[str] = None
    title: Optional[str] = None
    style: Optional[str] = None
    logline: Optional[str] = None
    beat: Optional[str] = None
    reference_image_url: Optional[str] = None
    tagline: Optional[str] = None
    genre: Optional[str] = None
    universe_id: Optional[str] = None
    project_id: Optional[str] = None

class ContextRequest(BaseModel): 
    universe_name: str
    project_id: str

# New Pydantic models for Universe and Project management
class CreateUniverseRequest(BaseModel):
    universe_name: str

class UniverseResponse(BaseModel):
    name: str

class CreateProjectRequest(BaseModel):
    project_name: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    logline: Optional[str] = None
    genre: Optional[str] = None
    character_anchor_url: Optional[str] = None
    poster_url: Optional[str] = None
    teaser_url: Optional[str] = None
    script_page_count: Optional[int] = None
    beat_sheet: Optional[Dict[str, Any]] = None
    beat_sheet_data: Optional[Dict[str, Any]] = None
    characters: Optional[List[Dict[str, Any]]] = None

class UpdateProjectConfigRequest(BaseModel):
    title: Optional[str] = None
    logline: Optional[str] = None
    genre: Optional[str] = None
    character_anchor_url: Optional[str] = None
    poster_url: Optional[str] = None
    teaser_url: Optional[str] = None
    script_page_count: Optional[int] = None
    # Add other fields as needed for updates

@app.get("/")
async def root():
    return {"message": "Hello World - Arc Studio API (FastAPI) is live"}

# --- Universe Management Endpoints ---
@app.get("/api/universes", response_model=List[UniverseResponse])
async def list_universes(user_id: str = Depends(get_current_user)): # Secured endpoint
    universes = []
    # In a real app, you would filter universes by user_id
    for entry in os.listdir(UNIVERSE_BASE_DIR):
        if os.path.isdir(os.path.join(UNIVERSE_BASE_DIR, entry)):
            universes.append(UniverseResponse(name=entry))
    return universes

@app.post("/api/universe/create", response_model=UniverseResponse, status_code=status.HTTP_201_CREATED)
async def create_universe(request: CreateUniverseRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    universe_path = os.path.join(UNIVERSE_BASE_DIR, request.universe_name)
    # In a real app, you would associate this universe with the user_id
    if os.path.exists(universe_path):
        raise HTTPException(status_code=409, detail=f"Universe '{request.universe_name}' already exists.")
    os.makedirs(universe_path)
    return UniverseResponse(name=request.universe_name)

# --- Project Management Endpoints ---
@app.get("/api/universe/{universe_name}/projects", response_model=List[ProjectResponse])
async def list_projects_in_universe(universe_name: str, user_id: str = Depends(get_current_user)): # Secured endpoint
    db = get_firestore_db()
    universe_ref = db.collection("universes").document(universe_name)
    
    if not universe_ref.get().exists:
        # Fallback to local FS check if Firestore universe doesn't exist yet (for transition)
        universe_path = os.path.join(UNIVERSE_BASE_DIR, universe_name)
        if not os.path.isdir(universe_path):
            return [] # No projects yet

    projects_ref = universe_ref.collection("projects")
    projects = []
    
    for doc in projects_ref.stream():
        p_data = doc.to_dict()
        projects.append(ProjectResponse(
            id=doc.id, 
            name=p_data.get('title', doc.id),
            logline=p_data.get('logline'),
            genre=p_data.get('genre'),
            character_anchor_url=p_data.get('character_anchor_url'),
            poster_url=p_data.get('poster_url'),
            teaser_url=p_data.get('teaser_url'),
            script_page_count=p_data.get('script_page_count'),
            characters=p_data.get('characters')
        ))
    return projects

@app.get("/api/project/{universe_name}/{project_id}", response_model=ProjectResponse)
async def get_project_details(universe_name: str, project_id: str, user_id: str = Depends(get_current_user)):
    bm = BibleManager(universe_name=universe_name, project_id=project_id)
    
    # Primary Source: Firestore
    project_ref = bm._get_project_ref()
    project_doc = project_ref.get()
    
    if not project_doc.exists:
        # Fallback to local FS config if not in Firestore (legacy)
        if not os.path.exists(bm.project_path):
            raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
        project_config = bm.get_project_data()
    else:
        project_config = project_doc.to_dict()
    
    return ProjectResponse(
        id=project_id,
        name=project_config.get('title', project_id),
        logline=project_config.get('logline'),
        genre=project_config.get('genre'),
        character_anchor_url=project_config.get('character_anchor_url'),
        poster_url=project_config.get('poster_url'),
        teaser_url=project_config.get('teaser_url'),
        script_page_count=project_config.get('script_page_count'),
        beat_sheet=project_config.get('beat_sheet'), # Onboarding saves to 'beat_sheet'
        beat_sheet_data=project_config.get('beat_sheet_data'), # BibleManager saves to 'beat_sheet_data'
        characters=project_config.get('characters')
    )


@app.post("/api/universe/{universe_name}/project/create", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_in_universe(universe_name: str, request: CreateProjectRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    universe_path = os.path.join(UNIVERSE_BASE_DIR, universe_name)
    if not os.path.isdir(universe_path):
        raise HTTPException(status_code=404, detail=f"Universe '{universe_name}' not found.")
    
    project_path = os.path.join(universe_path, request.project_name)
    if os.path.exists(project_path):
        raise HTTPException(status_code=409, detail=f"Project '{request.project_name}' already exists in universe '{universe_name}'.")
    
    # Initialize bible and config
    bm = BibleManager(universe_name=universe_name, project_id=request.project_name)
    bm.initialize_bible("save_the_cat")
    
    project_config = bm.get_project_data()
    return ProjectResponse(
        id=request.project_name, 
        name=project_config.get('title', request.project_name),
        logline=project_config.get('logline'),
        genre=project_config.get('genre'),
        character_anchor_url=project_config.get('character_anchor_url'),
        poster_url=project_config.get('poster_url'),
        teaser_url=project_config.get('teaser_url'),
        script_page_count=project_config.get('script_page_count')
    )

@app.post("/api/project/{universe_name}/{project_id}/update_config")
async def update_project_config(universe_name: str, project_id: str, config_update: UpdateProjectConfigRequest, user_id: str = Depends(get_current_user)):
    bm = BibleManager(universe_name=universe_name, project_id=project_id)
    if not os.path.exists(bm.project_path):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    
    update_data = config_update.dict(exclude_unset=True)
    bm.update_project_data(update_data)
    return {"status": "success", "message": "Project configuration updated."}

# --- Existing Endpoints (updated to use user_id) ---

@app.post("/api/analyze")
async def analyze_scene(request: SceneRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    # Cost for analysis could be added here
    if not request.scene_text:
        raise HTTPException(status_code=400, detail="No scene text provided")
    result = services.logic_engine.analyze_scene(request.scene_text)
    return result

@app.post("/api/critique")
async def critique_scene(request: SceneRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    # Cost for critique could be added here
    if not request.scene_text:
        raise HTTPException(status_code=400, detail="No scene text provided")
    
    persona_key = request.persona
    if persona_key not in PERSONAS:
         persona_key = "script_doctor"
    
    persona_prompt = PERSONAS.get(persona_key, "You are a helpful assistant.")
    
    bible_manager = BibleManager(
        universe_name=request.universe_name, 
        project_id=request.project_id
    ) 
    bible_context = bible_manager.get_context_string()

    critique_result = services.logic_engine.critique_scene(
        scene_text=request.scene_text, 
        persona_prompt=persona_prompt, 
        bible_context=bible_context
    )
    return {
        "critique": critique_result["critique"], 
        "score": critique_result["score"], 
        "persona_used": persona_key
    }

@app.post("/api/bible/index")
async def index_bible(request: BibleRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    # Cost for indexing could be added here
    bm = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
    os.makedirs(bm.project_path, exist_ok=True) 
    # bm.initialize_bible("save_the_cat") # Config is already initialized when project is created
    bm.update_section("## Project Bible", request.bible_text)
    
    services.rag_service.index_bible(request.project_id, request.bible_text)
    return {"status": "success"}

@app.post("/api/bible/update")
async def update_bible(request: BibleUpdateRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    # Cost for updating bible could be added here
    try:
        bm = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
        bm.update_section(request.section_header, request.content)
        return {"status": "success", "message": f"Updated section '{request.section_header}' for project '{request.project_id}' in universe '{request.universe_name}'"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bible for project '{request.project_id}' in universe '{request.universe_name}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bible/context")
async def get_bible_context(request: ContextRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    # Cost for getting context could be added here
    try:
        bm = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
        context_string = bm.get_context_string()
        return {"context_string": context_string}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bible for project '{request.project_id}' in universe '{request.universe_name}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assets/generate")
async def generate_asset(request: AssetRequest, user_id: str = Depends(get_current_user)): # Secured endpoint
    asset_type = request.type
    cost = ASSET_CREDIT_COSTS.get(asset_type, 0) # Get cost for the asset type
    await services.user_service.deduct_credits(user_id, cost) # Deduct credits

    # If universe/project provided, use them; otherwise, don't try to save to bible
    bm = None
    if request.universe_id and request.project_id:
        bm = BibleManager(universe_name=request.universe_id, project_id=request.project_id)
    
    if asset_type == 'character':
        url = services.asset_studio.generate_character_anchor(request.description)
        # Update project config with character anchor URL if bible manager exists
        if bm and os.path.exists(bm.project_path):
            bm.update_project_data({"character_anchor_url": url})
        return {"url": url}
    elif asset_type == 'character_concepts':
        urls = services.asset_studio.generate_character_concepts(request.description, visual_style="cinematic")
        # For character concepts, we don't immediately save to project_config as it's a selection process
        return {"urls": urls}
    elif asset_type == 'poster':
        if not request.title or not request.tagline:
            raise HTTPException(status_code=400, detail="Title and Tagline are required for poster generation.")
        
        url = services.asset_studio.generate_poster(
            title=request.title,
            tagline=request.tagline,
            anchor_image_url=request.reference_image_url,
            genre=request.genre or "Sci-Fi",
            style=request.style
        )
        # Update project config with poster URL if bible manager exists
        if bm and os.path.exists(bm.project_path):
            bm.update_project_data({"poster_url": url})
        return {"url": url}
    elif asset_type == 'teaser':
        if not request.beat:
            raise HTTPException(status_code=400, detail="Scene description (beat) is required for teaser generation.")
        
        job_id = services.asset_studio.generate_teaser(
            scene_description=request.beat,
            anchor_image_url=request.reference_image_url
        )
        return {"job_id": job_id}
    else:
        raise HTTPException(status_code=400, detail="Invalid asset type")

@app.get("/api/assets/check_video_status/{job_id}")
async def check_video_status(job_id: str, user_id: str = Depends(get_current_user)): # Secured endpoint
    status_info = services.asset_studio.check_video_status(job_id)
    # If video is completed, update project config
    if status_info["status"] == "completed" and status_info.get("video_url"):
        bm = BibleManager(universe_name="default", project_id="operation_blackout") # Placeholder
        bm.update_project_data({"teaser_url": status_info["video_url"]})
    return status_info

@app.get("/api/pitchdeck/download/{universe_name}/{project_id}")
async def download_pitch_deck(universe_name: str, project_id: str, user_id: str = Depends(get_current_user)): # Secured endpoint
    bm = BibleManager(universe_name=universe_name, project_id=project_id)
    project_data = bm.get_project_data()
    pdf_buffer = services.pdf_service.compile_pitch_deck(universe_name, project_id, project_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{project_id}_pitch_deck.pdf\""}
    )

# --- Stripe Endpoints ---
@app.post("/api/stripe/create-checkout-session/{plan_type}")
async def create_checkout_session(plan_type: str, user_id: str = Depends(get_current_user)):
    if plan_type == "subscription":
        checkout_url = await services.stripe_service.create_checkout_session(user_id, mode='subscription')
    elif plan_type == "pack":
        checkout_url = await services.stripe_service.create_checkout_session(user_id, mode='payment')
    else:
        raise HTTPException(status_code=400, detail="Invalid plan type. Must be 'subscription' or 'pack'.")
    return {"checkout_url": checkout_url}

@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    if sig_header is None:
        raise HTTPException(status_code=400, detail="Stripe-Signature header missing")

    try:
        event_data = await services.stripe_service.handle_webhook_event(payload, sig_header)
        return event_data
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error handling Stripe webhook: {e}")
        raise HTTPException(status_code=500, detail="Error processing webhook event")

# --- Onboarding Wizard Endpoints ---

# /api/onboarding/analyze_pitch moved to app.routers.onboarding

# finalize_onboarding moved to app.routers.onboarding

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)