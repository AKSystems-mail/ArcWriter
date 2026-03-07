import os
import json
import re
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
        
        self.client = None
        self.model_name = "models/gemini-2.5-flash" 

        # 1. PRIORITIZE API KEY
        if key:
            try:
                self.client = genai.Client(api_key=key.strip())
                self.model_name = "models/gemini-2.5-flash"
                logger.info(f"LLMService: Initialized with API Key ({self.model_name})")
            except Exception as e:
                logger.error(f"LLMService: API Key init failed: {e}")
                self.client = None

        # 2. FALLBACK to Vertex AI
        if not self.client and (project or os.getenv("K_SERVICE")):
            project_id = project or "arc-studio-box"
            try:
                import vertexai
                vertexai.init(project=project_id, location=location)
                self.client = genai.Client(vertex=True, project=project_id, location=location)
                self.model_name = "models/gemini-2.5-flash"
                logger.info(f"LLMService: Initialized with Vertex AI ({self.model_name})")
            except Exception as e:
                logger.error(f"LLMService: Vertex AI init failed: {e}")
                self.client = None

        if not self.client:
            logger.error("CRITICAL: LLMService failed all initialization paths.")

    def generate_json(self, prompt: str, system_instruction: str = None, model_id: str = None) -> dict:
        if not self.client:
            return {"error": "LLM client not initialized"}
        try:
            sys_inst = None
            if system_instruction:
                sys_inst = types.Content(parts=[types.Part.from_text(text=system_instruction)])

            config = types.GenerateContentConfig(
                temperature=0.7,
                system_instruction=sys_inst,
                response_mime_type="application/json"
            )
            
            target_model = model_id or self.model_name
            contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt + "\n\nOutput ONLY valid JSON.")])]

            response = self.client.models.generate_content(
                model=target_model,
                contents=contents,
                config=config
            )
            
            raw_text = response.text
            
            try:
                return json.loads(raw_text)
            except json.JSONDecodeError:
                # 1. Try stripping markdown blocks and whitespace
                cleaned = re.sub(r"```json\s*|\s*```", "", raw_text).strip()
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    # 2. Try finding the outermost { and } using balanced search
                    # This is more robust than simple regex for nested JSON
                    start_idx = cleaned.find('{')
                    end_idx = cleaned.rfind('}')
                    if start_idx != -1 and end_idx != -1:
                        potential_json = cleaned[start_idx:end_idx+1]
                        try:
                            return json.loads(potential_json)
                        except json.JSONDecodeError:
                            # 3. Final attempt: Try fixing common trailing comma issue
                            fixed = re.sub(r",\s*([\]\}])", r"\1", potential_json)
                            try:
                                return json.loads(fixed)
                            except:
                                pass
                
                logger.error(f"JSON parsing failed. Raw response snippet: {raw_text[:500]}...")
                return {"error": "JSON parsing failed", "raw": raw_text}

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
            
            target_model = self.model_name
            contents = [types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)])]
            
            response = self.client.models.generate_content(
                model=target_model,
                contents=contents,
                config=config
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini Text Error: {e}")
            return f"Error: {e}"