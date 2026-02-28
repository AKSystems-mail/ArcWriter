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

class RedeemRequest(BaseModel):
    code: str

@router.post("/redeem-beta")
async def redeem_beta_code(request: RedeemRequest, user_id: str = Depends(get_current_user)):
    """Redeems a secret beta code for 500 tester credits."""
    from main import services
    import os
    
    secret_beta_code = (os.getenv("BETA_SECRET_CODE") or "ARC_TESTER_2026").strip()
    
    if request.code.strip() != secret_beta_code:
        raise HTTPException(status_code=400, detail="Invalid or expired beta code.")
        
    # Check if user has already redeemed it
    user_data = await services.user_service.get_user_data(user_id)
    if user_data.get("beta_redeemed"):
        raise HTTPException(status_code=400, detail="Beta code already claimed by this account.")
        
    # Grant credits and mark as redeemed
    await services.user_service.add_credits(user_id, 500)
    await services.user_service.update_user_data(user_id, {"beta_redeemed": True})
    
    return {"status": "success", "message": "500 Tester Credits authorized. Go build something great."}

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
