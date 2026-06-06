# backend/app/services/user_service.py

from fastapi import HTTPException, status
from app.utils.firebase_auth_utils import get_firestore_db
from firebase_admin import firestore
from typing import Optional
from datetime import datetime, timedelta
import os

class UserService:
    def __init__(self):
        self.db = get_firestore_db()
        self.users_collection = self.db.collection('users')

    async def get_user_data(self, user_id: str):
        user_doc_ref = self.users_collection.document(user_id)
        user_doc = user_doc_ref.get()
        if user_doc.exists:
            return user_doc.to_dict()
        return None

    async def update_user_data(self, user_id: str, data: dict):
        user_doc_ref = self.users_collection.document(user_id)
        user_doc_ref.update(data)
        
        # If email is being set/updated, sync to Brevo Identified Contacts
        if 'email' in data and data['email']:
            await self._sync_to_brevo(data['email'])

    async def deduct_credits(self, user_id: str, amount: int):
        if amount <= 0:
            return

        user_ref = self.users_collection.document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Production Default: 25 starter credits
            user_ref.set({
                'studio_credits': 25,
                'email': None, 
                'plan': 'free',
                'created_at': firestore.SERVER_TIMESTAMP,
                'subscription_status': 'free'
            })
            return True

        user_data = user_doc.to_dict()
        current_credits = user_data.get('studio_credits', 0)
        subscription_status = user_data.get('subscription_status', 'free')
        plan = user_data.get('plan', 'free')
        
        # SECURITY: Only active 'WRITER_ROOM' subscribers get free logic/unlimited.
        # But even they have a limit on high-compute tasks (handled by caller).
        # For now, if they are active subscribers, we skip deduction for Logic.
        # If this is called for Poster/Teaser, the caller will pass amount > 0.
        
        if subscription_status == 'active' and 'WRITER_ROOM' in plan:
            # Subscribers don't pay for logic/text. 
            # If the amount is for a high-compute asset, we might still deduct from their allowance.
            # For simplicity in this audit fix, we'll allow active subscribers to bypass 
            # until we implement the 150/mo allowance limit strictly.
            return True
            
        if current_credits < amount:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED, 
                detail="Insufficient credits. Please purchase a top-up or upgrade."
            )

        # Atomic decrement
        user_ref.update({
            'studio_credits': firestore.Increment(-amount)
        })
        print(f"User {user_id} credits deducted by {amount}. New balance: {current_credits - amount}")
        return True

    async def add_credits(self, user_id: str, amount: int):
        if amount <= 0:
            return
        user_ref = self.users_collection.document(user_id)
        user_ref.update({
            'studio_credits': firestore.Increment(amount)
        })
        print(f"User {user_id} credits added by {amount}.")

    async def reset_monthly_allowance(self, user_id: str, plan_type: str):
        """Resets the user's credits to the plan's allowance (e.g., 150)."""
        allowance = 150 if 'writer_room' in plan_type else 0
        user_ref = self.users_collection.document(user_id)
        
        # We don't want to WIP out top-up credits.
        # But for simplicity in this MVP, we just set the balance to AT LEAST the allowance.
        user_doc = user_ref.get()
        if user_doc.exists:
            curr = user_doc.to_dict().get('studio_credits', 0)
            # If they have 10 credits left, we set them to 150.
            # If they have 200 credits (meaning they have top-ups), we don't reset DOWN.
            if curr < allowance:
                user_ref.update({'studio_credits': allowance})
                print(f"User {user_id} allowance reset to {allowance}")

    async def update_subscription_status(self, user_id: str, status: str, plan: str, next_billing_date: Optional[datetime] = None):
        user_doc_ref = self.users_collection.document(user_id)
        update_data = {
            'subscription_status': status,
            'plan': plan
        }
        if next_billing_date:
            update_data['next_billing_date'] = next_billing_date
        user_doc_ref.update(update_data)
        print(f"User {user_id} plan updated to {plan} ({status}).")

    async def _sync_to_brevo(self, email: str):
        brevo_key = (os.getenv("BREVO_API_KEY") or "").strip()
        list_id = (os.getenv("BREVO_REGISTERED_LIST_ID") or "3").strip()
        
        if not brevo_key: return

        try:
            import sib_api_v3_sdk
            from sib_api_v3_sdk.rest import ApiException
            configuration = sib_api_v3_sdk.Configuration()
            configuration.api_key['api-key'] = brevo_key
            api_instance = sib_api_v3_sdk.ContactsApi(sib_api_v3_sdk.ApiClient(configuration))
            
            create_contact = sib_api_v3_sdk.CreateContact(
                email=email,
                list_ids=[int(list_id)],
                update_enabled=True
            )
            api_instance.create_contact(create_contact)
            print(f"Brevo: Synced registered user {email} to list {list_id}")
        except Exception as e:
            print(f"Brevo Sync Error (UserService): {e}")
