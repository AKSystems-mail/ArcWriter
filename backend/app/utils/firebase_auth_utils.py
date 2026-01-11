# backend/app/utils/firebase_auth_utils.py

import firebase_admin
from firebase_admin import auth, credentials, firestore
import os

# Initialize Firebase Admin SDK if not already initialized
# This function should be called once at application startup.
# It expects GOOGLE_APPLICATION_CREDENTIALS environment variable to be set
# pointing to the Firebase service account key file.
def initialize_firebase_admin():
    if not firebase_admin._apps:
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            print("Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set "
                  "and points to your Firebase service account key file.")
            raise Exception(f"Failed to initialize Firebase Admin SDK: {e}. "
                            "Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set "
                            "and points to your Firebase service account key file.")

def get_firestore_db():
    initialize_firebase_admin()
    return firestore.client()

async def verify_token(id_token: str):
    initialize_firebase_admin()
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Error verifying Firebase ID token: {e}")
        return None
