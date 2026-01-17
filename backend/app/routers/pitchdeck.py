from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.utils.firebase_auth_utils import get_current_user, get_firestore_db
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
import io

router = APIRouter(
    prefix="/api/pitchdeck",
    tags=["pitchdeck"]
)

@router.get("/download/{universe_id}/{project_id}")
async def download_pitch_deck(
    universe_id: str, 
    project_id: str, 
    user_id: str = Depends(get_current_user)
):
    """
    Generates and downloads a PDF pitch deck for a project.
    """
    try:
        db = get_firestore_db()
        project_ref = db.collection('universes').document(universe_id).collection('projects').document(project_id)
        project_doc = project_ref.get()

        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")

        project_data = project_doc.to_dict()
        
        # Security check: Ensure the user owns the project (or is an editor)
        if project_data.get('owner_id') != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to access this project")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=LETTER)
        styles = getSampleStyleSheet()
        story = []

        # --- Page 1: Title & Metadata ---
        title = project_data.get('title', 'Untitled Project')
        genre = project_data.get('genre', 'N/A')
        logline = project_data.get('logline', 'N/A')
        vibe = project_data.get('vibe', 'N/A')

        title_style = styles['Title']
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 48))

        metadata_style = styles['Normal']
        story.append(Paragraph(f"<b>Genre:</b> {genre}", metadata_style))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"<b>Vibe:</b> {vibe}", metadata_style))
        story.append(Spacer(1, 24))
        
        logline_style = styles['Italic']
        story.append(Paragraph(f"<b>Logline:</b>", metadata_style))
        story.append(Paragraph(logline, logline_style))
        
        story.append(PageBreak())

        # --- Page 2: Synopsis (Project Bible) ---
        bible_content = project_data.get('bible_content', 'No synopsis available.')
        story.append(Paragraph("Project Synopsis", styles['Heading1']))
        story.append(Spacer(1, 12))
        
        # Replace newlines with Paragraph-compatible breaks or handle basic markdown
        # For a simple implementation, we'll split by double newlines
        for chunk in bible_content.split('\n\n'):
            clean_chunk = chunk.replace('\n', '<br/>')
            story.append(Paragraph(clean_chunk, styles['Normal']))
            story.append(Spacer(1, 12))

        story.append(PageBreak())

        # --- Page 3: Script Content (Mock/Future) ---
        story.append(Paragraph("Script Excerpt", styles['Heading1']))
        story.append(Spacer(1, 12))
        script_content = project_data.get('script_content', 'Script content not yet available.')
        story.append(Paragraph(script_content, styles['Code'] if 'Code' in styles else styles['Normal']))

        # Build PDF
        doc.build(story)
        buffer.seek(0)

        filename = f"{title.replace(' ', '_')}_PitchDeck.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
