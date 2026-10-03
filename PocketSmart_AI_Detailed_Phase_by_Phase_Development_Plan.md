# PocketSmart AI — Very Detailed Phase-by-Phase Development Plan

> **Source basis:** This development plan is derived from the complete 39-page PocketSmart AI project document, including its embedded screenshots/images. The source describes a budget-aware AI recommendation platform covering Home Interior, Party Planning, and Jewelry Planning, with user authentication, recommendation history, image input for jewelry, and Gemini-based recommendation generation.

---

## 0. Project Definition

### 0.1 Product Name

**PocketSmart AI — Your Smart Budget & Recommendation Assistant**

### 0.2 Core Product Goal

Build a web application where a user:

1. Creates an account.
2. Logs in.
3. Selects a planning category.
4. Enters a total budget and requirements.
5. Optionally uploads an image where applicable.
6. Sends the information to the AI recommendation engine.
7. Receives budget-aware, personalized recommendations.
8. Reviews product/service suggestions.
9. Saves and revisits previous recommendations.

### 0.3 Supported Planning Modules

| Module | Main Inputs | AI Output |
|---|---|---|
| Home Interior | Budget, rooms, quantities, preferences | Furniture, lighting, decor and related recommendations |
| Party Planner | Budget, guests, event type, venue/details | Food, venue, decoration and entertainment recommendations |
| Jewelry Planner | Budget, occasion, style, outfit image | Occasion/style-matched jewelry recommendations |

The source explicitly describes these three planning scenarios.

### 0.4 Main User Journey

```text
Landing Page
    ↓
Register
    ↓
Login
    ↓
Dashboard
    ↓
Choose Planner
    ├── Home Interior
    ├── Party
    └── Jewelry
    ↓
Enter Budget + Requirements
    ↓
Backend Validation
    ↓
Gemini AI Recommendation Engine
    ↓
Budget Allocation + Recommendations
    ↓
Recommendation Results
    ↓
View / Save / Reuse
    ↓
Recommendation History
```

---

# Phase 1 — Requirements, Scope & Project Foundation

## Objective

Convert the existing project description into a clearly defined, implementable product specification before writing production code.

## 1.1 Functional Requirements

Define the following functional requirements.

### Authentication

- User registration.
- User login.
- User logout.
- Password validation.
- Password hashing.
- JWT/token-based authorization.
- Protected planner routes.
- Session information.
- User-specific recommendation history.

The source describes `/register`, `/login`, `/logout`, `/token`, `/session-info`, and `/session-data`.

### Home Planner

Collect:

- Total budget.
- Room types.
- Number of rooms.
- Required furniture.
- Lighting requirements.
- Ceiling fan quantity.
- Dining table requirements.
- Additional requirements/preferences.

Generate:

- Budget allocation.
- Recommended categories.
- Product suggestions.
- Approximate prices.
- Platform/search links.
- Remaining budget.
- Cost-saving suggestions where supported.

### Party Planner

Collect:

- Total budget.
- Guest count.
- Event type.
- Venue information.
- Food/catering requirements.
- Decoration requirements.
- Entertainment requirements.

Generate:

- Food/catering suggestions.
- Venue suggestions.
- Decoration suggestions.
- Entertainment suggestions where supported.
- Budget allocation.
- Approximate cost.
- Remaining budget.

### Jewelry Planner

Collect:

- Budget.
- Occasion.
- Style preference.
- Outfit details.
- Optional outfit image.

Generate:

- Jewelry category.
- Style-matched recommendations.
- Color/style coordination.
- Approximate price.
- Shopping/search links.

The source specifically identifies optional outfit image analysis.

---

## 1.2 Non-Functional Requirements

Define:

- Responsive UI.
- Fast API response handling.
- Secure authentication.
- Environment-based secret management.
- Input validation.
- AI failure handling.
- Invalid/empty response handling.
- Mobile-friendly pages.
- Modular backend structure.
- Maintainable frontend templates.
- Recommendation history.
- Clear error messages.

---

## 1.3 Resolve Existing Documentation Inconsistencies

Before implementation, explicitly document these source inconsistencies rather than silently changing them.

### Flask vs FastAPI

The early architecture description mentions Flask, while later milestones and implementation screenshots describe FastAPI.

**Implementation decision:** use the implementation direction shown in the later milestones:

> **FastAPI + Python + Jinja2 + HTML/CSS/JavaScript**

### Gemini Model Naming

The document repeatedly refers to Gemini 1.5 Flash Pro, while screenshots may show newer model interfaces.

Create a configurable model setting instead of hardcoding the model name throughout the application.

Example:

```env
GEMINI_MODEL=<configured-model>
```

### External Platform Integration

The document mentions Amazon, Flipkart, IKEA, Swiggy, Zomato, OYO and other platforms.

Do not assume that every platform has a direct API integration.

Separate:

1. Actual API integrations.
2. Generated search URLs.
3. Mock/simulated integrations.
4. Future integrations.

---

# Phase 2 — Technical Architecture

## Objective

Establish the complete application architecture before implementing individual modules.

## 2.1 Recommended Architecture

```text
                    ┌─────────────────────┐
                    │      Browser        │
                    │ HTML/CSS/JS/Jinja2  │
                    └──────────┬──────────┘
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │ Routing + Auth + API│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Authentication    Planner Services   History
              │                │                │
              │                ▼                │
              │        Gemini Service           │
              │                │                │
              │                ▼                │
              │        Recommendation           │
              │          Processing              │
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                       External Platforms
             Amazon / Flipkart / IKEA / etc.
```

---

## 2.2 Backend Modules

Create clear separation between:

```text
backend/
├── main.py
├── config.py
├── dependencies.py
├── auth/
├── routes/
├── services/
├── models/
├── schemas/
├── database/
├── utils/
└── templates/
```

### Suggested responsibility

| Folder | Responsibility |
|---|---|
| `routes/` | HTTP/API endpoints |
| `services/` | Business logic |
| `models/` | Database models |
| `schemas/` | Request/response validation |
| `auth/` | Authentication |
| `database/` | Database connection/repositories |
| `utils/` | Shared helpers |
| `templates/` | Jinja2 frontend |
| `static/` | CSS/JS/images |

---

# Phase 3 — Development Environment Setup

## Objective

Create a reproducible local development environment.

## 3.1 Install Requirements

Set up:

- Python.
- Virtual environment.
- FastAPI.
- Uvicorn.
- Jinja2.
- Pydantic.
- Authentication libraries.
- HTTP client.
- Environment configuration.
- Gemini SDK/API client.
- Image processing dependency.

---

## 3.2 Environment Variables

Create:

```text
.env
.env.example
```

Example:

```env
APP_ENV=development
APP_NAME=PocketSmart AI

GEMINI_API_KEY=
GEMINI_MODEL=

JWT_SECRET_KEY=
JWT_ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=

DATABASE_URL=

CORS_ORIGINS=
```

Never commit the real `.env`.

---

## 3.3 Initial Repository

Create:

```text
pocketsmart-ai/
├── README.md
├── .gitignore
├── .env.example
├── requirements.txt
├── app/
├── tests/
├── docs/
└── scripts/
```

Initial Git workflow:

```text
main
└── development
    ├── feature/authentication
    ├── feature/home-planner
    ├── feature/party-planner
    ├── feature/jewelry-planner
    └── feature/recommendation-history
```

---

# Phase 4 — Gemini AI Setup & Validation

## Objective

Complete the AI foundation before building planner-specific functionality.

The source defines this as **Milestone 1: Gemini AI Initialization**.

---

## 4.1 Cloud/API Setup

Perform:

1. Create/configure Google Cloud or supported Gemini access.
2. Obtain API key.
3. Configure the selected Gemini model.
4. Store the key in environment variables.
5. Configure usage limits.
6. Test API connectivity.

The source explicitly instructs creating an API key and testing API connectivity.

---

## 4.2 Text-Only Test

Create a minimal test:

```text
Input:
Budget = ₹50,000
Requirement = Living room decoration

Expected:
A structured recommendation response.
```

Verify:

- API key works.
- Model responds.
- Response can be parsed.
- Errors are handled.
- Timeout is handled.

---

## 4.3 Multimodal Test

Test:

```text
Text + outfit image
```

Verify:

- Image upload works.
- Image is converted/processed correctly.
- Gemini receives the image.
- AI returns jewelry-related recommendations.

---

## 4.4 Create Central Gemini Service

Do not call Gemini directly from every route.

Create:

```text
services/gemini_service.py
```

Responsibilities:

- Gemini client initialization.
- Prompt execution.
- Text requests.
- Image requests.
- Response parsing.
- Error handling.
- Retry handling.
- Model configuration.
- Logging.

---

# Phase 5 — Data Models & Database

## Objective

Create persistent storage for users and recommendation history.

The source clearly requires user authentication, session data and recommendation history.

---

## 5.1 User Model

Fields:

```text
id
name
email
password_hash
created_at
updated_at
is_active
```

---

## 5.2 Recommendation Model

Fields:

```text
id
user_id
planner_type
budget
input_data
ai_response
created_at
```

Optional:

```text
title
summary
status
```

---

## 5.3 Session/User Tracking

Store only what is required for personalization and history.

Possible fields:

```text
user_id
session_id
last_activity
```

Avoid storing sensitive information unnecessarily.

---

## 5.4 Database Layer

Implement:

```text
database/
├── connection.py
├── models.py
├── repositories/
│   ├── user_repository.py
│   └── recommendation_repository.py
```

---

# Phase 6 — Authentication System

## Objective

Implement secure registration, login, logout and protected access.

The source explicitly documents these routes.

---

## 6.1 Registration

Endpoint:

```http
POST /register
```

Process:

```text
Receive registration
        ↓
Validate input
        ↓
Check duplicate email
        ↓
Hash password
        ↓
Create user
        ↓
Return success
```

---

## 6.2 Login

Endpoint:

```http
POST /login
```

Process:

```text
Email + password
        ↓
Find user
        ↓
Verify password
        ↓
Create JWT/session
        ↓
Return authentication result
```

---

## 6.3 Token

Endpoint:

```http
POST /token
```

Use the token to authorize protected routes.

---

## 6.4 Session Endpoints

Implement:

```http
GET /session-info
GET /session-data
```

These should return only appropriate authenticated-user information.

---

## 6.5 Logout

Endpoint:

```http
GET/POST /logout
```

The exact method can be selected during implementation.

---

## 6.6 Authentication Tests

Test:

- Valid registration.
- Duplicate email.
- Invalid password.
- Wrong credentials.
- Missing token.
- Expired token.
- Protected route access.
- Logout.
- Unauthorized access.

---

# Phase 7 — Common Planner Input Architecture

## Objective

Avoid building three completely separate systems.

Create a shared planner architecture.

---

## 7.1 Common Input Pipeline

```text
Frontend Form
      ↓
Pydantic Schema
      ↓
Validation
      ↓
Planner Service
      ↓
Prompt Builder
      ↓
Gemini Service
      ↓
Structured Response
      ↓
Result Formatter
      ↓
Frontend
```

---

## 7.2 Common Budget Validation

Validate:

- Budget exists.
- Budget > 0.
- Budget is numeric.
- Reasonable upper/lower limits.
- Required fields exist.
- Quantity is positive.
- Guest count is positive.

---

## 7.3 Standard Recommendation Schema

Use a consistent internal structure such as:

```json
{
  "planner": "home",
  "budget": 50000,
  "allocation": [],
  "recommendations": [],
  "total_estimated_cost": 0,
  "remaining_budget": 0,
  "notes": []
}
```

This makes frontend rendering much easier.

---

# Phase 8 — Home Interior Planner

## Objective

Implement the first complete recommendation module.

The source describes home planning around rooms, furniture, lighting and quantities.

---

## 8.1 Frontend Form

Create:

```text
Home Interior Planner
```

Inputs:

- Total budget.
- Room type.
- Room quantity.
- Lights.
- Ceiling fans.
- Dining table.
- Furniture.
- Decor.
- Additional requirements.

---

## 8.2 Dynamic Form Behaviour

Use JavaScript to allow:

```text
Add Room
Remove Room
Add Requirement
Change Quantity
```

Example:

```text
Living Room
  ├── Lights: 4
  ├── Fan: 1
  ├── Sofa: 1
  └── TV Unit: 1

Bedroom
  ├── Lights: 2
  ├── Fan: 1
  └── Wardrobe: 1
```

---

## 8.3 Home Prompt Builder

Create:

```text
services/prompts/home_prompt.py
```

Prompt should communicate:

- Total budget.
- Room information.
- Quantities.
- Style.
- Requirements.
- Indian context where required.
- Budget constraints.

---

## 8.4 Home Recommendation Logic

The service should generate:

```text
Category
Recommended item
Estimated price
Reason
Platform
Link/search link
```

---

## 8.5 Budget Allocation

Calculate:

```text
Total Budget
- Furniture allocation
- Lighting allocation
- Decor allocation
- Other allocation
= Remaining Budget
```

Do not rely entirely on the AI for arithmetic.

Where possible:

> AI decides recommendations; application code verifies calculations.

---

## 8.6 Home Result Page

Display:

- Total budget.
- Allocated amount.
- Remaining amount.
- Categories.
- Products.
- Estimated prices.
- Recommendation reasoning.
- External links.
- Cost-saving suggestions.

---

# Phase 9 — Party Planner

## Objective

Build the second planner using the same architecture.

---

## 9.1 Input Form

Fields:

```text
Budget
Guest count
Event type
Venue
Food preference
Decoration
Entertainment
Additional requirements
```

Event types can include the examples from the source:

- Birthday.
- Corporate.
- Wedding.

---

## 9.2 Party Budget Allocation

Possible categories:

```text
Food
Venue
Decoration
Entertainment
Accommodation
Miscellaneous
```

AI should recommend allocation based on the submitted event context.

Application code should verify:

```text
Sum(category allocations) <= total budget
```

---

## 9.3 Party Recommendation Service

Create:

```text
services/party_service.py
services/prompts/party_prompt.py
```

---

## 9.4 Platform/Search Integration

The source identifies:

- Swiggy.
- Zomato.
- OYO.

Implement external links/search generation where direct APIs are not available.

Clearly distinguish:

```text
Verified API data
vs
AI-generated recommendation
vs
External search link
```

---

## 9.5 Party Results Page

Show:

```text
Event Summary
Budget
Guest Count
Budget Allocation
Food
Venue
Decoration
Entertainment
Remaining Budget
```

---

# Phase 10 — Jewelry Planner & Image Analysis

## Objective

Implement the multimodal planner.

This is the module that differentiates PocketSmart AI from a basic text-only recommendation system.

---

## 10.1 Input Form

Fields:

```text
Budget
Occasion
Style
Jewelry preference
Outfit description
Outfit image
```

Image is optional according to the source.

---

## 10.2 Image Validation

Validate:

- File exists.
- Supported MIME type.
- File size.
- Image can be opened.
- Image can be processed.

Reject invalid images cleanly.

---

## 10.3 Image Processing

Pipeline:

```text
Upload Image
     ↓
Validate
     ↓
Open/Decode
     ↓
Resize/Optimize if needed
     ↓
Send image + prompt
     ↓
Gemini
```

---

## 10.4 Jewelry Prompt

Prompt should ask Gemini to consider:

- Outfit appearance.
- Colors.
- Occasion.
- Style.
- Budget.
- Matching jewelry categories.

---

## 10.5 Jewelry Result

Display:

```text
Occasion
Detected/identified outfit characteristics
Recommended jewelry type
Style
Color suggestion
Estimated price
Shopping/search link
Reason
```

Do not claim that image analysis is perfect.

---

# Phase 11 — Recommendation Engine

## Objective

Centralize recommendation logic so all three planners behave consistently.

---

## 11.1 Recommendation Service

Create:

```text
services/recommendation_service.py
```

Responsibilities:

- Identify planner.
- Build planner-specific prompt.
- Call Gemini.
- Parse output.
- Validate output.
- Calculate totals.
- Generate links.
- Save result.
- Return frontend-ready data.

---

## 11.2 Prompt Architecture

Use separate prompts:

```text
prompts/
├── home.py
├── party.py
├── jewelry.py
└── common.py
```

---

## 11.3 Structured AI Output

Prefer structured JSON output where supported.

Example:

```json
{
  "summary": "...",
  "budget_allocation": [
    {
      "category": "Lighting",
      "allocated_budget": 5000
    }
  ],
  "recommendations": [
    {
      "name": "...",
      "category": "...",
      "estimated_price": 2499,
      "platform": "Amazon",
      "search_url": "...",
      "reason": "..."
    }
  ],
  "total_estimated_cost": 0,
  "remaining_budget": 0
}
```

---

# Phase 12 — External Platform/Search Layer

## Objective

Handle product/service sources without tightly coupling the AI layer to specific websites.

---

## 12.1 Platform Registry

Create a configurable registry:

```text
Amazon
Flipkart
IKEA
Swiggy
Zomato
OYO
```

---

## 12.2 Link Generation

Create:

```text
services/platform_link_service.py
```

Responsibilities:

- Build search URLs.
- Map categories.
- Normalize search terms.
- Return external links.

---

## 12.3 Future API Integration

Keep the architecture ready for actual APIs.

```text
Recommendation Engine
        ↓
Platform Service
        ├── Search URL
        ├── API
        └── Future Provider
```

Do not hardcode platform-specific logic inside Gemini prompts.

---

# Phase 13 — Frontend Architecture

## Objective

Build the complete responsive UI described in the source.

---

## 13.1 Main Pages

Implement:

```text
/
 /register
 /login
 /dashboard
 /home-planner
 /home-recommendations
 /party-planner
 /party-recommendations
 /jewelry-planner
 /jewelry-recommendations
 /history
```

---

## 13.2 Landing Page

Include:

- PocketSmart AI introduction.
- Three planner categories.
- Main CTA.
- Product explanation.
- Testimonials section.
- Footer.

The source specifically includes a Home Page, Testimonials Page/section and Footer.

---

## 13.3 Dashboard

Display:

- Welcome/user information.
- Planner shortcuts.
- Recent recommendations.
- Saved/history items.
- Personalized information.

---

## 13.4 Planner UI

Each planner should have:

```text
Header
Progress/input section
Budget field
Dynamic requirements
Submit button
Loading state
Error state
```

---

## 13.5 Recommendation Cards

Cards should show:

```text
Product/service
Category
Estimated price
Reason
Platform
View/Search button
```

---

# Phase 14 — Recommendation History

## Objective

Implement persistent history as shown in the source.

---

## 14.1 History Endpoint

Implement:

```http
GET /history
```

---

## 14.2 History Page

Display:

```text
Date
Planner
Budget
Summary
View Details
```

---

## 14.3 Recommendation Details

Implement:

```http
GET /recommendations-details/{id}
```

or an equivalent route.

Allow users to reopen a previous recommendation.

---

## 14.4 Reuse Previous Plan

Future-friendly option:

```text
Previous Recommendation
        ↓
Reuse
        ↓
Edit Budget/Requirements
        ↓
Generate Again
```

---

# Phase 15 — UI/UX Refinement

## Objective

Make the prototype feel like a finished product.

---

## 15.1 Responsive Design

Test:

- Desktop.
- Laptop.
- Tablet.
- Android browser.
- iPhone browser.

---

## 15.2 Loading States

AI generation can take time.

Show:

```text
Analyzing your requirements...
Building your budget...
Finding suitable recommendations...
Preparing your results...
```

---

## 15.3 Error States

Handle:

- Invalid form.
- Gemini unavailable.
- API key failure.
- Timeout.
- Invalid AI response.
- Image upload failure.
- Session expiration.
- Database failure.

---

## 15.4 Empty States

Examples:

```text
No recommendations yet.
```

```text
No history available.
```

```text
Upload an outfit image for additional matching insights.
```

---

# Phase 16 — AI Response Validation & Safety

## Objective

Prevent malformed or misleading recommendations from breaking the application.

---

## 16.1 Validate AI JSON

Never directly render arbitrary AI output.

Pipeline:

```text
Gemini Response
      ↓
Parse
      ↓
Schema Validation
      ↓
Normalize
      ↓
Business Validation
      ↓
Render
```

---

## 16.2 Budget Validation

Verify:

```text
category_total <= user_budget
```

If over budget:

```text
Recalculate
or
Ask Gemini for a lower-cost alternative
```

---

## 16.3 Missing Recommendation Handling

The source explicitly calls for fallback/default recommendations.

Implement:

```text
AI response insufficient
        ↓
Fallback recommendation logic
        ↓
Return usable result
```

---

# Phase 17 — Testing

## Objective

Validate every planner end-to-end.

The source's Milestone 5 explicitly emphasizes real-world budget testing, response quality, budget adherence and platform accuracy.

---

## 17.1 Unit Tests

Test:

- Budget calculations.
- Input schemas.
- Authentication.
- Password hashing.
- JWT.
- Platform link generation.
- AI response parsing.
- Image validation.
- History queries.

---

## 17.2 Authentication Tests

Test:

```text
Register
Login
Logout
Invalid credentials
Duplicate user
Unauthorized planner
Expired token
```

---

## 17.3 Home Planner Tests

Test:

```text
₹10,000
₹50,000
₹1,00,000
```

Test:

- One room.
- Multiple rooms.
- Zero quantity.
- Missing room.
- Very large quantity.
- Missing budget.

---

## 17.4 Party Planner Tests

Test:

```text
Small birthday
Large birthday
Corporate event
Wedding
```

Test different guest counts and budgets.

---

## 17.5 Jewelry Tests

Test:

- Text only.
- Image + text.
- Different occasions.
- Different styles.
- Low budget.
- High budget.
- Invalid image.
- Unsupported file type.

---

# Phase 18 — End-to-End Testing

## Objective

Test the actual user journey rather than individual functions.

### Test Case 1 — Home

```text
Register
↓
Login
↓
Dashboard
↓
Home Planner
↓
₹50,000 budget
↓
Enter rooms/items
↓
Generate
↓
View recommendations
↓
Save
↓
Open history
↓
Open previous recommendation
```

### Test Case 2 — Party

```text
Login
↓
Party Planner
↓
₹1,00,000
↓
100 guests
↓
Wedding
↓
Generate
↓
Review allocation
↓
Review recommendations
```

### Test Case 3 — Jewelry

```text
Login
↓
Jewelry Planner
↓
₹10,000
↓
Wedding
↓
Upload outfit
↓
Generate
↓
Review matching recommendations
```

---

# Phase 19 — Prompt Optimization

## Objective

Improve recommendation quality based on real test results.

---

## 19.1 Evaluate

For every planner measure:

- Budget adherence.
- Relevance.
- Completeness.
- Price plausibility.
- Category accuracy.
- Style matching.
- Response format consistency.

---

## 19.2 Prompt Versioning

Use:

```text
home_v1
home_v2
party_v1
jewelry_v1
```

Track which prompt produces better results.

---

## 19.3 Prevent Hallucinated Data

If an exact product price cannot be verified:

Prefer wording such as:

```text
Estimated price
```

instead of presenting an AI-generated number as a guaranteed live price.

Similarly, distinguish recommendations from confirmed inventory/availability.

---

# Phase 20 — Performance Optimization

## Objective

Make the application responsive and economical.

---

## 20.1 Backend

Optimize:

- Database queries.
- AI calls.
- Image processing.
- Template rendering.
- External link generation.

---

## 20.2 AI Calls

Avoid unnecessary duplicate requests.

Example:

```text
One user submission
        ↓
One planner generation
        ↓
Store result
```

---

## 20.3 Image Optimization

For jewelry images:

- Validate.
- Resize if necessary.
- Compress where appropriate.
- Avoid storing unnecessary copies.

---

# Phase 21 — Security Hardening

## Objective

Prepare the application for real users.

---

## 21.1 Secrets

Never expose:

```text
GEMINI_API_KEY
JWT_SECRET_KEY
DATABASE_PASSWORD
```

in frontend code.

---

## 21.2 Authentication

Implement:

- Strong password hashing.
- Token expiry.
- Protected routes.
- Proper logout/session handling.

---

## 21.3 File Upload Security

For jewelry images:

- MIME validation.
- Extension validation.
- File-size limits.
- Safe temporary storage.
- Randomized filenames.
- No executable uploads.

---

## 21.4 Input Security

Protect against:

- SQL injection.
- Template injection.
- XSS.
- Malformed JSON.
- Oversized requests.

Use framework/schema validation.

---

## 21.5 CORS

Configure CORS for known frontend origins rather than allowing unrestricted origins in production.

The source explicitly calls for CORS configuration.

---

# Phase 22 — Logging & Monitoring

## Objective

Make failures diagnosable.

Log:

```text
Request ID
User ID
Planner type
Request duration
AI success/failure
Validation failure
Database failure
```

Do not log:

- API keys.
- Passwords.
- Sensitive tokens.

---

# Phase 23 — Deployment Preparation

## Objective

Prepare the FastAPI application for production deployment.

---

## 23.1 Production Structure

Example:

```text
server/
├── app/
├── .env
├── requirements.txt
├── run.sh
└── logs/
```

---

## 23.2 Production Server

Run FastAPI through Uvicorn or an appropriate production process manager.

Example architecture:

```text
Internet
   ↓
Nginx
   ↓
FastAPI
   ↓
Database
   ↓
Gemini API
```

---

## 23.3 HTTPS

Configure:

- Domain.
- SSL certificate.
- HTTPS redirect.
- Secure cookies if sessions use cookies.

---

# Phase 24 — Production Database

## Objective

Move from development storage to production-grade persistent storage.

Configure:

- Production database.
- Database migrations.
- Backup.
- Connection pooling.
- Environment-specific configuration.

---

# Phase 25 — Production AI Configuration

## Objective

Ensure Gemini configuration is production-ready.

Configure:

```env
GEMINI_MODEL=
GEMINI_API_KEY=
```

Set:

- Request limits.
- Error handling.
- Timeouts.
- Retry policy.
- Logging.
- Usage monitoring.

---

# Phase 26 — Final UI Verification

Review every screen shown/described in the source:

```text
Landing
Register
Login
Dashboard
Home Planner
Home Recommendations
Party Planner
Party Recommendations
Jewelry Planner
Jewelry Recommendations
History
```

Verify:

- Navigation.
- Mobile layout.
- Buttons.
- Forms.
- Error states.
- Loading states.
- External links.
- Logout.
- History.

---

# Phase 27 — Final Acceptance Testing

## Acceptance Criteria

### Authentication

- [ ] User can register.
- [ ] User can login.
- [ ] User can logout.
- [ ] Protected pages require authentication.
- [ ] Session information works.

### Home

- [ ] Budget accepted.
- [ ] Rooms accepted.
- [ ] Quantities accepted.
- [ ] AI recommendation generated.
- [ ] Budget allocation displayed.
- [ ] Recommendations displayed.
- [ ] External links work.
- [ ] History saved.

### Party

- [ ] Budget accepted.
- [ ] Guest count accepted.
- [ ] Event type accepted.
- [ ] Food recommendations generated.
- [ ] Venue recommendations generated.
- [ ] Decoration recommendations generated.
- [ ] Budget allocation displayed.
- [ ] History saved.

### Jewelry

- [ ] Budget accepted.
- [ ] Occasion accepted.
- [ ] Style accepted.
- [ ] Image optional.
- [ ] Image validation works.
- [ ] Gemini image analysis works.
- [ ] Jewelry recommendations generated.
- [ ] History saved.

### General

- [ ] Responsive.
- [ ] Secure.
- [ ] AI errors handled.
- [ ] Invalid input handled.
- [ ] AI response validated.
- [ ] Production environment works.

---

# Phase 28 — Documentation

Create:

```text
README.md
docs/
├── architecture.md
├── api.md
├── authentication.md
├── gemini.md
├── planners.md
├── deployment.md
├── testing.md
└── troubleshooting.md
```

README should explain:

1. What PocketSmart AI does.
2. Features.
3. Architecture.
4. Technologies.
5. Installation.
6. Environment variables.
7. Running locally.
8. API endpoints.
9. Planner workflows.
10. Production deployment.

---

# Phase 29 — Final Project Structure

A clean final structure can be:

```text
pocketsmart-ai/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   │
│   ├── auth/
│   │   ├── routes.py
│   │   ├── service.py
│   │   └── security.py
│   │
│   ├── routes/
│   │   ├── home.py
│   │   ├── party.py
│   │   ├── jewelry.py
│   │   ├── history.py
│   │   └── session.py
│   │
│   ├── services/
│   │   ├── gemini_service.py
│   │   ├── recommendation_service.py
│   │   ├── budget_service.py
│   │   ├── image_service.py
│   │   └── platform_link_service.py
│   │
│   ├── prompts/
│   │   ├── common.py
│   │   ├── home.py
│   │   ├── party.py
│   │   └── jewelry.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── home.py
│   │   ├── party.py
│   │   ├── jewelry.py
│   │   └── recommendation.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   └── recommendation.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   └── repositories/
│   │
│   ├── templates/
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard.html
│   │   ├── home_planner.html
│   │   ├── home_results.html
│   │   ├── party_planner.html
│   │   ├── party_results.html
│   │   ├── jewelry_planner.html
│   │   ├── jewelry_results.html
│   │   └── history.html
│   │
│   └── static/
│       ├── css/
│       ├── js/
│       └── images/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
├── scripts/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

# Phase 30 — Recommended Development Order

Do NOT develop all three planners simultaneously.

Use this order:

```text
PHASE 1
Requirements + Architecture
        ↓
PHASE 2
Project Setup
        ↓
PHASE 3
Gemini Integration
        ↓
PHASE 4
Database
        ↓
PHASE 5
Authentication
        ↓
PHASE 6
Common Recommendation Engine
        ↓
PHASE 7
Home Planner
        ↓
PHASE 8
Home UI + Results
        ↓
PHASE 9
Party Planner
        ↓
PHASE 10
Party UI + Results
        ↓
PHASE 11
Jewelry Planner
        ↓
PHASE 12
Image Analysis
        ↓
PHASE 13
History
        ↓
PHASE 14
Testing
        ↓
PHASE 15
Prompt Optimization
        ↓
PHASE 16
Security
        ↓
PHASE 17
Deployment
        ↓
PHASE 18
Final Acceptance
```

---

# Final Product Architecture

```text
                         POCKETSMART AI
                              │
               ┌──────────────┴──────────────┐
               │                             │
          USER ACCOUNT                  PLANNER SYSTEM
               │                             │
      ┌────────┼────────┐          ┌─────────┼─────────┐
      │        │        │          │         │         │
   Register  Login   Session     HOME      PARTY    JEWELRY
                                      │         │         │
                                      └─────────┼─────────┘
                                                │
                                         User Inputs
                                                │
                                                ▼
                                        Validation Layer
                                                │
                                                ▼
                                      Recommendation Engine
                                                │
                                      ┌─────────┴─────────┐
                                      │                   │
                                  Gemini AI          Budget Logic
                                      │                   │
                                      └─────────┬─────────┘
                                                │
                                                ▼
                                      Structured Results
                                                │
                              ┌─────────────────┼─────────────────┐
                              │                 │                 │
                           Products          Services         Suggestions
                              │                 │                 │
                              └─────────────────┼─────────────────┘
                                                │
                                                ▼
                                       Result Presentation
                                                │
                                                ▼
                                      Recommendation History
```

---

# Definition of Done

PocketSmart AI should be considered complete only when:

- [ ] The application starts successfully.
- [ ] Users can register and login.
- [ ] Authentication protects user-specific data.
- [ ] Dashboard works.
- [ ] Home Planner works end-to-end.
- [ ] Party Planner works end-to-end.
- [ ] Jewelry Planner works end-to-end.
- [ ] Jewelry image upload works.
- [ ] Gemini generates recommendations.
- [ ] AI responses are validated.
- [ ] Budget calculations are verified by application logic.
- [ ] Recommendations contain appropriate platform/search links.
- [ ] Recommendation history is persistent.
- [ ] Previous recommendations can be viewed.
- [ ] Invalid input is handled.
- [ ] AI/API failure is handled.
- [ ] Mobile UI works.
- [ ] Secrets are protected.
- [ ] Production configuration is separated from development.
- [ ] Automated tests pass.
- [ ] End-to-end tests pass.
- [ ] Documentation is complete.
- [ ] Production deployment is verified.

---

# Important Source-Based Notes

The original document positions PocketSmart AI as a practical combination of **generative AI, budget planning, recommendation generation, web technologies, authentication, session handling, and a responsive frontend**. fileciteturn0file0L286-L303

The document's development milestones are broadly:

1. Gemini AI Initialization.
2. Core Functionality Development.
3. FastAPI Backend Integration.
4. UI Development.
5. Testing & Optimization.

This plan expands those milestones into implementation-ready phases while retaining the three original planner domains and the authentication/history functionality described in the source. fileciteturn0file0L101-L109 fileciteturn0file0L218-L241
