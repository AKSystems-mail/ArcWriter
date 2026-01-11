from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
import requests # To fetch images from URLs
from typing import Dict, Any

# Assuming these imports exist or will be created for data retrieval
from app.services.bible_manager import BibleManager # For getting project details
# from app.models.character_model import Character  # Placeholder for future character data model

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        # Custom styles
        self.styles.add(ParagraphStyle(name='TitleStyle', fontSize=24, leading=28, alignment=TA_CENTER, fontName='Helvetica-Bold'))
        self.styles.add(ParagraphStyle(name='LoglineStyle', fontSize=14, leading=18, alignment=TA_CENTER, fontName='Helvetica-Oblique'))
        self.styles.add(ParagraphStyle(name='Heading1', fontSize=18, leading=22, fontName='Helvetica-Bold'))
        self.styles.add(ParagraphStyle(name='BodyText', fontSize=10, leading=12, fontName='Helvetica'))

    def _fetch_image(self, url: str):
        """Fetches an image from a URL and returns a BytesIO object."""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            return BytesIO(response.content)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching image from {url}: {e}")
            return None

    def compile_pitch_deck(self, universe_name: str, project_id: str, project_data: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []

        # --- Use Project Data ---
        title = project_data.get('title', f"Project {project_id}")
        logline = project_data.get('logline', "A compelling story that will keep you on the edge of your seat.")
        poster_url = project_data.get('poster_url', "https://via.placeholder.com/600x900?text=Movie+Poster+Placeholder")
        character_anchor_url = project_data.get('character_anchor_url')
        teaser_url = project_data.get('teaser_url') # Not directly used in PDF, but available
        script_page_count = project_data.get('script_page_count', 0)

        # For synopsis, still extracting from markdown for now
        bible_manager = BibleManager(universe_name=universe_name, project_id=project_id)
        if os.path.exists(bible_manager.bible_file_path):
            with open(bible_manager.bible_file_path, "r") as f:
                bible_content = f.read()
            synopsis = bible_manager._extract_section_content(bible_content, "## Synopsis") or \
                       "This is a detailed synopsis of the project. It outlines the plot, character arcs, and themes. This section would typically be much longer and provide all necessary information for a producer to understand the core narrative."
        else:
            synopsis = "Synopsis not available."

        full_script_content = "INT. ABANDONED WAREHOUSE - NIGHT\n\nA single flickering bulb illuminates a vast, dusty space. Rain drums against the corrugated iron roof.\n\nDETECTIVE MILLER (40s, weary, determined) moves cautiously, flashlight beam cutting through the gloom. His pistol is drawn. He finds a bloodstain on the concrete floor, fresh.\n\nMILLER\n(Whispering to comms)\nI've got contact. Possible victim, recent.\n\nSOUND of a metallic clang from the far end of the warehouse.\n\nMiller freezes, listens. He moves towards the sound, hugging the shadows between towering stacks of crates.\n\nCLOSE ON Miller's face - sweat beads on his brow, eyes scanning the darkness. The tension is palpable.\n\nFADE TO BLACK."
        # In a real app, this would be fetched from Firestore or another script storage.
        # For script page count, we'll use the stored value
        if script_page_count > 0:
            full_script_content += f"\n\n(Script content continues for {script_page_count} pages...)"


        # --- Page 1: Poster + Title + Logline ---
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(title.upper(), self.styles['TitleStyle']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph(logline, self.styles['LoglineStyle']))
        story.append(Spacer(1, 0.5 * inch))

        if poster_url:
            img_data = self._fetch_image(poster_url)
            if img_data:
                img = Image(img_data)
                # Scale image to fit page width while maintaining aspect ratio
                img_width = 4 * inch
                img_height = img.drawHeight * img_width / img.drawWidth
                img.drawWidth = img_width
                img.drawHeight = img_height
                img.hAlign = 'CENTER'
                story.append(img)
                story.append(Spacer(1, 0.5 * inch))

        story.append(PageBreak())

        # --- Page 2: Synopsis + Character Headshots ---
        story.append(Paragraph("Synopsis", self.styles['Heading1']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph(synopsis, self.styles['BodyText']))
        story.append(Spacer(1, 0.5 * inch))

        story.append(Paragraph("Key Characters", self.styles['Heading1']))
        story.append(Spacer(1, 0.2 * inch))
        if character_anchor_url:
            img_data = self._fetch_image(character_anchor_url)
            if img_data:
                img = Image(img_data)
                img_width = 1.5 * inch # Slightly larger
                img_height = img.drawHeight * img_width / img.drawWidth
                img.drawWidth = img_width
                img.drawHeight = img_height
                story.append(img)
                story.append(Paragraph("Main Character Anchor", self.styles['BodyText']))
                story.append(Spacer(1, 0.1 * inch))
        # Hardcoded for now. In reality, you'd iterate through a list of character anchor URLs
        else:
            story.append(Paragraph("No main character anchor visual available.", self.styles['BodyText']))
        story.append(PageBreak())

        # --- Page 3+: The Full Script ---
        story.append(Paragraph("Full Script", self.styles['Heading1']))
        story.append(Spacer(1, 0.2 * inch))
        # Split script by lines to create paragraphs for ReportLab
        for line in full_script_content.split('\n'):
            story.append(Paragraph(line, self.styles['BodyText']))
            story.append(Spacer(1, 0.05 * inch)) # Small space between lines

        doc.build(story)
        buffer.seek(0)
        return buffer
