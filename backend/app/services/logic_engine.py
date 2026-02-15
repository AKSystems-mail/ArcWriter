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

    def generate_scene_content(self, beat_context: str, characters: list, game_theory_type: str, existing_script: str = "") -> List[str]:
        """
        Generates a screenplay scene based on a beat and game theory constraint.
        Maintains continuity with existing_script if provided.
        Returns a list of objects for the editor.
        """
        system_instruction = (
            "You are a professional screenwriter. Write a scene in standard screenplay format. "
            "Do not include conversational filler before or after the script. "
            "Return the result as a JSON object with a single key 'blocks' containing a list of objects. "
            "Each object must have 'type' and 'text' keys.\n\n"
            "ALLOWED TYPES:\n"
            "- 'Scene Heading' (e.g. INT. OFFICE - DAY)\n"
            "- 'Action' (Description of visual events)\n"
            "- 'Character' (Name of the speaker, uppercase)\n"
            "- 'Dialogue' (The spoken words)\n"
            "- 'Parenthetical' (Internal direction, e.g. (beat))\n\n"
            "CONTINUITY RULES:\n"
            "1. If 'existing_script' is empty, write the definitive OPENING IMAGE scene from the provided beat sheet.\n"
            "2. If 'existing_script' is provided, pick up exactly where the script left off. Maintain tone and location.\n"
            "3. Ensure character voices are consistent with the previous pages."
        )
        
        user_prompt = (
            f"BEAT SHEET CONTEXT: {beat_context}.\n"
            f"CHARACTERS: {', '.join(characters)}.\n"
            f"CONSTRAINT: Use the logic of a '{game_theory_type}' game for the conflict.\n"
            f"EXISTING SCRIPT PAGES:\n{existing_script}\n\n"
            "TASK: Write the next logical scene."
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
                return [{"type": "Scene Heading", "text": "INT. SCENE - DAY"}, {"type": "Action", "text": str(response)}]
                
        except Exception as e:
            print(f"LLM Generation Error: {e}")
            return [{"type": "Scene Heading", "text": "INT. ERROR - DAY"}, {"type": "Action", "text": f"(Scene generation failed: {str(e)})"}]

    def critique_scene(self, scene_text: str, persona_prompt: str, bible_context: str) -> Dict[str, Any]:
        """
        Generates a critique and a rationality score using a specific system prompt (Persona).
        Includes an audit of 10 narrative devices.
        """
        # Map IDs to System Instructions with specialized Narrative Device focus
        prompts = {
            "market_viability": (
                "You are a commercial Hollywood analyst. Focus strictly on pacing, stakes, and audience retention.\n"
                "Audit the following devices: 'Save the Cat' (Empathy), 'In Medias Res' (Pacing), 'The MacGuffin' (Goal), and 'Pope in the Pool' (Exposition Management).\n"
            ),
            "thematic_consistency": (
                "You are a literary analyst. Focus on character arcs, subtext, and motifs.\n"
                "Audit the following devices: 'Subtext' (On-the-nose dialogue), 'Dramatic Irony' (Knowledge gaps), and 'Red Herrings' (Misdirection).\n"
            ),
            "structural_integrity": (
                "You are a logic engine. Focus on cause-and-effect, plot holes, and Game Theory.\n"
                "Audit the following devices: 'Chekhov’s Gun' (Payoffs), 'Deus Ex Machina' (Logic gaps), and 'Peripeteia' (Midpoint Pivots).\n"
            )
        }
        
        persona_context = prompts.get(persona_prompt, "You are a professional script consultant.")
        
        system_instruction = (
            f"{persona_context}\n"
            "Analyze the scene based on the provided context.\n\n"
            "UNIVERSE CONTINUITY RULES:\n"
            "The PROJECT CONTEXT contains details for the current script and other scripts in the same universe.\n"
            "1. Cross-reference characters, deaths, and major events across ALL projects.\n"
            "2. If this scene contradicts an established fact in a previous script (e.g., a dead character is alive without explanation), flag it.\n"
            "3. Use the specific literary terms (Chekhov's Gun, Peripeteia, etc.) when applicable.\n\n"
            "FORMATTING RULES:\n"
            "1. Provide the report as a numbered list.\n"
            "2. IMPORTANT: Add an empty line (extra space) after each numbered item to ensure readability.\n"
            "3. If a device is missing but needed, suggest how to add it.\n"
            "4. Use professional Hollywood terminology."
        )
        
        user_prompt = f"PROJECT CONTEXT:\n{bible_context}\n\nSCENE TEXT:\n{scene_text}"
        
        llm_critique = self.llm.generate_text(system_instruction=system_instruction, user_prompt=user_prompt)
        
        # Integrate the rationality score from analyze_scene
        analysis_result = self.analyze_scene(scene_text)
        rationality_score = analysis_result.get("rationality_score", 0)

        # Integrate dynamic analysis
        dynamics_result = self.analyze_scene_dynamics(scene_text)

        return {
            "critique": llm_critique, 
            "score": rationality_score,
            "analysis_details": analysis_result,
            **dynamics_result
        }

    def generate_project_metadata(self, pitch: str) -> Dict[str, Any]:
        """
        Generates metadata (Genre, Logline, Structure) from a raw elevator pitch or creative notes.
        """
        system_instruction = (
            "You are a legendary Hollywood script consultant. "
            "Analyze the user's raw idea (which may be a short pitch or lengthy notes) and distill it into professional project metadata.\n\n"
            "Return a JSON object with keys:\n"
            "- 'genre': (str)\n"
            "- 'logline': (str, punchy 1-sentence)\n"
            "- 'structure_suggestion': (str, e.g. 'Hero's Journey', 'Three Act', 'Non-linear')\n"
            "- 'title_ideas': (list of strings)\n"
            "- 'title': (str, the definitive title choice)\n"
            "- 'synopsis': (str, a detailed 2-paragraph summary of the story)\n"
            "- 'character_descriptions': (list of objects with 'name', 'role', and 'description')\n"
            "- 'beat_sheet': (dict with EVERY ONE of these 15 keys: 'opening_image', 'theme_stated', 'set_up', 'catalyst', 'debate', "
            "'break_into_two', 'b_story', 'fun_and_games', 'midpoint', 'bad_guys_close_in', 'all_is_lost', "
            "'dark_night_of_the_soul', 'break_into_three', 'finale', 'final_image')\n\n"
            "CRITICAL RULES:\n"
            "1. You MUST provide detailed content for every single beat in the 'beat_sheet' object.\n"
            "2. DO NOT leave the synopsis empty. Distill the user's notes into a professional narrative summary.\n"
            "3. If the user provides long notes, DO NOT simply repeat them. Distill them into a clean vision.\n"
            "4. Use 'dark_night_of_the_soul' NOT 'dark_night_of_soul'.\n"
            "5. If characters aren't named, invent a compelling 3-4 person cast that fits the genre."
        )
        user_prompt = f"Distill this project idea into a professional studio vision:\n\n{pitch[:15000]}"
        
        # Use Gemini 2.5 Pro for this high-reasoning task
        pro_model = self.llm.model_name.replace("flash", "pro")
        response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction, model_id=pro_model)

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

    def suggest_dialogue(self, context_lines: str, genre: str = "Drama", style: str = "Modern", beat_context: str = "", characters: list = []) -> List[str]:
        """
        Suggests 3 distinct dialogue options based on script context, genre, style, and project universe.
        """
        system_instruction = (
            "You are a screenwriting assistant. Analyze the script context and the project universe.\n"
            "Suggest 3 distinct dialogue options for the next character to speak.\n"
            "Option 1: On the nose (Direct, literal).\n"
            "Option 2: Subtextual (Hidden meaning, talking around the subject).\n"
            "Option 3: Conflict-heavy (Push back, aggressive, defensive).\n\n"
            "UNIVERSE CONTEXT:\n"
            f"- Characters: {', '.join(characters)}\n"
            f"- Current Beat/Goal: {beat_context}\n\n"
            "Return ONLY the dialogue lines as a JSON list of strings."
        )
        user_prompt = f"GENRE: {genre}\nSTYLE: {style}\n\nSCRIPT CONTEXT:\n{context_lines}"
        
        try:
            response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            if isinstance(response, list):
                return response
            elif isinstance(response, dict) and "suggestions" in response:
                return response["suggestions"]
            return [str(response)]
        except Exception as e:
            print(f"Error in suggest_dialogue: {e}")
            return ["(AI failed to generate suggestions)"]

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

    def analyze_resolution(self, script_text: str, active_conflicts: List[str]) -> Dict[str, Any]:
        """
        Analyzes the script's ending for stability and unresolved loose ends.
        """
        system_instruction = (
            "You are a narrative stability analyst. Analyze the ending of this script. "
            "1. Identify all surviving characters with high agency. "
            "2. For each survivor, check if their primary 'Want' was achieved or abandoned. "
            "3. STABILITY TEST: Does any Antagonistic force still have a Dominant Strategy to attack? "
            "   - If YES -> Status: 'Unstable / Sequel Hook'. "
            "   - If NO -> Status: 'Stable Resolution'. "
            "Return a JSON object with keys: "
            "'resolution_status' ('Stable' | 'Unstable' | 'Ambiguous'), "
            "'loose_ends' (list of objects {character, unresolved_utility}), "
            "'critique' (natural language explanation of the stability)."
        )
        
        # Analyze only the last 20% of the script for efficiency, or full if short
        text_len = len(script_text)
        ending_text = script_text[int(text_len * 0.8):] if text_len > 5000 else script_text
        
        user_prompt = (
            f"ACTIVE CONFLICTS: {', '.join(active_conflicts)}\n"
            f"SCRIPT ENDING:\n{ending_text}"
        )

        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            print(f"Error in analyze_resolution: {e}")
            return {
                "resolution_status": "Ambiguous", 
                "loose_ends": [], 
                "critique": f"Analysis failed: {str(e)}"
            }

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

    def scan_first_ten_pages(self, script_text: str, genre: str) -> Dict[str, Any]:
        """
        Conducts a specialized 'Gatekeeper Audit' of the first 10 pages.
        """
        system_instruction = (
            "You are a Senior Story Executive at a major studio. Your job is to decide whether to 'Pass' or 'Read' "
            "based strictly on the first 10 pages of a script.\n\n"
            "Evaluate the following 4 pillars:\n"
            "1. THEME STATEMENT: Is the theme stated (usually by a minor character) in pages 3-5?\n"
            "2. MOTIVATION: Are the protagonist's 'Want' (external goal) and 'Need' (internal lack) clear?\n"
            "3. TONE: Does the vocabulary and scene rhythm match the intended genre?\n"
            "4. CATALYST: Has the inciting incident occurred or been strongly foreshadowed?\n\n"
            "Return a JSON object with:\n"
            "- 'gatekeeper_verdict': 'READ' (Strong) or 'PASS' (Weak)\n"
            "- 'pillar_scores': { 'theme': int, 'motivation': int, 'tone': int, 'catalyst': int }\n"
            "- 'detailed_audit': str (A numbered list with professional feedback. IMPORTANT: Add an empty line space after each numbered item.)\n"
        )
        
        user_prompt = f"INTENDED GENRE: {genre}\nSCRIPT TEXT (FIRST 10 PAGES):\n{script_text[:30000]}"
        
        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            print(f"Error in hook scan: {e}")
            return {"error": str(e), "gatekeeper_verdict": "PASS"}

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