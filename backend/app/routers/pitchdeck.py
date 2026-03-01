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
    sections: str = "all",
    user_id: str = Depends(get_current_user)
):
    """
    Generates and downloads a high-fidelity PDF pitch deck.
    :param sections: Comma-separated list of sections to include (cover,story,cast,script)
    """
    try:
        db = get_firestore_db()
        project_ref = db.collection('universes').document(universe_id).collection('projects').document(project_id)
        project_doc = project_ref.get()

        if not project_doc.exists:
            raise HTTPException(status_code=404, detail="Project not found")

        project_data = project_doc.to_dict()
        
        if project_data.get('owner_id') != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        # Fetch Script Blocks (Aligned with Editor path)
        script_ref = project_ref.collection("script").document("content")
        script_doc = script_ref.get()
        script_blocks = None
        if script_doc.exists:
            script_blocks = script_doc.to_dict().get("blocks")

        # Parse sections
        include_list = sections.split(',')

        # Use the upgraded PDF Service
        from main import services
        buffer = services.pdf_service.compile_master_deck(project_data, script_blocks, include_sections=include_list)

        filename = f"{project_data.get('title', 'Project').replace(' ', '_')}_PitchPackage.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
