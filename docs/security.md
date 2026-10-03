# PocketSmart AI — Security Hardening Guide (Phase 21)

## 1. Google Cloud Console API Key Hardening

To prevent unauthorized consumption or quota abuse of your Google Gemini API key:

### Step 1: Open Google Cloud Credentials Console
Navigate to [Google Cloud Console &rarr; APIs & Services &rarr; Credentials](https://console.cloud.google.com/apis/credentials).

### Step 2: Select the Gemini API Key
Click on the API key being used (or the key generated from Google AI Studio).

### Step 3: Configure Application Restrictions (HTTP Referrers)
1. Under **Set an application restriction**, select **Websites**.
2. Under **Website restrictions**, add the following authorized domains:
   - `https://pocketsmartai-app.web.app/*`
   - `https://pocketsmartai-app.firebaseapp.com/*`
   - `http://localhost:*` *(for local development and testing)*
   - `http://127.0.0.1:*`

### Step 4: Configure API Restrictions
1. Under **API restrictions**, choose **Restrict key**.
2. Select **Generative Language API** from the dropdown.
3. Save changes.

*With these restrictions enabled, any request originating from an unauthorized domain or web origin will be rejected with an HTTP 403 Forbidden by Google's gateway, protecting your quota.*

---

## 2. Production HTTP Security Headers

Configured directly in [firebase.json](file:///c:/Users/P%20S%20RAM/PROJECTS/PocketSmart_AI/firebase.json):

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks. |
| `X-Frame-Options` | `DENY` | Protects users against clickjacking attempts. |
| `X-XSS-Protection` | `1; mode=block` | Enables browser built-in cross-site scripting filters. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Safeguards referrers across untrusted origins. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unwanted device hardware access. |
| `Cache-Control` | `public, max-age=31536000, immutable` | Long-term caching for immutable static assets. |

---

## 3. Data Protection & Firestore Security Rules

- Users are strictly constrained to their own records:
  ```javascript
  match /users/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```
- Plans can only be created with the creator's authenticated UID:
  ```javascript
  match /recommendations/{recId} {
    allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
    allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
  }
  ```
- Outfit photo uploads are restricted to `image/*` formats with an 8MB ceiling.
