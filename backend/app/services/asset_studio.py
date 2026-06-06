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

def check_and_clean_gemini_url():
    base_url = os.getenv("GOOGLE_GEMINI_BASE_URL")
    if base_url:
        import urllib.parse
        import socket
        try:
            parsed = urllib.parse.urlparse(base_url)
            host = parsed.hostname or "localhost"
            port = parsed.port or 80
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                s.connect((host, port))
            logger.info(f"AssetStudio: GOOGLE_GEMINI_BASE_URL is active on {host}:{port}")
        except Exception:
            logger.warning(f"AssetStudio: GOOGLE_GEMINI_BASE_URL ({base_url}) is not reachable. Unsetting to use default Google API.")
            os.environ.pop("GOOGLE_GEMINI_BASE_URL", None)

class AssetStudio:
    def __init__(self):
        check_and_clean_gemini_url()
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        try:
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                logger.error("AssetStudio: GEMINI_API_KEY not found in environment")
                return

            # Note: We use vertexai=False to use the Gemini Developer API (AI Studio)
            # Switch to v1beta for newest model support
            self.client = genai.Client(
                api_key=api_key,
                http_options={'api_version': 'v1beta'}
            )
            logger.info("AssetStudio: Gemini Client initialized successfully (v1beta).")
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
            # For Imagen 4, we use the specialized generate_images method
            # Note: image_references (edit/masking) requires a different workflow in Imagen 4,
            # so for now we focus on text-to-image generation which is the primary use case here.
            response = self.client.models.generate_images(
                model='imagen-4.0-generate-001',
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio='3:4',
                    safety_filter_level='block_low_and_above',
                    person_generation='allow_adult'
                )
            )

            if response.generated_images:
                img = response.generated_images[0]
                return base64.b64encode(img.image.image_bytes).decode('utf-8')
            
            return None
        except Exception as e:
            logger.error(f"AssetStudio: Error in generate_poster: {e}")
            return None

    def generate_character_anchor(self, description: str, style: str = None) -> List[str]:
        if not self.client: 
            logger.error("AssetStudio: Client not initialized for character anchor")
            return []
        
        logger.info(f"AssetStudio: Generating Character Anchor for: {description[:50]}...")
        prompt = (
            f"A professional cinematic character portrait for: {description}. "
            "High-end studio photography, photorealistic person, sharp focus, 8k, natural skin textures. "
            f"Consistent visual style: {style or 'Professional Cinematic Photography'}."
        )
        
        from concurrent.futures import ThreadPoolExecutor
        
        def generate_single_variant(i):
            try:
                response = self.client.models.generate_images(
                    model='imagen-4.0-generate-001',
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio='1:1',
                        safety_filter_level='block_low_and_above',
                        person_generation='allow_adult'
                    )
                )
                if response.generated_images:
                    img = response.generated_images[0]
                    return base64.b64encode(img.image.image_bytes).decode('utf-8')
            except Exception as e:
                logger.error(f"AssetStudio: Variant {i+1} failed: {e}")
            return None

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(generate_single_variant, range(2)))
        
        return [r for r in results if r is not None]

    def generate_teaser(self, prompt: str, genre: str = "scifi", aspect_ratio: str = "16:9") -> Optional[Any]:
        if not self.client:
            return None

        # Align audio with 'Visual Soul' IDs from the Onboarding Wizard
        audio_map = {
            "scifi": "Audio: Dark ambient synth-wave, futuristic drones, no dialogue.",
            "fantasy": "Audio: Ethereal orchestral strings, mystical choir hums, magical chimes.",
            "horror": "Audio: Eerie atonal violin screeches, low-frequency rhythmic thumping, heavy breathing.",
            "comedy": "Audio: Upbeat whimsical orchestral pluck, bright and energetic tempo, playful tuba.",
            "indie": "Audio: Somber solo piano melody, natural room ambience, intimate and grounded.",
            "noir": "Audio: Dark moody jazz, lonely trumpet, rainy street ambience, cinematic bass.",
            "western": "Audio: Rhythmic acoustic strumming, whistling wind, cinematic dusty atmosphere.",
            "romance": "Audio: Soft acoustic guitar, warm romantic pads, intimate and uplifting atmosphere."
        }
        
        # Fallback for genre normalization (handles title-case or ID mismatches)
        normalized_genre = str(genre).lower().replace(" ", "")
        if "drama" in normalized_genre: normalized_genre = "indie"
        if "action" in normalized_genre: normalized_genre = "scifi" # Default high energy to sci-fi/synth
        
        audio_footer = audio_map.get(normalized_genre, "Audio: Cinematic orchestral soundtrack, no dialogue.")
        enhanced_prompt = f"Professional cinematic motion shot, 8k, highly detailed: {prompt}. {audio_footer}"
        
        try:
            logger.info(f"AssetStudio: Initializing Motion Render with model 'veo-3.0-generate-001'")
            logger.info(f"AssetStudio: Prompt: {enhanced_prompt}")
            
            # Using correct generate_videos method for Veo
            # Start video generation - Standard model for production quality
            operation = self.client.models.generate_videos(
                model='veo-3.0-generate-001',
                prompt=enhanced_prompt,
                config=types.GenerateVideosConfig(
                    aspect_ratio=aspect_ratio,
                    duration_seconds=8
                )
            )

            # The SDK now returns an operation object with a name attribute (the ID)
            # or sometimes just the ID string depending on version. We normalize to string ID.
            operation_id = operation.name if hasattr(operation, 'name') else str(operation)
            logger.info(f"AssetStudio: Operation successfully created: {operation_id}")
            return operation_id
        except Exception as e:
            logger.error(f"AssetStudio: Motion Initialization Failure: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
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
            return {"status": "error", "done": True, "message": "Client not initialized"}
        try:
            logger.info(f"AssetStudio: Polling SDK for operation: {operation_id}")
            
            # SDK FIX: The public get() method requires an SDK Operation object handle.
            # We create a GenerateVideosOperation handle using the string ID.
            # This object has the .name attribute AND the .from_api_response method 
            # that the SDK internally calls to parse the server response.
            op_handle = types.GenerateVideosOperation(name=operation_id)
            operation = self.client.operations.get(op_handle)
            
            # Log basic state
            logger.info(f"AssetStudio: SDK Response Type: {type(operation)}")
            
            # LOG FULL RAW RESPONSE
            try:
                # Most SDK objects have a to_json() or can be cast to dict
                raw_json = operation.model_dump_json() if hasattr(operation, 'model_dump_json') else str(operation)
                logger.info(f"AssetStudio: FULL RAW OPERATION: {raw_json}")
            except Exception as e:
                logger.warning(f"AssetStudio: Could not dump full operation JSON: {e}")

            is_done = getattr(operation, 'done', False)
            has_res = bool(getattr(operation, 'response', None))
            has_err = bool(getattr(operation, 'error', None))
            logger.info(f"AssetStudio: Op {operation_id} -> done: {is_done}, has_response: {has_res}, has_error: {has_err}")

            result = {
                "done": is_done,
                "name": operation_id,
                "video_uri": None,
                "status": "processing"
            }

            if has_err:
                logger.error(f"AssetStudio: Operation {operation_id} reported error: {operation.error}")
                return {"status": "error", "done": True, "message": str(operation.error)}

            if is_done:
                logger.info(f"AssetStudio: Operation {operation_id} marked as DONE. Parsing response...")
                if has_res:
                    res = operation.response
                    # Veo responses contain generated_videos
                    if hasattr(res, 'generated_videos') and len(res.generated_videos) > 0:
                        video_obj = res.generated_videos[0]
                        # Correct attribute access for video content
                        v_attr = getattr(video_obj, 'video', None)
                        if v_attr:
                            uri = getattr(v_attr, 'uri', None)
                            v_bytes = getattr(v_attr, 'video_bytes', None)
                            
                            if uri:
                                # If the URI is an internal Google API link, we must download and re-host it
                                # because the frontend cannot access authenticated Google API files directly.
                                if "generativelanguage.googleapis.com" in uri:
                                    logger.info(f"AssetStudio: Downloading internal video from {uri}")
                                    try:
                                        video_res = requests.get(uri, headers={"x-goog-api-key": os.environ.get("GEMINI_API_KEY")})
                                        if video_res.status_code == 200:
                                            result["video_uri"] = self._upload_video_bytes(video_res.content, operation_id)
                                            result["status"] = "completed"
                                        else:
                                            logger.error(f"AssetStudio: Failed to download internal video: {video_res.status_code}")
                                            result["status"] = "error"
                                            result["message"] = "Cloud storage sync failed"
                                    except Exception as download_err:
                                        logger.error(f"AssetStudio: Error during video proxy: {download_err}")
                                        result["status"] = "error"
                                        result["message"] = "Cloud storage sync error"
                                else:
                                    result["video_uri"] = uri
                                    result["status"] = "completed"
                            elif v_bytes:
                                logger.info(f"AssetStudio: Found video_bytes for {operation_id}. Uploading...")
                                result["video_uri"] = self._upload_video_bytes(v_bytes, operation_id)
                                result["status"] = "completed"
                        
                        if result["video_uri"]:
                            logger.info(f"AssetStudio: Finalized video URI: {result['video_uri']}")
                        else:
                            logger.warning(f"AssetStudio: No URI/Bytes in video object for {operation_id}")
                            result["status"] = "error"
                            result["message"] = "No video data in response"
                    else:
                        logger.warning(f"AssetStudio: No generated_videos found in response for {operation_id}")
                        result["status"] = "error"
                        result["message"] = "Response missing video field"
                else:
                    logger.warning(f"AssetStudio: Op {operation_id} DONE but has no response object")
                    result["status"] = "error"
                    result["message"] = "Empty response"
            
            return result
        except Exception as e:
            logger.error(f"AssetStudio: Status check failed for {operation_id}: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"status": "error", "done": True, "message": str(e)}

    def generate_character_concepts(self, description: str, visual_style: str = "cinematic") -> List[str]:
        return []
