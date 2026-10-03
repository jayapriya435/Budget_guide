# PocketSmart AI — Google Gemini AI Integration & Prompt Engineering

## 1. Overview

PocketSmart AI uses the Google Gemini REST API (`generativelanguage.googleapis.com/v1beta`) with structured JSON schema outputs, multi-model cascade fail-safes, and multimodal image analysis.

---

## 2. Model Cascade Strategy

To balance speed, quality, and API rate limits, `gemini-service.js` attempts generation in the following priority order:

| Priority | Model Identifier | Strengths | Typical Latency |
|:---:|---|---|:---:|
| **1** | `gemini-2.5-flash` | State-of-the-art reasoning, optimal JSON compliance | ~1.8s – 3.2s |
| **2** | `gemini-1.5-flash` | High throughput, established stability | ~2.0s – 3.5s |
| **3** | `gemini-2.0-flash` | Modern multimodal versatility | ~2.2s – 4.0s |
| **4** | **Intelligent Domain Fallback** | Instant client-side deterministic rule engine | < 10ms (Offline) |

Every request includes a **9-second AbortController timeout**. If network lag or quota limits occur, the cascade immediately advances to the next model or activates the offline fallback engine, ensuring the user interface remains completely reliable.

---

## 3. Prompt Architecture & JSON Schema Enforcement

### 3.1 Home Interior Prompt Structure
```text
You are PocketSmart AI, an expert budget-conscious interior designer for Indian homes.
Create a detailed, mathematically verified interior budget allocation and itemized shopping list.

Client Requirements:
- Total Budget: ₹{data.budget}
- Primary Room: {data.room_type}
- Total Rooms: {data.room_count}
- Additional Rooms: {extraRoomsStr}
- Fixtures: {data.lights_count} Lights, {data.fans_count} Ceiling Fans
- Core Furniture: Sofa: {data.sofa_requirement}, Dining Table: {data.dining_table}
- Extra Decor/Furniture Desired: {extraReqsStr}
- Style Preference: {data.style_preference}
- Additional Notes: {data.additional_notes}

STRICT JSON OUTPUT FORMAT (Respond ONLY with valid JSON):
{
  "summary": "Brief 1-2 sentence overview of how the budget is optimized.",
  "budget_allocation": [
    {"category": "Furniture", "allocated_budget": 55000},
    {"category": "Lighting & Electrical", "allocated_budget": 15000},
    {"category": "Decor & Furnishings", "allocated_budget": 10000},
    {"category": "Contingency / Buffer", "allocated_budget": 5000}
  ],
  "recommendations": [
    {
      "name": "Specific product name",
      "category": "Furniture",
      "estimated_price": 28000,
      "platform": "Amazon",
      "reason": "Durable high-density foam matching modern minimalist tones."
    }
  ],
  "savings_suggestions": [
    "Tip on saving money through bundle deals"
  ],
  "notes": ["Important considerations regarding dimensions or delivery"]
}
CRITICAL RULES:
1. Sum of all recommended item estimated_prices MUST NOT exceed ₹{data.budget}.
2. Platforms must be chosen from: Amazon, Flipkart, IKEA.
3. Provide realistic Indian Rupee (INR) prices.
```

---

## 4. Multimodal Vision Pipeline (Jewelry Planner)

When an outfit photo is uploaded:
1. The browser validates MIME type (`image/jpeg`, `image/png`, `image/webp`) and size ($\le 8\text{ MB}$).
2. The image is converted into a base64 Data URL using `FileReader`.
3. The base64 data is split into `mimeType` and `data` strings and transmitted in the Gemini `inlineData` block:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "Analyze outfit colors, necklines, and recommend matching jewelry within budget..." },
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "/9j/4AAQSkZJRgABAQ..."
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseMimeType": "application/json",
    "temperature": 0.2,
    "maxOutputTokens": 1200
  }
}
```

---

## 5. Post-Processing & Arithmetic Verification

Raw text from Gemini passes through rigorous post-processing in `normalizeAndValidate()`:
1. **Markdown Stripping**: Removes enclosing ````json ... ```` markers if present.
2. **JSON Parsing**: Validates syntax; catches malformed tokens.
3. **Price Summation**: Sums up all recommended item prices:
   $$\text{totalEstimated} = \sum \text{rec.estimated\_price}$$
4. **Savings Calculation**:
   $$\text{remaining} = \max(0, \text{budget} - \text{totalEstimated})$$
5. **Percentage Recalculation**: Recomputes allocation percentages to guarantee that the visual progress bar totals 100%.
