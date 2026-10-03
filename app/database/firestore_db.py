"""
Firestore Database Client for PocketSmart AI
Implements persistent storage for Users and Recommendations using Google Cloud Firestore.
Works natively on Google Cloud Run (IAM authentication) and supports local credentials.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid

logger = logging.getLogger(__name__)

class FirestoreDB:
    """
    Firestore integration for PocketSmart AI.
    Handles 'users' and 'recommendations' collections.
    """

    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id or os.getenv("GCP_PROJECT", os.getenv("GOOGLE_CLOUD_PROJECT", "pocketsmartai-app"))
        self._db = None

    @property
    def client(self):
        if self._db is None:
            try:
                from google.cloud import firestore
                self._db = firestore.Client(project=self.project_id)
                logger.info(f"Connected to Firestore project: {self.project_id}")
            except Exception as e:
                logger.error(f"Failed to initialize Firestore client: {e}")
                self._db = None
        return self._db

    def is_available(self) -> bool:
        """Check if Firestore client is initialized and reachable."""
        try:
            return self.client is not None
        except Exception:
            return False

    # ==================== User Operations ====================

    def create_user(self, name: str, email: str, password_hash: str) -> Optional[Dict[str, Any]]:
        """Create a new user document in Firestore."""
        if not self.is_available():
            return None
        
        email_clean = email.lower().strip()
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "password_hash": password_hash,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        try:
            self.client.collection("users").document(user_id).set(user_data)
            return user_data
        except Exception as e:
            logger.error(f"Error creating user in Firestore: {e}")
            return None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email address."""
        if not self.is_available():
            return None
        
        try:
            email_clean = email.lower().strip()
            docs = self.client.collection("users").where("email", "==", email_clean).limit(1).stream()
            for doc in docs:
                data = doc.to_dict()
                data["doc_id"] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error fetching user by email from Firestore: {e}")
            return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Find user by ID."""
        if not self.is_available():
            return None

        try:
            doc = self.client.collection("users").document(str(user_id)).get()
            if doc.exists:
                data = doc.to_dict()
                data["doc_id"] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Error fetching user by ID from Firestore: {e}")
            return None

    # ==================== Recommendation Operations ====================

    def save_recommendation(
        self,
        user_id: str,
        planner_type: str,
        title: str,
        budget: float,
        input_data: Dict[str, Any],
        ai_response: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Save a generated recommendation plan to Firestore."""
        if not self.is_available():
            return None

        rec_id = str(uuid.uuid4())
        rec_data = {
            "id": rec_id,
            "user_id": str(user_id),
            "planner_type": planner_type,
            "title": title,
            "budget": float(budget),
            "input_data": input_data,
            "ai_response": ai_response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        try:
            self.client.collection("recommendations").document(rec_id).set(rec_data)
            return rec_data
        except Exception as e:
            logger.error(f"Error saving recommendation to Firestore: {e}")
            return None

    def get_user_recommendations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch all recommendations for a given user ordered by creation date."""
        if not self.is_available():
            return []

        try:
            docs = (
                self.client.collection("recommendations")
                .where("user_id", "==", str(user_id))
                .order_by("created_at", direction="DESCENDING")
                .limit(limit)
                .stream()
            )
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            # If compound index is not created yet, query without order_by and sort in Python
            try:
                docs = (
                    self.client.collection("recommendations")
                    .where("user_id", "==", str(user_id))
                    .stream()
                )
                items = [doc.to_dict() for doc in docs]
                items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return items[:limit]
            except Exception as inner_e:
                logger.error(f"Error fetching recommendations from Firestore: {inner_e}")
                return []

    def get_recommendation_by_id(self, rec_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific recommendation plan by ID."""
        if not self.is_available():
            return None

        try:
            doc = self.client.collection("recommendations").document(str(rec_id)).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error fetching recommendation {rec_id} from Firestore: {e}")
            return None

    def delete_recommendation(self, rec_id: str, user_id: str) -> bool:
        """Delete a recommendation if owned by the user."""
        if not self.is_available():
            return False

        try:
            doc_ref = self.client.collection("recommendations").document(str(rec_id))
            doc = doc_ref.get()
            if doc.exists and str(doc.to_dict().get("user_id")) == str(user_id):
                doc_ref.delete()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting recommendation {rec_id} from Firestore: {e}")
            return False


# Global Firestore instance
firestore_db = FirestoreDB()
