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

        # Universal Design Language: High-fidelity, photorealistic, cinematic
        base_language = (
            "Professional high-end cinematic photography, photorealistic people, crisp details, 8k resolution, "
            "natural skin textures, professional color grading. Strictly NO cartoons, NO drawings, "
            "NO illustrations, NO abstract art, NO 3D renders, NO anime."
        )

        # Genre-Specific Design Languages (Last 10 Years Trends)
        genre_map = {
            "Comedy": (
                "High-key bright studio lighting, vibrant colors with orange and yellow accents, clean and polished look. "
                "Layout: Awkward ensemble lineup or character duo centered. Typography: Bold red or yellow sans-serif title."
            ),
            "Drama": (
                "Candid camera style, grainy film texture, natural moody lighting, soft focus backgrounds. "
                "Composition: Human-centric, focusing on raw facial expressions and raw textures."
            ),
            "Action": (
                "High contrast, dynamic motion, intense rim lighting. Composition: Strong silhouettes, "
                "heavy negative space for urgency. Palette: Monochrome or sharp dual-tone."
            ),
            "Sci-Fi": (
                "Atmospheric fog, massive scale, tiny human figures against giant architectural structures. "
                "Color grading: Teal and orange or neon gradients. Technical futurism elements."
            ),
            "Horror": (
                "Minimalist stark negative space, high-contrast red and black palette. "
                "Creepy central motif, liminal space aesthetic, unsettling sharp lighting."
            ),
            "Thriller": (
                "Low-key lighting, deep shadows, mysterious silhouettes. Tense atmosphere, "
                "cold color palette with blues and grays."
            ),
            "Romance": (
                "Warm golden hour lighting, soft and intimate composition. "
                "Pastel color palette (lilacs, beiges). Elegant serif typography."
            ),
            "Western": (
                "Dusty atmosphere, harsh sun lighting, earthy tones (browns, tans). "
                "Wide panoramic scale, rugged textures."
            )
        }

        genre_style = genre_map.get(genre, "Cinematic composition, professional lighting.")
        
        prompt = f"A high-quality movie poster for a {genre} film titled '{title}'. {base_language} "
        prompt += f"Design Language: {genre_style} "
        prompt += f"Visual style: {style or 'Professional Studio Photography'}. "
        prompt += f"Bottom tagline: {tagline}."
        
        contents = [prompt]
        
        if image_references:
            for b64 in image_references:
                clean_b64 = b64.split("base64,")[-1] if "base64," in b64 else b64
                contents.append(types.Part.from_bytes(data=base64.b64decode(clean_b64), mime_type="image/jpeg"))

        try:
            response = self.client.models.generate_content(
                model='gemini-3.1-flash-image-preview',
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
        
        # Enhanced character prompt for photorealism
        prompt = (
            f"A professional cinematic character portrait for: {description}. "
            "High-end studio photography, photorealistic person, sharp focus, 8k, natural skin textures, "
            "detailed eyes and hair, professional lighting. Neutral cinematic background. "
            f"Consistent visual style: {style or 'Professional Cinematic Photography'}. "
            "Strictly NO cartoons, NO illustrations, NO drawings, NO 3D renders."
        )
        
        b64_variants = []
        for i in range(4):
            try:
                response = self.client.models.generate_content(
                    model='gemini-3.1-flash-image-preview',
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
