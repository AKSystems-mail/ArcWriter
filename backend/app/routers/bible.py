from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.utils.firebase_auth_utils import get_current_user
from app.services.bible_manager import BibleManager

router = APIRouter(
    prefix="/api/bible",
    tags=["bible"]
)

class BibleUpdateRequest(BaseModel):
    universe_name: str
    project_id: str
    section_header: str
    content: str

@router.post("/update")
async def update_bible_section(request: BibleUpdateRequest, user_id: str = Depends(get_current_user)):
    try:
        # Note: We should ideally verify that the user owns this project/universe
        # For now, we trust the auth token and provided IDs
        manager = BibleManager(universe_name=request.universe_name, project_id=request.project_id)
        manager.update_section(request.section_header, request.content)
        return {"status": "success", "message": f"Section '{request.section_header}' updated."}
    except Exception as e:
        print(f"Error updating bible: {e}")
        raise HTTPException(status_code=500, detail=str(e))
