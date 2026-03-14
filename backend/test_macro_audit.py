import os
import sys
import logging

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from app.services.logic_engine import LogicEngine

logging.basicConfig(level=logging.INFO)

def test_macro_audit():
    engine = LogicEngine()
    
    script_text = """
    INT. CAFE - DAY
    John sits alone, drinking coffee. He looks at his watch.
    
    JOHN
    Where is she?
    
    Mary enters, looking breathless.
    
    MARY
    I'm sorry I'm late.
    
    JOHN
    It doesn't matter now.
    """ * 20  # Make it long enough
    
    bible_context = "This is a story about John and Mary meeting at a cafe."
    
    print("Starting Macro Audit...")
    result = engine.audit_full_structure(script_text, bible_context)
    print("\nAudit Result:")
    print(result)

if __name__ == "__main__":
    test_macro_audit()
