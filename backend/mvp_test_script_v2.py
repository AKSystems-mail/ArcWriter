import requests
import os
import time

BASE_URL = "http://localhost:5000"
BIBLE_PATH = "project_bible_operation_blackout.md"

def run_mvp_flow():
    print("[1] Opening App (Checking Backend Health)...")
    try:
        resp = requests.get(f"{BASE_URL}/")
        if resp.status_code == 200:
             print(f"Status: {resp.status_code} - {resp.json().get('message', 'No message key')}")
        else:
             print(f"Status: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    print("\n[2] Selecting 'Architect Mode' (Frontend State Simulation)...")
    print("User preference 'arc_mode' = 'architect' saved locally.")

    print("\n[3] Creating Project 'Operation Blackout'...")
    
    from app.services.bible_manager import BibleManager
    
    if os.path.exists(BIBLE_PATH):
        os.remove(BIBLE_PATH)
        
    print(f"Initializing Bible at: {BIBLE_PATH}")
    manager = BibleManager(BIBLE_PATH)
    content = manager.initialize_bible("save_the_cat")
    
    print("\n[4] Verifying 'project_bible.md' creation...")
    if os.path.exists(BIBLE_PATH):
        print(f"SUCCESS: File '{BIBLE_PATH}' exists.")
        
        with open(BIBLE_PATH, "r") as f:
            file_content = f.read()
            
        if "# Project Bible" in file_content and "## Beat Sheet (Save the Cat)" in file_content:
             print("SUCCESS: Content matches 'Architect' (Save the Cat) template.")
        else:
             print("FAILURE: Content verification failed.")
    else:
        print("FAILURE: File was not created.")

if __name__ == "__main__":
    run_mvp_flow()
