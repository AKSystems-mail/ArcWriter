from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db

from firebase_admin import firestore

router = APIRouter(
    prefix="/api/user",
    tags=["users"]
)

class FeedbackRequest(BaseModel):
    subject: str
    body: str
    type: str # 'bug' | 'feature'
    metadata: Optional[dict] = None

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest, user_id: str = Depends(get_current_user)):
    """
    Two-Tier Feedback System:
    - Bugs: Available to all users.
    - Features: Restricted to 'active' subscribers (Writer's Room / Studio Pass).
    """
    db = get_firestore_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    
    is_paid = user_data.get('subscription_status') == 'active' or user_data.get('plan') == 'STUDIO_PASS'
    
    if request.type == 'feature' and not is_paid:
        raise HTTPException(status_code=403, detail="VIP Feature Requests are reserved for Studio subscribers.")

    feedback_data = {
        "user_id": user_id,
        "user_email": user_data.get('email'),
        "type": request.type,
        "subject": request.subject,
        "body": request.body,
        "status": "new",
        "created_at": firestore.SERVER_TIMESTAMP,
        "is_paid_user": is_paid,
        "metadata": request.metadata or {}
    }
    
    db.collection("feedback").add(feedback_data)
    
    # 2. Queue Email Notification for Founder
    try:
        email_content = f"""
        New {request.type.upper()} Submitted:
        
        Subject: {request.subject}
        User: {user_data.get('email')}
        Paid Tier: {'Yes' if is_paid else 'No'}
        
        Details:
        {request.body}
        
        ---
        Manage at: https://arcwriter.us/bug-feature
        """
        
        db.collection("mail_queue").add({
            "to": "aksystems.mail@gmail.com",
            "message": {
                "subject": f"[{request.type.upper()}] Feedback from {user_data.get('email')}: {request.subject}",
                "text": email_content,
                "html": f"<pre style='font-family: monospace; white-space: pre-wrap;'>{email_content}</pre>"
            },
            "status": "pending",
            "created_at": firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        logger.error(f"Mail Queue Error: {e}")

    return {"status": "success", "message": "Feedback received. Thank you for building ArcWriter with us."}

class UserMeResponse(BaseModel):
    id: str
    email: Optional[str] = None
    studio_credits: int = 25
    plan: str = "free"
    subscription_status: Optional[str] = None

@router.get("/me", response_model=UserMeResponse)
async def get_my_profile(user_id: str = Depends(get_current_user)):
    """
    Retrieves the current user's profile from Firestore.
    """
    try:
        db = get_firestore_db()
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # For testing: return dummy profile with production-ready credits
            return UserMeResponse(id=user_id, email="tester@example.com", studio_credits=25)
        
        data = user_doc.to_dict()
        
        return UserMeResponse(
            id=user_id,
            email=data.get('email'),
            studio_credits=data.get('studio_credits', 25),
            plan=data.get('plan', 'free'),
            subscription_status=data.get('subscription_status')
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user profile for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching user profile")
