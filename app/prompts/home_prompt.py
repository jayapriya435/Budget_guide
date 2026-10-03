import json
from typing import Dict, Any


def build_home_prompt(data: Dict[str, Any]) -> str:
    """
    Builds structured prompt for Home Interior Planner per Phase 8.3.
    """
    budget = data.get("budget", 50000)
    rooms = data.get("rooms", [])
    preferences = data.get("preferences", "Modern Minimalist")
    additional_notes = data.get("additional_notes", "None")

    rooms_str = json.dumps(rooms, indent=2)

    prompt = f"""
You are PocketSmart AI, an expert budget-aware interior design and shopping assistant for Indian households.
Your goal is to provide a sensible, realistic budget allocation and product recommendations strictly within the user's budget.

User Requirements:
- Total Budget: INR ₹{budget:,.2f}
- Preferred Style/Theme: {preferences}
- Room & Item Breakdown:
{rooms_str}
- Additional Notes: {additional_notes}

Instructions:
1. Strict Budget Adherence: The sum of all allocated categories and recommended item estimated prices must NOT exceed ₹{budget:,.2f}.
2. Recommendations should be practical, popular in the Indian market, and searchable on platforms like Amazon, Flipkart, or IKEA.
3. Suggest 3 to 6 key recommended items with realistic estimated prices in INR (₹).
4. Provide 2-3 cost-saving suggestions where applicable.
5. You MUST return ONLY a valid JSON object matching the following structure (no markdown fences, no conversational text):

{{
  "summary": "Brief explanation of the interior plan and how the budget is utilized.",
  "budget_allocation": [
    {{"category": "Furniture", "allocated_budget": 25000}},
    {{"category": "Lighting", "allocated_budget": 8000}},
    {{"category": "Decor & Accents", "allocated_budget": 7000}},
    {{"category": "Miscellaneous", "allocated_budget": 5000}}
  ],
  "recommendations": [
    {{
      "name": "3-Seater Fabric Sofa",
      "category": "Furniture",
      "estimated_price": 18999,
      "platform": "Amazon",
      "reason": "Compact and durable sofa with high density foam suitable for living rooms."
    }},
    {{
      "name": "Warm LED Ceiling Spotlight Set",
      "category": "Lighting",
      "estimated_price": 2499,
      "platform": "IKEA",
      "reason": "Energy-efficient warm lighting to create cozy atmosphere."
    }}
  ],
  "savings_suggestions": [
    "Consider modular engineered wood over solid teak to save up to 40% on furniture.",
    "Buy multi-pack smart LED bulbs online during sale events."
  ],
  "notes": [
    "Prices are estimates based on Indian e-commerce averages."
  ]
}}
"""
    return prompt.strip()
