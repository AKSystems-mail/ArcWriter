from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db
from app.services.logic_engine import LogicEngine
from app.services.script_parser import parse_pdf_to_editor_format
from pypdf import PdfReader
import io
import os
import uuid
import tempfile
import shutil
from firebase_admin import firestore

router = APIRouter(
    prefix="/api/onboarding",
    tags=["onboarding"]
)

class PitchRequest(BaseModel):
    pitch: str

class PitchAnalysisResponse(BaseModel):
    genre: str
    logline: str
    structure_suggestion: str
    title_ideas: List[str]

@router.post("/analyze_pitch", response_model=PitchAnalysisResponse)
@router.post("/initialize", response_model=PitchAnalysisResponse)
async def analyze_pitch(request: PitchRequest, user_id: str = Depends(get_current_user)):
    # Analyzes the pitch using Gemini and returns metadata including genre, logline, structure, and title ideas.
    logic_engine = LogicEngine()
    try:
        metadata = logic_engine.generate_project_metadata(request.pitch)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_file")
async def analyze_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    print(f"[{user_id}] Starting analyze_file for {file.filename}")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        script_blocks, text = parse_pdf_to_editor_format(tmp_path)
        
        if not text:
             pdf = PdfReader(tmp_path)
             text = ""
             for page in pdf.pages:
                 text += page.extract_text() + "\n"

        try:
             pdf = PdfReader(tmp_path)
             page_count = len(pdf.pages)
        except:
             page_count = 0

        logic_engine = LogicEngine()
        if page_count > 10:
             metadata = logic_engine.reverse_engineer_script(text)
             metadata["source_type"] = "script"
        else:
             metadata = logic_engine.distill_notes(text)
             metadata["source_type"] = "notes"
        
        metadata["script_blocks"] = script_blocks
        metadata["raw_text"] = text
        
        os.unlink(tmp_path)
        return metadata
    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Failed to analyze file: {str(e)}")

class SetupRequest(BaseModel):
    pitch: str = ""
    universe_name: Optional[str] = "My First Universe"
    metadata: Dict[str, Any]
    vibe: Optional[str] = "Cinematic"
    persona: str
    mode: str = "architect"
    user_id: Optional[str] = None
    is_script: bool = False
    script_content: Optional[List[Dict[str, Any]]] = None

    class Config:
        extra = "ignore"

    @field_validator('metadata', mode='before')
    @classmethod
    def unwrap_list(cls, v):
        if isinstance(v, list) and len(v) > 0:
            return v[0]
        return v

class FinalizeResponse(BaseModel):
    project_id: str
    universe_id: str
    redirect_to: str = "beat-sheet"

@router.post("/finalize", response_model=FinalizeResponse)
async def finalize_onboarding(request: SetupRequest, user_id: str = Depends(get_current_user)):
    try:
        db = get_firestore_db()
        logic_engine = LogicEngine()
        
        title = request.metadata.get("title", "Untitled Project")
        genre = request.metadata.get("genre", "Unknown Genre")
        logline = request.metadata.get("logline", "")
        
        beat_sheet_text = ""
        if "beat_sheet" in request.metadata:
            framework = request.metadata.get("structure_suggestion", "Save the Cat")
            beat_sheet_text = f"BEAT SHEET ({framework})\n" + "="*20 + "\n\n"
            for beat, desc in request.metadata["beat_sheet"].items():
                beat_sheet_text += f"{beat.replace('_', ' ').upper()}:\n{desc}\n\n"

        source_material_content = request.metadata.get("raw_text", "")
        if not source_material_content or not source_material_content.strip():
            source_material_content = beat_sheet_text

        bible_intro = f"# Project Bible: {title}\n## Metadata\n- Genre: {genre}\n- Logline: {logline}\n- Vibe: {request.vibe}\n- Analysis Lens: {request.persona}\n\n"
        synopsis = request.metadata.get("synopsis", request.pitch)
        bible_content = bible_intro + f"## Synopsis\n{synopsis}\n\n" + beat_sheet_text
        
        if "character_descriptions" in request.metadata:
            bible_content += "\n## Characters\n"
            for char in request.metadata["character_descriptions"]:
                bible_content += f"- **{char.get('name', 'Unknown')}**: {char.get('role', 'N/A')} - {char.get('description', '')}\n"

        # --- Universe Grouping Logic ---
        universe_display_name = request.universe_name or "My First Universe"
        
        # Check for existing universe by name for this user
        existing_universes = db.collection("universes")\
            .where("owner_id", "==", user_id)\
            .where("name", "==", universe_display_name)\
            .limit(1).get()
        
        if len(existing_universes) > 0:
            universe_id = existing_universes[0].id
            universe_ref = existing_universes[0].reference
        else:
            universe_id = f"universe_{uuid.uuid4().hex[:8]}"
            universe_ref = db.collection("universes").document(universe_id)
            universe_ref.set({
                "name": universe_display_name,
                "owner_id": user_id,
                "created_at": firestore.SERVER_TIMESTAMP
            })

        project_id = f"project_{uuid.uuid4().hex[:8]}"
        project_ref = universe_ref.collection("projects").document(project_id)
        
        beat_sheet = request.metadata.get("beat_sheet", {})
        project_data = {
            "title": title,
            "owner_id": user_id,
            "created_at": firestore.SERVER_TIMESTAMP,
            "bible_content": bible_content,
            "source_material": source_material_content,
            "logline": logline,
            "genre": genre,
            "vibe": request.vibe,
            "persona": request.persona,
            "mode": request.mode,
            "beat_sheet": beat_sheet,
            "beat_sheet_data": beat_sheet,
            "synopsis": synopsis,
            "characters": request.metadata.get("character_descriptions", [])
        }
        
        project_ref.set(project_data)

        redirect_to = "beat-sheet"
        if request.is_script and "script_blocks" in request.metadata:
            script_blocks = request.metadata["script_blocks"]
            if script_blocks:
                script_ref = project_ref.collection("script").document("content")
                script_ref.set({"blocks": script_blocks})
                redirect_to = "editor"
        elif request.mode == "explorer":
            first_beat = "Opening Image"
            beat_desc = beat_sheet.get("opening_image", "The start of the journey.")
            chars = [c.get("name", "Protagonist") for c in request.metadata.get("character_descriptions", [])[:2]]
            if not chars: chars = ["Protagonist"]
            
            try:
                initial_blocks = logic_engine.generate_scene_content(
                    beat_context=f"{first_beat}: {beat_desc}",
                    characters=chars,
                    game_theory_type="Cooperative"
                )
                if initial_blocks:
                    script_ref = project_ref.collection("script").document("content")
                    script_ref.set({"blocks": initial_blocks})
                    redirect_to = "editor"
            except Exception as e:
                print(f"Error generating initial explorer scene: {e}")
                redirect_to = "editor"

        return FinalizeResponse(project_id=project_id, universe_id=universe_id, redirect_to=redirect_to)

    except Exception as e:
        print(f"Error in finalize_onboarding: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to finalize onboarding: {str(e)}")