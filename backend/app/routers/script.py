from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.utils.firebase_auth_utils import get_current_user, verify_project_ownership
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

class MacroAuditRequest(BaseModel):
    full_script: str
    universe_id: str
    project_id: str

class SnapshotRequest(BaseModel):
    universe_id: str
    project_id: str
    blocks: List[Dict[str, Any]]
    name: Optional[str] = "Auto-save"

@router.post("/save_snapshot")
async def save_snapshot(request: SnapshotRequest, user_id: str = Depends(get_current_user)):
    from app.utils.firebase_auth_utils import get_firestore_db
    from firebase_admin import firestore
    
    await verify_project_ownership(request.universe_id, request.project_id, user_id)
    db = get_firestore_db()
    
    snapshot_ref = db.collection("universes").document(request.universe_id)\
        .collection("projects").document(request.project_id)\
        .collection("snapshots")
    
    # 1. Save new snapshot
    new_doc = snapshot_ref.document()
    new_doc.set({
        "name": request.name,
        "blocks": request.blocks,
        "created_at": firestore.SERVER_TIMESTAMP,
        "is_auto": request.name == "Auto-save"
    })
    
    # 2. Cull logic: Keep only last 50 snapshots
    # (Simple version: count and delete oldest if > 50)
    existing = snapshot_ref.order_by("created_at", direction=firestore.Query.DESCENDING).get()
    if len(existing) > 50:
        for doc in existing[50:]:
            doc.reference.delete()
            
    return {"status": "success", "snapshot_id": new_doc.id}

@router.get("/list_snapshots/{universe_id}/{project_id}")
async def list_snapshots(universe_id: str, project_id: str, user_id: str = Depends(get_current_user)):
    from app.utils.firebase_auth_utils import get_firestore_db
    await verify_project_ownership(universe_id, project_id, user_id)
    db = get_firestore_db()
    
    snaps = db.collection("universes").document(universe_id)\
        .collection("projects").document(project_id)\
        .collection("snapshots")\
        .order_by("created_at", direction="DESCENDING").limit(50).get()
        
    return [{"id": s.id, "name": s.to_dict().get("name"), "created_at": s.to_dict().get("created_at")} for s in snaps]

@router.post("/restore_snapshot")
async def restore_snapshot(request: Dict[str, str], user_id: str = Depends(get_current_user)):
    # request: { universe_id, project_id, snapshot_id }
    from app.utils.firebase_auth_utils import get_firestore_db
    uni_id, proj_id, snap_id = request['universe_id'], request['project_id'], request['snapshot_id']
    
    await verify_project_ownership(uni_id, proj_id, user_id)
    db = get_firestore_db()
    
    # Get snapshot data
    snap_doc = db.collection("universes").document(uni_id).collection("projects").document(proj_id)\
        .collection("snapshots").document(snap_id).get()
        
    if not snap_doc.exists:
        raise HTTPException(status_code=404, detail="Snapshot not found")
        
    blocks = snap_doc.to_dict().get("blocks")
    
    # Overwrite current content
    db.collection("universes").document(uni_id).collection("projects").document(proj_id)\
        .collection("script").document("content").set({"blocks": blocks})
        
    return {"status": "success"}

@router.post("/macro_audit")
async def macro_audit(request: MacroAuditRequest, user_id: str = Depends(get_current_user)):
    from app.services.bible_manager import BibleManager
    # SECURITY: Verify ownership before auditing
    await verify_project_ownership(request.universe_id, request.project_id, user_id)
    
    logic_engine = LogicEngine()
    try:
        manager = BibleManager(universe_name=request.universe_id, project_id=request.project_id)
        bible_context = manager.get_context_string()
        result = logic_engine.audit_full_structure(request.full_script, bible_context)
        return result
    except Exception as e:
        print(f"Error in macro audit endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
