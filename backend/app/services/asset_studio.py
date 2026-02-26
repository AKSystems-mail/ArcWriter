from typing import Optional, List, Dict, Any
import io
import uuid
import time
import base64
import traceback
import logging
import os
import requests
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class AssetStudio:
    def __init__(self):
        self.key = os.getenv("GEMINI_API_KEY")
        self.project = os.getenv("GOOGLE_CLOUD_PROJECT") or "arc-studio-box"
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        
        self.client = None
        if self.key:
            try:
                self.client = genai.Client(api_key=self.key.strip())
                logger.info("AssetStudio: Initialized with API Key")
            except Exception as e:
                logger.error(f"AssetStudio: API Key init failed: {e}")

        if not self.client:
            try:
                creds = None
                if os.path.exists('serviceAccountKey.json'):
                    from google.oauth2 import service_account
                    scopes = ['https://www.googleapis.com/auth/cloud-platform']
                    creds = service_account.Credentials.from_service_account_file(
                        'serviceAccountKey.json', 
                        scopes=scopes
                    )
                
                self.client = genai.Client(
                    vertexai=True, 
                    project=self.project, 
                    location=self.location,
                    credentials=creds
                )
                logger.info(f"AssetStudio: Initialized with Vertex AI (project={self.project})")
            except Exception as e:
                logger.error(f"AssetStudio: Vertex AI init failed: {e}")

    def generate_poster(self, title: str, tagline: str, genre: str = "Sci-Fi", style: Optional[str] = None, image_references: List[str] = None) -> Optional[str]:
        if not self.client:
            logger.error("AssetStudio: Client not initialized. Cannot generate poster.")
            return None

        prompt = f"A high-quality movie poster for a {genre} film titled '{title}'. "
        prompt += f"Visual style: {style or 'cinematic'}. "
        prompt += f"Bottom tagline: {tagline}."
        
        contents = [prompt]
        
        if image_references:
            for b64 in image_references:
                clean_b64 = b64.split("base64,")[-1] if "base64," in b64 else b64
                contents.append(types.Part.from_bytes(data=base64.b64decode(clean_b64), mime_type="image/jpeg"))

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=['IMAGE'],
                    image_config=types.ImageConfig(
                        aspect_ratio='2:3'
                    )
                )
            )
            
            if response.parts:
                for part in response.parts:
                    if part.inline_data:
                        return base64.b64encode(part.inline_data.data).decode('utf-8')
            
            return None
        except Exception as e:
            logger.error(f"AssetStudio: Error in generate_poster: {e}")
            return None

    def generate_character_anchor(self, description: str, style: str = None) -> List[str]:
        if not self.client: 
            return []
        
        prompt = f"A professional cinematic headshot for: {description}. "
        prompt += f"Neutral background, high detail, consistent visual style: {style or 'cinematic'}."
        
        b64_variants = []
        for i in range(4):
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash-image',
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_modalities=['IMAGE'],
                        image_config=types.ImageConfig(
                            aspect_ratio='1:1'
                        )
                    )
                )
                if response.parts:
                    for part in response.parts:
                        if part.inline_data:
                            b64_variants.append(base64.b64encode(part.inline_data.data).decode('utf-8'))
                            break
            except Exception as e:
                logger.error(f"AssetStudio: Variant {i+1} failed: {e}")
        return b64_variants

    def generate_teaser(self, prompt: str, aspect_ratio: str = "16:9") -> Optional[Any]:
        if not self.client:
            return None

        enhanced_prompt = f"Professional cinematic motion shot, 8k, highly detailed: {prompt}"
        
        try:
            operation = self.client.models.generate_videos(
                model='veo-2.0-generate-001',
                prompt=enhanced_prompt,
                config=types.GenerateVideosConfig(
                    aspect_ratio=aspect_ratio
                )
            )
            return operation
        except Exception as e:
            logger.error(f"AssetStudio: Motion Initialization Failure: {e}")
            return None

    def _upload_video_bytes(self, video_bytes: bytes, operation_id: str) -> Optional[str]:
        """Uploads raw video bytes to Firebase Storage and returns a public URL."""
        try:
            from firebase_admin import storage
            bucket = storage.bucket()
            op_short = operation_id.split('/')[-1]
            blob_name = f"teasers/teaser_{op_short}_{int(time.time())}.mp4"
            blob = bucket.blob(blob_name)
            
            blob.upload_from_string(video_bytes, content_type='video/mp4')
            blob.make_public()
            return blob.public_url
        except Exception as e:
            logger.error(f"AssetStudio: Failed to upload video bytes: {e}")
            return None

    def get_operation_status(self, operation_id: str) -> Dict[str, Any]:
        """Checks the status of a long-running motion operation."""
        if not self.client: 
            return {"status": "error"}
        try:
            op_obj = types.GenerateVideosOperation(name=operation_id)
            operation = self.client.operations.get(op_obj)
            
            result = {
                "done": operation.done,
                "name": operation.name,
                "video_uri": None
            }

            if operation.done:
                if operation.response:
                    res = operation.response
                    if hasattr(res, 'generated_videos') and len(res.generated_videos) > 0:
                        video_obj = res.generated_videos[0]
                        if hasattr(video_obj, 'video') and hasattr(video_obj.video, 'uri') and video_obj.video.uri:
                            result["video_uri"] = video_obj.video.uri
                        elif hasattr(video_obj, 'video') and hasattr(video_obj.video, 'video_bytes') and video_obj.video.video_bytes:
                            result["video_uri"] = self._upload_video_bytes(video_obj.video.video_bytes, operation_id)
                elif operation.error:
                    return {"status": "error", "message": str(operation.error)}
            
            return result
        except Exception as e:
            logger.error(f"AssetStudio: Status check failed for {operation_id}: {e}")
            return {"status": "error", "message": str(e)}

    def generate_character_concepts(self, description: str, visual_style: str = "cinematic") -> List[str]:
        return []
