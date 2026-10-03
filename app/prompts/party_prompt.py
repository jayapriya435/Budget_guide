from typing import Dict, Any


def build_party_prompt(data: Dict[str, Any]) -> str:
    """
    Builds structured prompt for Party & Event Planner per Phase 9.3.
    """
    budget = data.get("budget", 50000)
    guest_count = data.get("guest_count", 25)
    event_type = data.get("event_type", "Birthday")
    venue_type = data.get("venue_type", "Home / Banquet")
    food_pref = data.get("food_preference", "Veg & Non-Veg Buffet")
    decor_pref = data.get("decor_preference", "Theme Balloons & Lights")
    entertainment_pref = data.get("entertainment", "Music & Games")
    additional_notes = data.get("additional_notes", "None")

    prompt = f"""
You are PocketSmart AI, an expert event planner and budget strategist specializing in Indian celebrations and gatherings.
Provide a balanced budget allocation and service/vendor suggestions strictly within the provided budget.

Event Details:
- Total Budget: INR ₹{budget:,.2f}
- Guest Count: {guest_count} guests (Approx ₹{budget / max(guest_count, 1):,.0f} per head)
- Event Type: {event_type}
- Venue: {venue_type}
- Food & Catering: {food_pref}
- Decoration Requirements: {decor_pref}
- Entertainment: {entertainment_pref}
- Special Notes: {additional_notes}

Instructions:
1. Strict Budget Adherence: Total allocation and estimated costs must NOT exceed ₹{budget:,.2f}.
2. Recommend realistic allocations across Food & Catering, Venue, Decoration, Entertainment, and Miscellaneous buffer.
3. Suggest 3 to 6 practical recommendations linked to relevant platforms such as Zomato, Swiggy, OYO, or Amazon.
4. Provide cost-saving tips tailored to guest count.
5. Return ONLY a valid JSON object matching the following structure:

{{
  "summary": "Overview of event plan, per-head budget, and allocation breakdown.",
  "budget_allocation": [
    {{"category": "Food & Catering", "allocated_budget": 25000}},
    {{"category": "Venue / Space", "allocated_budget": 12000}},
    {{"category": "Decoration", "allocated_budget": 8000}},
    {{"category": "Entertainment & Music", "allocated_budget": 3000}},
    {{"category": "Miscellaneous", "allocated_budget": 2000}}
  ],
  "recommendations": [
    {{
      "name": "Buffet Catering Package (Main Course + Starter + Dessert)",
      "category": "Food & Catering",
      "estimated_price": 22000,
      "platform": "Zomato",
      "reason": "Popular local banquet catering with options for mixed dietary needs."
    }},
    {{
      "name": "DIY Theme Decor Kit & Fairy Lights",
      "category": "Decoration",
      "estimated_price": 3500,
      "platform": "Amazon",
      "reason": "Complete party banner, balloon arch, and reusable fairy lights."
    }}
  ],
  "savings_suggestions": [
    "Opt for buffet style instead of plated service to reduce server labor fees.",
    "Order mocktail mixes in bulk online rather than per glass."
  ],
  "notes": [
    "Venue prices vary based on weekday vs weekend booking."
  ]
}}
"""
    return prompt.strip()
