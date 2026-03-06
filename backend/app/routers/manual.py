from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import io
import re
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/manual",
    tags=["manual"]
)

# Global cache for the PDF bytes to eliminate generation latency
_cached_pdf_bytes = None
_last_md_mtime = 0

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont('Courier', 10)
    page_number_text = "%d." % (doc.page)
    canvas.drawRightString(letter[0] - 1.0 * inch, letter[1] - 0.5 * inch, page_number_text)
    canvas.restoreState()

def get_manual_path():
    file_path = "Screenwriter_Guide.md"
    if not os.path.exists(file_path):
        file_path = os.path.join(os.path.dirname(__file__), "..", "..", "Screenwriter_Guide.md")
    return file_path

@router.get("/download")
async def download_manual():
    """
    Generates and downloads 'The Screenwriter's Guide' in professional screenplay format.
    Uses in-memory caching to eliminate generation latency for the user.
    """
    global _cached_pdf_bytes, _last_md_mtime
    file_path = get_manual_path()
    try:
        mtime = os.path.getmtime(file_path)
        if _cached_pdf_bytes and mtime <= _last_md_mtime:
            return StreamingResponse(io.BytesIO(_cached_pdf_bytes), media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=\"ArcWriter_Screenwriters_Guide.pdf\""})

        with open(file_path, "r") as f:
            markdown_content = f.read()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch, leftMargin=1.5*inch, rightMargin=1*inch)
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='ScriptSlug', fontSize=12, leading=14, fontName='Courier-Bold', spaceBefore=12, spaceAfter=12, textTransform='uppercase'))
        styles.add(ParagraphStyle(name='ScriptAction', fontSize=12, leading=14, fontName='Courier', spaceAfter=12))
        styles.add(ParagraphStyle(name='ScriptChar', fontSize=12, leading=14, fontName='Courier', leftIndent=2.0*inch, spaceBefore=12, spaceAfter=0, textTransform='uppercase'))
        styles.add(ParagraphStyle(name='ScriptDialogue', fontSize=12, leading=14, fontName='Courier', leftIndent=1.0*inch, rightIndent=1.5*inch, spaceAfter=6))
        styles.add(ParagraphStyle(name='ScriptParenthetical', fontSize=12, leading=14, fontName='Courier', leftIndent=1.5*inch, rightIndent=2.0*inch, spaceAfter=0))
        styles.add(ParagraphStyle(name='ScriptTitle', fontSize=24, leading=28, alignment=TA_CENTER, fontName='Courier-Bold', spaceBefore=150))
        styles.add(ParagraphStyle(name='ScriptCenterInfo', fontSize=12, leading=14, alignment=TA_CENTER, fontName='Courier', spaceAfter=12))

        story_elements = []
        lines = markdown_content.split('\n')
        first_content_line = 0
        for i, line in enumerate(lines):
            if 'FADE IN:' in line:
                first_content_line = i
                break
            if line.strip():
                if i == 0: story_elements.append(Paragraph(line.strip(), styles['ScriptTitle']))
                else: story_elements.append(Paragraph(line.strip(), styles['ScriptCenterInfo']))
        
        if story_elements:
            story_elements.append(PageBreak())
            lines = lines[first_content_line:]

        for line in lines:
            stripped = line.strip()
            if not stripped: continue
            indent = len(line) - len(line.lstrip())
            if indent >= 15:
                if stripped in ['FADE IN:', 'FADE OUT.', 'CUT TO:', 'BACK TO:', 'FADE TO BLACK.', 'THE END']:
                    story_elements.append(Paragraph(stripped, styles['ScriptSlug']))
                else: story_elements.append(Paragraph(stripped, styles['ScriptChar']))
            elif indent >= 8 and stripped.startswith('(') and stripped.endswith(')'):
                story_elements.append(Paragraph(stripped, styles['ScriptParenthetical']))
            elif indent >= 8: story_elements.append(Paragraph(stripped, styles['ScriptDialogue']))
            elif stripped.upper().startswith('INT.') or stripped.upper().startswith('EXT.'):
                story_elements.append(Paragraph(stripped.upper(), styles['ScriptSlug']))
            else: story_elements.append(Paragraph(stripped, styles['ScriptAction']))

        doc.build(story_elements, onLaterPages=add_page_number)
        pdf_bytes = buffer.getvalue()
        _cached_pdf_bytes = pdf_bytes
        _last_md_mtime = mtime
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=\"ArcWriter_Screenwriters_Guide.pdf\""})
    except Exception as e:
        logger.error(f"Manual download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/section/{section_id}")
async def get_manual_section(section_id: str):
    """
    Returns a specific screenplay scene as JSON.
    """
    file_path = get_manual_path()
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        search_key = section_id.upper()
        mapping = {
            "LANDING": "LANDING PAGE",
            "WIZARD": "WIZARD",
            "STORY_DNA": "STORY DNA LAB",
            "BLUEPRINT_VERIFICATION": "BLUEPRINT VERIFICATION",
            "VISUAL_SOUL": "VISUAL SOUL",
            "DIAGNOSTIC_LENS": "DIAGNOSTIC LENS",
            "DASHBOARD": "DASHBOARD",
            "BLUEPRINT": "BLUEPRINT PAGE",
            "BLUEPRINT_PAGE": "BLUEPRINT PAGE",
            "SCRIPT_EDITOR": "SCRIPT EDITOR",
            "EDITOR": "SCRIPT EDITOR",
            "BEAT_SHEET": "BLUEPRINT PAGE"
        }
        search_key = mapping.get(search_key, search_key)
        
        logger.info(f"ManualSection: Searching for '{search_key}' in {len(lines)} lines.")

        start_line_idx = -1
        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped: continue
            
            if stripped.startswith('INT.') or stripped.startswith('EXT.'):
                # IMPROVED: Check for partial match or exact match to be more robust
                # e.g. "SCRIPT EDITOR" will match "INT. THE SCRIPT EDITOR - NIGHT"
                if search_key in stripped.upper():
                    start_line_idx = i
                    logger.info(f"ManualSection: Found match at line {i}: {stripped}")
                    break
        
        if start_line_idx == -1:
            raise HTTPException(status_code=404, detail=f"Help section '{section_id}' not found.")

        # Collect until next slugline or transition
        scene_lines = [lines[start_line_idx]]
        for i in range(start_line_idx + 1, len(lines)):
            line = lines[i]
            stripped = line.strip()
            if not stripped: continue
            if stripped.startswith('INT.') or stripped.startswith('EXT.') or stripped in ['FADE OUT.', 'CUT TO:', 'FADE TO BLACK.', 'FADE IN:']:
                break
            scene_lines.append(line)

        # Parse collected lines
        result = {
            "slugline": scene_lines[0].strip(),
            "action": "",
            "character": "ARCWRITER",
            "parenthetical": "",
            "dialogue": ""
        }
        
        action_parts = []
        dialogue_parts = []
        
        for line in scene_lines[1:]:
            indent = len(line) - len(line.lstrip())
            stripped = line.strip()
            if indent >= 15:
                result["character"] = stripped
            elif indent >= 8 and stripped.startswith('(') and stripped.endswith(')'):
                result["parenthetical"] = stripped.strip('()')
            elif indent >= 8:
                dialogue_parts.append(stripped)
            else:
                action_parts.append(stripped)
        
        result["action"] = " ".join(action_parts)
        result["dialogue"] = " ".join(dialogue_parts)
        return result

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        logger.error(f"Failed to fetch help section {section_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
