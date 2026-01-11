from google.cloud import storage
import os

# Initialize Google Cloud Storage client
# This assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set
# pointing to your service account key file, or you are running in a GCP environment.
storage_client = storage.Client()

def upload_to_firebase_storage(file_obj, destination_blob_name, bucket_name=None):
    """
    Uploads a file object to Firebase Storage and returns its public URL.

    Args:
        file_obj: The file-like object to upload (e.g., from an UploadFile in FastAPI).
        destination_blob_name: The path and filename in the Firebase Storage bucket.
        bucket_name: The name of the Firebase Storage bucket. If None, it tries to infer
                     from environment variable or client default.

    Returns:
        The public URL of the uploaded file, or None if upload fails.
    """
    if bucket_name is None:
        bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
        if not bucket_name:
            # Fallback to default bucket naming convention if not explicitly set
            # This is a common pattern for Firebase Storage buckets
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
            if project_id:
                bucket_name = f"{project_id}.appspot.com"
            else:
                print("Error: Firebase Storage bucket name not provided and GOOGLE_CLOUD_PROJECT environment variable not set.")
                return None
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        # Ensure the file_obj is at the beginning before reading
        file_obj.seek(0)
        blob.upload_from_file(file_obj)

        # Make the blob publicly accessible. This might not be desired for all use cases.
        # Consider using signed URLs for more secure access control.
        blob.make_public()

        print(f"File {destination_blob_name} uploaded to {bucket_name} and is publicly accessible at {blob.public_url}")
        return blob.public_url
    except Exception as e:
        print(f"Error uploading file to Firebase Storage: {e}")
        return None
