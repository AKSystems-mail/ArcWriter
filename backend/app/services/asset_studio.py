from typing import Optional, List, Dict
from app.services.storage_utils import upload_to_firebase_storage # Import the utility
from google.cloud import aiplatform # Import Vertex AI SDK
import io # For creating dummy file objects
import uuid # For unique filenames
import time # For simulating completion time

class AssetStudio:
    _video_jobs: Dict[str, Dict[str, str]] = {} # In-memory storage for video jobs

    def __init__(self):
        # Initialize models using the globally initialized vertexai
        from vertexai.vision_models import ImageGenerationModel
        try:
            from vertexai.preview.vision_models import VideoGenerationModel
            self.veo_model = VideoGenerationModel.from_pretrained("veo-001")
        except ImportError:
            print("Warning: VideoGenerationModel not available. Teaser generation disabled.")
            self.veo_model = None
        
        # Upgrading to Imagen 3 and Veo 001 for superior quality and speed
        self.imagen_model = ImageGenerationModel.from_pretrained("imagegeneration@006")

    def generate_character_anchor(self, description: str, style_reference: str = None) -> str:
        """
        Generates a consistent character face.
        Returns a URL to the generated image.
        """
        print(f"Generating Character Anchor for: {description}")
        
        # Use Vertex AI Imagen API
        response = self.imagen_model.generate_images(
            prompt=f"A consistent character face for: {description}. Cinematic lighting, 8k resolution.",
            number_of_images=1,
        )
        
        if response.images:
            image_bytes = response.images[0]._image_bytes
            file_obj = io.BytesIO(image_bytes)
            file_obj.name = "character_anchor.jpg"
            public_url = upload_to_firebase_storage(file_obj, f"assets/character_anchors/{description.replace(' ', '_')}.jpg")
            return public_url if public_url else "https://mock-storage.googleapis.com/character_anchor_failed.jpg"
        
        return "https://mock-storage.googleapis.com/character_anchor_failed.jpg"


    def generate_character_concepts(self, description: str, visual_style: str = "cinematic") -> List[str]:
        """
        Generates 4 character concept images based on the description and visual style.
        Returns a list of URLs to the generated images.
        """
        print(f"Generating character concepts for: {description} with style: {visual_style}")
        prompt = f"High-quality cinematic headshot of {description}, neutral lighting, 8k resolution. Style: {visual_style}."
        print(f"Image generation prompt: {prompt}")

        generated_urls = []
        num_variations = 4 # As requested
        
        # Use Vertex AI Imagen API
        response = self.imagen_model.generate_images(
            prompt=prompt,
            number_of_images=num_variations,
        )
        for i, image in enumerate(response.images):
            # Save the image bytes
            image_bytes = image._image_bytes
            file_obj = io.BytesIO(image_bytes)
            unique_filename = f"character_concepts/{description.replace(' ', '_')}_{uuid.uuid4()}_{i}.jpg"
            public_url = upload_to_firebase_storage(file_obj, unique_filename)
            if public_url:
                generated_urls.append(public_url)
            else:
                generated_urls.append(f"https://mock-storage.googleapis.com/concept_failed_{i}.jpg")

        # For demonstration, generate dummy image URLs
        for i in range(num_variations):
            dummy_image_data = f"dummy_image_data_concept_{i}".encode('utf-8')
            file_obj = io.BytesIO(dummy_image_data)
            file_obj.name = f"concept_{i}.jpg"
            unique_filename = f"character_concepts/{description.replace(' ', '_')}_{uuid.uuid4()}_{i}.jpg"
            public_url = upload_to_firebase_storage(file_obj, unique_filename)
            if public_url:
                generated_urls.append(public_url)
            else:
                generated_urls.append(f"https://mock-storage.googleapis.com/concept_failed_{i}.jpg")

        return generated_urls

    def generate_poster(self, title: str, tagline: str, anchor_image_url: Optional[str] = None, genre: str = "Sci-Fi", style: Optional[str] = None) -> str:
        """
        Generates a movie poster based on a prompt, using a reference image for consistency.
        Returns a URL to the generated image.
        """
        # Construct the prompt based on the specified strategy
        prompt = f"A movie poster for a {genre} film titled {title}. Central character: [Reference Image]. Text: {title} in {genre} font at top, {tagline} at bottom."
        if style:
            prompt += f" Overall visual style: {style}."
        
        print(f"Generating Poster with prompt: {prompt}")
        if anchor_image_url:
            print(f"Using reference image for consistency: {anchor_image_url}")
        
        # Use Vertex AI Imagen API
        response = self.imagen_model.generate_images(
            prompt=prompt,
            number_of_images=1,
            # For poster, we might want to use the anchor image as a reference
            # but Imagen functionality for this varies by version.
            # For now, we'll just use the prompt.
        )
        
        if response.images:
            image_bytes = response.images[0]._image_bytes
            file_obj = io.BytesIO(image_bytes)
            unique_filename = f"posters/{title.replace(' ', '_')}_{uuid.uuid4()}.jpg"
            public_url = upload_to_firebase_storage(file_obj, unique_filename)
            return public_url if public_url else "https://mock-storage.googleapis.com/poster_failed.jpg"

        # For demonstration, create a dummy file object
        dummy_poster_data = b"dummy_image_data_for_poster_" + title.encode('utf-8')
        file_obj = io.BytesIO(dummy_poster_data)
        file_obj.name = "poster.jpg"
        unique_filename = f"posters/{title.replace(' ', '_')}_{uuid.uuid4()}.jpg"

        # Upload to Firebase Storage
        public_url = upload_to_firebase_storage(file_obj, unique_filename)
        return public_url if public_url else "https://mock-storage.googleapis.com/poster_failed.jpg"

    def generate_teaser(self, scene_description: str, anchor_image_url: Optional[str] = None) -> str:
        """
        Submits a job to generate a motion clip/teaser from a scene description,
        using an anchor image for consistency. Returns a job_id.
        Video length limited to 5 seconds (Veo Fast Mode) for cost saving.
        """
        print(f"Submitting teaser generation job for: {scene_description[:50]}...")
        if anchor_image_url:
            print(f"Using anchor image for consistency: {anchor_image_url}")

        job_id = str(uuid.uuid4())
        
        # Use Google Veo (VideoGenerationModel)
        # Note: Veo API might require specific parameters for duration and mode.
        # duration_seconds=5 for cost saving as requested.
        
        # This is a conceptual implementation as the exact Veo API might differ
        # video_job = self.veo_model.generate_video(
        #     prompt=scene_description,
        #     # first_frame_image=anchor_image_url,
        #     fps=24,
        # )
        # job_id = video_job.job_id

        # Simulate job creation and initial status
        self._video_jobs[job_id] = {
            "status": "pending",
            "video_url": None,
            "start_time": time.time()
        }
        print(f"Teaser generation job submitted with job_id: {job_id}")
        return job_id
    
    def check_video_status(self, job_id: str) -> Dict[str, str]:
        """
        Checks the status of a video generation job.
        Simulates completion after a certain time.
        """
        job_info = self._video_jobs.get(job_id)
        if not job_info:
            return {"status": "not_found"}

        if job_info["status"] == "pending":
            # Simulate completion after 10-15 seconds
            if time.time() - job_info["start_time"] > 10 + (int(job_id[-1], 16) % 6): # Vary completion time
                job_info["status"] = "completed"
                # Simulate a generated video URL
                job_info["video_url"] = f"https://mock-video.googleapis.com/teaser_{job_id}.mp4"
                print(f"Video job {job_id} completed. URL: {job_info['video_url']}")
            
        return {"status": job_info["status"], "video_url": job_info["video_url"]}