from typing import Dict, List, Any, Tuple
import json
from app.services.llm_service import LLMService # Import LLMService
from app.services.game_library import identify_game_archetype, generate_logic_critique

class LogicEngine:
    def __init__(self):
        self.llm = LLMService()

    def analyze_scene(self, scene_text: str, stakes_context: str = "") -> Dict[str, Any]:
        """
        Analyzes a scene using Game Theory to identify plot holes and compare
        script outcome with Nash Equilibrium.
        """
        
        # 1. Extract Payoff Matrix (Mock LLM Call)
        analysis_data = self._mock_llm_extract_payoff(scene_text, stakes_context)
        
        # 2. Calculate Nash Equilibrium
        equilibria = self._calculate_nash_equilibrium(analysis_data["payoff_matrix"])
        
        # 3. Compare Script Outcome to Equilibrium
        script_outcome = tuple(analysis_data["actual_outcome"]) # e.g., ("Confess", "Silent")
        
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
        game_archetype = identify_game_archetype(analysis_data["payoff_matrix"])
        
        # Generate Deterministic Critique based on Archetype
        # We assume the first character (Player A) is the protagonist
        protagonist_move = script_outcome[0]
        # We need to find the equilibrium move for the protagonist.
        # equilibria is a list of tuples [('Defect', 'Defect')]
        # We pass the full equilibrium list to the helper
        logic_critique = generate_logic_critique(game_archetype, protagonist_move, equilibria)

        return {
            "rationality_score": rationality_score,
            "critique_message": critique_message,
            "game_archetype": game_archetype,
            "logic_critique": logic_critique,
            "payoff_matrix": analysis_data["payoff_matrix"],
            "nash_equilibria": [list(eq) for eq in equilibria],
            "script_outcome": list(script_outcome)
        }

    def _mock_llm_extract_payoff(self, scene_text: str, stakes_context: str) -> Dict[str, Any]:
        """
        Mock LLM response extracting players, strategies, and payoffs.
        Simulating a Prisoner's Dilemma scenario for demonstration.
        """
        # In a real implementation, this would call self.llm.generate_json(...)
        # using a system prompt to parse the text.
        
        return {
            "players": ["Protagonist", "Antagonist"],
            "strategies": ["Cooperate", "Defect"],
            "payoff_matrix": {
                # Format: Player A Strategy -> { Player B Strategy -> [Payoff A, Payoff B] }
                "Cooperate": {
                    "Cooperate": [3, 3], # Reward
                    "Defect": [0, 5]     # Sucker / Temptation
                },
                "Defect": {
                    "Cooperate": [5, 0], # Temptation / Sucker
                    "Defect": [1, 1]     # Punishment
                }
            },
            # We'll simulate that the script outcome varies based on the text length for variety in testing
            "actual_outcome": ["Cooperate", "Cooperate"] if len(scene_text) % 2 == 0 else ["Defect", "Defect"]
        }

    def _calculate_nash_equilibrium(self, matrix: Dict[str, Dict[str, List[int]]]) -> List[Tuple[str, str]]:
        """
        Calculates Pure Strategy Nash Equilibria for a 2-player 2-strategy game.
        """
        # Flatten the matrix structure for easier analysis
        strategies = list(matrix.keys())
        if len(strategies) != 2:
            return [] # Simplified for 2x2
            
        s1, s2 = strategies[0], strategies[1]
        
        # Payoffs [A_payoff, B_payoff]
        # matrix[A_strat][B_strat]
        
        # Best response for Player A against B's strategies
        # If B chooses s1: A compares matrix[s1][s1][0] vs matrix[s2][s1][0]
        a_best_response_to_b_s1 = []
        if matrix[s1][s1][0] >= matrix[s2][s1][0]:
            a_best_response_to_b_s1.append(s1)
        if matrix[s2][s1][0] >= matrix[s1][s1][0]:
            a_best_response_to_b_s1.append(s2)
            
        # If B chooses s2: A compares matrix[s1][s2][0] vs matrix[s2][s2][0]
        a_best_response_to_b_s2 = []
        if matrix[s1][s2][0] >= matrix[s2][s2][0]:
            a_best_response_to_b_s2.append(s1)
        if matrix[s2][s2][0] >= matrix[s1][s2][0]:
            a_best_response_to_b_s2.append(s2)

        # Best response for Player B against A's strategies
        # If A chooses s1: B compares matrix[s1][s1][1] vs matrix[s1][s2][1]
        b_best_response_to_a_s1 = []
        if matrix[s1][s1][1] >= matrix[s1][s2][1]:
            b_best_response_to_a_s1.append(s1)
        if matrix[s1][s2][1] >= matrix[s1][s1][1]:
            b_best_response_to_a_s1.append(s2)
            
        # If A chooses s2: B compares matrix[s2][s1][1] vs matrix[s2][s2][1]
        b_best_response_to_a_s2 = []
        if matrix[s2][s1][1] >= matrix[s2][s2][1]:
            b_best_response_to_a_s2.append(s1)
        if matrix[s2][s2][1] >= matrix[s2][s1][1]:
            b_best_response_to_a_s2.append(s2)
            
        # Find intersections (Mutual Best Responses)
        equilibria = []
        
        # Check (s1, s1)
        if s1 in a_best_response_to_b_s1 and s1 in b_best_response_to_a_s1:
            equilibria.append((s1, s1))
            
        # Check (s1, s2)
        if s1 in a_best_response_to_b_s2 and s2 in b_best_response_to_a_s1:
            equilibria.append((s1, s2))
            
        # Check (s2, s1)
        if s2 in a_best_response_to_b_s1 and s1 in b_best_response_to_a_s2:
            equilibria.append((s2, s1))
            
        # Check (s2, s2)
        if s2 in a_best_response_to_b_s2 and s2 in b_best_response_to_a_s2:
            equilibria.append((s2, s2))
            
        return equilibria

    def analyze_scene_logic(self, scene_text: str) -> dict:
        """Alias for analyze_scene to maintain compatibility"""
        return self.analyze_scene(scene_text)

    def critique_scene(self, scene_text: str, persona_prompt: str, bible_context: str) -> Dict[str, Any]:
        """
        Generates a critique and a rationality score using a specific system prompt (Persona).
        """
        system_instruction = "You are an AI assistant tasked with critiquing movie scripts and providing helpful feedback based on the provided persona and context."
        user_prompt = f"{persona_prompt}\nContext: {bible_context}\nAnalyze this scene:\n\n{scene_text}"
        
        llm_critique = self.llm.generate_text(system_instruction=system_instruction, user_prompt=user_prompt)
        
        # Integrate the rationality score from analyze_scene
        analysis_result = self.analyze_scene(scene_text)
        rationality_score = analysis_result.get("rationality_score", 0) # Default to 0 if not found

        return {"critique": llm_critique, "score": rationality_score}

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
            "'opening_image', 'theme_stated', 'setup', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', "
            "'bad_guys_close_in', 'all_is_lost', 'dark_night_of_soul', "
            "'break_into_three', 'finale', 'final_image'."
        )
        user_prompt = f"Here is my idea: {pitch}"
        
        return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

    def analyze_scene_dynamics(self, scene_text: str) -> Dict[str, Any]:
        """
        Analyzes the emotional rhythm, power dynamics, and subtext of a scene.
        """
        system_instruction = (
            "You are a master dramatic editor. Analyze the text for 'Push and Pull' based on these criteria:\n"
            "1. Power Dynamics: Who holds the power at the start? Who holds it at the end? Does it shift?\n"
            "2. Subtext Gap: Are the characters saying exactly what they mean (Bad) or is there a gap (Good)?\n"
            "3. Pacing: Contrast between short, sharp dialogue (Push) and pauses/monologues (Pull).\n\n"
            "Return a JSON object with:\n"
            "- 'power_shift_score' (integer 0-100: How much did the dynamic change?)\n"
            "- 'tension_peaks' (List of line numbers (1-indexed based on input) where tension is highest)\n"
            "- 'verdict' (string, e.g., 'Static Scene' or 'Dynamic Scene')\n"
            "- 'analysis_summary' (string: Brief explanation of the dynamics)\n"
            "- 'rhythm_map' (Dictionary where keys are line numbers (1-indexed) and values are categories: 'on_the_nose' (Low Subtext/Blue), 'high_tension' (Push/Orange), 'emotional_weight' (Pull/Purple). Only include lines that fit these categories.)"
        )
        user_prompt = f"Analyze this scene line by line. Treat the first line of text as line 1.\n\n{scene_text}"
        
        return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

    def reverse_engineer_script(self, script_text: str) -> Dict[str, Any]:
        """
        Reverse engineers a Save the Cat beat sheet from a full script.
        """
        system_instruction = (
            "You are a master film analyst. Reverse engineer a professional Save the Cat beat sheet from the provided script text. "
            "Return a JSON object with keys: 'genre' (str), 'logline' (str), 'title' (str), "
            "'beat_sheet' (dict with these exact keys: "
            "'opening_image', 'theme_stated', 'setup', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', "
            "'bad_guys_close_in', 'all_is_lost', 'dark_night_of_soul', "
            "'break_into_three', 'finale', 'final_image')."
        )
        user_prompt = f"Analyze this script and extract the beat sheet:\n\n{script_text[:50000]}" # Limit to 50k chars for a roughly 100pg script context
        
        return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

    def distill_notes(self, notes_text: str) -> Dict[str, Any]:
        """
        Distills core themes, characters, and synopsis from creative notes.
        """
        system_instruction = (
            "You are a creative executive at a top studio. Distill these raw notes into a project vision. "
            "Return a JSON object with keys: 'genre' (str), 'logline' (str), 'title' (str), 'themes' (list of str), "
            "'character_descriptions' (list of objects with 'name' and 'role'), 'synopsis' (str), "
            "and a 'beat_sheet' object with these exact keys: "
            "'opening_image', 'theme_stated', 'setup', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', "
            "'bad_guys_close_in', 'all_is_lost', 'dark_night_of_soul', "
            "'break_into_three', 'finale', 'final_image'."
        )
        user_prompt = f"Distill these notes:\n\n{notes_text}"
        
        return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)

    def generate_scene_content(self, beat_context: str, characters: List[str], game_theory_type: str) -> List[Dict[str, str]]:
        """
        Generates a screenplay scene based on a beat and Game Theory constraints.
        Returns a list of script blocks compatible with the editor.
        """
        system_instruction = (
            f"You are a screenwriter. Write a scene based on the following Beat. "
            f"Constraint: The interaction must follow the logic of a [{game_theory_type}] game. "
            f"The outcome must align with the Nash Equilibrium. "
            "Format the output as a JSON array of objects, where each object represents a script block "
            "and has exactly two keys: 'type' (one of: 'Scene Heading', 'Action', 'Character', 'Dialogue', 'Parenthetical') "
            "and 'text' (the content of the line). "
            "Ensure the scene is well-paced and idiomatic."
        )
        
        user_prompt = (
            f"Beat Context: {beat_context}\n"
            f"Characters involved: {', '.join(characters)}\n"
            f"Game Theory Dynamic: {game_theory_type}\n"
            "Generate the scene content."
        )
        
        response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        
        # Validate/Normalization if necessary, though generate_json returns a dict. 
        # We expect a list, but generate_json returns a dict (parsed from JSON). 
        # If the LLM returns { "scene": [...] } or just [...], we need to handle it.
        # generate_json implementation: return json.loads(response.text)
        
        if isinstance(response, list):
            return response
        elif isinstance(response, dict):
            # Check if wrapped in a key
            for key in ["scene", "blocks", "content", "script"]:
                if key in response and isinstance(response[key], list):
                    return response[key]
            
            # If strictly a dict but no obvious list, might be error or malformed
            return []
            
        return []
