"""
Storage Service for PocketSmart AI
Supports uploading images to Google Cloud Storage / Firebase Storage in production,
with fallback to local disk storage for local development.
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    """
    Unified file and image storage handling.
    In Production (Cloud Run): uploads to Firebase / Google Cloud Storage bucket.
    In Local: stores files in app/static/uploads/
    """

    def __init__(self):
        self.bucket_name = os.getenv("STORAGE_BUCKET", "pocketsmartai-app.appspot.com")
        self._bucket = None

    @property
    def bucket(self):
        if self._bucket is None:
            try:
                from google.cloud import storage
                client = storage.Client()
                self._bucket = client.bucket(self.bucket_name)
            except Exception as e:
                logger.warning(f"Could not connect to Cloud Storage bucket {self.bucket_name}: {e}")
                self._bucket = None
        return self._bucket

    def save_image(self, file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> Tuple[str, str]:
        """
        Saves uploaded image.
        Returns a tuple: (public_or_relative_url, local_or_storage_path)
        """
        ext = Path(filename).suffix.lower() or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"

        # If Cloud Storage is available and in production:
        if settings.APP_ENV == "production" and self.bucket is not None:
            try:
                blob = self.bucket.blob(f"uploads/{unique_name}")
                blob.upload_from_string(file_bytes, content_type=content_type)
                blob.make_public()
                public_url = blob.public_url
                return public_url, public_url
            except Exception as e:
                logger.error(f"Failed to upload to Cloud Storage: {e}. Falling back to local.")

        # Local storage fallback
        local_dir = Path(__file__).resolve().parent.parent / "static" / "uploads"
        local_dir.mkdir(parents=True, exist_ok=True)
        local_path = local_dir / unique_name

        with open(local_path, "wb") as f:
            f.write(file_bytes)

        relative_url = f"/static/uploads/{unique_name}"
        return relative_url, str(local_path)


storage_service = StorageService()
