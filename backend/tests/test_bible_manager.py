import unittest
import os
import shutil
from app.services.bible_manager import BibleManager

class TestBibleManager(unittest.TestCase):
    TEMP_DIR = "test_data"
    TEST_FILE = os.path.join(TEMP_DIR, "test_bible.md")

    def setUp(self):
        if not os.path.exists(self.TEMP_DIR):
            os.makedirs(self.TEMP_DIR)
        self.manager = BibleManager(self.TEST_FILE)

    def tearDown(self):
        if os.path.exists(self.TEMP_DIR):
            shutil.rmtree(self.TEMP_DIR)

    def test_initialize_bible(self):
        self.manager.initialize_bible("save_the_cat")
        self.assertTrue(os.path.exists(self.TEST_FILE))
        with open(self.TEST_FILE, "r") as f:
            content = f.read()
        self.assertIn("# Project Bible", content)
        self.assertIn("## Beat Sheet (Save the Cat)", content)

    def test_update_section(self):
        # Initialize first
        self.manager.initialize_bible("save_the_cat")
        
        # Update Characters section
        new_char_info = "- Hero: A brave warrior."
        self.manager.update_section("## Characters", new_char_info)
        
        with open(self.TEST_FILE, "r") as f:
            content = f.read()
            
        # Verify new content is present
        self.assertIn(new_char_info, content)
        
        # Verify old content is preserved (e.g. Logline header still there)
        self.assertIn("## Logline", content)
        self.assertIn("(Insert Logline)", content)
        
        # Verify subsequent sections are preserved
        self.assertIn("## Beat Sheet (Save the Cat)", content)
        
        # Update Logline (first section)
        new_logline = "A story about testing."
        self.manager.update_section("## Logline", new_logline)
        
        with open(self.TEST_FILE, "r") as f:
            content = f.read()
            
        self.assertIn(new_logline, content)
        # Check if Characters info is still there
        self.assertIn(new_char_info, content)

    def test_update_section_append(self):
        self.manager.initialize_bible("save_the_cat")
        new_section_header = "## Notes"
        new_content = "Some extra notes."
        self.manager.update_section(new_section_header, new_content)
        
        with open(self.TEST_FILE, "r") as f:
            content = f.read()
            
        self.assertIn(new_section_header, content)
        self.assertIn(new_content, content)

if __name__ == "__main__":
    unittest.main()
