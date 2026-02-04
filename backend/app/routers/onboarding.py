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
    # Extracts text from PDF and analyzes it as a script or notes.
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    tmp_path = None
    try:
        # Stream to temp file to save memory
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        file_size = os.path.getsize(tmp_path)
        print(f"[{user_id}] File streamed to {tmp_path}. Size: {file_size} bytes")

        # 1. Parse as Script (Always attempt, to be ready if user selects 'Script')
        print(f"[{user_id}] Starting parse_pdf_to_editor_format...")
        try:
            # Optimized: returns blocks AND full text
            script_blocks, text = parse_pdf_to_editor_format(tmp_path)
            print(f"[{user_id}] Finished parse_pdf_to_editor_format. Blocks: {len(script_blocks)}, Text Length: {len(text)}")
        except Exception as e:
            print(f"[{user_id}] parsing failed: {e}")
            script_blocks = []
            text = ""
        
        # 2. Extract raw text for Analysis (If parser failed or returned empty text, try fallback?)
        # For now, assume if parser worked, text is good. If parser failed, we might want a fallback.
        if not text:
             print(f"[{user_id}] Parser returned no text. Attempting fallback raw text extraction...")
             try:
                pdf = PdfReader(tmp_path)
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
                print(f"[{user_id}] Fallback extraction complete. Length: {len(text)}")
             except Exception as e:
                 print(f"[{user_id}] Fallback extraction failed: {e}")

        # Count pages for heuristic (re-open efficiently or just guess from blocks? Let's use PdfReader just for page count if needed, or assume text length)
        # We need page count for the heuristic 'is this a script?'
        try:
             pdf = PdfReader(tmp_path)
             page_count = len(pdf.pages)
        except:
             page_count = 0

        logic_engine = LogicEngine()
        
        metadata = {}
        print(f"[{user_id}] Starting LogicEngine analysis (Pages: {page_count})...")
        if page_count > 10:
             # Heuristic: likely a script
             metadata = logic_engine.reverse_engineer_script(text)
             metadata["source_type"] = "script"
        else:
             metadata = logic_engine.distill_notes(text)
             metadata["source_type"] = "notes"
        print(f"[{user_id}] Finished LogicEngine analysis.")
        
        # Return both metadata and the raw/parsed content options
        metadata["script_blocks"] = script_blocks
        metadata["raw_text"] = text # For "Source Material" drawer
        
        # Cleanup
        os.unlink(tmp_path)
            
        print(f"[{user_id}] analyze_file complete. Returning.")
        return metadata
    except Exception as e:
        print(f"Error analyzing file: {e}")
        # Clean up if error
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Failed to analyze file: {str(e)}")

class SetupRequest(BaseModel):
    pitch: str = ""
    metadata: Dict[str, Any]
    vibe: Optional[str] = "Cinematic"
    persona: str
    mode: str = "architect"
    user_id: Optional[str] = None
    is_script: bool = False
    script_content: Optional[List[Dict[str, Any]]] = None

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
        
        # Safely get metadata with defaults
        title = request.metadata.get("title", "Untitled Project")
        genre = request.metadata.get("genre", "Unknown Genre")
        logline = request.metadata.get("logline", "")
        
        # 1. Construct the Beat Sheet Text
        beat_sheet_text = ""
        # ... (keep existing construction logic)
        if "beat_sheet" in request.metadata:
            # Detect framework for header
            framework = request.metadata.get("structure_suggestion", "Save the Cat")
            beat_sheet_text = f"BEAT SHEET ({framework})\n" + "="*20 + "\n\n"
            for beat, desc in request.metadata["beat_sheet"].items():
                beat_sheet_text += f"{beat.replace('_', ' ').upper()}:\n{desc}\n\n"

        # 2. Determine Source Material Content
        source_material_content = request.metadata.get("raw_text", "")
        if not source_material_content or not source_material_content.strip():
            source_material_content = beat_sheet_text

        # 3. Construct Bible Content
        bible_intro = f"# Project Bible: {title}\n## Metadata\n- Genre: {genre}\n- Logline: {logline}\n- Vibe: {request.vibe}\n- Analysis Lens: {request.persona}\n\n"
        synopsis = request.metadata.get("synopsis", request.pitch)
        
        bible_content = bible_intro + f"## Synopsis\n{synopsis}\n\n" + beat_sheet_text
        
        if "character_descriptions" in request.metadata:
            bible_content += "\n## Characters\n"
            for char in request.metadata["character_descriptions"]:
                bible_content += f"- **{char.get('name', 'Unknown')}**: {char.get('role', 'N/A')} - {char.get('description', '')}\n"

        # 4. Create Universe (if needed)
        universe_id = f"universe_{user_id}"
        universe_ref = db.collection("universes").document(universe_id)
        
        if not universe_ref.get().exists:
            universe_ref.set({
                "name": "My First Universe",
                "owner_id": user_id,
                "created_at": firestore.SERVER_TIMESTAMP
            })

        # 5. Create Project
        project_id = f"project_{uuid.uuid4().hex[:8]}"
        project_ref = universe_ref.collection("projects").document(project_id)
        
        # 6. Save to Firestore
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
            "beat_sheet_data": beat_sheet, # Sync for Architect mode
            "synopsis": synopsis,
            "characters": request.metadata.get("character_descriptions", [])
        }
        
        project_ref.set(project_data)

        # 7. Handle Script Import or Initial Scene Generation (Explorer Mode)
        redirect_to = "beat-sheet"
        
        if request.is_script and "script_blocks" in request.metadata:
            # Import existing script
            script_blocks = request.metadata["script_blocks"]
            if script_blocks:
                script_ref = project_ref.collection("script").document("content")
                script_ref.set({"blocks": script_blocks})
                redirect_to = "editor" # Go to editor if script imported
        elif request.mode == "explorer":
            # Explorer Mode: Generate the first scene automatically
            print(f"[{user_id}] Explorer mode: Generating initial scene...")
            first_beat = "Opening Image"
            beat_desc = beat_sheet.get("opening_image", "The start of the journey.")
            
            # Simple character extraction for the prompt
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
                redirect_to = "editor" # Still go to editor, it will just be empty or default

        return FinalizeResponse(project_id=project_id, universe_id=universe_id, redirect_to=redirect_to)

    except Exception as e:
        print(f"Error in finalize_onboarding: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to finalize onboarding: {str(e)}")
