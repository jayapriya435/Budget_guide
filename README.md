# PocketSmart AI — Smart Budget & Recommendation Assistant

PocketSmart AI is an intelligent, budget-aware recommendation assistant designed to help users plan and budget effectively across three core domains:
1. **🛋️ Home Interior Planning**: Room-by-room budgeting, furniture, lighting, appliances, and decor allocation.
2. **🎉 Party & Event Planning**: Guest-count calibrated budgeting for catering, venues, decoration, and entertainment.
3. **💎 Jewelry Planning (Multimodal)**: Occasion, style, and outfit image analysis for coordinated jewelry and accessory recommendations.

---

## 🛠️ Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **AI Engine**: [Google Gemini AI](https://ai.google.dev/) (`gemini-2.5-flash` configurable)
- **Frontend / Templating**: Jinja2 + HTML5 / Modern Vanilla CSS / JavaScript
- **Database**: SQLite (SQLAlchemy ORM)
- **Authentication**: JWT & PBKDF2/Bcrypt password hashing

---

## 📁 Project Structure

```text
PocketSmart_AI/
├── app/
│   ├── main.py                  # Application entry point & FastAPI app
│   ├── config.py                # Environment & settings management
│   ├── auth/                    # Registration, Login, JWT verification
│   ├── database/                # SQLite connection & session management
│   ├── models/                  # SQLAlchemy models (User, Recommendation)
│   ├── routes/                  # API and template routers
│   ├── schemas/                 # Pydantic schemas for request/response
│   ├── services/                # Gemini AI, link generator, budget logic
│   ├── templates/               # Jinja2 HTML templates
│   └── static/                  # CSS styles, JS scripts, uploads
├── scripts/
│   └── test_gemini.py           # Gemini AI connectivity verification
├── requirements.txt             # Python dependencies
├── .env.example                 # Example environment variables
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Create and Activate Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Open `.env` and add your **`GEMINI_API_KEY`** from [Google AI Studio](https://aistudio.google.com/).

### 4. Verify Gemini Connectivity

```powershell
python scripts/test_gemini.py
```

### 5. Run the Local Development Server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Open your browser at: **`http://127.0.0.1:8000`**
Interactive API documentation: **`http://127.0.0.1:8000/docs`**
