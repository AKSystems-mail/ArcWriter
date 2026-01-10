from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import os

# Import local services
from app.services.logic_engine import LogicEngine
from app.services.rag_service import RagService
from app.services.asset_studio import AssetStudio
from app.services.deck_assembler import PitchDeckAssembler
from app.services.bible_manager import BibleManager # BibleManager now expects project_id

app = FastAPI(title="Arc Studio API")

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

class BibleRequest(BaseModel):
    project_id: str
    bible_text: str

class BibleUpdateRequest(BaseModel):
    project_id: str # Added project_id to update request
    section_header: str
    content: str

class AssetRequest(BaseModel):
    type: str # 'character', 'poster', 'teaser'
    description: Optional[str] = None
    title: Optional[str] = None
    style: Optional[str] = None
    logline: Optional[str] = None
    beat: Optional[str] = None
    reference_image_url: Optional[str] = None

class ContextRequest(BaseModel): # New model for context string request
    project_id: str

@app.get("/")
async def root():
    return {"message": "Hello World - Arc Studio API (FastAPI) is live"}

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
    
    # Initialize BibleManager with a hardcoded project_id for now
    # In a full app, project_id would come from the frontend
    bible_manager = BibleManager("operation_blackout") 
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
    # This endpoint should probably use BibleManager to initialize a bible for a project
    # and then pass to rag_service.
    # For now, it directly passes bible_text. Let's make it consistent.
    bm = BibleManager(request.project_id) # Initialize manager for the specific project
    bm.initialize_bible("save_the_cat") # Or based on project settings
    bm.update_section("## Project Bible", request.bible_text) # Overwrite initial if request has content
    
    rag_service.index_bible(request.project_id, request.bible_text)
    return {"status": "success"}

@app.post("/api/bible/update")
async def update_bible(request: BibleUpdateRequest):
    try:
        bm = BibleManager(request.project_id) # Initialize manager for the specific project
        bm.update_section(request.section_header, request.content)
        return {"status": "success", "message": f"Updated section '{request.section_header}' for project '{request.project_id}'"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bible for project '{request.project_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bible/context") # New endpoint for getting context string
async def get_bible_context(request: ContextRequest):
    try:
        bm = BibleManager(request.project_id)
        context_string = bm.get_context_string()
        return {"context_string": context_string}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Bible for project '{request.project_id}' not found.")
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
