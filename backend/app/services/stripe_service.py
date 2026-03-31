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
        self.frontend_url = os.getenv("FRONTEND_URL") or "https://arcwriter.us"

        # Price IDs from Dashboard
        self.prices = {
            "WRITER_ROOM_MONTHLY": (os.getenv("STRIPE_PRICE_WR_MONTHLY") or "").strip(),
            "WRITER_ROOM_ANNUAL": (os.getenv("STRIPE_PRICE_WR_ANNUAL") or "").strip(),
            "STUDIO_PASS": (os.getenv("STRIPE_PRICE_STUDIO_PASS") or "").strip(),
            "TOP_UP": (os.getenv("STRIPE_PRICE_TOP_UP") or "").strip(),
            "MANUSCRIPT_ADAPTATION": (os.getenv("STRIPE_PRICE_ADAPTATION") or "price_1TF5u1Q6LC1Uq9P30tdNaiPW").strip()
        }
        
        # Validation for required price IDs
        if not self.prices["MANUSCRIPT_ADAPTATION"]:
            print("WARNING: STRIPE_PRICE_ADAPTATION is not set in the environment.")

    async def create_adaptation_checkout_session(self, user_id: str) -> str:
        """One-time payment for premium manuscript adaptation credit."""
        price_id = self.prices.get("MANUSCRIPT_ADAPTATION")
        if not price_id:
            raise HTTPException(status_code=400, detail="Manuscript Adaptation pricing not configured.")

        try:
            email = await self._get_user_email(user_id)
            session = stripe.checkout.Session.create(
                customer_email=email,
                line_items=[{"price": price_id, "quantity": 1}],
                mode="payment",
                success_url=f"{self.frontend_url}/upload-manuscript?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{self.frontend_url}/wizard",
                client_reference_id=user_id,
                metadata={
                    "user_id": user_id,
                    "tier": "MANUSCRIPT_ADAPTATION"
                }
            )
            return session.url
        except Exception as e:
            print(f"Stripe Adaptation Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to initiate secure checkout.")

    async def create_customer_portal_session(self, user_id: str) -> str:
        """Creates a Stripe Customer Portal session for subscription management."""
        try:
            email = await self._get_user_email(user_id)
            customers = stripe.Customer.list(email=email, limit=1)
            
            if not customers.data:
                raise HTTPException(status_code=404, detail="No active billing record found.")
            
            customer_id = customers.data[0].id
            
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=f"{self.frontend_url}/billing",
            )
            return session.url
        except Exception as e:
            print(f"Stripe Portal Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to open billing portal.")

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
        except stripe.error.StripeError as e:
            print(f"Stripe API Error: {e.user_message or str(e)}")
            raise HTTPException(status_code=400, detail=e.user_message or str(e))
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
                    await self.user_service.add_credits(user_id, 600)
                elif tier == "TOP_UP":
                    await self.user_service.add_credits(user_id, 65)
                elif tier == "MANUSCRIPT_ADAPTATION":
                    await self.user_service.update_user_data(user_id, {"has_adaptation_credit": True})
                else:
                    await self.user_service.update_subscription_status(user_id, "active", tier)
                    await self.user_service.reset_monthly_allowance(user_id, tier)

        # 2. Monthly Renewal Success
        elif event["type"] == "invoice.paid":
            invoice = event["data"]["object"]
            subscription_id = invoice.get("subscription")
            if subscription_id:
                subscription = stripe.Subscription.retrieve(subscription_id)
                user_id = subscription.get("metadata", {}).get("user_id")
                tier = subscription.get("metadata", {}).get("tier")
                if user_id and tier:
                    await self.user_service.reset_monthly_allowance(user_id, tier)

        # 3. Subscription Cancellation or Updates
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            user_id = subscription.get("metadata", {}).get("user_id")
            if user_id:
                # GRACE PERIOD: If they set to cancel at end of period
                if subscription.get("cancel_at_period_end"):
                    end_date = datetime.fromtimestamp(subscription["current_period_end"])
                    await self.user_service.update_subscription_status(
                        user_id, 
                        "active", # Stay active
                        subscription.get("metadata", {}).get("tier", "FREE"),
                        next_billing_date=end_date
                    )
                    await self.user_service.update_user_data(user_id, {"pending_cancellation": True})
                    print(f"User {user_id} set to cancel at end of period: {end_date}")
                else:
                    # They might have un-cancelled
                    await self.user_service.update_user_data(user_id, {"pending_cancellation": False})

        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            user_id = subscription.get("metadata", {}).get("user_id")
            if user_id:
                # FINAL REVOCATION: Subscription is now officially over
                await self.user_service.update_subscription_status(user_id, "inactive", "free")
                await self.user_service.update_user_data(user_id, {"pending_cancellation": False})
                print(f"User {user_id} subscription officially ended.")

        return {"status": "success"}

    async def _get_user_email(self, user_id: str) -> Optional[str]:
        user_data = await self.user_service.get_user_data(user_id)
        return user_data.get("email") if user_data else None
