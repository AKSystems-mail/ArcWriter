from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
import io
import re
import os

router = APIRouter(
    prefix="/api/manual",
    tags=["manual"]
)

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont('Courier', 10)
    page_number_text = "%d." % (doc.page)
    canvas.drawRightString(letter[0] - 1.0 * inch, letter[1] - 0.5 * inch, page_number_text)
    canvas.restoreState()

@router.get("/download")
async def download_manual():
    """
    Generates and downloads 'The Screenwriter's Guide to ArcWriter' in professional screenplay format.
    Handles the new clean indentation-based format.
    """
    try:
        # Resolve path relative to the backend directory
        file_path = "Screenwriter_Guide.md"
        if not os.path.exists(file_path):
            file_path = os.path.join(os.path.dirname(__file__), "..", "..", "Screenwriter_Guide.md")

        with open(file_path, "r") as f:
            markdown_content = f.read()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter, 
            topMargin=1.0*inch, 
            bottomMargin=1.0*inch, 
            leftMargin=1.5*inch, 
            rightMargin=1.0*inch
        )
        
        styles = getSampleStyleSheet()
        
        # --- Screenplay Style Definitions ---
        styles.add(ParagraphStyle(
            name='ScriptSlug', 
            fontSize=12, 
            leading=14, 
            fontName='Courier-Bold', 
            spaceBefore=12, 
            spaceAfter=12,
            textTransform='uppercase'
        ))
        
        styles.add(ParagraphStyle(
            name='ScriptAction', 
            fontSize=12, 
            leading=14, 
            fontName='Courier', 
            spaceAfter=12
        ))
        
        styles.add(ParagraphStyle(
            name='ScriptChar', 
            fontSize=12, 
            leading=14, 
            fontName='Courier', 
            leftIndent=2.0*inch, 
            spaceBefore=12,
            spaceAfter=0,
            textTransform='uppercase'
        ))
        
        styles.add(ParagraphStyle(
            name='ScriptDialogue', 
            fontSize=12, 
            leading=14, 
            fontName='Courier', 
            leftIndent=1.0*inch, 
            rightIndent=1.5*inch, 
            spaceAfter=6
        ))
        
        styles.add(ParagraphStyle(
            name='ScriptParenthetical', 
            fontSize=12, 
            leading=14, 
            fontName='Courier', 
            leftIndent=1.5*inch, 
            rightIndent=2.0*inch,
            spaceAfter=0
        ))

        styles.add(ParagraphStyle(
            name='ScriptTitle', 
            fontSize=24, 
            leading=28, 
            alignment=TA_CENTER, 
            fontName='Courier-Bold', 
            spaceBefore=150
        ))
        
        styles.add(ParagraphStyle(
            name='ScriptCenterInfo', 
            fontSize=12, 
            leading=14, 
            alignment=TA_CENTER, 
            fontName='Courier', 
            spaceAfter=12
        ))

        story_elements = []
        lines = markdown_content.split('\n')
        
        # Simple cover page detection
        if len(lines) > 0 and not lines[0].strip().startswith('INT.') and not lines[0].strip().startswith('EXT.'):
            # Process title page lines
            title_lines_done = 0
            for i, line in enumerate(lines):
                if 'FADE IN:' in line:
                    title_lines_done = i
                    break
                if line.strip():
                    if i == 0:
                        story_elements.append(Paragraph(line.strip(), styles['ScriptTitle']))
                    else:
                        story_elements.append(Paragraph(line.strip(), styles['ScriptCenterInfo']))
            
            if story_elements:
                story_elements.append(PageBreak())
                lines = lines[title_lines_done:]

        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue

            # Calculate indentation (count leading spaces)
            indent = len(line) - len(line.lstrip())

            # 1. Transitions / Character Names (High Indent)
            if indent >= 15:
                # Could be Transition (right-aligned in MD usually means high indent or specific name)
                if stripped in ['FADE IN:', 'FADE OUT.', 'CUT TO:', 'BACK TO:', 'FADE TO BLACK.', 'THE END']:
                    story_elements.append(Paragraph(stripped, styles['ScriptSlug']))
                else:
                    # Likely a Character Name
                    story_elements.append(Paragraph(stripped, styles['ScriptChar']))
            
            # 2. Parentheticals (Moderate Indent + Parens)
            elif indent >= 8 and stripped.startswith('(') and stripped.endswith(')'):
                story_elements.append(Paragraph(stripped, styles['ScriptParenthetical']))
            
            # 3. Dialogue (Moderate Indent)
            elif indent >= 8:
                story_elements.append(Paragraph(stripped, styles['ScriptDialogue']))
            
            # 4. Sluglines (Zero Indent + Keyword)
            elif stripped.upper().startswith('INT.') or stripped.upper().startswith('EXT.'):
                story_elements.append(Paragraph(stripped.upper(), styles['ScriptSlug']))
            
            # 5. Action (Zero/Low Indent)
            else:
                story_elements.append(Paragraph(stripped, styles['ScriptAction']))

        # Build the PDF
        doc.build(story_elements, onLaterPages=add_page_number)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=\"ArcWriter_Screenwriters_Guide.pdf\""}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
