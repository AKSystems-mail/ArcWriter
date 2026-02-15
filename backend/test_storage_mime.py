import sys
import os
import io

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.services.storage_utils import upload_to_firebase_storage
from app.utils.firebase_auth_utils import initialize_firebase_admin

def test_mime_type():
    print("Testing MIME type for Firebase Storage upload...")
    initialize_firebase_admin()
    
    # Create a dummy image content
    dummy_content = b"fake image data"
    file_obj = io.BytesIO(dummy_content)
    
    destination = "test/mime_test.jpg"
    print(f"Uploading to {destination}...")
    
    url = upload_to_firebase_storage(file_obj, destination)
    
    if url:
        print(f"Upload successful. URL: {url}")
        print("Please check the Firebase Console for 'test/mime_test.jpg' MIME type.")
    else:
        print("Upload failed.")

if __name__ == "__main__":
    test_mime_type()
