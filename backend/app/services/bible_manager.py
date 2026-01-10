import os
import re

class BibleManager:
    TEMPLATES = {
        "save_the_cat": "# Project Bible\n\n## Title\n(Insert Project Title)\n\n## Genre\n(Insert Project Genre)\n\n## Logline\n(Insert Logline)\n\n## Characters\n(Insert Characters)\n\n## Beat Sheet (Save the Cat)\n1. Opening Image\n2. Theme Stated\n3. Set-up\n4. Catalyst\n5. Debate\n6. Break into Two\n7. B Story\n8. Fun and Games\n9. Midpoint\n10. Bad Guys Close In\n11. All Is Lost\n12. Dark Night of the Soul\n13. Break into Three\n14. Finale\n15. Final Image\n",
        "heros_journey": "# Project Bible\n\n## Title\n(Insert Project Title)\n\n## Genre\n(Insert Project Genre)\n\n## Logline\n(Insert Logline)\n\n## Characters\n(Insert Characters)\n\n## The Hero's Journey\n1. Ordinary World\n2. Call to Adventure\n3. Refusal of the Call\n4. Meeting the Mentor\n5. Crossing the Threshold\n6. Tests, Allies, Enemies\n7. Approach to the Inmost Cave\n8. Ordeal\n9. Reward (Seizing the Sword)\n10. The Road Back\n11. Resurrection\n12. Return with the Elixir\n"
    }

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.file_path = f"project_bible_{project_id}.md"

    def initialize_bible(self, template_type: str = "save_the_cat"):
        if template_type not in self.TEMPLATES:
            raise ValueError(f"Unknown template type: {template_type}")
        
        content = self.TEMPLATES[template_type]
        with open(self.file_path, "w") as f:
            f.write(content)
        return content

    def update_section(self, header: str, new_content: str):
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Bible file not found at {self.file_path}")

        with open(self.file_path, "r") as f:
            content = f.read()

        header_pattern = re.escape(header)
        parts = re.split(f"(^{header_pattern}.*$)", content, maxsplit=1, flags=re.MULTILINE)
        
        if len(parts) < 3:
             with open(self.file_path, "a") as f:
                 f.write(f"\n\n{header}\n{new_content}")
             return

        rest = parts[2]
        next_header_match = re.search(r"^#", rest, flags=re.MULTILINE)
        
        if next_header_match:
            section_content = rest[:next_header_match.start()]
            next_sections = rest[next_header_match.start():]
            updated_section = section_content.rstrip() + "\n\n" + new_content + "\n\n"
            new_rest = updated_section + next_sections
        else:
            new_rest = rest.rstrip() + "\n\n" + new_content + "\n"

        final_content = parts[0] + parts[1] + new_rest
        with open(self.file_path, "w") as f:
            f.write(final_content)

    def get_context_string(self) -> str:
        if not os.path.exists(self.file_path):
            return "Title: Unknown, Genre: Unknown, Beats: "

        with open(self.file_path, "r") as f:
            content = f.read()

        title = self._extract_section_content(content, "## Title") or "Unknown"
        genre = self._extract_section_content(content, "## Genre") or "Unknown"
        
        beats_content = self._extract_section_content(content, "## Beat Sheet (Save the Cat)")
        if not beats_content:
             beats_content = self._extract_section_content(content, "## The Hero's Journey")
        
        # Format beats: replace newlines with a separator to make it a single line
        # We assume the raw content is decent enough to just join
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
