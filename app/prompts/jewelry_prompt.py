from typing import Dict, Any


def build_jewelry_prompt(data: Dict[str, Any], has_image: bool = False) -> str:
    """
    Builds structured prompt for Jewelry Planner per Phase 10.4.
    Supports multimodal input when an image is attached.
    """
    budget = data.get("budget", 20000)
    occasion = data.get("occasion", "Wedding Reception")
    style_pref = data.get("style", "Traditional Kundan")
    outfit_desc = data.get("outfit_description", "Silk Saree / Lehenga")
    jewelry_types = data.get("jewelry_types", "Necklace, Earrings")
    additional_notes = data.get("additional_notes", "None")

    image_instruction = (
        "An image of the user's outfit is provided. Analyze the colors, neckline, embroidery, "
        "and metal undertones (gold, rose gold, silver) in the photo to recommend coordinated jewelry pieces."
        if has_image else
        "No outfit image provided. Rely on the detailed text description for styling."
    )

    prompt = f"""
You are PocketSmart AI, a premier fashion stylist and budget jewelry recommendation consultant.
Your role is to advise the user on exquisite jewelry pieces that complement their outfit and occasion while staying strictly within budget.

Jewelry Requirements:
- Total Budget: INR ₹{budget:,.2f}
- Occasion: {occasion}
- Style Preference: {style_pref}
- Outfit Description: {outfit_desc}
- Desired Jewelry Categories: {jewelry_types}
- Additional Preferences: {additional_notes}
- Visual Context: {image_instruction}

Instructions:
1. Strict Budget Adherence: Total allocated budget and estimated prices must NOT exceed ₹{budget:,.2f}.
2. Provide styling reasoning (why this metal/gem tone pairs with the neckline/outfit shade).
3. Suggest 2 to 5 curated jewelry pieces with estimated prices in INR (₹).
4. Specify appropriate platforms (e.g. Amazon, Flipkart, Myntra, Tanishq).
5. Return ONLY a valid JSON object matching the following structure:

{{
  "summary": "Style coordination analysis and recommendation summary.",
  "detected_outfit_characteristics": "Analysis of fabric tone, neckline, and color palette.",
  "budget_allocation": [
    {{"category": "Necklace / Choker", "allocated_budget": 12000}},
    {{"category": "Earrings / Jhumkas", "allocated_budget": 5000}},
    {{"category": "Bangles / Bracelet", "allocated_budget": 3000}}
  ],
  "recommendations": [
    {{
      "name": "Kundan Choker Set with Matching Drops",
      "category": "Necklace",
      "estimated_price": 9999,
      "platform": "Amazon",
      "reason": "Matches the high collar and deep jewel tones of the outfit."
    }},
    {{
      "name": "Peacock Motif Meenakari Jhumkas",
      "category": "Earrings",
      "estimated_price": 3899,
      "platform": "Myntra",
      "reason": "Complements the gold thread zari embroidery."
    }}
  ],
  "savings_suggestions": [
    "Opt for brass-based antique gold polish instead of solid gold for occasion wear.",
    "Look for convertible necklace sets that can be worn with multiple outfits."
  ],
  "notes": [
    "Prices are estimates for fashion/fine jewelry in the Indian market."
  ]
}}
"""
    return prompt.strip()
