from firebase_admin import storage as firebase_storage
import os

def upload_to_firebase_storage(file_obj, destination_blob_name, bucket_name=None):
    """
    Uploads a file object to Firebase Storage and returns its public URL.
    Uses the firebase-admin SDK for better integration.
    """
    try:
        # If bucket_name is provided, use it, otherwise firebase_admin.storage.bucket()
        # uses the default bucket configured during initialize_app or the default one.
        bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()
        blob = bucket.blob(destination_blob_name)

        # Ensure the file_obj is at the beginning before reading
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
            
        blob.upload_from_file(file_obj)

        # Make the blob publicly accessible.
        blob.make_public()

        print(f"File {destination_blob_name} uploaded successfully.")
        return blob.public_url
    except Exception as e:
        print(f"Error uploading file to Firebase Storage: {e}")
        return None
