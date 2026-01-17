from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
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

@router.post("/generate_scene")
async def generate_scene(request: SceneGenerationRequest, user_id: str = Depends(get_current_user)):
    logic_engine = LogicEngine()
    try:
        scene_blocks = logic_engine.generate_scene_content(
            beat_context=request.beat_context,
            characters=request.characters,
            game_theory_type=request.game_theory_type
        )
        return {"blocks": scene_blocks}
    except Exception as e:
        print(f"Error generating scene: {e}")
        raise HTTPException(status_code=500, detail=str(e))
