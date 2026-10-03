"""
Phase 4 / Milestone 1 — Gemini AI Initialization & Verification Script
PocketSmart AI

Usage:
    python scripts/test_gemini.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

# Load .env
load_dotenv(dotenv_path=root_dir / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()


def run_gemini_check():
    print("=" * 60)
    print("PocketSmart AI — Gemini API Connectivity Check")
    print("=" * 60)
    print(f"Configured Model: {GEMINI_MODEL}")

    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        print("\n[!] GEMINI_API_KEY is missing or unset in your .env file.")
        print("Please obtain an API key from Google AI Studio (https://aistudio.google.com/)")
        print("and set GEMINI_API_KEY=your_key in your .env file.")
        print("Note: The application includes offline/fallback mode for local testing.")
        print("=" * 60)
        return False

    print("[*] GEMINI_API_KEY detected. Connecting to Gemini API...")

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)

        test_prompt = (
            "You are PocketSmart AI, an expert budget and shopping assistant. "
            "Given a budget of INR 25,000 for a Living Room lighting upgrade, "
            "suggest 2 categories with estimated prices. Respond briefly in JSON format with fields: "
            "category, estimated_price, and reason."
        )

        print("\nSending test prompt to Gemini...")
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=test_prompt
        )

        print("\n[+] Successfully received response from Gemini AI!")
        print("-" * 60)
        print(response.text)
        print("-" * 60)
        print("\n[+] Gemini API initialization validated successfully.")
        return True

    except Exception as e:
        print(f"\n[!] Error connecting to Gemini API: {str(e)}")
        print("Please verify your API key, network access, and model name.")
        return False


if __name__ == "__main__":
    success = run_gemini_check()
    sys.exit(0 if success else 1)
