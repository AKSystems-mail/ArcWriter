import os
import json
from dotenv import load_dotenv
import google.generativeai as genai 
from google.api_core import exceptions
import logging

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        key = os.getenv("GEMINI_API_KEY")
        if key:
            key = key.strip() # Remove any accidental whitespace
            genai.configure(api_key=key)
            # Use Gemini 2.0 Flash for maximum speed and intelligence
            self.model_name = "gemini-2.0-flash"
        else:
            logger.warning("GEMINI_API_KEY not set. LLMService will not function correctly.")
            self.model_name = None

    def _get_model(self, system_instruction: str = None):
        if not self.model_name:
            return None
        return genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction
        )

    def generate_json(self, prompt: str, system_instruction: str = None) -> dict:
        model = self._get_model(system_instruction)
        if not model:
            return {"error": "LLM not initialized"}
        try:
            # Simplest prompt structure
            response = model.generate_content(
                prompt + "\n\nOutput ONLY valid JSON. No markdown blocks.",
                generation_config=genai.GenerationConfig(
                    temperature=0.7, 
                    response_mime_type="application/json"
                ),
                request_options={"timeout": 60}
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error generating JSON: {e}")
            return {"error": str(e), "result": {}}

    def generate_text(self, system_instruction: str, user_prompt: str, timeout: int = 60) -> str:
        model = self._get_model(system_instruction)
        if not model:
            return "Error: LLM not initialized"
        try:
            response = model.generate_content(
                user_prompt,
                generation_config=genai.GenerationConfig(temperature=0.7), 
                request_options={"timeout": timeout} 
            )
            return response.text
        except exceptions.DeadlineExceeded:
            logger.error("Gemini API call timed out.")
            return "Error: Gemini API call timed out."
        except exceptions.GoogleAPIError as e:
            logger.error(f"Google API Error: {e}")
            return f"Error: Google API Error: {e}"
        except Exception as e:
            logger.error(f"An unexpected error occurred during Gemini API call: {e}")
            return f"Error: An unexpected error occurred: {e}"
