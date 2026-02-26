from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import uuid
import io
from datetime import datetime
from app.utils.firebase_auth_utils import get_firestore_db
from app.services.script_parser import parse_pdf_to_editor_format

router = APIRouter(prefix="/api/public", tags=["public"])

class LeadRequest(BaseModel):
    email: EmailStr
    analysis_id: str
    project_title: Optional[str] = "Your Project"

@router.post("/analyze")
async def public_analyze(
    raw_input: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Public endpoint to generate a teaser beat sheet from text or PDF."""
    from main import services
    
    text_to_analyze = ""
    
    if file:
        try:
            content = await file.read()
            # parse_pdf_to_editor_format returns (blocks, full_text, page_count)
            _, full_text, _ = parse_pdf_to_editor_format(io.BytesIO(content))
            text_to_analyze = full_text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        text_to_analyze = raw_input

    if not text_to_analyze or len(text_to_analyze) < 50:
        raise HTTPException(status_code=400, detail="Please provide more detail or a valid script for analysis.")

    try:
        result = services.logic_engine.public_structural_analysis(text_to_analyze)
        
        # Save the full analysis temporarily in Firestore to be claimed by email
        db = get_firestore_db()
        analysis_id = str(uuid.uuid4())
        
        db.collection("temporary_analyses").document(analysis_id).set({
            "full_analysis": result["full_analysis"],
            "created_at": datetime.utcnow(),
            "claimed": False
        })
        
        print(f"DEBUG: Returning teaser_beats: {result['teaser_beats']}")
        return {
            "analysis_id": analysis_id,
            "teaser_beats": result["teaser_beats"]
        }
    except Exception as e:
        import logging
        logging.error(f"Public Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="The Logic Engine is currently processing other scripts. Please try again.")

@router.post("/capture_lead")
async def capture_lead(request: LeadRequest):
    """Saves email and triggers the full beat sheet delivery."""
    db = get_firestore_db()
    
    try:
        # 1. Retrieve the temporary analysis
        analysis_ref = db.collection("temporary_analyses").document(request.analysis_id)
        analysis_doc = analysis_ref.get()
        
        if not analysis_doc.exists:
            raise HTTPException(status_code=404, detail="Analysis expired or not found.")
            
        analysis_data = analysis_doc.to_dict()
        full_analysis = analysis_data["full_analysis"]
        
        # 2. Save to 'leads' collection for marketing
        db.collection("leads").add({
            "email": request.email,
            "project_title": full_analysis.get("title", request.project_title),
            "created_at": datetime.utcnow(),
            "source": "beat_sheet_builder"
        })
        
        # 3. Trigger Email via Firebase Extension (mail_queue)
        # Format the beat sheet for HTML
        beat_html = "<ul>"
        beats = full_analysis.get("beat_sheet", {})
        for name, content in beats.items():
            beat_html += f"<li><strong>{name}:</strong> {content}</li>"
        beat_html += "</ul>"

        db.collection("mail_queue").add({
            "to": request.email,
            "message": {
                "subject": f"Your 15-Point Beat Sheet: {full_analysis.get('title', 'Untitled Project')}",
                "html": f"""
                    <h1>Arc Studio: Structural Analysis Complete</h1>
                    <p>Here is your professional 15-point structural breakdown based on your notes.</p>
                    <hr/>
                    <h3>{full_analysis.get('title', 'Project Concept')}</h3>
                    <p><strong>Logline:</strong> {full_analysis.get('logline')}</p>
                    {beat_html}
                    <hr/>
                    <p>Ready to see your movie? <a href="https://arc-studio-box.web.app/login">Join the Writer's Room</a> to generate cinematic posters and motion teasers.</p>
                """
            }
        })
        
        # Mark as claimed
        analysis_ref.update({"claimed": True})
        
        return {"status": "success", "message": "Check your inbox for the full breakdown!"}
        
    except Exception as e:
        import logging
        logging.error(f"Lead Capture Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to deliver analysis. Please try again.")
