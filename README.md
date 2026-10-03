# ⚡ PocketSmart AI — Your Smart Budget & Recommendation Assistant

[![Firebase Production](https://img.shields.io/badge/Production-Live-success?logo=firebase&logoColor=white)](https://pocketsmartai-app.web.app)
[![Architecture](https://img.shields.io/badge/Architecture-100%25%20Firebase%20Cloud--Native-blue?logo=google-cloud&logoColor=white)](docs/architecture.md)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%202.5%20Flash-orange?logo=google&logoColor=white)](docs/gemini.md)
[![Test Suite](https://img.shields.io/badge/Tests-Passing-brightgreen?logo=node.js&logoColor=white)](#-automated-testing)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

> **Live Web Application:** [https://pocketsmartai-app.web.app](https://pocketsmartai-app.web.app)  
> **Source Repository:** [https://github.com/jayapriya435/Budget_guide.git](https://github.com/jayapriya435/Budget_guide.git)

PocketSmart AI is an intelligent, budget-aware recommendation assistant designed to help users budget effectively across **Home Interiors**, **Events & Parties**, and **Jewelry Styling**. Built on a **100% Firebase Cloud-Native architecture**, it combines Google Gemini's advanced reasoning with client-side mathematical verification and curated retail platform search queries.

---

## 🌟 Key Features & Planning Modules

### 1. 🛋️ Home Interior Planner
- **Multi-Room Budgeting**: Primary room allocation with dynamic room builder (`+ Add Room`) for guest rooms, bedrooms, and kitchens.
- **Fixture & Furniture Controls**: Dedicated counter steppers for lights and ceiling fans, sofa/dining table options, and an extra decor checklist (TV Units, Curtains, Floor Rugs, Indoor Plants).
- **Arithmetic Verification**: Mathematically enforces that item totals never exceed the allocated budget, calculating real remaining savings.
- **Curated Store Links**: Generates verified search queries on **Amazon**, **Flipkart**, and **IKEA**.

### 2. 🎉 Party & Event Planner
- **Headcount Calibration**: Calibrates per-person catering and venue math across 5 celebration types (Birthday, Corporate, Wedding & Sangeet, Anniversary, Housewarming).
- **Comprehensive Allocation**: Distributes funds across Food & Catering, Venue & Seating, Decoration & Theme, and Entertainment.
- **Service Integration**: Outbound search queries for **Zomato**, **Swiggy**, **OYO**, and **Amazon**.

### 3. 💎 Jewelry & Styling Planner (Multimodal Vision)
- **Multimodal Vision Analysis**: Drag-and-drop outfit photo upload (JPEG, PNG, WebP $\le 8\text{ MB}$) analyzed directly via Gemini Vision.
- **Harmonious Styling**: Recommends occasion-specific metal alloys, necklace styles, jhumkas, and kadas tailored to garment necklines and color undertones.
- **Jewelry Search Queries**: Direct search links on **Amazon**, **Flipkart**, and **Myntra**.

### 4. 🔄 Edit & Reuse Plan Workflow
- Reopen any saved plan from the Cloud Firestore dashboard.
- Clicking **`🔄 Edit & Reuse This Plan`** automatically re-populates the input form, allowing instant adjustments and re-generation.

### 5. 🖨️ Clean Print & PDF Reports
- Dedicated `@media print` engine allows one-click generation of professional client-ready budget reports with no screen clutter.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Firebase Global CDN Edge                        │
│                   HTML5 • Modern CSS3 • Vanilla JS                     │
└──────────────┬──────────────────────────┬──────────────────────────────┘
               │                          │
      ┌────────▼────────┐        ┌────────▼────────┐
      │  Firebase Auth  │        │ Cloud Firestore │
      │  Google OAuth   │        │  User History   │
      └─────────────────┘        └─────────────────┘
               │
      ┌────────▼───────────────────────────────────┐
      │         Google Gemini REST API v1beta      │
      │  gemini-2.5-flash • Structured JSON Schema │
      └────────────────────────────────────────────┘
```

- **Hosting & CDN**: Firebase Hosting (HTTP/2, global edge distribution, automated SSL).
- **Authentication**: Firebase Authentication (Google OAuth + Email/Password + Instant Guest Demo).
- **Database**: Cloud Firestore (Real-time NoSQL, rule-protected security).
- **Storage**: Firebase Cloud Storage (Secure outfit photo persistence).
- **AI Core**: Google Gemini REST API (`gemini-2.5-flash` cascade with 9s timeout and offline fallback engine).

---

## 📁 Repository Structure

```text
PocketSmart_AI/
├── public/                      # Production Firebase Web App
│   ├── index.html               # Single Page Application (All Views)
│   ├── css/
│   │   ├── style.css            # Base styles & tokens
│   │   └── spa.css              # Dynamic components, cards & print media
│   └── js/
│       ├── app.js               # State manager, controllers & dynamic UI
│       ├── firebase-config.js   # Auth, Firestore & Storage services
│       └── gemini-service.js    # Gemini REST client & arithmetic validator
├── docs/                        # Complete Technical Documentation
│   ├── architecture.md          # System architecture & data flow
│   ├── planners.md              # Functional specifications for 3 planners
│   ├── gemini.md                # Prompt engineering & model cascade
│   ├── deployment.md            # Firebase Hosting & Firestore setup
│   └── security.md              # API Key restrictions & security headers
├── scripts/
│   └── test_client_engine.js    # Automated arithmetic & link validation tests
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml  # Automated GitHub Actions deployment
├── firestore.rules              # Cloud Firestore security rules
├── storage.rules                # Cloud Storage security rules
├── firebase.json                # Hosting rewrites, headers & cache policies
└── package.json                 # Project scripts & test runner
```

---

## 🚀 Quickstart & Local Development

### 1. Clone the Repository
```powershell
git clone https://github.com/jayapriya435/Budget_guide.git
cd Budget_guide
```

### 2. Run Automated Tests
PocketSmart AI includes a self-contained, zero-dependency Node.js automated test suite:
```powershell
npm test
```

### 3. Run Locally with Firebase Emulator or Live Server
You can serve the static files with any local HTTP server:
```powershell
npx serve public
```
Or with Firebase CLI:
```powershell
firebase serve --only hosting
```
Open **`http://localhost:5000`** in your browser.

---

## 🧪 Automated Testing

The automated test runner validates:
1. **Arithmetic Verification**: Confirms that calculated total costs equal the sum of item prices and are $\le \text{budget}$.
2. **Platform Deep Link Generator**: Validates outbound search queries for Amazon, Flipkart, IKEA, Swiggy, Zomato, and OYO.
3. **JSON Cleaner**: Verifies stripping of Markdown fences and syntax parsing.
4. **Dynamic Prompt Formatter**: Confirms serialization of multi-room arrays and decor checkboxes.
5. **Party Allocation Math**: Validates guest-calibrated budget distributions.

Run tests anytime:
```powershell
npm test
```

---

## 📚 Technical Documentation Suite

For in-depth design documents, please review:
- [System Architecture](docs/architecture.md)
- [Planners Functional Specification](docs/planners.md)
- [Gemini AI & Prompt Engineering](docs/gemini.md)
- [Deployment & Operations Guide](docs/deployment.md)
- [Security Hardening & API Key Protection](docs/security.md)

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
