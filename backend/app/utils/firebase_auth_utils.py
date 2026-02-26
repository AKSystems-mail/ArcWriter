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
            cred_path = "serviceAccountKey.json"
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                print(f"Found service account key at {cred_path}")
            else:
                cred = credentials.ApplicationDefault()
                print("Using Application Default Credentials")

            bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
            if not bucket_name:
                # Try to infer it from project ID (check all common cloud env vars)
                project_id = (
                    os.getenv("FIREBASE_PROJECT_ID") or 
                    os.getenv("GOOGLE_CLOUD_PROJECT") or 
                    os.getenv("GCP_PROJECT") or
                    "arc-studio-box" # Explicit fallback for this project
                )
                if project_id:
                    bucket_name = f"{project_id}.firebasestorage.app"
            
            config = {}
            if bucket_name:
                config['storageBucket'] = bucket_name
                print(f"Configuring Firebase Admin with storage bucket: {bucket_name}")

            firebase_admin.initialize_app(cred, config)
            print("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            print("Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set "
                  "and points to your Firebase service account key file, or place serviceAccountKey.json in the root.")
            raise Exception(f"Failed to initialize Firebase Admin SDK: {e}")

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

from fastapi import Header, HTTPException, status

async def get_current_user(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication scheme. Token required.")
    
    id_token = authorization.split("Bearer ")[1]
    decoded_token = await verify_token(id_token)
    
    if decoded_token is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials.")
    
    user_id = decoded_token['uid']
    
    # Check if user exists in Firestore, create if not
    db = get_firestore_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        try:
            user_ref.set({
                'plan': 'free',
                'studio_credits': 999999,
                'created_at': firestore.SERVER_TIMESTAMP,
                'email': decoded_token.get('email', 'unknown@example.com') # Store email from token
            })
            print(f"New user {user_id} created in Firestore.")
        except Exception as e:
            # If set fails, we still return the user_id but maybe log it? 
            # It might fail if we don't have permissions or something weird.
            print(f"Error creating user doc: {e}")
    
    return user_id

async def verify_project_ownership(universe_id: str, project_id: str, user_id: str):
    """
    Helper to verify that the project exists and is owned by the user.
    Raises HTTPException if unauthorized.
    """
    db = get_firestore_db()
    project_ref = db.collection("universes").document(universe_id).collection("projects").document(project_id)
    project_doc = project_ref.get()
    
    if not project_doc.exists:
        raise HTTPException(status_code=404, detail="Project not found.")
        
    data = project_doc.to_dict()
    if data.get("owner_id") != user_id:
        print(f"SECURITY ALERT: User {user_id} attempted unauthorized access to project {project_id}")
        raise HTTPException(status_code=403, detail="Unauthorized access to this project.")
    
    return data
