from fastapi import APIRouter, Depends, Request, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.utils.firebase_auth_utils import get_current_user

router = APIRouter(prefix="/api/billing", tags=["billing"])

class CheckoutRequest(BaseModel):
    tier: str # 'WRITER_ROOM_MONTHLY' | 'WRITER_ROOM_ANNUAL' | 'STUDIO_PASS'

@router.get("/health")
async def billing_health():
    return {"status": "billing router is live"}

@router.post("/create-session")
async def create_session(request: CheckoutRequest, user_id: str = Depends(get_current_user)):
    """Creates a Stripe Checkout session for the requested tier."""
    from main import services
    url = await services.stripe_service.create_checkout_session(user_id, request.tier)
    return {"url": url}

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhooks for payment verification."""
    from main import services
    payload = await request.body()
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe signature")
    
    return await services.stripe_service.handle_webhook_event(payload, stripe_signature)
