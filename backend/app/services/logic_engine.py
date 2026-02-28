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
        """Generates a screenplay scene with strict block types for the frontend."""
        system_instruction = (
            "You are a professional screenwriter. Write a scene in standard screenplay format.\n"
            "Return a JSON object with a single key 'blocks' containing a list of objects.\n"
            "Each object MUST have 'type' and 'text' keys.\n\n"
            "ALLOWED TYPES (MUST MATCH EXACTLY):\n"
            "- 'Scene Heading' (For sluglines, e.g. INT. OFFICE - DAY)\n"
            "- 'Action' (For visual descriptions)\n"
            "- 'Character' (For speaker names, uppercase only)\n"
            "- 'Dialogue' (For spoken lines)\n"
            "- 'Parenthetical' (For internal direction)\n\n"
            "CRITICAL: DO NOT repeat the 'CONTEXT' or 'EXISTING SCRIPT' in your response. "
            "Only return the NEW blocks that continue the story.\n\n"
            "CRITICAL: Character names MUST be uppercase. No ages/descriptions in Character blocks."
        )
        user_prompt = (
            f"BEAT: {beat_context}.\nCHARACTERS: {', '.join(characters)}.\n"
            f"GAME LOGIC: {game_theory_type}.\n"
            f"CONTEXT (Pick up from here if not empty):\n{existing_script}\n\n"
            "TASK: Write the next logical scene or the opening scene if no context provided."
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
            "market_viability": "Focus on pacing, high stakes, and audience engagement.",
            "thematic_consistency": "Focus on subtext, emotional resonance, and consistent motifs.",
            "structural_integrity": "Focus on narrative logic, cause-and-effect, and structural setup/payoff."
        }
        persona_context = prompts.get(persona_prompt, "You are a professional script consultant.")
        system_instruction = (
            f"{persona_context}\n"
            "Analyze the scene contextually based on the Project Master Blueprint.\n\n"
            "FORMATTING RULE: Provide the report as a numbered list. "
            "IMPORTANT: Add an empty line (extra space) after each numbered item.\n\n"
            f"MASTER BLUEPRINT CONTEXT:\n{bible_context}"
        )
        
        # Integrate dynamic analysis
        dynamics_result = self.analyze_scene_dynamics(scene_text)
        llm_critique = self.llm.generate_text(system_instruction=system_instruction, user_prompt=f"SCENE TEXT TO ANALYZE:\n{scene_text}")
        
        return {
            "critique": llm_critique, 
            "score": 85,
            **dynamics_result
        }

    def analyze_scene_dynamics(self, scene_text: str) -> Dict[str, Any]:
        """Analyzes emotional rhythm and power dynamics with annotated milestones."""
        system_instruction = (
            "You are a master dramatic editor. Analyze the scene for dynamic tension.\n"
            "MANDATE: Return EXACTLY 20 integers in the 'tension_curve' list.\n"
            "MANDATE: Identify 3-5 'milestones' (indices 0-19) where tension shifts significantly.\n"
            "Return JSON: { \n"
            "  'tension_curve': [int], \n"
            "  'milestones': [{ 'index': int, 'label': str, 'description': str }],\n"
            "  'verdict': str, \n"
            "  'analysis_summary': str \n"
            "}"
        )
        user_prompt = f"Analyze this scene line-by-line for tension spikes:\n\n{scene_text[:10000]}"
        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            logger.error(f"Error in analyze_scene_dynamics: {e}")
            return {"tension_curve": [5] * 20, "milestones": []}

    def suggest_dialogue(self, context_lines: str, genre: str = "Drama", style: str = "Modern", beat_context: str = "", characters: list = []) -> List[str]:
        """Suggests 3 distinct dialogue options."""
        system_instruction = (
            "You are a screenwriting assistant. Suggest 3 distinct dialogue options (Direct, Subtextual, Conflict-heavy).\n"
            "Return ONLY a JSON list of strings."
        )
        user_prompt = f"GENRE: {genre}\nSTYLE: {style}\nCHARACTERS: {characters}\nBEAT: {beat_context}\nCONTEXT:\n{context_lines}"
        try:
            response = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            return response if isinstance(response, list) else []
        except Exception as e:
            logger.error(f"Error in suggest_dialogue: {e}")
            return []

    def scan_first_ten_pages(self, script_text: str, genre: str) -> Dict[str, Any]:
        """Conducts a 'Gatekeeper Audit' of the first 10 pages with velocity analysis."""
        system_instruction = (
            "You are a Senior Story Executive. Decide 'READ' or 'PASS' based on the first 10 pages.\n"
            "MANDATE: Analyze the 'Hook Velocity' (how fast interest builds).\n"
            "MANDATE: Return EXACTLY 10 integers in the 'velocity_curve' (one for each page).\n"
            "Return JSON: { \n"
            "  'gatekeeper_verdict': 'READ'|'PASS', \n"
            "  'pillar_scores': { 'theme': int, 'motivation': int, 'tone': int, 'catalyst': int }, \n"
            "  'velocity_curve': [int], \n"
            "  'hook_milestones': [{ 'page': int, 'label': str }],\n"
            "  'detailed_audit': str \n"
            "}\n\n"
            "FORMATTING RULE: Provide 'detailed_audit' as a numbered list with empty lines between items."
        )
        user_prompt = f"GENRE: {genre}\nSCRIPT OPENING:\n{script_text[:30000]}"
        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            logger.error(f"Error in hook scan: {e}")
            return {"gatekeeper_verdict": "PASS", "velocity_curve": [5] * 10}

    def audit_full_structure(self, full_script: str, bible_context: str) -> Dict[str, Any]:
        """Conducts a deep structural audit of the entire script."""
        system_instruction = (
            "You are a master script consultant. Analyze the full script for structural integrity.\n"
            "Focus specifically on:\n"
            "1. SETUP/PAYOFF (Chekhov's Gun): Is everything in Act 3 earned? Is anything missing from Act 1?\n"
            "2. CHARACTER ARCS: Do characters evolve consistently from start to finish?\n"
            "3. BLUEPRINT ALIGNMENT: Does the script follow the 15-beat master structure provided?\n\n"
            "Return JSON: { 'structural_integrity_score': int, 'plothole_warnings': [str], 'pacing_verdict': str, 'full_audit_report': str }\n\n"
            "FORMATTING RULE: Provide 'full_audit_report' as a numbered list with empty lines between items."
        )
        user_prompt = f"PROJECT MASTER BLUEPRINT:\n{bible_context}\n\nFULL SCRIPT TEXT:\n{full_script[:100000]}"
        try:
            audit_result = self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
            
            # Step 10 Implementation: Resolution Scanner
            # If the script seems long enough to have an ending, run the stability test
            if len(full_script) > 5000:
                resolution_report = self.analyze_resolution(full_script)
                audit_result["resolution_scan"] = resolution_report
                
            return audit_result
        except Exception as e:
            logger.error(f"Error in full script audit: {e}")
            return {"structural_integrity_score": 0, "plothole_warnings": ["Audit failed due to context size."]}

    def analyze_resolution(self, script_text: str) -> Dict[str, Any]:
        """
        The Resolution Scanner: Performs a Game Theory 'Stability Test' on the script's ending.
        Checks if characters still have dominant strategies to attack or if the resolution is stable.
        """
        system_instruction = (
            "You are a Story Logic Auditor specializing in Game Theory.\n"
            "TASK: Evaluate the RESOLUTION of this script for structural stability.\n\n"
            "LOGIC STEPS:\n"
            "1. IDENTIFY ACTIVE AGENTS: List primary characters with high 'Agency' who are alive at the end.\n"
            "2. CHECK MOTIVATIONS: For each survivor, evaluate their final 'Want' vs their 'Outcome'.\n"
            "3. THE STABILITY TEST: Does any Antagonist still have a 'Dominant Strategy' to attack or undermine the Hero?\n"
            "   - If YES: Flag as 'Unstable Ending / Sequel Hook'.\n"
            "   - If NO: Flag as 'Stable Resolution'.\n\n"
            "Return JSON ONLY:\n"
            "{\n"
            "  'resolution_status': 'Stable' | 'Unstable' | 'Ambiguous',\n"
            "  'loose_ends': [str],\n"
            "  'critique': str,\n"
            "  'active_agents': [{ 'name': str, 'agency_score': int, 'status': str }]\n"
            "}"
        )
        
        # Focus specifically on the last 15,000 characters for the resolution
        ending_text = script_text[-15000:]
        user_prompt = f"Evaluate the final state of this narrative:\n\n{ending_text}"
        
        try:
            return self.llm.generate_json(prompt=user_prompt, system_instruction=system_instruction)
        except Exception as e:
            logger.error(f"Resolution Scanner Error: {e}")
            return {"resolution_status": "Ambiguous", "loose_ends": ["Audit timed out."]}

    def reverse_engineer_script(self, script_text: str) -> Dict[str, Any]:
        """Reverse engineers a full project bible from a script."""
        return self.generate_project_metadata(f"EXTRACT FROM FULL SCRIPT:\n{script_text[:50000]}")

    def distill_notes(self, notes_text: str) -> Dict[str, Any]:
        """Distills core themes and beats from notes."""
        return self.generate_project_metadata(f"EXTRACT FROM ROUGH NOTES:\n{notes_text[:20000]}")

    def public_structural_analysis(self, raw_input: str) -> Dict[str, Any]:
        """Special logic for the public lead magnet. Returns full sheet internally, but teaser externally."""
        full_analysis = self.generate_project_metadata(raw_input)
        
        # Defense-in-depth: Ensure it's a dict
        if isinstance(full_analysis, list) and len(full_analysis) > 0:
            full_analysis = full_analysis[0]
            
        print(f"DEBUG: full_analysis keys: {list(full_analysis.keys()) if isinstance(full_analysis, dict) else 'NOT A DICT'}")
            
        # Extract full beat sheet
        full_beats = full_analysis.get("beat_sheet", {})
        print(f"DEBUG: full_beats type: {type(full_beats)}")
        print(f"DEBUG: full_beats content: {full_beats}")
        
        # Create the teaser (First 3 beats)
        teaser_beats = []
        # Standard Save the Cat order: 
        # 1. Opening Image
        # 2. Theme Stated
        # 3. Set-up
        target_beats = [
            {"id": 1, "name": "Opening Image", "aliases": ["opening image", "opening"]},
            {"id": 2, "name": "Theme Stated", "aliases": ["theme stated", "theme"]},
            {"id": 3, "name": "Set-up", "aliases": ["set-up", "setup"]}
        ]
        
        for target in target_beats:
            content = None
            name = target["name"]
            aliases = target["aliases"]
            idx_str = str(target["id"])
            
            # 1. Search in Dict
            if isinstance(full_beats, dict) and full_beats:
                # Try aliases
                for alias in aliases:
                    for k, v in full_beats.items():
                        if alias in str(k).lower():
                            content = v
                            break
                    if content: break
                
                # Try index fallback
                if not content:
                    content = full_beats.get(idx_str)
            
            # 2. Search in List
            elif isinstance(full_beats, list) and full_beats:
                # Try finding by name in list items
                for item in full_beats:
                    if isinstance(item, dict):
                        item_name = (item.get("beat") or item.get("name") or item.get("title") or "").lower()
                        if any(a in item_name for a in aliases) or idx_str == item_name:
                            content = item.get("description") or item.get("content") or item.get("text")
                            if content: break
                
                # Strict index fallback if no name match
                if not content and target["id"] <= len(full_beats):
                    item = full_beats[target["id"] - 1]
                    if isinstance(item, dict):
                        content = item.get("description") or item.get("content") or item.get("text") or list(item.values())[0]
                    else:
                        content = str(item)

            # FINAL FALLBACK
            if not content or content == "Analyzing...":
                if target["id"] == 1: content = full_analysis.get("logline") or full_analysis.get("synopsis")
                elif target["id"] == 2: content = "The core truth your protagonist must learn during this journey."
                else: content = "Establishing the world and the status quo before the journey begins."

            teaser_beats.append({
                "id": target["id"], 
                "title": name, 
                "content": str(content)[:300]
            })
            
        print(f"DEBUG: teaser_beats: {teaser_beats}")
        return {
            "teaser_beats": teaser_beats,
            "full_analysis": full_analysis # Backend will store this, frontend won't see it yet
        }

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