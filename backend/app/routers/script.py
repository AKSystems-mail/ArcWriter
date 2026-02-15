from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.utils.firebase_auth_utils import get_current_user
from app.services.logic_engine import LogicEngine

router = APIRouter(
    prefix="/api/script",
    tags=["script"]
)

class SceneGenerationRequest(BaseModel):
    beat_context: str
    characters: List[str]
    game_theory_type: str = "Prisoner's Dilemma" # Default
    existing_script: Optional[str] = ""

class DialogueSuggestionRequest(BaseModel):
    # ... (existing fields)
    context_lines: str
    genre: str = "Drama"
    style: str = "Modern"
    beat_context: Optional[str] = ""
    characters: Optional[List[str]] = []

class HookScanRequest(BaseModel):
    script_text: str
    genre: str

@router.post("/hook_scan")
async def hook_scan(request: HookScanRequest, user_id: str = Depends(get_current_user)):
    logic_engine = LogicEngine()
    try:
        result = logic_engine.scan_first_ten_pages(request.script_text, request.genre)
        return result
    except Exception as e:
        print(f"Error in hook scan endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_scene")
async def generate_scene(request: SceneGenerationRequest, user_id: str = Depends(get_current_user)):
    logic_engine = LogicEngine()
    try:
        scene_blocks = logic_engine.generate_scene_content(
            beat_context=request.beat_context,
            characters=request.characters,
            game_theory_type=request.game_theory_type,
            existing_script=request.existing_script
        )
        return {"blocks": scene_blocks}
    except Exception as e:
        print(f"Error generating scene: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest_dialogue")
async def suggest_dialogue(request: DialogueSuggestionRequest, user_id: str = Depends(get_current_user)):
    logic_engine = LogicEngine()
    try:
        suggestions = logic_engine.suggest_dialogue(
            context_lines=request.context_lines,
            genre=request.genre,
            style=request.style,
            beat_context=request.beat_context,
            characters=request.characters
        )
        return suggestions
    except Exception as e:
        print(f"Error suggesting dialogue: {e}")
        raise HTTPException(status_code=500, detail=str(e))
