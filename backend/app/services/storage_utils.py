from firebase_admin import storage as firebase_storage
import os

import time

def upload_to_firebase_storage(file_obj, destination_blob_name, bucket_name=None):
    """
    Uploads a file object to Firebase Storage and returns its public URL.
    Uses direct string upload to avoid resumable SSL errors in Cloud Functions.
    """
    try:
        bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()
        blob = bucket.blob(destination_blob_name)

        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        
        # Read the entire buffer into memory
        content = file_obj.read()
        
        # Use upload_from_string for direct, non-resumable upload
        # This is the fix for the SSL: UNEXPECTED_EOF_WHILE_READING error
        blob.upload_from_string(
            content,
            content_type="image/jpeg",
            timeout=300
        )

        blob.make_public()
        print(f"File {destination_blob_name} uploaded successfully via Direct Buffer.")
        return blob.public_url
    except Exception as e:
        print(f"Critical error in Visuals Dept upload: {e}")
        return None
