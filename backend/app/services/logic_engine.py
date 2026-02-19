from typing import Dict, List, Any, Tuple
import json
import logging
from app.services.llm_service import LLMService
from app.services.game_library import identify_game_archetype, generate_logic_critique

logger = logging.getLogger(__name__)

class LogicEngine:
    def __init__(self):
        self.llm = LLMService()

    def analyze_scene(self, scene_text: str, stakes_context: str = "") -> Dict[str, Any]:
        """Analyzes a scene using Game Theory."""
        system_instruction = (
            "You are a Game Theory expert and Script Doctor. "
            "Analyze the conflict and extract a 2x2 payoff matrix (0-10).\n"
            "Return JSON: { 'players': [str, str], 'strategies': [str, str], 'payoff_matrix': { ... }, 'actual_outcome': [p1_move, p2_move] }"
        )
        user_prompt = f"STAKES: {stakes_context}\nSCENE:\n{scene_text}"

        try:
            analysis_data = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            matrix = analysis_data.get("payoff_matrix", {})
            if not matrix: return {"error": "No matrix", "rationality_score": 0}

            equilibria = self._calculate_nash_equilibrium(matrix)
            actual = analysis_data.get("actual_outcome", ["", ""])
            script_outcome = tuple(actual) 
            
            rationality_score = 95 if script_outcome in equilibria else 45
            game_archetype = identify_game_archetype(matrix)
            logic_critique = generate_logic_critique(game_archetype, actual[0] if actual else "", equilibria)

            return {
                "rationality_score": rationality_score,
                "game_archetype": game_archetype,
                "logic_critique": logic_critique,
                "payoff_matrix": matrix,
                "nash_equilibria": [list(eq) for eq in equilibria],
                "script_outcome": list(script_outcome)
            }
        except Exception as e:
            logger.error(f"Error in analyze_scene: {e}")
            return {"error": str(e), "rationality_score": 0}

    def generate_scene_content(self, beat_context: str, characters: list, game_theory_type: str, existing_script: str = "") -> List[str]:
        """Generates a screenplay scene."""
        system_instruction = (
            "You are a professional screenwriter. Write a scene in standard screenplay format.\n"
            "Return JSON object with key 'blocks' containing list of {type, text} objects.\n"
            "CRITICAL: Character names MUST be uppercase. No ages/descriptions in Character blocks."
        )
        user_prompt = (
            f"BEAT: {beat_context}.\nCHARACTERS: {', '.join(characters)}.\n"
            f"GAME LOGIC: {game_theory_type}.\nEXISTING SCRIPT:\n{existing_script}\n\n"
            "TASK: Write the definitive opening or next scene."
        )

        try:
            response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            return response.get("blocks", []) if isinstance(response, dict) else []
        except Exception as e:
            logger.error(f"LLM Generation Error: {e}")
            return [{"type": "Scene Heading", "text": "INT. ERROR - DAY"}]

    def generate_project_metadata(self, pitch: str) -> Dict[str, Any]:
        """Distills pitch into Project DNA (Genre, Logline, Beats, Characters)."""
        system_instruction = (
            "You are a legendary Hollywood script consultant and character designer.\n\n"
            "MANDATE: You MUST identify and invent names/descriptions for at least 4-6 primary characters.\n"
            "MANDATE: You MUST provide detailed text for all 15 Save the Cat beats.\n\n"
            "Return a JSON object with keys: 'genre', 'logline', 'structure_suggestion', 'title', 'synopsis', "
            "'character_descriptions' (list of {name, role, description}), and 'beat_sheet' (15 beats)."
        )
        user_prompt = f"Distill this project idea into a professional studio vision:\n\n{pitch[:15000]}"
        
        try:
            response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            
            # Defense-in-depth: Un-listify
            if isinstance(response, list) and len(response) > 0:
                response = response[0]
            
            if not isinstance(response, dict) or "error" in response:
                raise RuntimeError(f"AI Analysis failed: {response.get('error', 'Unknown error')}")

            # Rigorous validation
            beats = response.get("beat_sheet", {})
            chars = response.get("character_descriptions", [])
            
            if not beats or len(beats) < 5:
                logger.error("LogicEngine: Distillation returned insufficient beats.")
                raise RuntimeError("AI failed to extract sufficient narrative beats. Try more detailed notes.")
                
            if not chars or len(chars) < 1:
                logger.error("LogicEngine: Distillation returned no characters.")
                raise RuntimeError("AI failed to extract character data. Please include character relationships.")

            return response
        except Exception as e:
            logger.error(f"LogicEngine Metadata Error: {e}")
            raise e

    def critique_scene(self, scene_text: str, persona_prompt: str, bible_context: str) -> Dict[str, Any]:
        """Critiques a scene."""
        prompts = {
            "market_viability": "Focus on pacing and stakes.",
            "thematic_consistency": "Focus on subtext and motifs.",
            "structural_integrity": "Focus on logic and Chekhov’s Gun."
        }
        persona_context = prompts.get(persona_prompt, "You are a consultant.")
        system_instruction = f"{persona_context}\nAnalyze the scene contextually.\n\nCONTEXT:\n{bible_context}"
        llm_critique = self.llm.generate_text(system_instruction=system_instruction, user_prompt=f"SCENE:\n{scene_text}")
        return {"critique": llm_critique, "score": 85}

    def _calculate_nash_equilibrium(self, matrix: Dict[str, Dict[str, List[int]]]) -> List[Tuple[str, str]]:
        """Calculates Pure Strategy Nash Equilibria."""
        strategies = list(matrix.keys())
        if len(strategies) != 2: return []
        s1, s2 = strategies[0], strategies[1]
        equilibria = []
        if matrix[s1][s1][0] >= matrix[s2][s1][0] and matrix[s1][s1][1] >= matrix[s1][s2][1]: equilibria.append((s1, s1))
        if matrix[s1][s2][0] >= matrix[s2][s2][0] and matrix[s1][s2][1] >= matrix[s1][s1][1]: equilibria.append((s1, s2))
        if matrix[s2][s1][0] >= matrix[s1][s1][0] and matrix[s2][s1][1] >= matrix[s2][s2][1]: equilibria.append((s2, s1))
        if matrix[s2][s2][0] >= matrix[s1][s2][0] and matrix[s2][s2][1] >= matrix[s2][s1][1]: equilibria.append((s2, s2))
        return equilibria
