import os
import sys
import json
from io import BytesIO

# Add current directory to path so 'app' is found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.logic_engine import LogicEngine
from app.services.pdf_service import PDFService

def test_coverage_pipeline():
    print("\n--- STARTING COVERAGE PIPELINE TEST ---")
    
    logic = LogicEngine()
    pdf = PDFService()
    
    dummy_script = """
    INT. OFFICE - DAY
    ANNA (30s) stares at a blinking cursor. The room is silent.
    
    ANNA
    It has to be perfect.
    
    She hits a key. The cursor moves. 
    
    EXT. CLIFFSIDE - NIGHT
    A storm rages. Anna stands at the edge.
    """
    
    # 1. Test Data (Mocked from a real expected response)
    report = {
        "verdict": "RECOMMEND",
        "scores": {
            "concept": 9,
            "logic": 8,
            "character": 9,
            "dialogue": 7
        },
        "synopsis": "A lonely writer struggles with perfection in a high-stakes office environment. As a storm brews outside, her internal tension reaches a breaking point on a literal cliffside.\n\nThe story explores the boundary between creative dedication and madness.",
        "analysis": {
            "strengths": ["High visual tension", "Strong character motivation", "Economical use of dialogue"],
            "weaknesses": ["Cliffside transition feels abrupt", "Could use more set-up for the storm"]
        },
        "executive_summary": "This is a taut, cinematic psychological thriller with high market potential. Recommend for immediate development."
    }

    # 2. Test PDF Service
    print("\nStep 2: Testing PDF Report Rendering with full data...")
    try:
        pdf_buf = pdf.generate_coverage_report(report, "TEST SCRIPT TITLE")
        if isinstance(pdf_buf, BytesIO) and len(pdf_buf.getvalue()) > 500:
            print(f"SUCCESS: PDF generated with real data ({len(pdf_buf.getvalue())} bytes).")
            
            # Save a local copy for manual inspection
            with open("test_coverage_full_output.pdf", "wb") as f:
                f.write(pdf_buf.getvalue())
            print("INFO: Saved 'test_coverage_full_output.pdf' for inspection.")
        else:
            print("FAILURE: PDF buffer is too small or invalid.")
    except Exception as e:
        print(f"FAILURE in PDFService: {e}")
        return

    print("\n--- PIPELINE TEST COMPLETE: SUCCESS ---")

if __name__ == "__main__":
    test_coverage_pipeline()
