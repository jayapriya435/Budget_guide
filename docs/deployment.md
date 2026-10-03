# PocketSmart AI — Deployment & Operations Guide

## 1. Production Hosting Environment

- **Production URL**: [https://pocketsmartai-app.web.app](https://pocketsmartai-app.web.app)
- **Firebase Project ID**: `pocketsmartai-app`
- **Primary Hosting CDN**: Firebase Global Edge CDN
- **Database**: Google Cloud Firestore (Multi-region)
- **Authentication**: Firebase Identity Platform (OAuth + Email)

---

## 2. Prerequisites for Deployment

1. **Node.js**: Version 18+ (tested on Node v24).
2. **Firebase CLI**: Install globally via:
   ```powershell
   npm install -g firebase-tools
   ```
3. **Login to Google Firebase**:
   ```powershell
   firebase login
   ```

---

## 3. Deployment Commands

### 3.1 Deploy Frontend Hosting Only
To deploy HTML, CSS, JavaScript, and asset updates to Firebase Hosting:
```powershell
firebase deploy --only hosting
```

### 3.2 Deploy Security Rules
To deploy Firestore security rules and Firebase Storage rules:
```powershell
firebase deploy --only firestore:rules,storage:rules
```

### 3.3 Full Deployment
To deploy all configurations, hosting files, and rules in one step:
```powershell
firebase deploy
```

---

## 4. Environment & Firebase Config (`public/js/firebase-config.js`)

Firebase Web App credentials configured in `public/js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDry2GDDt4moGMTK9exwT_VMQQdOUR8f7M",
  authDomain: "pocketsmartai-app.firebaseapp.com",
  projectId: "pocketsmartai-app",
  storageBucket: "pocketsmartai-app.firebasestorage.app",
  messagingSenderId: "857430482582",
  appId: "1:857430482582:web:454a73e281ef4e65e8acb7"
};
```

---

## 5. Security Rules Configuration

### 5.1 Cloud Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /recommendations/{recId} {
      allow read: if resource.data.is_public == true || (request.auth != null && resource.data.user_id == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5.2 Firebase Cloud Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /outfits/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 8 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 6. Custom Domain & SSL Setup

To attach a custom production domain (e.g. `pocketsmart.ai`):
1. Navigate to [Firebase Console &rarr; Hosting](https://console.firebase.google.com/project/pocketsmartai-app/hosting).
2. Click **Add Custom Domain**.
3. Enter your domain name and follow the DNS verification prompts to add `A` records.
4. Firebase automatically provisions and renews SSL certificates (Let's Encrypt) at zero cost.
