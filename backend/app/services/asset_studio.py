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
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        try:
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                logger.error("AssetStudio: GEMINI_API_KEY not found in environment")
                return

            self.client = genai.Client(
                api_key=api_key,
                http_options={'api_version': 'v1alpha'}
            )
            logger.info("AssetStudio: Gemini Client initialized successfully.")
        except Exception as e:
            logger.error(f"AssetStudio: Failed to initialize Gemini Client: {e}")

    def generate_poster(self, title: str, tagline: str, genre: str, style: str = "Cinematic", image_references: List[str] = None, characters: List[Dict] = None) -> Optional[str]:
        if not self.client:
            return None

        # Build prompt using character anchors if available
        char_descriptions = ""
        if characters:
            char_descriptions = "\nCharacters to feature:\n" + "\n".join([f"- {c.get('name')}: {c.get('description')}" for c in characters])

        prompt = (
            f"A high-end cinematic movie poster for a film titled '{title}'.\n"
            f"Tagline: '{tagline}'\n"
            f"Genre: {genre}\n"
            f"Style: {style}\n"
            f"{char_descriptions}\n\n"
            "Visual Guidelines: Professional graphic design, balanced composition, high-quality typography. "
            "Sharp focus, vibrant cinematic lighting, studio quality. "
            "Ensure consistency with any provided character visual references. "
            "Strictly NO real actor likenesses. NO messy AI text (except the clear title if possible)."
        )

        try:
            contents = [prompt]
            if image_references:
                for b64 in image_references[:4]:
                    contents.append(types.Part.from_bytes(data=base64.b64decode(b64), mime_type='image/png'))

            response = self.client.models.generate_content(
                model='gemini-3.1-flash-image-preview',
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalalities=['IMAGE'],
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
            logger.error("AssetStudio: Client not initialized for character anchor")
            return []
        
        logger.info(f"AssetStudio: Generating Character Anchor for: {description[:50]}...")
        # Enhanced character prompt for photorealism and ethnic accuracy
        prompt = (
            f"A professional cinematic character portrait for: {description}. "
            "Critically important: Accurately represent the character's ethnic/racial background as described. "
            "High-end studio photography, photorealistic person, sharp focus, 8k, natural skin textures, "
            "detailed eyes and hair, professional lighting. Neutral cinematic background. "
            f"Consistent visual style: {style or 'Professional Cinematic Photography'}. "
            "Strictly NO real actor likenesses. NO cartoons, NO illustrations, NO 3D renders."
        )
        
        from concurrent.futures import ThreadPoolExecutor
        
        def generate_single_variant(i):
            try:
                logger.info(f"AssetStudio: Starting variant {i+1} thread...")
                start_time = time.time()
                response = self.client.models.generate_content(
                    model='gemini-3.1-flash-image-preview',
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_modalalities=['IMAGE'],
                        image_config=types.ImageConfig(
                            aspect_ratio='1:1'
                        )
                    )
                )
                duration = time.time() - start_time
                logger.info(f"AssetStudio: Variant {i+1} completed in {duration:.2f}s")
                if response.parts:
                    for part in response.parts:
                        if part.inline_data:
                            return base64.b64encode(part.inline_data.data).decode('utf-8')
            except Exception as e:
                logger.error(f"AssetStudio: Variant {i+1} failed: {e}")
            return None

        # Execute 4 requests in parallel to prevent 60s timeout
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(generate_single_variant, range(4)))
        
        # Filter out None results
        b64_variants = [r for r in results if r is not None]
        
        logger.info(f"AssetStudio: Successfully generated {len(b64_variants)} character variants in parallel")
        return b64_variants

    def generate_teaser(self, prompt: str, genre: str = "Sci-Fi", aspect_ratio: str = "16:9") -> Optional[Any]:
        if not self.client:
            return None

        # Genre-specific audio signatures for immersive music soundtracks
        audio_map = {
            "Sci-Fi": "Audio: Dark ambient synth-wave, futuristic drones, no dialogue.",
            "Action": "Audio: Fast-paced orchestral percussion, high-energy cinematic pulses.",
            "Horror": "Audio: Eerie atonal violin screeches, low-frequency rhythmic thumping.",
            "Drama": "Audio: Somber solo piano melody, natural room ambience, no speech.",
            "Thriller": "Audio: Tense ticking sounds, rising atmospheric tension, sharp metallic clangs.",
            "Romance": "Audio: Soft acoustic guitar, warm romantic pads, intimate atmosphere.",
            "Western": "Audio: Rhythmic acoustic strumming, whistling wind, cinematic dusty atmosphere.",
            "Comedy": "Audio: Upbeat whimsical orchestral pluck, bright and energetic tempo."
        }
        
        audio_cue = audio_map.get(genre, "Audio: Immersive cinematic soundscape.")
        full_prompt = f"{prompt}. {audio_cue}"

        try:
            logger.info(f"AssetStudio: Requesting Teaser Render (Veo 3.0): {full_prompt[:100]}...")
            operation = self.client.models.generate_content(
                model='veo-3.0-generate-001',
                contents=[full_prompt],
                config=types.GenerateContentConfig(
                    response_modalalities=['VIDEO'],
                    video_config=types.VideoConfig(
                        aspect_ratio=aspect_ratio,
                        duration_seconds=8
                    )
                )
            )
            
            # Verify operation object structure
            if isinstance(operation, str):
                # If API returns a string, wrap it as operation name
                logger.warning(f"AssetStudio: API returned string instead of operation object: {operation}")
                # Create a minimal operation-like object
                class OperationWrapper:
                    def __init__(self, name):
                        self.name = name
                        self.done = False
                return OperationWrapper(operation)
            
            logger.info(f"AssetStudio: Operation type: {type(operation)}, has name: {hasattr(operation, 'name')}")
            return operation
        except Exception as e:
            logger.error(f"AssetStudio: Motion Initialization Failure: {e}")
            logger.error(f"Exception traceback: {traceback.format_exc()}")
            return None

    def _upload_video_bytes(self, video_bytes: bytes, operation_id: str) -> Optional[str]:
        """Uploads raw video bytes to Firebase Storage and returns a public URL."""
        try:
            from firebase_admin import storage
            bucket = storage.bucket()
            op_short = operation_id.split('/')[-1]
            blob_name = f"teasers/teaser_{op_short}_{int(time.time())}.mp4"
            blob = bucket.blob(blob_name)
            
            # Force direct buffer upload to bypass connection resets
            with io.BytesIO(video_bytes) as buf:
                blob.upload_from_file(buf, content_type='video/mp4')
            
            blob.make_public()
            return blob.public_url
        except Exception as e:
            logger.error(f"AssetStudio: Video Upload Failed: {e}")
            return None

    def get_teaser_status(self, operation_id: str) -> Dict[str, Any]:
        """Checks the status of a long-running video generation task."""
        if not self.client:
            return {"status": "error", "done": True, "message": "Client not initialized"}

        try:
            # Position argument syntax for operation name
            op = self.client.operations.get(operation_id)
            
            if op.done:
                if op.error:
                    logger.error(f"AssetStudio: Teaser Error from API: {op.error}")
                    return {"status": "error", "done": True, "message": str(op.error)}
                
                # Check for video data in response
                if op.response and hasattr(op.response, 'video'):
                    video_uri = self._upload_video_bytes(op.response.video.bytes, operation_id)
                    return {"status": "success", "done": True, "video_uri": video_uri}
                elif op.response and hasattr(op.response, 'parts'):
                    # Handle multimodal response parts
                    for part in op.response.parts:
                        if hasattr(part, 'video'):
                            video_uri = self._upload_video_bytes(part.video.bytes, operation_id)
                            return {"status": "success", "done": True, "video_uri": video_uri}
                
                return {"status": "error", "done": True, "message": "No video data found in completed response"}
            
            return {"status": "processing", "done": False}
        except Exception as e:
            logger.error(f"AssetStudio: Status check failed for {operation_id}: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"status": "error", "done": True, "message": str(e)}

    def generate_character_concepts(self, description: str, visual_style: str = "cinematic") -> List[str]:
        return []
