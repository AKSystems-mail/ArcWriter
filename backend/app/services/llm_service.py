import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        key = os.getenv("GEMINI_API_KEY")
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        if project:
            # Prioritize Vertex AI in GCP environments
            try:
                self.client = genai.Client(vertex=True, project=project, location=location)
                # Use Gemini 2.5 Flash for the base model (Cost efficient for testing)
                self.model_name = "gemini-2.5-flash" 
                logger.info(f"LLMService initialized with Vertex AI (project={project}, location={location})")
            except Exception as e:
                logger.error(f"Failed to initialize Vertex AI client: {e}")
                self.client = None
        elif key:
            # Fallback to Google AI Studio API Key
            try:
                self.client = genai.Client(api_key=key.strip())
                self.model_name = "models/gemini-2.5-flash"
                logger.info("LLMService initialized with Google AI API Key")
            except Exception as e:
                logger.error(f"Failed to initialize Google AI client: {e}")
                self.client = None
        else:
            logger.warning("Neither GEMINI_API_KEY nor GOOGLE_CLOUD_PROJECT set. LLMService will not function correctly.")
            self.client = None
            self.model_name = None

    def generate_json(self, prompt: str, system_instruction: str = None) -> dict:
        if not self.client:
            return {"error": "LLM client not initialized"}
        try:
            # Explicitly wrap system instruction if provided
            sys_inst = None
            if system_instruction:
                sys_inst = types.Content(parts=[types.Part.from_text(text=system_instruction)])

            config = types.GenerateContentConfig(
                temperature=0.7,
                system_instruction=sys_inst,
                response_mime_type="application/json"
            )
            
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt + "\n\nOutput ONLY valid JSON.")
                    ]
                )
            ]

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating JSON: {e}")
            return {"error": str(e), "result": {}}

    def generate_text(self, system_instruction: str, user_prompt: str, timeout: int = 60) -> str:
        if not self.client:
            return "Error: LLM client not initialized"
        try:
            sys_inst = None
            if system_instruction:
                sys_inst = types.Content(parts=[types.Part.from_text(text=system_instruction)])

            config = types.GenerateContentConfig(
                temperature=0.7,
                system_instruction=sys_inst
            )
            
            # Switch to Gemini 2.5 Pro for intensive text analysis
            pro_model = self.model_name.replace("flash", "pro")
            
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=user_prompt)
                    ]
                )
            ]
            
            response = self.client.models.generate_content(
                model=pro_model,
                contents=contents,
                config=config
            )
            return response.text
        except Exception as e:
            logger.error(f"An unexpected error occurred during Gemini API call: {e}")
            return f"Error: An unexpected error occurred: {e}"
