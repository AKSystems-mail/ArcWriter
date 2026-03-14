import unittest
from unittest.mock import MagicMock, patch
import os

# Set dummy env var for initialization
os.environ["GEMINI_API_KEY"] = "test-key"

from app.services.asset_studio import AssetStudio

class TestAssetStudio(unittest.TestCase):
    def setUp(self):
        self.studio = AssetStudio()
        # Mock the client
        self.studio.client = MagicMock()

    def test_generate_teaser_returns_string_when_operation_is_object(self):
        # Mock operation object with .name attribute
        mock_operation = MagicMock()
        mock_operation.name = "projects/test/locations/test/operations/123"
        self.studio.client.models.generate_videos.return_value = mock_operation
        
        operation_id = self.studio.generate_teaser("test prompt")
        
        # This will fail if it returns the mock_operation object instead of a string
        self.assertIsInstance(operation_id, str)
        self.assertEqual(operation_id, "projects/test/locations/test/operations/123")

    def test_generate_teaser_returns_string_when_operation_is_string(self):
        # Mock operation returning a string directly
        self.studio.client.models.generate_videos.return_value = "projects/test/locations/test/operations/456"
        
        operation_id = self.studio.generate_teaser("test prompt")
        
        self.assertIsInstance(operation_id, str)
        self.assertEqual(operation_id, "projects/test/locations/test/operations/456")

    def test_generate_teaser_returns_none_on_failure(self):
        self.studio.client.models.generate_videos.side_effect = Exception("API Error")
        
        result = self.studio.generate_teaser("test prompt")
        
        self.assertIsNone(result)

    def test_generate_poster_calls_imagen_with_correct_config(self):
        mock_response = MagicMock()
        mock_image = MagicMock()
        mock_image.image.image_bytes = b"test-image-data"
        mock_response.generated_images = [mock_image]
        self.studio.client.models.generate_images.return_value = mock_response
        
        result = self.studio.generate_poster("Test Title", "Sci-Fi", "Cinematic")
        
        # Verify generate_images call
        args, kwargs = self.studio.client.models.generate_images.call_args
        self.assertEqual(kwargs['model'], 'imagen-4.0-generate-001')
        self.assertIn("Test Title", kwargs['prompt'])
        config = kwargs['config']
        self.assertEqual(config.aspect_ratio, '3:4')
        self.assertIsNotNone(result)

    def test_generate_character_anchor_calls_imagen_with_correct_config(self):
        mock_response = MagicMock()
        mock_image = MagicMock()
        mock_image.image.image_bytes = b"test-image-data"
        mock_response.generated_images = [mock_image]
        self.studio.client.models.generate_images.return_value = mock_response
        
        result = self.studio.generate_character_anchor("A mysterious hero")
        
        # Verify generate_images call
        args, kwargs = self.studio.client.models.generate_images.call_args
        self.assertEqual(kwargs['model'], 'imagen-4.0-generate-001')
        self.assertIn("A mysterious hero", kwargs['prompt'])
        config = kwargs['config']
        self.assertEqual(config.aspect_ratio, '1:1')
        self.assertGreater(len(result), 0)

    def test_get_operation_status_retrieves_video_uri(self):
        operation_id = "test-op-123"
        mock_operation = MagicMock()
        mock_operation.done = True
        mock_operation.error = None
        
        # Mock response object
        mock_response = MagicMock()
        mock_video = MagicMock()
        mock_video.video.uri = "https://example.com/video.mp4"
        mock_response.generated_videos = [mock_video]
        mock_operation.response = mock_response
        
        self.studio.client.operations.get.return_value = mock_operation
        
        status = self.studio.get_operation_status(operation_id)
        
        # Verify the call used a GenerateVideosOperation with the correct name
        args, kwargs = self.studio.client.operations.get.call_args
        passed_op = args[0]
        from google.genai import types
        self.assertIsInstance(passed_op, types.GenerateVideosOperation)
        self.assertEqual(passed_op.name, operation_id)
        self.assertTrue(status['done'])
        self.assertEqual(status['video_uri'], "https://example.com/video.mp4")

if __name__ == "__main__":
    unittest.main()
