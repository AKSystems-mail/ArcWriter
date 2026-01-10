import sys
import os
# Add the parent directory to sys.path to allow importing 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.bible_manager import BibleManager

# Create a dummy project bible file for testing get_context_string
bm = BibleManager('test_project')
bm.initialize_bible('save_the_cat')
bm.update_section('## Title', 'The Test Project')
bm.update_section('## Genre', 'Sci-Fi')
bm.update_section('## Beat Sheet (Save the Cat)', '1. Beat 1: Start\n2. Beat 2: Middle\n3. Beat 3: End')

print(f"Dummy bible created at {bm.file_path}")

