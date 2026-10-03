import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_home_planner_flow():
    # 1. Access Home Planner Form
    form_resp = client.get("/home-planner")
    assert form_resp.status_code == 200
    assert "Home Interior Planner" in form_resp.text

    # 2. Submit Home Planner Requirements
    payload = {
        "budget": 45000,
        "room_type": "Living Room",
        "room_count": 1,
        "lights_count": 4,
        "fans_count": 1,
        "sofa_requirement": "3-Seater",
        "dining_table": "None",
        "style_preference": "Modern Minimalist",
        "additional_notes": "Warm ambiance"
    }
    rec_resp = client.post("/home-recommendations", data=payload)
    assert rec_resp.status_code == 200
    assert "Living Room Recommendation" in rec_resp.text
    assert "Budget Allocation" in rec_resp.text
    assert "Find on" in rec_resp.text or "Shop on" in rec_resp.text or "Explore on" in rec_resp.text


def test_party_planner_flow():
    # 1. Access Party Planner Form
    form_resp = client.get("/party-planner")
    assert form_resp.status_code == 200
    assert "Party & Event Planner" in form_resp.text or "Party &amp; Event Planner" in form_resp.text

    # 2. Submit Party Planner Requirements
    payload = {
        "budget": 60000,
        "guest_count": 40,
        "event_type": "Birthday Party",
        "venue_type": "Community Hall / Clubhouse",
        "food_preference": "Mixed Veg & Non-Veg Buffet",
        "decor_preference": "Theme Balloon Arch & Fairy Lights",
        "entertainment": "Music Playlist & Interactive Party Games",
        "additional_notes": "Include photo booth"
    }
    rec_resp = client.post("/party-recommendations", data=payload)
    assert rec_resp.status_code == 200
    assert "Birthday Party" in rec_resp.text
    assert "Category Allocation" in rec_resp.text


def test_jewelry_planner_flow():
    # 1. Access Jewelry Planner Form
    form_resp = client.get("/jewelry-planner")
    assert form_resp.status_code == 200
    assert "Jewelry & Styling Planner" in form_resp.text or "Jewelry &amp; Styling Planner" in form_resp.text

    # 2. Submit Jewelry Requirements (Text only)
    payload = {
        "budget": 25000,
        "occasion": "Wedding Reception",
        "style": "Traditional Kundan & Polki",
        "outfit_description": "Emerald green Banarasi saree with gold zardozi border",
        "jewelry_types": "Choker Necklace, Jhumkas",
        "additional_notes": "Warm gold undertones"
    }
    rec_resp = client.post("/jewelry-recommendations", data=payload)
    assert rec_resp.status_code == 200
    assert "Wedding Reception Styling" in rec_resp.text
    assert "Curated Jewelry Recommendations" in rec_resp.text


import uuid


def test_authenticated_history_persistence():
    # 1. Register test user with unique email
    email = f"history_{uuid.uuid4().hex[:8]}@pocketsmart.ai"
    client.post("/register", json={"name": "History Tester", "email": email, "password": "password123!"})
    login_resp = client.post("/login", json={"email": email, "password": "password123!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit a home recommendation with authenticated cookies/token
    client.cookies.set("access_token", f"Bearer {token}")
    payload = {
        "budget": 80000,
        "room_type": "Master Bedroom",
        "room_count": 1,
        "lights_count": 2,
        "fans_count": 1,
        "sofa_requirement": "None",
        "dining_table": "None",
        "style_preference": "Scandinavian Boho",
        "additional_notes": "Large wardrobe space"
    }
    client.post("/home-recommendations", data=payload, headers=headers)

    # 3. Check history page
    history_resp = client.get("/history", headers=headers)
    assert history_resp.status_code == 200
    assert "Master Bedroom Interior Plan" in history_resp.text
    assert "80,000" in history_resp.text
