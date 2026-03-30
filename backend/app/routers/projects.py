from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db
from app.services.logic_engine import LogicEngine
from firebase_admin import firestore
import uuid

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

class UniversePremiseRequest(BaseModel):
    series_premise: str

@router.post("/{universe_id}/premise")
async def update_universe_premise(universe_id: str, request: UniversePremiseRequest, user_id: str = Depends(get_current_user)):
    db = get_firestore_db()
    uni_ref = db.collection('universes').document(universe_id)
    uni_doc = uni_ref.get()
    
    if not uni_doc.exists or uni_doc.to_dict().get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    uni_ref.update({"series_premise": request.series_premise})
    return {"status": "success"}

@router.get("/{universe_id}/continuity")
async def get_universe_continuity(universe_id: str, user_id: str = Depends(get_current_user)):
    """Retrieves the series premise and the most recent character list from a universe."""
    db = get_firestore_db()
    uni_ref = db.collection('universes').document(universe_id)
    uni_doc = uni_ref.get()
    
    if not uni_doc.exists or uni_doc.to_dict().get('owner_id') != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    uni_data = uni_doc.to_dict()
    
    # Get characters from the most recent project
    recent_project = db.collection('universes').document(universe_id)\
        .collection('projects').order_by('created_at', direction=firestore.Query.DESCENDING).limit(1).get()
        
    characters = []
    if len(recent_project) > 0:
        characters = recent_project[0].to_dict().get('characters', [])
        
    return {
        "series_premise": uni_data.get("series_premise", ""),
        "characters": characters
    }

class AdaptationProcessRequest(BaseModel):
    universe_name: Optional[str] = "My First Universe"
    raw_text: str

@router.post("/process_adaptation")
async def process_manuscript_adaptation(request: AdaptationProcessRequest, user_id: str = Depends(get_current_user)):
    """
    Premium: Processes a full manuscript into a Scriptment.
    Requires 'has_adaptation_credit' on the user document.
    """
    try:
        db = get_firestore_db()
        
        # 1. Verify Credit
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists or not user_doc.to_dict().get("has_adaptation_credit"):
            raise HTTPException(status_code=402, detail="No adaptation credit found. Please complete checkout.")

        logic_engine = LogicEngine()
        
        # 2. Run Adaptation Engine
        print(f"[{user_id}] AdaptEngine: Analyzing manuscript...")
        adaptation_data = logic_engine.adapt_manuscript(request.raw_text)
        
        # 3. Generate the Scriptment
        print(f"[{user_id}] AdaptEngine: Generating Scriptment...")
        scriptment_blocks = logic_engine.generate_scriptment(adaptation_data, request.raw_text)

        # 4. Create New Project & Universe
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

        # 5. Save Data
        project_data = {
            "title": adaptation_data.get("title", "Adapted Project"),
            "owner_id": user_id,
            "created_at": firestore.SERVER_TIMESTAMP,
            "logline": adaptation_data.get("logline", ""),
            "genre": adaptation_data.get("genre", "Unknown"),
            "synopsis": adaptation_data.get("synopsis", ""),
            "beat_sheet": adaptation_data.get("beat_sheet", {}),
            "beat_sheet_data": adaptation_data.get("beat_sheet", {}),
            "characters": adaptation_data.get("character_descriptions", []),
            "adaptation_mode": True,
            "mode": "architect"
        }
        
        project_ref.set(project_data)

        if scriptment_blocks:
            script_ref = project_ref.collection("script").document("content")
            script_ref.set({"blocks": scriptment_blocks})

        # 6. DEDUCT CREDIT
        user_ref.update({"has_adaptation_credit": False})

        return {
            "status": "success", 
            "project_id": project_id, 
            "universe_id": universe_id
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Adaptation Failed: {str(e)}")
