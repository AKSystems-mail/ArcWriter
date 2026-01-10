from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import shutil # For deleting directories

# Import local services
from app.services.logic_engine import LogicEngine
from app.services.rag_service import RagService
from app.services.asset_studio import AssetStudio
from app.services.deck_assembler import PitchDeckAssembler
from app.services.bible_manager import BibleManager 

app = FastAPI(title="Arc Studio API")

# Define base directory for universes
UNIVERSE_BASE_DIR = "universes"
os.makedirs(UNIVERSE_BASE_DIR, exist_ok=True) # Ensure universe base directory exists

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services - NOTE: bible_manager is now initialized per project in endpoints
logic_engine = LogicEngine()
rag_service = RagService()
asset_studio = AssetStudio()
deck_assembler = PitchDeckAssembler()

class SceneRequest(BaseModel):
    scene_text: str
    persona: Optional[str] = "script_doctor"
    # Added universe_name and project_id to SceneRequest for future use
    universe_name: Optional[str] = "default" 
    project_id: Optional[str] = "operation_blackout" 

class BibleRequest(BaseModel):
    universe_name: str # Added universe_name
    project_id: str
    bible_text: str

class BibleUpdateRequest(BaseModel):
    universe_name: str # Added universe_name
    project_id: str 
    section_header: str
    content: str

class AssetRequest(BaseModel):
    type: str 
    description: Optional[str] = None
    title: Optional[str] = None
    style: Optional[str] = None
    logline: Optional[str] = None
    beat: Optional[str] = None
    reference_image_url: Optional[str] = None

class ContextRequest(BaseModel): 
    universe_name: str # Added universe_name
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

@app.get("/")
async def root():
    return {"message": "Hello World - Arc Studio API (FastAPI) is live"}

# --- Universe Management Endpoints ---
@app.get("/api/universes", response_model=List[UniverseResponse])
async def list_universes():
    universes = []
    for entry in os.listdir(UNIVERSE_BASE_DIR):
        if os.path.isdir(os.path.join(UNIVERSE_BASE_DIR, entry)):
            universes.append(UniverseResponse(name=entry))
    return universes

@app.post("/api/universe/create", response_model=UniverseResponse, status_code=status.HTTP_201_CREATED)
async def create_universe(request: CreateUniverseRequest):
    universe_path = os.path.join(UNIVERSE_BASE_DIR, request.universe_name)
    if os.path.exists(universe_path):
        raise HTTPException(status_code=409, detail=f"Universe '{request.universe_name}' already exists.")
    os.makedirs(universe_path)
    return UniverseResponse(name=request.universe_name)

# --- Project Management Endpoints ---
@app.get("/api/universe/{universe_name}/projects", response_model=List[ProjectResponse])
async def list_projects_in_universe(universe_name: str):
    universe_path = os.path.join(UNIVERSE_BASE_DIR, universe_name)
    if not os.path.isdir(universe_path):
        raise HTTPException(status_code=404, detail=f"Universe '{universe_name}' not found.")
    
    projects = []
    for entry in os.listdir(universe_path):
        project_path = os.path.join(universe_path, entry)
        if os.path.isdir(project_path):
            # For now, project_id is the folder name and name is the folder name.
            # In a real app, project metadata might be stored in a file inside the folder.
            projects.append(ProjectResponse(id=entry, name=entry)) 
    return projects

@app.post("/api/universe/{universe_name}/project/create", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_in_universe(universe_name: str, request: CreateProjectRequest):
    universe_path = os.path.join(UNIVERSE_BASE_DIR, universe_name)
    if not os.path.isdir(universe_path):
        raise HTTPException(status_code=404, detail=f"Universe '{universe_name}' not found.")
    
    project_path = os.path.join(universe_path, request.project_name)
    if os.path.exists(project_path):
        raise HTTPException(status_code=409, detail=f"Project '{request.project_name}' already exists in universe '{universe_name}'.")
    
    os.makedirs(project_path)
    # Initialize a default project_bible.md for the new project
    bm = BibleManager(universe_name=universe_name, project_id=request.project_name)
    bm.initialize_bible("save_the_cat") # Initialize with default template
    
    return ProjectResponse(id=request.project_name, name=request.project_name)

# --- Existing Endpoints (updated to use universe_name) ---

@app.post("/api/analyze")
async def analyze_scene(request: SceneRequest):
    if not request.scene_text:
        raise HTTPException(status_code=400, detail="No scene text provided")
    result = logic_engine.analyze_scene_logic(request.scene_text)
    return result

@app.post("/api/critique")
async def critique_scene(request: SceneRequest):
    if not request.scene_text:
        raise HTTPException(status_code=400, detail="No scene text provided")
    
    persona_key = request.persona
    if persona_key not in PERSONAS:
         persona_key = "script_doctor"
    
    persona_prompt = PERSONAS.get(persona_key, "You are a helpful assistant.")
    
    # Using universe_name and project_id from request, defaulting if not provided
    bible_manager = BibleManager(
        universe_name=request.universe_name, 
        project_id=request.project_id
    ) 
    bible_context = bible_manager.get_context_string()

    critique_result = logic_engine.critique_scene(
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
async def index_bible(request: BibleRequest):
    bm = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
    # Ensure project path exists before writing bible content
    os.makedirs(bm.project_path, exist_ok=True) 
    bm.initialize_bible("save_the_cat") # Initialize with default template (or update logic if template is part of request)
    bm.update_section("## Project Bible", request.bible_text) # Overwrite initial if request has content
    
    rag_service.index_bible(request.project_id, request.bible_text)
    return {"status": "success"}

@app.post("/api/bible/update")
async def update_bible(request: BibleUpdateRequest):
    try:
        bm = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
        bm.update_section(request.section_header, request.content)
        return {"status": "success", "message": f"Updated section '{request.section_header}' for project '{request.project_id}' in universe '{request.universe_name}'"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bible for project '{request.project_id}' in universe '{request.universe_name}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bible/context")
async def get_bible_context(request: ContextRequest):
    try:
        bm = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
        context_string = bm.get_context_string()
        return {"context_string": context_string}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bible for project '{request.project_id}' in universe '{request.universe_name}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assets/generate")
async def generate_asset(request: AssetRequest):
    if request.type == 'character':
        url = asset_studio.generate_character_anchor(request.description)
    elif request.type == 'poster':
        prompt_parts = []
        if request.title: prompt_parts.append(f"Title: {request.title}")
        if request.style: prompt_parts.append(f"Style: {request.style}")
        if request.logline: prompt_parts.append(f"Logline: {request.logline}")
        prompt = ". ".join(prompt_parts)
        url = asset_studio.generate_poster(prompt, request.reference_image_url)
    elif request.type == 'teaser':
        script_segment = request.beat if request.beat else "No script segment provided"
        url = asset_studio.generate_teaser(script_segment)
    else:
        raise HTTPException(status_code=400, detail="Invalid asset type")
    return {"url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
