# PocketSmart AI — Planners Specification Guide

PocketSmart AI features three specialized, budget-calibrated planning engines designed for real-world Indian consumer scenarios.

---

## 1. 🛋️ Home Interior Planner

### 1.1 Objective
Empowers homeowners and renters to plan and furnish living spaces within strict financial limits, preventing overspending through room-by-room allocation and curated product recommendations.

### 1.2 Input Parameters
- **Total Budget (₹)**: Numeric constraint in Indian Rupees.
- **Primary Room Type**: *Living Room, Master Bedroom, Kids Bedroom, Guest Room, Kitchen, Home Office*.
- **Dynamic Multi-Room Builder**: Allows adding unlimited secondary rooms (`+ Add Another Room`), specifying room type, key furniture, and individual fixture counts.
- **Fixture Counters**:
  - Lighting fixtures stepper (`+` / `-`).
  - Ceiling fans stepper (`+` / `-`).
- **Core Furniture Selection**:
  - Sofa requirement (*None, 2-Seater, 3-Seater, L-Shape Sectional, Recliner*).
  - Dining table preference (*None, 2-Seater Bistro, 4-Seater, 6-Seater Family*).
- **Extra Decor & Furniture Checklist**:
  - TV Unit / Entertainment Console.
  - Curtains & Blackout Drapes.
  - Floor Rug / Textured Carpet.
  - Indoor Air-Purifying Plants.
- **Interior Design Theme**: *Modern Minimalist, Traditional Indian Warmth, Contemporary Scandinavian, Bohemian Chic, Luxury Elegant*.
- **Additional Preferences & Room Dimensions**.

### 1.3 Arithmetic Validation & Budget Distribution
The recommendation engine allocates funds across four core buckets:
1. **Furniture Allocation (~55%)**: Centerpiece seating, tables, storage.
2. **Lighting & Electrical (~20%)**: Warm ambient LEDs, ceiling fans, task lights.
3. **Decor & Soft Furnishings (~15%)**: Curtains, rugs, wall accents, planters.
4. **Contingency Buffer (~10%)**: Delivery charges, installation hardware, emergency buffer.

Code guarantees:
$$\sum (\text{item estimated prices}) \le \text{Total Budget}$$
$$\text{Remaining Savings} = \text{Total Budget} - \sum (\text{item estimated prices})$$

### 1.4 Outbound Retailer Deep Links
- **Amazon India**: Sofas, entertainment units, home decor.
- **Flipkart**: Coffee tables, bedroom furniture, lighting bundles.
- **IKEA India**: Scandinavian modular storage, ambient lamps, rugs.

---

## 2. 🎉 Party & Event Planner

### 2.1 Objective
Eliminates the stress of event budgeting by calibrating venue, catering, decor, and entertainment expenses against guest headcounts.

### 2.2 Input Parameters
- **Total Budget (₹)**: Financial ceiling for the complete celebration.
- **Expected Guest Count**: Number of attendees (calibrates per-plate catering math).
- **Event Type**: *Birthday Party, Corporate Gathering, Wedding & Sangeet, Anniversary Celebration, Housewarming Party*.
- **Venue Preference**: *Home / Private Terrace, Community Banquet Hall, Outdoor Lawn / Resort, Cafe / Restaurant*.
- **Catering / Food Style**: *Vegetarian Buffet, Non-Veg Feast, High Tea & Snacks, Box Meals*.
- **Theme & Decor**: *Balloon Arch & Fairy Lights, Floral & Traditional Marigold, Neon & Glow Lounge, Minimalist Elegant Chic*.
- **Entertainment & Audio**: *DJ & Sound System, Live Acoustic Singer, Interactive Host / Magician, Curated Playlist Only*.
- **Special Requirements**.

### 2.3 Budget Allocation Buckets
1. **Food & Catering (~45–50%)**: Per-plate appetizer and main course budgeting.
2. **Venue & Seating (~20–25%)**: Space rental, seating arrangements.
3. **Decoration & Lighting (~15–18%)**: Photo backdrops, lighting, balloon arches.
4. **Entertainment & Sound (~10–12%)**: Audio systems, performers, playlist setup.

### 2.4 Service Provider Links
- **Zomato**: Curated catering menus, restaurant event reservations.
- **Swiggy**: Bulk snack deliveries, beverage setups.
- **OYO**: Party halls, banquet rooms, event venues.
- **Amazon**: DIY decoration packages, reusable fairy lights, party favors.

---

## 3. 💎 Jewelry & Styling Planner (Multimodal Vision)

### 3.1 Objective
Assists users in assembling coordinated jewelry ensembles that harmoniously complement their festive and wedding outfits while adhering to budget caps.

### 3.2 Input Parameters
- **Total Budget (₹)**: Maximum spending allowance.
- **Occasion**: *Wedding Reception, Festive / Diwali Puja, Sangeet / Engagement, Cocktail / Evening Party, Daily Office Chic*.
- **Jewelry Artistry & Style**: *Traditional Kundan & Polki, Temple Gold Artistry, Contemporary Diamond & Crystal, Minimalist Modern Silver*.
- **Outfit Description**: Textual description of fabric, neckline, and color palette.
- **Multimodal Outfit Photo Upload (Optional)**:
  - Drag-and-drop dropzone supporting JPEG, PNG, and WebP.
  - Client-side size validation (max 8MB).
  - Instant live image preview.
  - Multimodal base64 serialization transmitted directly into Gemini Vision.
- **Desired Jewelry Categories**: *Full Bridal Ensemble, Choker & Jhumkas, Statement Earrings Only, Bangles & Kadas*.

### 3.3 Stylist Output & Recommendations
- **Stylist Assessment**: Color harmony notes analyzing the relationship between garment tones and jewelry metals.
- **Itemized Recommendations**: Specific necklace, earring, and bangle suggestions with estimated prices and metal alloy recommendations.
- **Partner Platforms**: Direct search links on *Amazon*, *Flipkart*, and *Myntra*.

---

## 4. 🔄 Edit & Reuse Plan Workflow

Every generated plan can be reopened and adapted:
1. User accesses plan from **Dashboard** or **Saved History**.
2. Clicking **`🔄 Edit & Reuse This Plan`** automatically re-populates all form fields.
3. User adjusts budget or requirements.
4. Submitting triggers new AI recommendation and updates the timeline.
