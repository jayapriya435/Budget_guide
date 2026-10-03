/**
 * PocketSmart AI — Client-Side Gemini AI Engine
 * Directly invokes Google Gemini REST API with strict JSON schema, multimodal vision,
 * arithmetic validation, and instant intelligent fallbacks.
 */

const GeminiService = {
  DEFAULT_MODELS: [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash"
  ],

  getApiKey() {
    return localStorage.getItem('ps_gemini_api_key') || 'AIzaSyDry2GDDt4moGMTK9exwT_VMQQdOUR8f7M';
  },

  setApiKey(key) {
    if (key) {
      localStorage.setItem('ps_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('ps_gemini_api_key');
    }
  },

  // ==================== Platform Deep Link Generator ====================
  generatePlatformUrl(itemName, platform, domain) {
    const cleanItem = encodeURIComponent(itemName);
    const plat = (platform || 'Amazon').toLowerCase();

    if (plat.includes('amazon')) {
      return `https://www.amazon.in/s?k=${cleanItem}`;
    } else if (plat.includes('flipkart')) {
      return `https://www.flipkart.com/search?q=${cleanItem}`;
    } else if (plat.includes('ikea')) {
      return `https://www.ikea.com/in/en/search/?q=${cleanItem}`;
    } else if (plat.includes('myntra')) {
      return `https://www.myntra.com/${cleanItem}`;
    } else if (plat.includes('zomato')) {
      return `https://www.google.com/search?q=${encodeURIComponent(itemName + ' Zomato catering menu')}`;
    } else if (plat.includes('swiggy')) {
      return `https://www.google.com/search?q=${encodeURIComponent(itemName + ' Swiggy delivery')}`;
    } else if (plat.includes('oyo')) {
      return `https://www.google.com/search?q=${encodeURIComponent(itemName + ' OYO party venue hall booking')}`;
    } else {
      return `https://www.google.com/search?q=${cleanItem}+buy+online+india`;
    }
  },

  // ==================== Prompt Builders ====================
  buildHomePrompt(data) {
    return `You are PocketSmart AI, an expert budget-conscious interior designer for Indian homes.
Create a detailed, mathematically verified interior budget allocation and itemized shopping list.

Client Requirements:
- Total Budget: ₹${data.budget}
- Room Type: ${data.room_type} (${data.room_count} room)
- Fixtures: ${data.lights_count} Lights, ${data.fans_count} Ceiling Fans
- Furniture: Sofa: ${data.sofa_requirement}, Dining Table: ${data.dining_table}
- Style Preference: ${data.style_preference}
- Additional Notes: ${data.additional_notes || 'None'}

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
      "name": "Specific product name (e.g. Modern 3-Seater L-Shape Fabric Sofa)",
      "category": "Furniture",
      "estimated_price": 28000,
      "platform": "Amazon",
      "reason": "Durable high-density foam with water-resistant upholstery matching modern minimalist tones."
    }
  ],
  "savings_suggestions": [
    "Tip 1 on saving money (e.g. bundle lighting packages)",
    "Tip 2 on seasonal clearance deals"
  ],
  "notes": ["Important considerations regarding dimensions or delivery"]
}
CRITICAL RULES:
1. Sum of all recommended item estimated_prices MUST NOT exceed ₹${data.budget}.
2. Platforms must be chosen from: Amazon, Flipkart, IKEA.
3. Provide realistic Indian Rupee (INR) prices.`;
  },

  buildPartyPrompt(data) {
    return `You are PocketSmart AI, an expert event planner for Indian celebrations.
Create a balanced, guest-calibrated budget plan and curated vendor recommendations.

Event Requirements:
- Total Budget: ₹${data.budget}
- Event Type: ${data.event_type}
- Guest Count: ${data.guest_count} attendees
- Venue Type: ${data.venue_type}
- Food Preference: ${data.food_preference}
- Theme & Decor: ${data.theme}
- Entertainment: ${data.entertainment}
- Additional Notes: ${data.additional_notes || 'None'}

STRICT JSON OUTPUT FORMAT (Respond ONLY with valid JSON):
{
  "summary": "Brief 1-2 sentence overview of the event plan.",
  "budget_allocation": [
    {"category": "Food & Catering", "allocated_budget": 45000},
    {"category": "Venue & Seating", "allocated_budget": 20000},
    {"category": "Decoration & Lighting", "allocated_budget": 12000},
    {"category": "Entertainment & Audio", "allocated_budget": 8000},
    {"category": "Emergency Buffer", "allocated_budget": 5000}
  ],
  "recommendations": [
    {
      "name": "Multi-Course Party Buffet Service",
      "category": "Food & Catering",
      "estimated_price": 32000,
      "platform": "Zomato",
      "reason": "Includes 2 starters, 3 mains, breads and dessert per guest."
    }
  ],
  "savings_suggestions": [
    "Order customized packages rather than individual à la carte items.",
    "Utilize reusable fairy light curtains and balloon arch kits from Amazon."
  ],
  "notes": ["Confirm head count 48 hours prior to final catering lock-in."]
}
CRITICAL RULES:
1. Total estimated cost MUST NOT exceed ₹${data.budget}.
2. Platforms must be chosen from: Zomato, Swiggy, Amazon, OYO.
3. Provide realistic Indian Rupee prices.`;
  },

  buildJewelryPrompt(data, hasImage) {
    return `You are PocketSmart AI, a high-fashion jewelry stylist specializing in Indian weddings and festive attire.
Create an occasion-perfect jewelry ensemble that maximizes sparkle and elegance within budget.

Client Specifications:
- Total Budget: ₹${data.budget}
- Occasion: ${data.occasion}
- Preferred Style: ${data.style}
- Outfit Details: ${data.outfit_description || 'Festive Indian attire'}
- Jewelry Categories Desired: ${data.jewelry_types}
- Has Outfit Photo: ${hasImage ? 'Yes, analyze outfit photo undertones and necklines' : 'No'}
- Additional Notes: ${data.additional_notes || 'None'}

STRICT JSON OUTPUT FORMAT (Respond ONLY with valid JSON):
{
  "summary": "Stylist assessment of color harmony and jewelry pairing.",
  "budget_allocation": [
    {"category": "Necklace / Choker", "allocated_budget": 40000},
    {"category": "Earrings / Jhumkas", "allocated_budget": 18000},
    {"category": "Bangles / Kadas", "allocated_budget": 12000}
  ],
  "recommendations": [
    {
      "name": "Kundan & Pearl Embellished Choker Necklace",
      "category": "Necklace / Choker",
      "estimated_price": 28000,
      "platform": "Amazon",
      "reason": "Accentuates the neckline with radiant emerald glass drop stones."
    }
  ],
  "savings_suggestions": [
    "Opt for gold-plated silver brass alloys for identical heirloom sheen at 80% lower cost.",
    "Choose detachable chandelier earrings that can be worn in multiple styles."
  ],
  "notes": ["Store in airtight velvet pouches away from moisture."]
}
CRITICAL RULES:
1. Total estimated cost MUST NOT exceed ₹${data.budget}.
2. Platforms must be chosen from: Amazon, Myntra, Flipkart.
3. Realistic Indian Rupee prices.`;
  },

  // ==================== Live Gemini REST API Call ====================
  async generatePlan(plannerType, formData, imageBase64 = null) {
    const budget = parseFloat(formData.budget) || 10000;
    const apiKey = this.getApiKey();

    let prompt = '';
    if (plannerType === 'home') prompt = this.buildHomePrompt(formData);
    else if (plannerType === 'party') prompt = this.buildPartyPrompt(formData);
    else if (plannerType === 'jewelry') prompt = this.buildJewelryPrompt(formData, !!imageBase64);

    // Build API payload
    const parts = [{ text: prompt }];

    // If multimodal outfit image is supplied
    if (imageBase64 && plannerType === 'jewelry') {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const requestBody = {
      contents: [{ role: "user", parts: parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 1200
      }
    };

    // Try live models cascade
    for (const model of this.DEFAULT_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = this.cleanAndParseJson(candidateText);
            if (parsed && parsed.recommendations && parsed.recommendations.length > 0) {
              return this.normalizeAndValidate(plannerType, budget, parsed, formData, false);
            }
          }
        }
      } catch (err) {
        console.warn(`Model ${model} request warning, trying cascade...`, err);
      }
    }

    // Graceful fallback if offline or API limit reached
    console.info("Using intelligent offline fallback engine for instant response.");
    return this.buildDomainFallback(plannerType, budget, formData, imageBase64);
  },

  cleanAndParseJson(rawText) {
    let cleaned = rawText.trim();
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) cleaned = match[1].trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn("JSON parse error from raw response:", e);
      return null;
    }
  },

  normalizeAndValidate(plannerType, budget, data, inputData, isFallback = false) {
    const rawAllocations = data.budget_allocation || [];
    const allocationItems = rawAllocations.map(item => {
      const cat = item.category || 'General';
      const amt = parseFloat(item.allocated_budget) || 0;
      const pct = budget > 0 ? Math.round((amt / budget) * 100 * 10) / 10 : 0;
      return { category: cat, allocated_budget: amt, percentage: pct };
    });

    const rawRecs = data.recommendations || [];
    let totalEstimated = 0;
    const recommendationItems = rawRecs.map(rec => {
      const name = rec.name || 'Recommended Item';
      const cat = rec.category || 'General';
      const price = parseFloat(rec.estimated_price) || 0;
      const platform = rec.platform || 'Amazon';
      const reason = rec.reason || 'Curated to match your budget and specifications.';
      const searchUrl = this.generatePlatformUrl(name, platform, plannerType);

      totalEstimated += price;
      return {
        name,
        category: cat,
        estimated_price: price,
        platform,
        search_url: searchUrl,
        reason
      };
    });

    const remaining = Math.max(0, budget - totalEstimated);

    return {
      planner_type: plannerType,
      title: `${inputData.room_type || inputData.event_type || inputData.occasion || 'Smart'} Plan`,
      budget: budget,
      total_estimated_cost: Math.round(totalEstimated),
      remaining_budget: Math.round(remaining),
      allocation: allocationItems,
      recommendations: recommendationItems,
      summary: data.summary || `Smart budget allocation for ₹${budget.toLocaleString('en-IN')}`,
      savings_suggestions: data.savings_suggestions || [
        "Compare seasonal promotional coupons on verified platforms.",
        "Check multi-item combo discounts to save up to 15%."
      ],
      notes: data.notes || [],
      input_data: inputData,
      is_fallback: isFallback
    };
  },

  buildDomainFallback(plannerType, budget, inputData, imageBase64) {
    let allocations = [];
    let items = [];
    let summary = '';

    if (plannerType === 'home') {
      summary = `Custom ${inputData.style_preference || 'Modern'} interior plan for ${inputData.room_type || 'Living Room'} optimized within ₹${budget.toLocaleString('en-IN')}.`;
      allocations = [
        { category: "Furniture", allocated_budget: Math.round(budget * 0.55), percentage: 55 },
        { category: "Lighting & Electrical", allocated_budget: Math.round(budget * 0.20), percentage: 20 },
        { category: "Decor & Curtains", allocated_budget: Math.round(budget * 0.15), percentage: 15 },
        { category: "Contingency Buffer", allocated_budget: Math.round(budget * 0.10), percentage: 10 }
      ];
      items = [
        {
          name: `${inputData.style_preference || 'Modern'} Premium Fabric Sofa Set`,
          category: "Furniture",
          estimated_price: Math.round(budget * 0.38),
          platform: "Amazon",
          reason: "Ergonomic living room centerpiece with durable, stain-resistant fabric."
        },
        {
          name: "Warm White Ambient LED Ceiling Fixture",
          category: "Lighting & Electrical",
          estimated_price: Math.round(budget * 0.14),
          platform: "IKEA",
          reason: "Energy-efficient warm glow illuminating living spaces evenly."
        },
        {
          name: "Handcrafted Textured Coffee Table",
          category: "Furniture",
          estimated_price: Math.round(budget * 0.15),
          platform: "Flipkart",
          reason: "Engineered solid wood finish complementing minimalist aesthetics."
        },
        {
          name: "Sheer & Blackout Dual Curtains Set",
          category: "Decor & Curtains",
          estimated_price: Math.round(budget * 0.10),
          platform: "Amazon",
          reason: "Natural daylight filtering with thermal room insulation."
        }
      ];
    } else if (plannerType === 'party') {
      summary = `Celebration event strategy calibrated for ${inputData.guest_count || 30} guests within ₹${budget.toLocaleString('en-IN')}.`;
      allocations = [
        { category: "Food & Catering", allocated_budget: Math.round(budget * 0.50), percentage: 50 },
        { category: "Venue & Seating", allocated_budget: Math.round(budget * 0.22), percentage: 22 },
        { category: "Decoration & Theme", allocated_budget: Math.round(budget * 0.18), percentage: 18 },
        { category: "Entertainment & Sound", allocated_budget: Math.round(budget * 0.10), percentage: 10 }
      ];
      items = [
        {
          name: "Deluxe Party Buffet & Appetizer Spread",
          category: "Food & Catering",
          estimated_price: Math.round(budget * 0.44),
          platform: "Zomato",
          reason: "Multi-course starters and gourmet main course meal per attendee."
        },
        {
          name: `${inputData.theme || 'Celebration'} Balloon Garland & Fairy Light Backdrop`,
          category: "Decoration & Theme",
          estimated_price: Math.round(budget * 0.14),
          platform: "Amazon",
          reason: "Instagram-ready photo booth banner setup with shimmer foil curtains."
        },
        {
          name: "Portable High-Fidelity Bluetooth Party Speaker with Mic",
          category: "Entertainment & Sound",
          estimated_price: Math.round(budget * 0.12),
          platform: "Amazon",
          reason: "Crystal clear bass and vocal karaoke setup for guest engagement."
        },
        {
          name: "Celebration Venue Reservation & Seating",
          category: "Venue & Seating",
          estimated_price: Math.round(budget * 0.18),
          platform: "OYO",
          reason: "Private banquet lounge with air conditioning and guest parking."
        }
      ];
    } else {
      summary = `Multimodal jewelry ensemble matching ${inputData.occasion || 'Festive'} occasion within ₹${budget.toLocaleString('en-IN')}.`;
      allocations = [
        { category: "Necklace / Choker", allocated_budget: Math.round(budget * 0.55), percentage: 55 },
        { category: "Earrings / Jhumkas", allocated_budget: Math.round(budget * 0.25), percentage: 25 },
        { category: "Bangles & Rings", allocated_budget: Math.round(budget * 0.20), percentage: 20 }
      ];
      items = [
        {
          name: `${inputData.style || 'Traditional Kundan'} Gold-Plated Choker Set`,
          category: "Necklace / Choker",
          estimated_price: Math.round(budget * 0.48),
          platform: "Amazon",
          reason: "Intricate meenakari craftsmanship matching traditional and Indo-western necklines."
        },
        {
          name: "Filigree Antique Temple Jhumka Earrings",
          category: "Earrings / Jhumkas",
          estimated_price: Math.round(budget * 0.22),
          platform: "Myntra",
          reason: "Lightweight statement drops engineered for all-day festive comfort."
        },
        {
          name: "Kundan Studded Floral Bangle Pair",
          category: "Bangles & Rings",
          estimated_price: Math.round(budget * 0.16),
          platform: "Flipkart",
          reason: "Openable screw clasps fitting multiple wrist sizes seamlessly."
        }
      ];
    }

    const payload = {
      summary,
      budget_allocation: allocations,
      recommendations: items,
      savings_suggestions: [
        "Compare seasonal promotional discounts across Amazon, Flipkart, and IKEA.",
        "Check bundle offers to save an extra 15% on complementary items."
      ],
      notes: [
        "Instant mode active. You can configure your custom Gemini API key in Settings anytime."
      ]
    };

    return this.normalizeAndValidate(plannerType, budget, payload, inputData, true);
  }
};
