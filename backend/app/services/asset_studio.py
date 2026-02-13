from typing import Optional, List, Dict
from app.services.storage_utils import upload_to_firebase_storage
from google.cloud import aiplatform
import io
import uuid
import time
import traceback # Added for logging

class AssetStudio:
    _video_jobs: Dict[str, Dict[str, str]] = {}

    def __init__(self):
        from vertexai.vision_models import ImageGenerationModel
        try:
            from vertexai.preview.vision_models import VideoGenerationModel
            self.veo_model = VideoGenerationModel.from_pretrained("veo-001")
        except ImportError:
            print("Warning: VideoGenerationModel not available. Teaser generation disabled.")
            self.veo_model = None
        
        # Using Imagen 3 as primary
        try:
            self.imagen_model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
        except Exception as e:
            print(f"Warning: Failed to load Imagen 3.0: {e}. Falling back to imagegeneration@002.")
            self.imagen_model = ImageGenerationModel.from_pretrained("imagegeneration@002")

    def _generate_with_fallback(self, prompt, **kwargs):
        try:
            return self.imagen_model.generate_images(prompt=prompt, **kwargs)
        except Exception as e:
            print(f"Primary model generation failed: {e}")
            if "403" in str(e) or "PermissionDenied" in str(e) or "404" in str(e):
                print(f"Attempting fallback to imagegeneration@002 due to: {e}")
                from vertexai.vision_models import ImageGenerationModel
                try:
                    fallback_model = ImageGenerationModel.from_pretrained("imagegeneration@002")
                    return fallback_model.generate_images(prompt=prompt, **kwargs)
                except Exception as fe:
                    print(f"Fallback model also failed: {fe}")
                    raise fe
            raise e

    def generate_character_anchor(self, description: str, style_reference: str = None) -> str:
        print(f"Generating Character Anchor for: {description}")
        try:
            response = self._generate_with_fallback(
                prompt=f"A consistent character face for: {description}. Cinematic lighting, 8k resolution.",
                number_of_images=1,
            )
            if response.images:
                image_bytes = response.images[0]._image_bytes
                file_obj = io.BytesIO(image_bytes)
                file_obj.name = "character_anchor.jpg"
                public_url = upload_to_firebase_storage(file_obj, f"assets/character_anchors/{description.replace(' ', '_')}.jpg")
                return public_url if public_url else "https://placehold.co/600x600?text=Upload+Failed"
        except Exception as e:
            print(f"Error generating character anchor: {e}")
            traceback.print_exc()
        
        return "https://placehold.co/600x600?text=Character+Gen+Failed"

    def generate_character_concepts(self, description: str, visual_style: str = "cinematic") -> List[str]:
        print(f"Generating character concepts for: {description}")
        generated_urls = []
        try:
            response = self._generate_with_fallback(
                prompt=f"High-quality cinematic headshot of {description}, neutral lighting, 8k resolution. Style: {visual_style}.",
                number_of_images=4,
            )
            for i, image in enumerate(response.images):
                image_bytes = image._image_bytes
                file_obj = io.BytesIO(image_bytes)
                unique_filename = f"character_concepts/{description.replace(' ', '_')}_{uuid.uuid4()}_{i}.jpg"
                public_url = upload_to_firebase_storage(file_obj, unique_filename)
                generated_urls.append(public_url if public_url else f"https://placehold.co/600x600?text=Concept+{i}")
        except Exception as e:
            print(f"Error generating concepts: {e}")
            traceback.print_exc()
            # Return dummy images on failure so UI doesn't break
            for i in range(4):
                generated_urls.append(f"https://placehold.co/600x600?text=Concept+Gen+Failed+{i}")

        return generated_urls

    def generate_poster(self, title: str, tagline: str, anchor_image_url: Optional[str] = None, genre: str = "Sci-Fi", style: Optional[str] = None) -> str:
        prompt = f"A movie poster for a {genre} film titled {title}. Text: {title} in {genre} font at top, {tagline} at bottom."
        if style:
            prompt += f" Overall visual style: {style}."
        
        print(f"Generating Poster with prompt: {prompt}")
        
        try:
            response = self._generate_with_fallback(
                prompt=prompt,
                number_of_images=1,
            )
            
            if response.images:
                image_bytes = response.images[0]._image_bytes
                file_obj = io.BytesIO(image_bytes)
                unique_filename = f"posters/{title.replace(' ', '_')}_{uuid.uuid4()}.jpg"
                public_url = upload_to_firebase_storage(file_obj, unique_filename)
                return public_url if public_url else "https://placehold.co/600x900?text=Poster+Generation+Unavailable"
        except Exception:
            traceback.print_exc()
            return "https://placehold.co/600x900?text=Poster+Generation+Unavailable"

        return "https://placehold.co/600x900?text=Poster+Generation+Unavailable"

        return "https://placehold.co/600x900?text=Poster+Generation+Unavailable"

    def generate_teaser(self, scene_description: str, anchor_image_url: Optional[str] = None) -> str:
        # ... (Keep existing logic, but ensure try/except if you enable real API calls)
        job_id = str(uuid.uuid4())
        self._video_jobs[job_id] = {
            "status": "pending",
            "video_url": None,
            "start_time": time.time()
        }
        return job_id
    
    def check_video_status(self, job_id: str) -> Dict[str, str]:
        # ... (Keep existing logic)
        job_info = self._video_jobs.get(job_id)
        if not job_info: return {"status": "not_found"}
        
        if job_info["status"] == "pending":
            if time.time() - job_info["start_time"] > 5: # Faster simulation
                job_info["status"] = "completed"
                job_info["video_url"] = f"https://mock-video.googleapis.com/teaser_{job_id}.mp4"
        
        return {"status": job_info["status"], "video_url": job_info["video_url"]}
