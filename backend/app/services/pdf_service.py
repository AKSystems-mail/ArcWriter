from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime
import requests
import qrcode
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        # Custom Branding Styles
        self.styles.add(ParagraphStyle(name='ArcTitle', fontSize=32, leading=36, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=colors.black))
        self.styles.add(ParagraphStyle(name='ArcLogline', fontSize=16, leading=20, alignment=TA_CENTER, fontName='Helvetica-Oblique', textColor=colors.grey))
        self.styles.add(ParagraphStyle(name='ArcHeading', fontSize=22, leading=26, fontName='Helvetica-Bold', spaceAfter=12))
        self.styles.add(ParagraphStyle(name='ArcSubHeading', fontSize=10, leading=14, fontName='Helvetica-Bold', textColor=colors.grey, uppercase=True, letterSpacing=2))
        self.styles.add(ParagraphStyle(name='ArcBody', fontSize=11, leading=15, fontName='Helvetica'))
        
        # Screenplay Standards (Courier)
        self.styles.add(ParagraphStyle(name='ScriptSlug', fontSize=12, leading=14, fontName='Courier-Bold', spaceBefore=12, spaceAfter=12))
        self.styles.add(ParagraphStyle(name='ScriptAction', fontSize=12, leading=14, fontName='Courier', spaceAfter=12))
        self.styles.add(ParagraphStyle(name='ScriptChar', fontSize=12, leading=14, fontName='Courier', leftIndent=2.0*inch, spaceBefore=6))
        self.styles.add(ParagraphStyle(name='ScriptDialogue', fontSize=12, leading=14, fontName='Courier', leftIndent=1.0*inch, rightIndent=1.0*inch, spaceAfter=6))
        self.styles.add(ParagraphStyle(name='ScriptParenthetical', fontSize=12, leading=14, fontName='Courier', leftIndent=1.5*inch, rightIndent=1.5*inch))
        self.styles.add(ParagraphStyle(name='ScriptActBreak', fontSize=12, leading=14, fontName='Courier-Bold', alignment=TA_CENTER, spaceBefore=24, spaceAfter=24))
        
        # Industry Standard Title Page (Strict Courier)
        self.styles.add(ParagraphStyle(name='IndustryTitle', fontSize=12, fontName='Courier-Bold', alignment=TA_CENTER, leading=14, spaceAfter=12))
        self.styles.add(ParagraphStyle(name='IndustryStandard', fontSize=12, fontName='Courier', alignment=TA_CENTER, leading=14))
        self.styles.add(ParagraphStyle(name='IndustryContact', fontSize=12, fontName='Courier', alignment=TA_LEFT, leading=14))
        self.styles.add(ParagraphStyle(name='IndustryLegal', fontSize=10, fontName='Courier', alignment=TA_LEFT, leading=12))

    def _fetch_image(self, url: str):
        if not url or 'placehold.co' in url: return None
        try:
            resp = requests.get(url, timeout=10)
            if resp.ok: return BytesIO(resp.content)
        except Exception as e:
            logger.warning(f"PDFService: Failed to fetch {url}: {e}")
        return None

    def _generate_qr(self, data: str):
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf

    def _on_page(self, canvas, doc, watermark_text=None):
        """Canvas-level drawing for every page (Watermarks and Page Numbers)."""
        canvas.saveState()
        
        # 1. Watermark (Diagonal, Transparent)
        if watermark_text:
            canvas.setFont('Courier-Bold', 40)
            canvas.setStrokeColor(colors.grey)
            canvas.setFillColor(colors.grey)
            canvas.setStrokeAlpha(0.1)
            canvas.setFillAlpha(0.1)
            canvas.translate(3*inch, 3*inch)
            canvas.rotate(45)
            canvas.drawCentredString(0, 0, watermark_text.upper())
            canvas.setStrokeAlpha(1.0) # Reset
            canvas.setFillAlpha(1.0)
            
        # 2. Page Number (Top Right, starting after title pages)
        # Note: Professional scripts put numbers top right
        if doc.page > 1:
            canvas.setFont('Courier', 12)
            canvas.drawRightString(7.75*inch, 10.5*inch, f"{doc.page - 1}.")
            
        canvas.restoreState()

    def compile_master_deck(self, project_data: Dict[str, Any], script_blocks: List[Dict[str, Any]] = None, include_sections: List[str] = None, recipient: str = None) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
        story = []

        # Default to all sections if none specified
        if not include_sections or 'all' in include_sections:
            include_sections = ['cover', 'story', 'cast', 'script']

        title = project_data.get('title', 'UNTITLED PROJECT').upper()
        logline = project_data.get('logline', 'No logline provided.')
        synopsis = project_data.get('synopsis') or project_data.get('bible_content', 'Synopsis in production.')
        poster_url = project_data.get('poster_url')
        teaser_url = project_data.get('teaser_url')
        characters = project_data.get('characters', [])
        
        # Registration Metadata (Robust Extraction)
        reg = project_data.get('registration') or {}
        author_name = str(reg.get('author_name') or project_data.get('author') or 'Unnamed Writer')
        contact_info = str(reg.get('contact_info') or '')
        wga_number = str(reg.get('wga_number') or '')
        
        # Safe year extraction
        try:
            current_year = str(datetime.now().year)
        except:
            current_year = "2026"
        copy_year = str(reg.get('copyright_year') or current_year)

        # --- PAGE 1: VISUAL SOUL COVER ---
        if 'cover' in include_sections:
            story.append(Spacer(1, 1*inch))
            story.append(Paragraph(title, self.styles['ArcTitle']))
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph(logline, self.styles['ArcLogline']))
            story.append(Spacer(1, 0.5*inch))

            if poster_url:
                p_img = self._fetch_image(poster_url)
                if p_img:
                    img = Image(p_img, width=4.5*inch, height=6*inch) # Normalized
                    img.hAlign = 'CENTER'
                    story.append(img)
            
            story.append(PageBreak())

        # --- INDUSTRY TITLE PAGE (Always before script if script included) ---
        if 'script' in include_sections:
            # WGA (Top Right)
            if wga_number:
                story.append(Paragraph(f"WGAw Reg: {wga_number}", self.styles['IndustryContact']))
            
            story.append(Spacer(1, 3.5*inch))
            story.append(Paragraph(f"<u>{title}</u>", self.styles['IndustryTitle']))
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph("Written by", self.styles['IndustryStandard']))
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph(author_name, self.styles['IndustryStandard']))
            
            story.append(Spacer(1, 4*inch))
            
            # Contact & Legal Footer
            footer_data = [
                [Paragraph(contact_info.replace('\n', '<br/>'), self.styles['IndustryContact']), 
                 Paragraph(f"&copy; {copy_year} {author_name}.<br/>All Rights Reserved.", self.styles['IndustryLegal'])]
            ]
            footer_table = Table(footer_data, colWidths=[4*inch, 3*inch])
            footer_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'BOTTOM')]))
            story.append(footer_table)
            
            story.append(PageBreak())

        # --- PAGE 2: THE STORY & TEASER ---
        if 'story' in include_sections:
            story.append(Paragraph("THE NARRATIVE CORE", self.styles['ArcSubHeading']))
            story.append(Paragraph("Synopsis", self.styles['ArcHeading']))
            
            # Clean Synopsis (remove markdown artifacts)
            clean_syn = synopsis.replace('## Synopsis', '').replace('##', '\n').strip()
            for para in clean_syn.split('\n\n'):
                story.append(Paragraph(para.strip(), self.styles['ArcBody']))
                story.append(Spacer(1, 0.15*inch))

            if teaser_url:
                story.append(Spacer(1, 0.5*inch))
                story.append(Paragraph("CINEMATIC TEASER", self.styles['ArcSubHeading']))
                qr_buf = self._generate_qr(teaser_url)
                qr_img = Image(qr_buf, width=1.5*inch, height=1.5*inch)
                qr_img.hAlign = 'LEFT'
                
                # Table for QR + Text
                qr_data = [[qr_img, Paragraph("<b>Scan to view the Motion Teaser.</b><br/>This cinematic 8-second render captures the atmosphere and visual vibe of the production.", self.styles['ArcBody'])]]
                qr_table = Table(qr_data, colWidths=[1.6*inch, 4*inch])
                qr_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
                story.append(qr_table)

            story.append(PageBreak())

        # --- PAGE 3: PERSONNEL ---
        if 'cast' in include_sections:
            story.append(Paragraph("PERSONNEL DOSSIERS", self.styles['ArcSubHeading']))
            story.append(Paragraph("Principal Cast", self.styles['ArcHeading']))
            story.append(Spacer(1, 0.2*inch))

            for char in characters:
                char_name = char.get('name', 'Unknown').upper()
                char_role = char.get('role', 'Supporting').upper()
                char_desc = char.get('description', 'No dossier available.')
                char_anchor = char.get('anchor_url')

                char_img_data = self._fetch_image(char_anchor) if char_anchor else None
                
                row_data = []
                if char_img_data:
                    c_img = Image(char_img_data, width=1.2*inch, height=1.2*inch)
                    row_data.append(c_img)
                else:
                    row_data.append("")

                desc_text = f"<b>{char_name}</b> ({char_role})<br/><br/>{char_desc}"
                row_data.append(Paragraph(desc_text, self.styles['ArcBody']))

                c_table = Table([row_data], colWidths=[1.4*inch, 5*inch])
                c_table.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 24)
                ]))
                story.append(c_table)

            story.append(PageBreak())

        # --- PAGE 4+: THE SCRIPT ---
        if 'script' in include_sections:
            story.append(Paragraph("PRODUCTION ASSET", self.styles['ArcSubHeading']))
            story.append(Paragraph("The Screenplay", self.styles['ArcHeading']))
            story.append(Spacer(1, 0.2*inch))

            if script_blocks:
                for block in script_blocks:
                    b_type = block.get('type', 'action').lower()
                    text = block.get('text', '').strip()
                    
                    style_map = {
                        'slugline': 'ScriptSlug',
                        'scene heading': 'ScriptSlug',
                        'action': 'ScriptAction',
                        'character': 'ScriptChar',
                        'dialogue': 'ScriptDialogue',
                        'parenthetical': 'ScriptParenthetical',
                        'act break': 'ScriptActBreak'
                    }
                    
                    para_style = self.styles.get(style_map.get(b_type, 'ScriptAction'))
                    if b_type == 'slugline' or b_type == 'act break': text = text.upper()
                    story.append(Paragraph(text, para_style))
            else:
                story.append(Paragraph("Full script asset currently in production.", self.styles['ArcBody']))

        # Cleanup: Ensure we don't have a trailing PageBreak that causes an empty page
        if story and isinstance(story[-1], PageBreak):
            story.pop()

        # Build with Page Callback for Watermarks/Numbers
        doc.build(story, onLaterPages=lambda c, d: self._on_page(c, d, watermark_text=recipient), 
                  onFirstPage=lambda c, d: self._on_page(c, d, watermark_text=recipient))
        
        buffer.seek(0)
        return buffer
