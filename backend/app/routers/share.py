from fastapi import APIRouter, Depends, HTTPException, Body, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import secrets
import string
import hashlib
import json
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db
from firebase_admin import firestore

router = APIRouter(
    prefix="/api/share",
    tags=["share"]
)

def generate_secure_hash(length=12):
    """Generates a random alphanumeric string for the share link."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class ShareCreateRequest(BaseModel):
    universe_id: str
    project_id: str
    recipient: Optional[str] = None
    password: Optional[str] = None
    expiration_days: Optional[int] = 7 # 0 for Never
    allow_download: bool = False

class TrackEventRequest(BaseModel):
    type: str # 'view', 'play_teaser', 'read_script', 'scroll_depth', 'heartbeat'
    device_id: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/create")
async def create_share_link(request: ShareCreateRequest, user_id: str = Depends(get_current_user)):
    try:
        db = get_firestore_db()
        
        # Verify ownership
        project_ref = db.collection('universes').document(request.universe_id).collection('projects').document(request.project_id)
        project_doc = project_ref.get()
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_data = project_doc.to_dict()
        if project_data.get('owner_id') != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        # Generate unique hash
        share_hash = generate_secure_hash()
        
        # Calculate expiration
        expires_at = None
        if request.expiration_days and request.expiration_days > 0:
            expires_at = datetime.utcnow() + timedelta(days=request.expiration_days)

        # Hash password if provided
        password_hash = None
        if request.password and request.password.strip():
            password_hash = hashlib.sha256(request.password.encode()).hexdigest()

        share_data = {
            "hash": share_hash,
            "owner_id": user_id,
            "universe_id": request.universe_id,
            "project_id": request.project_id,
            "project_title": project_data.get("title", "Untitled"),
            "recipient": request.recipient,
            "password_hash": password_hash,
            "expires_at": expires_at,
            "allow_download": request.allow_download,
            "is_revoked": False,
            "created_at": firestore.SERVER_TIMESTAMP,
            "view_count": 0,
            "unique_devices": []
        }

        db.collection("share_links").document(share_hash).set(share_data)

        return {"share_url": f"/pitch/{share_hash}", "hash": share_hash}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list-all")
async def list_all_user_shares(user_id: str = Depends(get_current_user)):
    """Lists every share link created by the user across all projects. Gated for subscribers."""
    try:
        db = get_firestore_db()
        
        # SUBSCRIPTION GATE
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists or user_doc.to_dict().get('subscription_status') != 'active':
            raise HTTPException(status_code=402, detail="Writer's Room subscription required to view pitch analytics.")

        shares = db.collection("share_links")\
            .where("owner_id", "==", user_id)\
            .order_by("created_at", direction=firestore.Query.DESCENDING)\
            .get()
        
        return [s.to_dict() for s in shares]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{universe_id}/{project_id}")
async def list_project_shares(universe_id: str, project_id: str, user_id: str = Depends(get_current_user)):
    """Lists all share links created for a specific project. Gated for subscribers."""
    try:
        db = get_firestore_db()
        
        # SUBSCRIPTION GATE
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists or user_doc.to_dict().get('subscription_status') != 'active':
            raise HTTPException(status_code=402, detail="Writer's Room subscription required to view pitch analytics.")

        shares = db.collection("share_links")\
            .where("owner_id", "==", user_id)\
            .where("universe_id", "==", universe_id)\
            .where("project_id", "==", project_id)\
            .order_by("created_at", direction=firestore.Query.DESCENDING)\
            .get()
        
        return [s.to_dict() for s in shares]
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/revoke/{share_hash}")
async def revoke_share_link(share_hash: str, user_id: str = Depends(get_current_user)):
    """The Kill Switch: Instantly deactivates a share link."""
    try:
        db = get_firestore_db()
        share_ref = db.collection("share_links").document(share_hash)
        share_doc = share_ref.get()
        
        if not share_doc.exists:
            raise HTTPException(status_code=404, detail="Link not found")
        
        if share_doc.to_dict().get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        share_ref.update({"is_revoked": True})
        return {"status": "revoked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track/{share_hash}")
async def track_pitch_event(share_hash: str, request: Request, event: TrackEventRequest):
    """Logs an engagement event from the public pitch page."""
    try:
        db = get_firestore_db()
        share_ref = db.collection("share_links").document(share_hash)
        
        # Capture IP and metadata
        ip = request.client.host
        user_agent = request.headers.get("user-agent", "Unknown")
        
        event_data = {
            "type": event.type,
            "device_id": event.device_id,
            "ip": ip,
            "user_agent": user_agent,
            "metadata": event.metadata,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        
        # 1. Log to sub-collection for deep analytics
        share_ref.collection("events").add(event_data)
        
        # 2. Update summary metrics on the root doc
        updates = {}
        if event.type == 'view':
            updates["view_count"] = firestore.Increment(1)
            # Add to unique devices if not already there
            updates["unique_devices"] = firestore.ArrayUnion([event.device_id])
            
        if updates:
            share_ref.update(updates)
            
        return {"status": "tracked"}
    except Exception as e:
        print(f"Tracking Error: {e}")
        return {"status": "error"}

@router.get("/analytics/{share_hash}")
async def get_link_analytics(share_hash: str, user_id: str = Depends(get_current_user)):
    """Retrieves aggregated analytics for a specific link. Gated for subscribers."""
    try:
        db = get_firestore_db()

        # SUBSCRIPTION GATE
        user_doc = db.collection('users').document(user_id).get()
        if not user_doc.exists or user_doc.to_dict().get('subscription_status') != 'active':
            raise HTTPException(status_code=402, detail="Writer's Room subscription required to view pitch analytics.")

        share_ref = db.collection("share_links").document(share_hash)
        share_doc = share_ref.get()

        
        if not share_doc.exists or share_doc.to_dict().get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        # Fetch all events
        events = share_ref.collection("events").order_by("timestamp").get()
        event_list = [e.to_dict() for e in events]
        
        # Basic Aggregation
        stats = {
            "total_views": 0,
            "teaser_plays": 0,
            "script_opens": 0,
            "max_scroll": 0,
            "avg_time_seconds": 0,
            "locations": set(),
            "timeline": []
        }
        
        for e in event_list:
            if e['type'] == 'view': stats["total_views"] += 1
            if e['type'] == 'play_teaser': stats["teaser_plays"] += 1
            if e['type'] == 'read_script': stats["script_opens"] += 1
            if e['type'] == 'scroll_depth':
                stats["max_scroll"] = max(stats["max_scroll"], e.get('metadata', {}).get('depth', 0))
            if e['ip']: stats["locations"].add(e['ip']) # In prod, we'd resolve this to a city
            
        stats["locations"] = list(stats["locations"])
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/view/{share_hash}")
async def get_share_data(share_hash: str):
    """
    Returns public-safe data for the pitch page.
    Does NOT return script content or sensitive info.
    """
    try:
        db = get_firestore_db()
        share_ref = db.collection("share_links").document(share_hash)
        share_doc = share_ref.get()

        if not share_doc.exists:
            raise HTTPException(status_code=404, detail="Pitch not found")

        share_data = share_doc.to_dict()

        # Check revocation
        if share_data.get("is_revoked"):
            raise HTTPException(status_code=410, detail="This pitch access has been revoked by the writer.")

        # Check expiration
        if share_data.get("expires_at"):
            # Firestore timestamp to datetime
            expires_at = share_data["expires_at"]
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                raise HTTPException(status_code=410, detail="This pitch has expired. Please contact the writer for renewed access.")

        # Get project data
        project_ref = db.collection('universes').document(share_data["universe_id"]).collection('projects').document(share_data["project_id"])
        project_doc = project_ref.get()
        
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project no longer exists")

        project_data = project_doc.to_dict()
        
        # Increment view count
        share_ref.update({"view_count": firestore.Increment(1)})

        # Return sanitized data
        return {
            "title": project_data.get("title"),
            "logline": project_data.get("logline"),
            "synopsis": project_data.get("synopsis") or project_data.get("bible_content"),
            "genre": project_data.get("genre"),
            "vibe": project_data.get("vibe"),
            "poster_url": project_data.get("poster_url"),
            "teaser_url": project_data.get("teaser_url"),
            "characters": project_data.get("characters", []),
            "registration": project_data.get("registration", {}),
            "requires_password": bool(share_data.get("password_hash")),
            "allow_download": share_data.get("allow_download", False),
            "recipient": share_data.get("recipient")
        }

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unlock/{share_hash}")
async def unlock_script(share_hash: str, password: Optional[str] = Body(None, embed=True)):
    """
    Authenticates access to the full script if password protected.
    Returns script blocks.
    """
    try:
        db = get_firestore_db()
        share_doc = db.collection("share_links").document(share_hash).get()

        if not share_doc.exists:
            raise HTTPException(status_code=404, detail="Pitch not found")

        share_data = share_doc.to_dict()

        # CRITICAL: Check revocation/expiration before unlocking script
        if share_data.get("is_revoked"):
            raise HTTPException(status_code=410, detail="This pitch access has been revoked.")
            
        if share_data.get("expires_at"):
            if datetime.utcnow() > share_data["expires_at"].replace(tzinfo=None):
                raise HTTPException(status_code=410, detail="This pitch has expired.")

        # Check Password
        stored_hash = share_data.get("password_hash")
        if stored_hash:
            if not password:
                raise HTTPException(status_code=401, detail="Password required")
            
            provided_hash = hashlib.sha256(password.encode()).hexdigest()
            if provided_hash != stored_hash:
                raise HTTPException(status_code=401, detail="Incorrect password")

        # Get Script Content
        project_ref = db.collection('universes').document(share_data["universe_id"]).collection('projects').document(share_data["project_id"])
        script_doc = project_ref.collection("script").document("content").get()
        
        if not script_doc.exists:
            return {"blocks": []}

        return {"blocks": script_doc.to_dict().get("blocks", [])}

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
