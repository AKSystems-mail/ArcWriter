from typing import Optional, List, Dict
import io
import uuid
import time
import base64
import traceback
import logging
import os
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

        if not self.client and (self.project or os.getenv("K_SERVICE")):
            try:
                self.client = genai.Client(vertex=True, project=self.project, location=self.location)
                logger.info(f"AssetStudio: Initialized with Vertex AI (project={self.project})")
            except Exception as e:
                logger.error(f"AssetStudio: Vertex AI init failed: {e}")

    def generate_poster(self, title: str, tagline: str, genre: str = "Sci-Fi", style: Optional[str] = None) -> Optional[str]:
        if not self.client:
            logger.error("AssetStudio: Client not initialized. Cannot generate poster.")
            return None

        prompt = f"A high-quality movie poster for a {genre} film titled '{title}'. "
        prompt += f"Visual style: {style or 'cinematic'}. "
        prompt += f"Bottom tagline: {tagline}."
        
        logger.info(f"AssetStudio: Generating Poster...")
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=['IMAGE']
                )
            )
            
            if response.parts:
                for part in response.parts:
                    if part.inline_data:
                        return base64.b64encode(part.inline_data.data).decode('utf-8')
            
            logger.warning("AssetStudio: No image data in response (likely safety filter).")
            return None
        except Exception as e:
            logger.error(f"AssetStudio: Error in generate_poster: {e}")
            traceback.print_exc()
            return None

    def generate_character_anchor(self, description: str, style: str = None) -> Optional[str]:
        if not self.client: 
            logger.error("AssetStudio: Client not initialized for anchor.")
            return None
        
        prompt = f"A professional character portrait for: {description}. "
        prompt += f"Cinematic lighting, 8k resolution, consistent visual style: {style or 'cinematic'}."
        
        logger.info(f"AssetStudio: Generating Character Anchor. Prompt length: {len(prompt)}")
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash-image',
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=['IMAGE']
                )
            )
            if response.parts:
                for part in response.parts:
                    if part.inline_data:
                        logger.info("AssetStudio: Character anchor generated successfully.")
                        return base64.b64encode(part.inline_data.data).decode('utf-8')
            
            logger.warning("AssetStudio: No image data in anchor response (likely safety filter).")
        except Exception as e:
            logger.error(f"AssetStudio: Error generating character anchor: {e}")
            traceback.print_exc()
        return None

    def generate_character_concepts(self, description: str, visual_style: str = "cinematic") -> List[str]:
        return []