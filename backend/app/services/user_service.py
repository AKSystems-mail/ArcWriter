# backend/app/services/user_service.py

from fastapi import HTTPException, status
from app.utils.firebase_auth_utils import get_firestore_db
from firebase_admin import firestore
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

        user_doc_ref = self.users_collection.document(user_id)
        
        # Use a transaction to ensure atomicity for credit deduction
        @firestore.transactional
        async def update_in_transaction(transaction, user_doc_ref):
            snapshot = await user_doc_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise HTTPException(status_code=404, detail="User not found.")

            current_credits = snapshot.get('studio_credits') or 0
            subscription_status = snapshot.get('subscription_status')

            # If user has an active subscription, no credits are deducted
            if subscription_status == 'active':
                return
            
            if current_credits < amount:
                raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits. Please purchase more or subscribe.")

            transaction.update(user_doc_ref, {'studio_credits': current_credits - amount})
            print(f"User {user_id} credits deducted by {amount}. Remaining: {current_credits - amount}")
        
        try:
            await self.db.run_transaction(update_in_transaction, user_doc_ref)
        except HTTPException:
            raise # Re-raise the HTTPException
        except Exception as e:
            print(f"Error deducting credits for user {user_id}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to deduct credits.")

    async def add_credits(self, user_id: str, amount: int):
        if amount <= 0:
            return
        user_doc_ref = self.users_collection.document(user_id)
        
        @firestore.transactional
        async def update_in_transaction(transaction, user_doc_ref):
            snapshot = await user_doc_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise HTTPException(status_code=404, detail="User not found.")
            current_credits = snapshot.get('studio_credits') or 0
            transaction.update(user_doc_ref, {'studio_credits': current_credits + amount})
            print(f"User {user_id} credits added by {amount}. New total: {current_credits + amount}")
        
        try:
            await self.db.run_transaction(update_in_transaction, user_doc_ref)
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
