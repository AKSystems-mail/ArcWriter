import sys
import os
import firebase_admin
from firebase_admin import storage

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.utils.firebase_auth_utils import initialize_firebase_admin

def check_mime():
    initialize_firebase_admin()
    bucket = storage.bucket()
    
    # Check the test file
    blob = bucket.get_blob("test/mime_test.jpg")
    if blob:
        print(f"File: {blob.name}")
        print(f"Content-Type: {blob.content_type}")
    else:
        print("Blob test/mime_test.jpg not found.")

    # Also check the one the user mentioned if possible
    # gs://arc-studio-box.firebasestorage.app/posters/Untitled_adf995ec-8210-465e-b8f4-f7b76979017c.jpg
    user_blob = bucket.get_blob("posters/Untitled_adf995ec-8210-465e-b8f4-f7b76979017c.jpg")
    if user_blob:
        print(f"File: {user_blob.name}")
        print(f"Content-Type: {user_blob.content_type}")
    else:
        print("User mentioned blob not found.")

if __name__ == "__main__":
    check_mime()
