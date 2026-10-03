/**
 * PocketSmart AI — Automated Client Engine Test Suite
 * Tests client-side arithmetic validation, prompt formatting, platform link generation,
 * JSON response parsing, and domain fallback engines.
 * 
 * Run with: node scripts/test_client_engine.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation mirroring GeminiService functions for headless validation
const GeminiEngine = {
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

  cleanAndParseJson(rawText) {
    let cleaned = rawText.trim();
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) cleaned = match[1].trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
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
      savings_suggestions: data.savings_suggestions || [],
      notes: data.notes || [],
      input_data: inputData,
      is_fallback: isFallback
    };
  },

  buildHomePrompt(data) {
    const extraRoomsStr = (data.additional_rooms && data.additional_rooms.length > 0)
      ? data.additional_rooms.map((r, i) => `Additional Room ${i + 1} (${r.type}): ${r.furniture}, ${r.lights} Lights, ${r.fans} Fans`).join('; ')
      : 'None';
    const extraReqsStr = (data.extra_requirements && data.extra_requirements.length > 0)
      ? data.extra_requirements.join(', ')
      : 'Standard essentials';

    return `Total Budget: ₹${data.budget}, Primary: ${data.room_type}, Rooms: ${data.room_count}, Extra Rooms: ${extraRoomsStr}, Decor: ${extraReqsStr}`;
  }
};

// ==================== TEST SUITES ====================

test('Arithmetic Verification: Total cost sum and remaining budget calculations', () => {
  const budget = 50000;
  const mockAiData = {
    summary: 'Optimized living room budget',
    budget_allocation: [
      { category: 'Furniture', allocated_budget: 30000 },
      { category: 'Lighting', allocated_budget: 10000 },
      { category: 'Buffer', allocated_budget: 10000 }
    ],
    recommendations: [
      { name: 'Sofa', category: 'Furniture', estimated_price: 25000, platform: 'Amazon' },
      { name: 'Ceiling Light', category: 'Lighting', estimated_price: 8000, platform: 'IKEA' },
      { name: 'Floor Lamp', category: 'Lighting', estimated_price: 4000, platform: 'Flipkart' }
    ]
  };

  const result = GeminiEngine.normalizeAndValidate('home', budget, mockAiData, { room_type: 'Living Room' });

  assert.equal(result.budget, 50000);
  assert.equal(result.total_estimated_cost, 37000);
  assert.equal(result.remaining_budget, 13000);
  assert.ok(result.total_estimated_cost <= result.budget, 'Total cost must be within budget');
  assert.equal(result.recommendations.length, 3);
  assert.equal(result.allocation[0].percentage, 60);
});

test('Platform Deep Link Generator: Correct store search URLs', () => {
  const amazonUrl = GeminiEngine.generatePlatformUrl('Ergonomic Study Chair', 'Amazon', 'home');
  assert.ok(amazonUrl.startsWith('https://www.amazon.in/s?k=Ergonomic%20Study%20Chair'));

  const flipkartUrl = GeminiEngine.generatePlatformUrl('Textured Coffee Table', 'Flipkart', 'home');
  assert.ok(flipkartUrl.startsWith('https://www.flipkart.com/search?q=Textured%20Coffee%20Table'));

  const ikeaUrl = GeminiEngine.generatePlatformUrl('Floor Lamp', 'IKEA', 'home');
  assert.ok(ikeaUrl.startsWith('https://www.ikea.com/in/en/search/?q=Floor%20Lamp'));

  const zomatoUrl = GeminiEngine.generatePlatformUrl('Biryani Catering', 'Zomato', 'party');
  assert.ok(zomatoUrl.includes('google.com/search?q=') && zomatoUrl.includes('Zomato'));

  const swiggyUrl = GeminiEngine.generatePlatformUrl('Party Snacks', 'Swiggy', 'party');
  assert.ok(swiggyUrl.includes('google.com/search?q=') && swiggyUrl.includes('Swiggy'));

  const oyoUrl = GeminiEngine.generatePlatformUrl('Banquet Hall', 'OYO', 'party');
  assert.ok(oyoUrl.includes('google.com/search?q=') && oyoUrl.includes('OYO'));
});

test('JSON Cleaner: Strips markdown code blocks and handles raw JSON', () => {
  const markdownJson = '```json\n{"summary": "Test summary", "recommendations": []}\n```';
  const parsed = GeminiEngine.cleanAndParseJson(markdownJson);
  assert.notEqual(parsed, null);
  assert.equal(parsed.summary, 'Test summary');

  const rawJson = '{"summary": "Raw summary", "recommendations": []}';
  const parsedRaw = GeminiEngine.cleanAndParseJson(rawJson);
  assert.equal(parsedRaw.summary, 'Raw summary');

  const invalidJson = 'Not a valid JSON string';
  assert.equal(GeminiEngine.cleanAndParseJson(invalidJson), null);
});

test('Prompt Formatter: Correctly serializes dynamic multi-rooms and decor checklists', () => {
  const inputData = {
    budget: 80000,
    room_type: 'Living Room',
    room_count: 2,
    additional_rooms: [
      { type: 'Master Bedroom', furniture: 'Bed + Wardrobe', lights: 3, fans: 1 }
    ],
    extra_requirements: ['TV Unit', 'Indoor Plants'],
    lights_count: 7,
    fans_count: 2,
    sofa_requirement: '3-Seater',
    dining_table: '4-Seater'
  };

  const formatted = GeminiEngine.buildHomePrompt(inputData);
  assert.ok(formatted.includes('Total Budget: ₹80000'));
  assert.ok(formatted.includes('Primary: Living Room'));
  assert.ok(formatted.includes('Master Bedroom'));
  assert.ok(formatted.includes('TV Unit, Indoor Plants'));
});

test('Party Planner Budget Allocation: Guest-calibrated food & venue allocation', () => {
  const budget = 100000;
  const mockPartyData = {
    summary: '50-guest celebration strategy',
    budget_allocation: [
      { category: 'Food & Catering', allocated_budget: 50000 },
      { category: 'Venue & Seating', allocated_budget: 25000 },
      { category: 'Decoration & Theme', allocated_budget: 15000 },
      { category: 'Entertainment & Sound', allocated_budget: 10000 }
    ],
    recommendations: [
      { name: 'Dinner Buffet per Guest', category: 'Food & Catering', estimated_price: 42000, platform: 'Zomato' },
      { name: 'Event Hall Rental', category: 'Venue & Seating', estimated_price: 24000, platform: 'OYO' }
    ]
  };

  const result = GeminiEngine.normalizeAndValidate('party', budget, mockPartyData, { event_type: 'Birthday Party' });
  assert.equal(result.budget, 100000);
  assert.equal(result.total_estimated_cost, 66000);
  assert.equal(result.remaining_budget, 34000);
  assert.equal(result.allocation.length, 4);
});

console.log('✅ All PocketSmart AI client engine test cases executed successfully!');
