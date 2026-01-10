import os
import json
import google.generativeai as genai # Changed from google.generativeai
from google.api_core import exceptions
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel("gemini-1.5-pro")

    def generate_json(self, prompt: str, system_instruction: str = None) -> dict:
        """
        Generates JSON output from the LLM.
        """
        # This will be implemented similarly to generate_text but with JSON specific output handling.
        # For now, it remains a mock to focus on generate_text first.
        logger.info(f"Generating JSON with system prompt: {system_instruction[:50]}...")
        return {"mock": "response", "prompt": prompt, "system_instruction": system_instruction}

    def generate_text(self, system_instruction: str, user_prompt: str, timeout: int = 60) -> str:
        """
        Generates text output using the Gemini 1.5 Pro model.
        """
        try:
            full_prompt = [
                {"role": "user", "parts": [system_instruction]},
                {"role": "user", "parts": [user_prompt]}
            ]
            
            # The system_instruction parameter in generate_content is currently in preview,
            # so we'll incorporate it as part of the prompt for now.
            # Once generally available, it can be passed directly.

            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(temperature=0.7), # Removed timeout from here
                request_options={"timeout": timeout} # Added timeout here
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
