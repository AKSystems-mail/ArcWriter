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
        if key:
            key = key.strip() # Remove any accidental whitespace
            self.client = genai.Client(api_key=key)
            # Use Gemini 1.5 Pro for stability ensuring compatibility
            self.model_name = "gemini-1.5-pro"
        else:
            logger.warning("GEMINI_API_KEY not set. LLMService will not function correctly.")
            self.client = None
            self.model_name = None

    def generate_json(self, prompt: str, system_instruction: str = None) -> dict:
        if not self.client:
            return {"error": "LLM client not initialized"}
        try:
            config = types.GenerateContentConfig(
                temperature=0.7,
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
            
            # Use explicit Content/Part structure to avoid API ambiguity
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
            config = types.GenerateContentConfig(
                temperature=0.7,
                system_instruction=system_instruction
            )
            
            # The new SDK handles timeouts differently, usually via client configuration or request_options if available.
            # In google-genai, it's often passed in the Client initialization or not directly exposed per-call in the same way.
            # We will use the default for now.
            
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=user_prompt)
                    ]
                )
            ]
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            return response.text
        except Exception as e:
            logger.error(f"An unexpected error occurred during Gemini API call: {e}")
            return f"Error: An unexpected error occurred: {e}"
