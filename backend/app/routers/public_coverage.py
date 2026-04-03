from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import uuid
import io
import os
import hashlib
from datetime import datetime, timedelta
from app.utils.firebase_auth_utils import get_firestore_db
from app.services.script_parser import parse_pdf_to_editor_format
from firebase_admin import firestore

router = APIRouter(prefix="/api/public/coverage", tags=["coverage"])

class CoverageLeadRequest(BaseModel):
    email: EmailStr
    script_title: str
    analysis_id: str

def get_ip_hash(request: Request):
    """Simple IP hashing for privacy-compliant rate limiting."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0]
    else:
        ip = request.client.host
    return hashlib.sha256(ip.encode()).hexdigest()

async def check_rate_limit(request: Request):
    """
    Enforces the '1-Per-Week' and '3-Strike' lifetime policy.
    Also checks the Global Daily Budget Cap.
    """
    db = get_firestore_db()
    ip_hash = get_ip_hash(request)
    
    # 1. Check Global Daily Cap (Safety Valve)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    global_ref = db.collection("campaign_stats").document("daily_coverage")
    global_doc = global_ref.get()
    
    if global_doc.exists:
        stats = global_doc.to_dict()
        if stats.get("date") == today_str and stats.get("count", 0) >= 20:
            raise HTTPException(status_code=429, detail="The Art Dept is currently at capacity for today. Please check back tomorrow or join the Writer's Room.")
    
    # 2. Check Individual IP Limit
    limit_ref = db.collection("rate_limits").document(ip_hash)
    limit_doc = limit_ref.get()
    
    if limit_doc.exists:
        data = limit_doc.to_dict()
        
        # Lifetime Cap (3 Strikes)
        if data.get("total_count", 0) >= 3:
            raise HTTPException(status_code=403, detail="You've reached the lifetime limit for free coverage. Please upgrade to a paid tier for unlimited audits.")
            
        # Weekly Frequency Limit
        last_run = data.get("last_run")
        if last_run:
            # Firestore timestamp to datetime
            if datetime.utcnow() < last_run.replace(tzinfo=None) + timedelta(days=7):
                raise HTTPException(status_code=429, detail="Your free launch credit is valid for 1 report per week. Please try again later or join the Writer's Room.")

    return ip_hash

@router.post("/generate")
async def generate_public_coverage(
    request: Request,
    file: UploadFile = File(...)
):
    """Handles the public script upload and AI coverage generation."""
    from main import lazy_initialize, services
    lazy_initialize()
    
    # 1. SECURITY: Enforce Rate Limits
    ip_hash = await check_rate_limit(request)
    
    # 2. Process File
    try:
        content = await file.read()
        _, full_text, _ = parse_pdf_to_editor_format(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse script: {str(e)}")

    if not full_text or len(full_text) < 1000:
        raise HTTPException(status_code=400, detail="Script too short. Please provide a full screenplay or a substantial excerpt.")

    # 3. AI Generation
    try:
        report = services.logic_engine.generate_professional_coverage(full_text)
        
        # 4. Save Temporary Results
        db = get_firestore_db()
        analysis_id = str(uuid.uuid4())
        
        db.collection("temporary_coverage").document(analysis_id).set({
            "report": report,
            "ip_hash": ip_hash,
            "created_at": datetime.utcnow(),
            "full_text_preview": full_text[:5000],
            "claimed": False
        })
        
        return {
            "analysis_id": analysis_id,
            "verdict": report.get("verdict"),
            "scores": report.get("scores")
        }
        
    except Exception as e:
        print(f"Coverage Error: {e}")
        raise HTTPException(status_code=500, detail="The Master Executive is currently in a meeting. Please try again in a few minutes.")

@router.post("/claim")
async def claim_coverage(request: CoverageLeadRequest):
    """Captures lead info, updates limits, and sends the PDF report."""
    from main import services
    db = get_firestore_db()
    
    try:
        # 1. Verify Analysis
        ref = db.collection("temporary_coverage").document(request.analysis_id)
        doc = ref.get()
        if not doc.exists or doc.to_dict().get("claimed"):
            raise HTTPException(status_code=404, detail="Report not found or already claimed.")
            
        data = doc.to_dict()
        report = data["report"]
        ip_hash = data["ip_hash"]
        
        # 2. Update Rate Limits (Commit the strike)
        limit_ref = db.collection("rate_limits").document(ip_hash)
        limit_ref.set({
            "last_run": datetime.utcnow(),
            "total_count": firestore.Increment(1)
        }, merge=True)
        
        # 3. Update Global Stats
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        global_ref = db.collection("campaign_stats").document("daily_coverage")
        global_ref.set({
            "date": today_str,
            "count": firestore.Increment(1)
        }, merge=True)
        
        # 4. Save Lead
        db.collection("leads").add({
            "email": request.email,
            "script_title": request.script_title,
            "source": "public_coverage_lead",
            "created_at": datetime.utcnow()
        })
        
        # 5. GENERATE PDF
        pdf_buf = services.pdf_service.generate_coverage_report(report, request.script_title)
        
        # 6. Upload to Storage
        from app.utils.firebase_auth_utils import get_storage_bucket
        bucket = get_storage_bucket()
        report_filename = f"coverage_reports/{request.analysis_id}_{uuid.uuid4().hex[:8]}.pdf"
        blob = bucket.blob(report_filename)
        blob.upload_from_string(pdf_buf.getvalue(), content_type='application/pdf')
        blob.make_public()
        report_url = blob.public_url
        
        # 7. Queue Email with Results and Download Link
        email_content = f"""
        STUDIO COVERAGE: {request.script_title}
        VERDICT: {report.get('verdict')}
        
        A formal Studio Coverage Report has been generated for your script. 
        You can download the full PDF analysis here:
        {report_url}
        
        EXECUTIVE SUMMARY:
        {report.get('executive_summary')}
        
        Ready to fix the structural issues identified?
        Import this script into the ArcWriter Studio: https://arcwriter.us/login
        """
        
        db.collection("mail_queue").add({
            "to": request.email,
            "message": {
                "subject": f"STUDIO COVERAGE: {request.script_title}",
                "html": f"""
                    <div style="font-family: 'Courier New', Courier, monospace; background: #f4f4f4; padding: 40px; color: #111;">
                        <div style="background: white; padding: 40px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
                            <h2 style="border-bottom: 2px solid #111; padding-bottom: 10px; text-transform: uppercase;">Official Studio Coverage</h2>
                            <p><strong>TITLE:</strong> {request.script_title}</p>
                            <p><strong>VERDICT:</strong> <span style="color: {'green' if report.get('verdict') == 'RECOMMEND' else 'orange' if report.get('verdict') == 'CONSIDER' else 'red'}; font-weight: bold;">{report.get('verdict')}</span></p>
                            
                            <div style="background: #00cec9; color: white; padding: 20px; text-align: center; margin: 30px 0;">
                                <a href="{report_url}" style="color: white; text-decoration: none; font-weight: bold; font-size: 18px;">DOWNLOAD FULL PDF REPORT</a>
                            </div>
                            
                            <h3 style="text-transform: uppercase; font-size: 14px; border-bottom: 1px solid #eee;">Executive Summary</h3>
                            <p style="font-size: 13px; line-height: 1.6;">{report.get('executive_summary')}</p>
                            
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #111; font-size: 11px; color: #666; text-align: center;">
                                ARCHITECTED BY ARCWRITER AI STUDIO
                            </div>
                        </div>
                    </div>
                """
            },
            "status": "pending",
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        ref.update({"claimed": True})
        return {"status": "success", "message": "Report transmitted to your inbox."}
        
    except Exception as e:
        print(f"Claim Error: {e}")
        raise HTTPException(status_code=500, detail="Transmission failed.")
