# backend/app/services/stripe_service.py

import stripe
import os
from fastapi import HTTPException, status
from typing import Dict, Any, Optional
from app.services.user_service import UserService
from datetime import datetime, timedelta

class StripeService:
    def __init__(self, user_service: UserService):
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        self.user_service = user_service
        
        # Base Frontend URL for redirection
        self.frontend_url = os.getenv("FRONTEND_URL") or "https://arc-studio-box.web.app"

        # Price IDs from Dashboard
        self.prices = {
            "WRITER_ROOM_MONTHLY": os.getenv("STRIPE_PRICE_WR_MONTHLY"),
            "WRITER_ROOM_ANNUAL": os.getenv("STRIPE_PRICE_WR_ANNUAL"),
            "STUDIO_PASS": os.getenv("STRIPE_PRICE_STUDIO_PASS") # One-time $49
        }

    async def create_checkout_session(self, user_id: str, tier: str) -> str:
        price_id = self.prices.get(tier)
        if not price_id:
            raise HTTPException(status_code=400, detail=f"Invalid pricing tier: {tier}")

        mode = "subscription" if "WRITER_ROOM" in tier else "payment"
        
        try:
            email = await self._get_user_email(user_id)
            
            session = stripe.checkout.Session.create(
                customer_email=email,
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
                success_url=f"{self.frontend_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{self.frontend_url}/billing",
                client_reference_id=user_id,
                metadata={
                    "user_id": user_id,
                    "tier": tier
                }
            )
            return session.url
        except Exception as e:
            print(f"Stripe Session Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to initiate secure checkout.")

    async def handle_webhook_event(self, payload: bytes, sig_header: str):
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, self.webhook_secret)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        # 1. Initial Purchase Success
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session.get("client_reference_id")
            tier = session.get("metadata", {}).get("tier")
            
            if user_id and tier:
                if tier == "STUDIO_PASS":
                    # One-time pack: Add 600 credits
                    await self.user_service.add_credits(user_id, 600)
                else:
                    # Subscription: Reset to 150 allowance and update status
                    await self.user_service.update_subscription_status(user_id, "active", tier)
                    await self.user_service.reset_monthly_allowance(user_id, tier)

        # 2. Monthly Renewal Success
        elif event["type"] == "invoice.paid":
            invoice = event["data"]["object"]
            customer_id = invoice.get("customer")
            # We'd need to look up our user_id by customer_id in a real app, 
            # but for this MVP we'll assume client_reference_id logic or metadata.
            subscription = stripe.Subscription.retrieve(invoice.get("subscription"))
            user_id = subscription.get("metadata", {}).get("user_id")
            tier = subscription.get("metadata", {}).get("tier")
            
            if user_id and tier:
                # Every time they pay their monthly bill, reset allowance to 150
                await self.user_service.reset_monthly_allowance(user_id, tier)

        return {"status": "success"}

    async def _get_user_email(self, user_id: str) -> Optional[str]:
        user_data = await self.user_service.get_user_data(user_id)
        return user_data.get("email") if user_data else None
