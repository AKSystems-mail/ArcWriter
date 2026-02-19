from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
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
    title: str
    synopsis: str
    character_descriptions: List[Dict[str, Any]]
    beat_sheet: Dict[str, str]

@router.post("/initialize")
async def initialize_project(request: PitchRequest, user_id: str = Depends(get_current_user)):
    print(f"[{user_id}] Initializing project from pitch...")
    try:
        logic_engine = LogicEngine()
        metadata = logic_engine.generate_project_metadata(request.pitch)
        return metadata
    except Exception as e:
        import traceback
        print(f"CRITICAL: Initialize failure: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Studio Engine Error: {str(e)}")

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
async def finalize_onboarding(request: SetupRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    print(f"[{user_id}] Finalizing onboarding. Mode: {request.mode}, Vibe: {request.vibe}")
    try:
        db = get_firestore_db()
        logic_engine = LogicEngine()
        
        # Defense-in-depth: Metadata can sometimes be wrapped in a list from LLM responses
        metadata = request.metadata
        if isinstance(metadata, list) and len(metadata) > 0:
            metadata = metadata[0]
            
        title = metadata.get("title", "Untitled Project")
        genre = metadata.get("genre", "Unknown Genre")
        logline = metadata.get("logline", "")
        
        beat_sheet = metadata.get("beat_sheet", {})
        # Defense: If beat_sheet is a list (AI occasionally returns list of objects), convert to dict
        if isinstance(beat_sheet, list):
            print(f"WARNING: beat_sheet arrived as list, converting to dict.")
            converted_beats = {}
            for item in beat_sheet:
                if isinstance(item, dict):
                    # Try common key names
                    name = item.get("beat_name") or item.get("beat") or item.get("name")
                    desc = item.get("description") or item.get("text")
                    if name and desc:
                        # Convert to snake case and strip percentages/parentheses
                        # e.g. "Opening Image (1%)" -> "opening_image"
                        key = name.lower().split("(")[0].strip().replace(" ", "_").replace("-", "_")
                        converted_beats[key] = desc
            beat_sheet = converted_beats
            
        # Defense 2: If beat_sheet is ALREADY a dict but has messy keys
        if isinstance(beat_sheet, dict):
            cleaned_beats = {}
            for k, v in beat_sheet.items():
                clean_k = k.lower().split("(")[0].strip().replace(" ", "_").replace("-", "_")
                cleaned_beats[clean_k] = v
            beat_sheet = cleaned_beats
            
        print(f"DEBUG: Beat sheet keys received: {list(beat_sheet.keys()) if beat_sheet else 'EMPTY'}")
        
        # --- Construct Clean Source Material (ONLY Beats + Cast) ---
        source_material_content = f"## NARRATIVE BEATS\n\n"
        for beat, desc in beat_sheet.items():
            source_material_content += f"### {beat.replace('_', ' ').upper()}\n{desc}\n\n"
        
        if "character_descriptions" in metadata:
            source_material_content += "---\n## KEY CAST & PROFILES\n\n"
            for char in metadata["character_descriptions"]:
                source_material_content += f"**{char.get('name', 'Unknown').upper()}**\n"
                source_material_content += f"ROLE: {char.get('role', 'N/A')}\n"
                source_material_content += f"DESCRIPTION: {char.get('description', '')}\n\n\n"

        # Construct Project Bible (Full comprehensive doc)
        bible_intro = f"# Project Bible: {title}\n## Metadata\n- Genre: {genre}\n- Logline: {logline}\n- Vibe: {request.vibe}\n- Analysis Lens: {request.persona}\n\n"
        synopsis = metadata.get("synopsis", "")
        bible_content = bible_intro + f"## Synopsis\n{synopsis}\n\n" + source_material_content

        universe_display_name = request.universe_name or "My First Universe"
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
        
        # Ensure beat_sheet is a dict for Firestore
        final_beat_sheet = beat_sheet if isinstance(beat_sheet, dict) else {}

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
            "beat_sheet": final_beat_sheet,
            "beat_sheet_data": final_beat_sheet,
            "synopsis": synopsis,
            "characters": metadata.get("character_descriptions", [])
        }
        
        print(f"DEBUG: Saving project {project_id} with {len(project_data['characters'])} characters and {len(final_beat_sheet)} beats")
        project_ref.set(project_data)

        redirect_to = "beat-sheet"
        if request.is_script and "script_blocks" in metadata:
            script_blocks = metadata["script_blocks"]
            if script_blocks:
                script_ref = project_ref.collection("script").document("content")
                script_ref.set({"blocks": script_blocks})
                redirect_to = "editor"
        elif request.mode == "explorer":
            print(f"[{user_id}] Explorer mode: Generating initial scene...")
            first_beat_desc = beat_sheet.get("opening_image", "A striking visual start.")
            chars = [c.get("name", "Protagonist") for c in metadata.get("character_descriptions", [])[:2]]
            
            # CRITICAL: Pass full context so AI doesn't hallucinate sci-fi for a mystery
            full_context = f"GENRE: {genre}\nLOGLINE: {logline}\nBEAT: Opening Image - {first_beat_desc}"
            
            try:
                initial_blocks = logic_engine.generate_scene_content(
                    beat_context=full_context,
                    characters=chars,
                    game_theory_type="Cooperative"
                )
                if initial_blocks:
                    script_ref = project_ref.collection("script").document("content")
                    script_ref.set({"blocks": initial_blocks})
                    redirect_to = "editor"
            except Exception as e:
                print(f"Error: {e}")
                redirect_to = "editor"

        return FinalizeResponse(project_id=project_id, universe_id=universe_id, redirect_to=redirect_to)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))