# backend/app/services/stripe_service.py

import stripe
import os
from fastapi import HTTPException, status
from typing import Dict, Any
from app.services.user_service import UserService
from datetime import datetime, timedelta
import firebase_admin # Imported for _get_user_email fallback, will recheck if needed

class StripeService:
    def __init__(self, user_service: UserService):
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe.api_key:
            raise Exception("STRIPE_SECRET_KEY environment variable not set.")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        if not self.webhook_secret:
            print("Warning: STRIPE_WEBHOOK_SECRET environment variable not set. Webhook verification will be skipped.")
        self.user_service = user_service

        # Define product IDs/prices from Stripe Dashboard
        self.subscription_price_id = os.getenv("STRIPE_SUBSCRIPTION_PRICE_ID") # e.g., price_12345
        self.pitch_pack_product_id = os.getenv("STRIPE_PITCH_PACK_PRODUCT_ID") # e.g., prod_ABCDE
        self.pitch_pack_credits = 100 # Amount of credits for the pitch pack

        if not self.subscription_price_id:
            print("Warning: STRIPE_SUBSCRIPTION_PRICE_ID not set. Subscription checkout will not work.")
        if not self.pitch_pack_product_id:
            print("Warning: STRIPE_PITCH_PACK_PRODUCT_ID not set. Pitch Pack checkout will not work.")

    async def create_checkout_session(self, user_id: str, mode: str, quantity: int = 1) -> str:
        """
        Creates a Stripe Checkout Session for subscription or one-time payment.
        :param user_id: The Firebase UID of the user.
        :param mode: 'subscription' or 'payment'
        :param quantity: For one-time payments, the quantity of items.
        :return: The URL to the Stripe Checkout Session.
        """
        try:
            if mode == 'subscription':
                if not self.subscription_price_id:
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Subscription price ID not configured.")
                line_items = [
                    {
                        'price': self.subscription_price_id,
                        'quantity': 1,
                    },
                ]
            elif mode == 'payment': # For one-time credit pack
                if not self.pitch_pack_product_id:
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Pitch Pack product ID not configured.")
                
                # Assuming the product ID implies a fixed price for simplicity, or we would need a Price ID.
                # For a fixed $35 'Pitch Package', we might need a specific price ID for it.
                # Let's assume the product_id is associated with a single price for now.
                # A more robust solution would fetch the price ID from the product.
                
                # For this example, let's assume a hardcoded price object for the pack,
                # or better, create a Price object in Stripe for the Pitch Pack product.
                # For demo purposes, we'll try to find an existing price for the product or define one.
                prices = stripe.Price.list(product=self.pitch_pack_product_id, limit=1)
                if not prices.data:
                    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No price found for Pitch Pack product.")
                pack_price_id = prices.data[0].id

                line_items = [
                    {
                        'price': pack_price_id,
                        'quantity': quantity,
                    },
                ]
            else:
                raise HTTPException(status_code=400, detail="Invalid checkout mode.")

            checkout_session = stripe.checkout.Session.create(
                customer_email=await self._get_user_email(user_id), # Pre-fill email
                line_items=line_items,
                mode=mode,
                success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}", # Frontend success URL
                cancel_url="http://localhost:5173/cancel", # Frontend cancel URL
                client_reference_id=user_id, # Link session to our user
                metadata={'user_id': user_id} # Add metadata for webhook
            )
            return checkout_session.url
        except stripe.error.StripeError as e:
            print(f"Error creating checkout session: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")

    async def handle_webhook_event(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Handles Stripe webhook events.
        :param payload: The raw request body.
        :param sig_header: The Stripe-Signature header.
        :return: A dictionary indicating success and event type.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
        except ValueError as e:
            # Invalid payload
            raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            raise HTTPException(status_code=400, detail=f"Invalid signature: {e}")

        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = session.metadata.get('user_id')
            if not user_id:
                print(f"Webhook: User ID not found in session metadata for session {session.id}")
                return {"status": "success", "message": "User ID missing, skipping update."}

            # Retrieve full session to get line items/subscription details
            session_with_line_items = stripe.checkout.Session.retrieve(
                session.id,
                expand=['line_items', 'subscription']
            )

            # Check if it's a subscription or one-time payment
            if session_with_line_items.mode == 'subscription':
                # Determine next billing date (e.g., 1 month from now)
                next_billing_date = datetime.now() + timedelta(days=30)
                await self.user_service.update_subscription_status(user_id, 'active', next_billing_date)
                print(f"User {user_id} subscribed. Next billing: {next_billing_date}")
            elif session_with_line_items.mode == 'payment':
                # Assuming a successful one-time payment adds 100 credits
                await self.user_service.add_credits(user_id, self.pitch_pack_credits)
                print(f"User {user_id} purchased pitch pack, added {self.pitch_pack_credits} credits.")
            
            return {"status": "success", "message": "Checkout session completed and user updated."}
        
        return {"status": "success", "message": "Event type not handled."}

    async def _get_user_email(self, user_id: str) -> str:
        """Helper to get user's email from Firestore."""
        user_data = await self.user_service.get_user_data(user_id)
        if user_data and user_data.get('email'):
            return user_data['email']
        
        # Fallback to Firebase Auth if not in Firestore (though it should be created on first login)
        try:
            from firebase_admin import auth # Import here to avoid circular dependency
            user_record = auth.get_user(user_id)
            return user_record.email
        except Exception as e:
            print(f"Could not retrieve email for user {user_id}: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User email not found for Stripe checkout.")