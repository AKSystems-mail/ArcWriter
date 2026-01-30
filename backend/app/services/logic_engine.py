from typing import Dict, List, Any, Tuple
import json
from app.services.llm_service import LLMService
from app.services.game_library import identify_game_archetype, generate_logic_critique

class LogicEngine:
    def __init__(self):
        self.llm = LLMService()

    def analyze_scene(self, scene_text: str, stakes_context: str = "") -> Dict[str, Any]:
        """
        Analyzes a scene using Game Theory to identify plot holes and compare
        script outcome with Nash Equilibrium.
        """
        system_instruction = (
            "You are a Game Theory expert and Script Doctor. "
            "Analyze the following scene and extract a mathematical representation of the conflict.\n"
            "Identify the two primary players and their strategies (Cooperate vs Defect, or specific actions).\n"
            "Construct a 2x2 payoff matrix where values represent the benefit/utility to each player (0-10).\n"
            "Identify the 'actual_outcome' chosen by the characters in the text.\n\n"
            "Return JSON with:\n"
            "- 'players': [str, str]\n"
            "- 'strategies': [str, str]\n"
            "- 'payoff_matrix': { strategy1: { strategy1: [p1_score, p2_score], strategy2: [p1_score, p2_score] }, ... }\n"
            "- 'actual_outcome': [p1_move, p2_move]\n"
        )
        user_prompt = f"STAKES: {stakes_context}\nSCENE:\n{scene_text}"

        try:
            analysis_data = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            
            # 2. Calculate Nash Equilibrium
            matrix = analysis_data.get("payoff_matrix", {})
            if not matrix:
                 # Fallback if AI fails to generate matrix
                 analysis_data = self._mock_llm_extract_payoff(scene_text, stakes_context)
                 matrix = analysis_data["payoff_matrix"]

            equilibria = self._calculate_nash_equilibrium(matrix)
            
            # 3. Compare Script Outcome to Equilibrium
            actual = analysis_data.get("actual_outcome", ["", ""])
            script_outcome = tuple(actual) 
            
            is_rational = script_outcome in equilibria
            
            # 4. Calculate Rationality Score and Critique
            if is_rational:
                rationality_score = 95
                critique_message = "The characters acted rationally according to their incentives. The scene logic is solid."
            else:
                rationality_score = 45
                critique_message = (
                    f"The outcome {script_outcome} deviates from the Nash Equilibrium {equilibria}. "
                    "One or both characters are acting against their best interests without clear motivation."
                )
            
            # Identify Game Archetype
            game_archetype = identify_game_archetype(matrix)
            
            # Generate Deterministic Critique based on Archetype
            protagonist_move = actual[0] if actual else ""
            logic_critique = generate_logic_critique(game_archetype, protagonist_move, equilibria)

            return {
                "rationality_score": rationality_score,
                "critique_message": critique_message,
                "game_archetype": game_archetype,
                "logic_critique": logic_critique,
                "payoff_matrix": matrix,
                "nash_equilibria": [list(eq) for eq in equilibria],
                "script_outcome": list(script_outcome)
            }
        except Exception as e:
            print(f"Error in analyze_scene: {e}")
            return {"error": str(e), "rationality_score": 0}

    def generate_scene_content(self, beat_context: str, characters: list, game_theory_type: str) -> List[str]:
        """
        Generates a screenplay scene based on a beat and game theory constraint.
        Returns a list of strings (blocks) for the editor.
        """
        system_instruction = (
            "You are a professional screenwriter. Write a scene in standard screenplay format. "
            "Do not include conversational filler before or after the script. "
            "Return the result as a JSON object with a single key 'blocks' containing a list of strings, "
            "where each string is a paragraph of the script (e.g., 'INT. ROOM - DAY', 'JOHN', 'Hello there.')."
        )
        
        user_prompt = (
            f"CONTEXT: The current beat is '{beat_context}'.\n"
            f"CHARACTERS: {', '.join(characters)}.\n"
            f"CONSTRAINT: The interaction must follow the logic of a '{game_theory_type}' game.\n"
            "TASK: Write the scene content."
        )

        try:
            # Call the LLM using the correct self.llm reference
            response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            
            # Robust Parsing Logic
            if isinstance(response, dict) and "blocks" in response:
                return response["blocks"]
            elif isinstance(response, list):
                return response
            else:
                # Fallback if AI returns unstructured text
                return ["INT. SCENE - DAY", "(AI generation format error, raw text below)", str(response)]
                
        except Exception as e:
            print(f"LLM Generation Error: {e}")
            return ["INT. ERROR - DAY", f"(Scene generation failed: {str(e)})"]

    def critique_scene(self, scene_text: str, persona_prompt: str, bible_context: str) -> Dict[str, Any]:
        """
        Generates a critique and a rationality score using a specific system prompt (Persona).
        """
        system_instruction = "You are an AI assistant tasked with critiquing movie scripts and providing helpful feedback based on the provided persona and context."
        user_prompt = f"{persona_prompt}\nContext: {bible_context}\nAnalyze this scene:\n\n{scene_text}"
        
        llm_critique = self.llm.generate_text(system_instruction=system_instruction, user_prompt=user_prompt)
        
        # Integrate the rationality score from analyze_scene
        analysis_result = self.analyze_scene(scene_text)
        rationality_score = analysis_result.get("rationality_score", 0)

        # Integrate dynamic analysis
        dynamics_result = self.analyze_scene_dynamics(scene_text)

        return {
            "critique": llm_critique, 
            "score": rationality_score,
            **dynamics_result
        }

    def generate_project_metadata(self, pitch: str) -> Dict[str, Any]:
        """
        Generates metadata (Genre, Logline, Structure) from a raw elevator pitch.
        """
        system_instruction = (
            "You are a legendary Hollywood script consultant. "
            "Analyze the user's raw idea and distill it into professional project metadata. "
            "Return JSON with keys: 'genre' (str), 'logline' (str, punchy 1-sentence), "
            "'structure_suggestion' (str, e.g. 'Hero's Journey', 'Three Act', 'Non-linear'), "
            "'title_ideas' (list of strings), 'title' (str), 'synopsis' (str), "
            "and a 'beat_sheet' object with these exact keys: "
            "'opening_image', 'theme_stated', 'set_up', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', "
            "'bad_guys_close_in', 'all_is_lost', 'dark_night_of_the_soul', "
            "'break_into_three', 'finale', 'final_image'."
            " IMPORTANT: Use 'dark_night_of_the_soul' NOT 'dark_night_of_soul'."
            " IMPORTANT: Use 'set_up' NOT 'setup'."
        )
        user_prompt = f"Here is my idea: {pitch}"
        
        response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

        # Defense-in-depth: Un-listify if AI returns a list
        if isinstance(response, list) and len(response) > 0:
            return response[0]
        return response

    def analyze_scene_dynamics(self, scene_text: str) -> Dict[str, Any]:
        """
        Analyzes the emotional rhythm, power dynamics, and subtext of a scene.
        """
        system_instruction = (
            "You are a master dramatic editor. Analyze the following screenplay scene for dynamic tension and rhythm.\n"
            "1. Power Shifts: Identify who holds the power at various points. Does it shift?\n"
            "2. Push vs Pull: Identify 'Push' lines (aggressive, advancing the plot, making demands) and 'Pull' lines (defensive, retreating, reacting).\n"
            "3. Tension Curve: Generate an array of integers (0-10) representing the emotional intensity for every line of text.\n\n"
            "Return a JSON object with:\n"
            "- 'tension_curve': [int, int, ...] (one value per line of input text)\n"
            "- 'push_pull_map': { line_index: 'push' | 'pull' } (only for notable lines)\n"
            "- 'power_shift_indices': [int, ...] (indices where the power dynamic notably changes)\n"
            "- 'highlight_ranges': [ [start, end, 'label'], ... ] (important thematic ranges)\n"
            "- 'verdict': str (e.g., 'Rising Action', 'Stagnant', 'Climactic')\n"
            "- 'analysis_summary': str (Brief professional explanation)\n"
        )
        user_prompt = f"Analyze this scene line by line. Treat the first line as index 0.\n\n{scene_text}"
        
        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            print(f"Error in analyze_scene_dynamics: {e}")
            return {"error": str(e), "tension_curve": []}

    def reverse_engineer_script(self, script_text: str) -> Dict[str, Any]:
        """
        Reverse engineers a Save the Cat beat sheet from a full script.
        """
        system_instruction = (
            "You are a master film analyst. Reverse engineer a professional Save the Cat beat sheet from the provided script text. "
            "Return a JSON object with keys: 'genre' (str), 'logline' (str), 'title' (str), "
            "'beat_sheet' (dict with these exact keys: "
            "'opening_image', 'theme_stated', 'set_up', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', "
            "'bad_guys_close_in', 'all_is_lost', 'dark_night_of_the_soul', "
            "'break_into_three', 'finale', 'final_image')."
        )
        user_prompt = f"Analyze this script and extract the beat sheet:\n\n{script_text[:50000]}" 
        
        return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

    def suggest_dialogue(self, context: str) -> Dict[str, Any]:
        """
        Suggests the next line of dialogue based on current script context.
        """
        system_instruction = (
            "You are a master screenwriter. Based on the provided script context, "
            "suggest the next logical and punchy line of dialogue or action. "
            "Keep it character-driven and concise. "
            "Return JSON with a single key 'suggestion' (str)."
        )
        user_prompt = f"SCRIPT CONTEXT:\n{context}\n\nWHAT HAPPENS NEXT?"
        
        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            print(f"Error in suggest_dialogue: {e}")
            return {"suggestion": "(AI failed to generate suggestion)"}

    def distill_notes(self, notes_text: str) -> Dict[str, Any]:
        """
        Distills core themes, characters, and synopsis from creative notes.
        """
        system_instruction = (
            "You are a creative executive at a top studio. Distill these raw notes into a project vision. "
            "Return a JSON object with keys: 'genre' (str), 'logline' (str), 'title' (str), 'themes' (list of str), "
            "'character_descriptions' (list of objects with 'name' and 'role'), 'synopsis' (str), "
            "and a 'beat_sheet' object with these exact keys: "
            "'opening_image', 'theme_stated', 'set_up', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', "
            "'bad_guys_close_in', 'all_is_lost', 'dark_night_of_the_soul', "
            "'break_into_three', 'finale', 'final_image'."
        )
        user_prompt = f"Distill these notes:\n\n{notes_text}"
        
        return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

    # --- Helper Methods ---

    def _mock_llm_extract_payoff(self, scene_text: str, stakes_context: str) -> Dict[str, Any]:
        """Mock LLM response for Game Theory analysis."""
        return {
            "players": ["Protagonist", "Antagonist"],
            "strategies": ["Cooperate", "Defect"],
            "payoff_matrix": {
                "Cooperate": {"Cooperate": [3, 3], "Defect": [0, 5]},
                "Defect": {"Cooperate": [5, 0], "Defect": [1, 1]}
            },
            "actual_outcome": ["Cooperate", "Cooperate"] if len(scene_text) % 2 == 0 else ["Defect", "Defect"]
        }

    def _calculate_nash_equilibrium(self, matrix: Dict[str, Dict[str, List[int]]]) -> List[Tuple[str, str]]:
        """Calculates Pure Strategy Nash Equilibria."""
        strategies = list(matrix.keys())
        if len(strategies) != 2: return []
        s1, s2 = strategies[0], strategies[1]
        
        equilibria = []
        
        # Check (s1, s1)
        if matrix[s1][s1][0] >= matrix[s2][s1][0] and matrix[s1][s1][1] >= matrix[s1][s2][1]:
            equilibria.append((s1, s1))
        # Check (s1, s2)
        if matrix[s1][s2][0] >= matrix[s2][s2][0] and matrix[s1][s2][1] >= matrix[s1][s1][1]:
            equilibria.append((s1, s2))
        # Check (s2, s1)
        if matrix[s2][s1][0] >= matrix[s1][s1][0] and matrix[s2][s1][1] >= matrix[s2][s2][1]:
            equilibria.append((s2, s1))
        # Check (s2, s2)
        if matrix[s2][s2][0] >= matrix[s1][s2][0] and matrix[s2][s2][1] >= matrix[s2][s1][1]:
            equilibria.append((s2, s2))
            
        return equilibria