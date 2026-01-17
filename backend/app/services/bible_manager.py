import os
import re
import json # Import json
from typing import Optional, Dict, Any
from datetime import datetime # Import datetime
from fastapi import HTTPException
from app.utils.firebase_auth_utils import get_firestore_db

class BibleManager:
    TEMPLATES = {
        "save_the_cat": "# Project Bible\n\n## Title\n(Insert Project Title)\n\n## Genre\n(Insert Project Genre)\n\n## Logline\n(Insert Logline)\n\n## Characters\n(Insert Characters)\n\n## Beat Sheet (Save the Cat)\n1. Opening Image\n2. Theme Stated\n3. Set-up\n4. Catalyst\n5. Debate\n6. Break into Two\n7. B Story\n8. Fun and Games\n9. Midpoint\n10. Bad Guys Close In\n11. All Is Lost\n12. Dark Night of the Soul\n13. Break into Three\n14. Finale\n15. Final Image\n",
        "heros_journey": "# Project Bible\n\n## Title\n(Insert Project Title)\n\n## Genre\n(Insert Project Genre)\n\n## Logline\n(Insert Logline)\n\n## Characters\n(Insert Characters)\n\n## The Hero's Journey\n1. Ordinary World\n2. Call to Adventure\n3. Refusal of the Call\n4. Meeting the Mentor\n5. Crossing the Threshold\n6. Tests, Allies, Enemies\n7. Approach to the Inmost Cave\n8. Ordeal\n9. Reward (Seizing the Sword)\n10. The Road Back\n11. Resurrection\n12. Return with the Elixir\n"
    }

    def __init__(self, universe_name: str, project_id: str):
        self.universe_name = universe_name
        self.project_id = project_id
        # Define the base directory for universes relative to the backend app
        self.base_dir = "universes"
        self.universe_path = os.path.join(self.base_dir, self.universe_name)
        self.project_path = os.path.join(self.universe_path, self.project_id)
        self.bible_file_path = os.path.join(self.project_path, "project_bible.md")
        self.config_file_path = os.path.join(self.project_path, "project_config.json")
        self.db = get_firestore_db()

    def _get_project_ref(self):
        """Helper to get the Firestore project reference."""
        return self.db.collection("universes").document(self.universe_name).collection("projects").document(self.project_id)

    def save_bible(self, markdown_content: str):
        """Updates the bible_content field in Firestore for this project."""
        project_ref = self._get_project_ref()
        project_ref.update({"bible_content": markdown_content})
        print(f"Bible content saved to Firestore for project {self.project_id}")

    def initialize_bible(self, template_type: str = "save_the_cat"):
        # Ensure project directory exists (still used for project_config.json for now)
        os.makedirs(self.project_path, exist_ok=True)

        if template_type not in self.TEMPLATES:
            raise ValueError(f"Unknown template type: {template_type}")
        
        # Create initial content
        content = self.TEMPLATES[template_type]
        
        # Save to Firestore
        self.save_bible(content)
        
        # Create initial project_config.json (KEEPING LOCAL FOR NOW AS STATED IN TASK BUT PRIMARY IS FIRESTORE)
        initial_config = {
            "title": self.project_id.replace('_', ' ').title(), # Default title from project_id
            "logline": self._extract_section_content(content, "## Logline"),
            "genre": self._extract_section_content(content, "## Genre"),
            "character_anchor_url": None,
            "poster_url": None,
            "teaser_url": None,
            "script_page_count": 0,
            "created_at": datetime.utcnow().isoformat() # Store creation time
        }
        self._write_project_config(initial_config)
        
        return content

    def _read_project_config(self) -> Dict[str, Any]:
        """Reads the project_config.json file."""
        if os.path.exists(self.config_file_path):
            with open(self.config_file_path, "r") as f:
                return json.load(f)
        return {}

    def _write_project_config(self, config_data: Dict[str, Any]):
        """Writes data to the project_config.json file."""
        with open(self.config_file_path, "w") as f:
            json.dump(config_data, f, indent=4)

    def get_project_data(self) -> Dict[str, Any]:
        """Retrieves structured project data from project_config.json."""
        config_data = self._read_project_config()
        # Ensure 'title' is always present, derived from project_id if not explicitly set
        if 'title' not in config_data or not config_data['title']:
            config_data['title'] = self.project_id.replace('_', ' ').title()
        return config_data

    def update_project_data(self, data: Dict[str, Any]):
        """Updates specific fields in the project_config.json."""
        current_config = self._read_project_config()
        current_config.update(data)
        self._write_project_config(current_config)

    def update_section(self, header: str, new_content: str):
        project_ref = self._get_project_ref()
        project_doc = project_ref.get()
        
        if not project_doc.exists:
            raise HTTPException(status_code=404, detail=f"Project {self.project_id} not found in Firestore.")

        project_data = project_doc.to_dict()
        content = project_data.get("bible_content", "")

        header_pattern = re.escape(header)
        parts = re.split(f"(^{header_pattern}.*$)", content, maxsplit=1, flags=re.MULTILINE)
        
        if len(parts) < 3:
             # If section not found, append it
             updated_content = content.rstrip() + f"\n\n{header}\n{new_content}\n"
             self.save_bible(updated_content)
             return

        rest = parts[2]
        next_header_match = re.search(r"^##", rest, flags=re.MULTILINE) # Use ## for sections
        
        if next_header_match:
            section_content = rest[:next_header_match.start()]
            next_sections = rest[next_header_match.start():]
            # Replace the old content with new_content for this header
            updated_section = "\n" + new_content + "\n\n"
            new_rest = updated_section + next_sections
        else:
            new_rest = "\n" + new_content + "\n"

        final_content = parts[0] + parts[1] + new_rest
        self.save_bible(final_content)

    def get_context_string(self) -> str:
        project_ref = self._get_project_ref()
        project_doc = project_ref.get()
        
        if not project_doc.exists:
            return "Title: Unknown, Genre: Unknown, Beats: "

        project_data = project_doc.to_dict()
        content = project_data.get("bible_content", "")

        if not content:
            return "Title: Unknown, Genre: Unknown, Beats: "

        title = self._extract_section_content(content, "## Title") or "Unknown"
        genre = self._extract_section_content(content, "## Genre") or "Unknown"
        
        beats_content = self._extract_section_content(content, "## Beat Sheet (Save the Cat)")
        if not beats_content:
             beats_content = self._extract_section_content(content, "## The Hero's Journey")
        
        # Format beats: replace newlines with a separator to make it a single line
        beats_lines = [line.strip() for line in beats_content.split('\n') if line.strip()]
        beats = "; ".join(beats_lines)

        return f"Title: {title}, Genre: {genre}, Beats: {beats}"

    def _extract_section_content(self, full_content: str, header: str) -> str:
        """Helper to extract content under a specific markdown header."""
        # Find the header
        header_pattern = re.escape(header)
        # Match header line, then everything until the next header or end of string
        match = re.search(fr"(^{header_pattern}.*)([\s\S]*?)(?=^#|\Z)", full_content, re.MULTILINE)
        if match:
            # group(2) is the content of the section
            return match.group(2).strip()
        return ""