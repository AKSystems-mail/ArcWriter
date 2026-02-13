# backend/app/services/user_service.py

from fastapi import HTTPException, status
from app.utils.firebase_auth_utils import get_firestore_db
from firebase_admin import firestore
from typing import Optional
from datetime import datetime, timedelta

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

    async def deduct_credits(self, user_id: str, amount: int):
        if amount <= 0:
            return

        user_ref = self.users_collection.document(user_id)
        
        # Check balance and subscription status first
        user_doc = user_ref.get()
        if not user_doc.exists:
            # Grant a one-time "New User Bonus" for testing/onboarding
            print(f"User {user_id} not found. Creating profile with 100 starter credits.")
            user_ref.set({
                'studio_credits': 100,
                'email': None, # Will be updated later if needed
                'plan': 'free',
                'created_at': firestore.SERVER_TIMESTAMP
            })
            current_credits = 100
            subscription_status = 'free'
        else:
            user_data = user_doc.to_dict()
            current_credits = user_data.get('studio_credits', 0)
            subscription_status = user_data.get('subscription_status')

        # If user has an active subscription, no credits are deducted
        if subscription_status == 'active':
            return True
            
        if current_credits < amount:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED, 
                detail="Insufficient credits. Please purchase more or subscribe."
            )

        # Atomic decrement (Safe and Simple)
        user_ref.update({
            'studio_credits': firestore.Increment(-amount)
        })
        print(f"User {user_id} credits deducted by {amount}. New balance roughly: {current_credits - amount}")
        return True

    async def add_credits(self, user_id: str, amount: int):
        if amount <= 0:
            return
        user_ref = self.users_collection.document(user_id)
        try:
            user_ref.update({
                'studio_credits': firestore.Increment(amount)
            })
            print(f"User {user_id} credits added by {amount}.")
        except Exception as e:
            print(f"Error adding credits for user {user_id}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add credits.")

    async def update_subscription_status(self, user_id: str, status: str, next_billing_date: Optional[datetime] = None):
        user_doc_ref = self.users_collection.document(user_id)
        update_data = {'subscription_status': status}
        if next_billing_date:
            update_data['next_billing_date'] = next_billing_date
        user_doc_ref.update(update_data)
        print(f"User {user_id} subscription status updated to {status}. Next billing date: {next_billing_date}")
