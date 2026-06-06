from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import uuid
import io
import os
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
        
        # Firestore synchronous calls (No await needed for this client)
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
        project_title = full_analysis.get("title", request.project_title)
        db.collection("leads").add({
            "email": request.email,
            "project_title": project_title,
            "created_at": datetime.utcnow(),
            "source": "beat_sheet_builder"
        })

        # 3. Add to Brevo Contact List for Automation
        brevo_key = (os.getenv("BREVO_API_KEY") or "").strip()
        list_id = (os.getenv("BREVO_LIST_ID") or "").strip()
        
        if brevo_key and list_id:
            try:
                import sib_api_v3_sdk
                from sib_api_v3_sdk.rest import ApiException
                configuration = sib_api_v3_sdk.Configuration()
                configuration.api_key['api-key'] = brevo_key
                api_instance = sib_api_v3_sdk.ContactsApi(sib_api_v3_sdk.ApiClient(configuration))
                
                # Update enabled=True means it won't fail if they already exist
                create_contact = sib_api_v3_sdk.CreateContact(
                    email=request.email,
                    list_ids=[int(list_id)],
                    update_enabled=True,
                    attributes={"PROJECT_TITLE": project_title}
                )
                api_instance.create_contact(create_contact)
                print(f"DEBUG: Added {request.email} to Brevo list {list_id}")
            except ApiException as e:
                print(f"Brevo API Error: {e}")
            except Exception as e:
                print(f"Unexpected Brevo sync error: {e}")
        
        # 4. Trigger Email via Firebase Extension (mail_queue)
        # Format the beat sheet for HTML
        # Use 15-point standard but add spacing
        beat_html = ""
        beats = full_analysis.get("beat_sheet", {})
        
        # Robust iteration for dict or list of objects
        if isinstance(beats, dict):
            for name, content in beats.items():
                label = name.replace('_', ' ').title()
                beat_html += f"<div style='margin-bottom: 20px;'><strong style='color: #00cec9; display: block; margin-bottom: 4px;'>{label}</strong><p style='margin: 0; font-style: italic; color: #444;'>{content}</p></div>"
        elif isinstance(beats, list):
            for i, b in enumerate(beats):
                if isinstance(b, dict):
                    # Look for name in common keys
                    name = b.get("beat") or b.get("name") or b.get("title") or b.get("beat_name") or b.get("type")
                    content = b.get("description") or b.get("content") or b.get("text")
                    
                    # If it's a simple key-value pair like {"Opening Image": "..."}
                    if not name and not content and len(b) == 1:
                        name, content = list(b.items())[0]
                    
                    # Fallback to index if still missing
                    final_label = name or f"Beat {i+1}"
                    final_content = content or ""
                    
                    beat_html += f"<div style='margin-bottom: 20px;'><strong style='color: #00cec9; display: block; margin-bottom: 4px;'>{final_label}</strong><p style='margin: 0; font-style: italic; color: #444;'>{final_content}</p></div>"
                else:
                    beat_html += f"<div style='margin-bottom: 20px; color: #444;'>{str(b)}</div>"

        # Public URL for the logo
        logo_url = "https://arc-studio-box.web.app/ArcWriter_logo_30.png"

        db.collection("mail_queue").add({
            "to": request.email,
            "message": {
                "subject": f"Your 15-Point Beat Sheet: {full_analysis.get('title', 'Untitled Project')}",
                "html": f"""
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; color: #111; line-height: 1.6;">
                        <div style="text-align: center; margin-bottom: 40px;">
                            <img src="{logo_url}" alt="ArcWriter" style="height: 30px; width: auto;" />
                        </div>
                        <h2 style="text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-bottom: 30px;">Structural Analysis Complete</h2>
                        <p>Here is your professional 15-point structural breakdown based on your notes.</p>
                        
                        <div style="background: #fdfdfd; padding: 30px; border-radius: 4px; border: 1px solid #eee; margin-bottom: 40px;">
                            <h3 style="margin-top: 0; color: #111; font-size: 24px; text-transform: uppercase; letter-spacing: -1px;">{full_analysis.get('title', 'Project Concept')}</h3>
                            <p style="font-weight: bold; color: #666; margin-bottom: 30px;">Logline: <span style="font-weight: normal; font-style: italic;">{full_analysis.get('logline')}</span></p>
                            
                            {beat_html}
                        </div>
                        
                        <div style="text-align: center; background: #050505; color: white; padding: 40px; border-radius: 4px;">
                            <h3 style="margin-top: 0; color: #00cec9; text-transform: uppercase; letter-spacing: 2px;">Ready to see your movie?</h3>
                            <p style="color: #888; font-size: 14px; margin-bottom: 25px;">Bring your characters to life and generate cinematic trailers using our full Studio suite.</p>
                            <a href="https://arc-studio-box.web.app/login" style="display: inline-block; background: white; color: black; padding: 15px 35px; text-decoration: none; border-radius: 2px; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Enter The Writer's Room</a>
                        </div>
                        
                        <p style="text-align: center; font-size: 10px; color: #999; margin-top: 40px; text-transform: uppercase; letter-spacing: 3px;">
                            Built by Arc Studio &copy; 2026
                        </p>
                    </div>
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
