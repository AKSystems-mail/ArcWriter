from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db

router = APIRouter(
    prefix="/api/user",
    tags=["users"]
)

class UserMeResponse(BaseModel):
    id: str
    email: Optional[str] = None
    studio_credits: int = 99999
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
            # For testing: return dummy profile with high credits
            return UserMeResponse(id=user_id, email="tester@example.com", studio_credits=99999)
        
        data = user_doc.to_dict()
        
        return UserMeResponse(
            id=user_id,
            email=data.get('email'),
            studio_credits=data.get('studio_credits', 99999),
            plan=data.get('plan', 'free'),
            subscription_status=data.get('subscription_status')
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user profile for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching user profile")
