import json
import logging
import re
from typing import Optional, Dict, Any, List
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

# Ultra-fast models priority list
FAST_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]


class GeminiService:
    """
    High-speed, optimized service for Google Gemini API models.
    Supports structured JSON generation, fast fallback cascades, and multimodal image analysis.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = None

    @property
    def client(self):
        """
        Lazy-initialize the Gemini client with optimized HTTP timeout options.
        """
        if self._client is None:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured in settings or environment.")
            from google import genai
            from google.genai import types
            # 8-second HTTP timeout to prevent long stalls
            http_options = types.HttpOptions(timeout=8000)
            self._client = genai.Client(api_key=self.api_key, http_options=http_options)
        return self._client

    def is_configured(self) -> bool:
        """
        Returns True if the API key is configured.
        """
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here")

    def generate_recommendation(
        self,
        prompt: str,
        image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute prompt against Gemini model and return parsed JSON structure.
        Uses fast model cascade and strict JSON response mode for maximum speed.
        """
        if not self.is_configured():
            logger.warning("Gemini API key is not configured. Returning fallback response.")
            return self._get_fallback_response(prompt)

        from google.genai import types

        # Build contents list
        contents = [prompt]
        if image_path:
            try:
                img = Image.open(image_path)
                # Resize image if very large to speed up upload & inference
                img.thumbnail((800, 800))
                contents.append(img)
            except Exception as img_err:
                logger.error(f"Failed to open image for Gemini: {img_err}")

        # Generation config: strict JSON output & lower token limit for instant generation
        gen_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=750,
            temperature=0.2
        )

        # Prioritize configured model, followed by fast lite models
        models_to_try = [self.model_name] + [m for m in FAST_MODELS if m != self.model_name]

        last_error = None
        for model in models_to_try:
            try:
                logger.info(f"Generating recommendation using {model}...")
                response = self.client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=gen_config
                )

                raw_text = response.text or ""
                parsed_data = self._clean_and_parse_json(raw_text)
                if parsed_data and parsed_data.get("recommendations"):
                    return parsed_data

            except Exception as e:
                logger.warning(f"Model {model} failed or timed out: {e}. Trying fallback...")
                last_error = str(e)
                continue

        # If all live models failed, return graceful structured fallback
        logger.error(f"All Gemini models failed. Last error: {last_error}")
        return self._get_fallback_response(prompt, error=last_error)

    def _clean_and_parse_json(self, raw_text: str) -> Dict[str, Any]:
        """
        Extract and parse JSON from Markdown code fences or raw string.
        """
        cleaned = raw_text.strip()
        if "```" in cleaned:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
            if match:
                cleaned = match.group(1).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning("Failed to decode response as JSON.")
            return {
                "raw_text": raw_text,
                "summary": "AI generated recommendations based on your preferences.",
                "budget_allocation": [],
                "recommendations": []
            }

    def _get_fallback_response(self, prompt: str, error: Optional[str] = None) -> Dict[str, Any]:
        """
        Fallback response when Gemini is unconfigured or unreachable.
        """
        return {
            "summary": "Budget recommendations (instant offline mode).",
            "is_fallback": True,
            "error_detail": error,
            "budget_allocation": [],
            "recommendations": []
        }


# Singleton service instance
gemini_service = GeminiService()
