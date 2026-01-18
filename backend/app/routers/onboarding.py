from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db
from app.services.logic_engine import LogicEngine
from app.services.script_parser import parse_pdf_to_editor_format
from pypdf import PdfReader
import io
import os
import uuid
import tempfile
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
    # Extracts text from PDF and analyzes it as a script or notes.
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        
        # Save to temp file for pdfplumber
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # 1. Parse as Script (Always attempt, to be ready if user selects 'Script')
        script_blocks = parse_pdf_to_editor_format(tmp_path)
        
        # 2. Extract raw text for Analysis
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        
        page_count = len(pdf.pages)
        logic_engine = LogicEngine()
        
        metadata = {}
        if page_count > 10:
             # Heuristic: likely a script
             metadata = logic_engine.reverse_engineer_script(text)
             metadata["source_type"] = "script"
        else:
             metadata = logic_engine.distill_notes(text)
             metadata["source_type"] = "notes"
        
        # Return both metadata and the raw/parsed content options
        metadata["script_blocks"] = script_blocks
        metadata["raw_text"] = text # For "Source Material" drawer
        
        # Cleanup
        os.unlink(tmp_path)
            
        return metadata
    except Exception as e:
        print(f"Error analyzing file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze file: {str(e)}")

class SetupRequest(BaseModel):
    pitch: str
    metadata: Dict[str, Any]
    vibe: str
    persona: str
    user_id: Optional[str] = None
    is_script: bool = False
    script_content: Optional[List[Dict[str, Any]]] = None
    is_script: bool = False # New flag

class FinalizeResponse(BaseModel):
    project_id: str
    universe_id: str

@router.post("/finalize", response_model=FinalizeResponse)
async def finalize_onboarding(request: SetupRequest, user_id: str = Depends(get_current_user)):
    # Finalizes the onboarding process: creates universe, project, and saves to Firestore.
    try:
        db = get_firestore_db()
        
        title = request.metadata.get("title", "Untitled Project")
        genre = request.metadata.get("genre", "Unknown Genre")
        logline = request.metadata.get("logline", "")
        
        # Handle Bible Content (Source Material)
        bible_intro = f"# Project Bible: {title}\n## Metadata\n- Genre: {genre}\n- Logline: {logline}\n- Vibe: {request.vibe}\n- Producer Persona: {request.persona}\n\n"
        
        synopsis = request.metadata.get("synopsis", request.pitch)
        bible_content = bible_intro + f"## Synopsis\n{synopsis}\n"

        if "raw_text" in request.metadata:
             bible_content += "\n## Source Material\n" + request.metadata["raw_text"] + "\n"

        if "character_descriptions" in request.metadata:
            bible_content += "\n## Characters\n"
            for char in request.metadata["character_descriptions"]:
                bible_content += f"- **{char.get('name', 'Unknown')}**: {char.get('role', 'N/A')} - {char.get('description', '')}\n"

        if "beat_sheet" in request.metadata:
            bible_content += "\n## Beat Sheet (Save the Cat)\n"
            for beat, desc in request.metadata["beat_sheet"].items():
                bible_content += f"- **{beat}**: {desc}\n"

        universe_id = f"universe_{user_id}"
        universe_ref = db.collection("universes").document(universe_id)
        
        if not universe_ref.get().exists:
            universe_ref.set({
                "name": "My First Universe",
                "owner_id": user_id,
                "created_at": firestore.SERVER_TIMESTAMP
            })

        project_id = f"project_{uuid.uuid4().hex[:8]}"
        project_ref = universe_ref.collection("projects").document(project_id)
        
        # PERSIST TO FILE SYSTEM (BibleManager)
        from app.services.bible_manager import BibleManager
        bm = BibleManager(universe_name=universe_id, project_id=project_id)
        bm.initialize_bible("save_the_cat")
        
        # Update project_config.json
        bm.update_project_data({
            "title": title,
            "genre": genre,
            "logline": logline,
            "vibe": request.vibe,
            "persona": request.persona,
            "beat_sheet_data": request.metadata.get("beat_sheet"),
            "synopsis": synopsis,
            "characters": request.metadata.get("character_descriptions"),
            "owner_id": user_id
        })
        
        # SYNC TO FIRESTORE
        project_data = {
            "title": title,
            "owner_id": user_id,
            "created_at": firestore.SERVER_TIMESTAMP,
            "bible_content": bible_content,
            "logline": logline,
            "genre": genre,
            "vibe": request.vibe,
            "persona": request.persona,
            "beat_sheet": request.metadata.get("beat_sheet"),
            "beat_sheet_data": request.metadata.get("beat_sheet"),
            "synopsis": synopsis,
            "characters": request.metadata.get("character_descriptions")
        }
        
        project_ref.set(project_data)

        # Handle Script Import
        if request.is_script and "script_blocks" in request.metadata:
            script_blocks = request.metadata["script_blocks"]
            if script_blocks:
                script_ref = project_ref.collection("script").document("content")
                script_ref.set({"blocks": script_blocks})
                print(f"Imported {len(script_blocks)} blocks to script.")

        return FinalizeResponse(project_id=project_id, universe_id=universe_id)

    except Exception as e:
        print(f"Error in finalize_onboarding: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to finalize onboarding: {str(e)}")
