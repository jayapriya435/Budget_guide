/**
 * PocketSmart AI — Firebase SDK Client & Cloud Services
 * Integrates Firebase Auth, Cloud Firestore, and Firebase Storage.
 */

const firebaseConfig = {
  projectId: "pocketsmartai-app",
  appId: "1:857430482582:web:454a73e281ef4e65e8acb7",
  storageBucket: "pocketsmartai-app.firebasestorage.app",
  apiKey: "AIzaSyDry2GDDt4moGMTK9exwT_VMQQdOUR8f7M",
  authDomain: "pocketsmartai-app.firebaseapp.com",
  messagingSenderId: "857430482582",
  projectNumber: "857430482582"
};

// Initialize Firebase
let app, auth, db, storage, googleProvider;
let isFirebaseInitialized = false;

try {
  if (typeof firebase !== 'undefined') {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    isFirebaseInitialized = true;
    console.log("⚡ PocketSmart AI: Firebase initialized successfully (Project: pocketsmartai-app)");
  } else {
    console.warn("Firebase SDK not loaded, running in offline fallback mode.");
  }
} catch (err) {
  console.error("Firebase initialization warning:", err);
}

// ==================== Authentication Service ====================

const AuthService = {
  currentUser: null,
  listeners: [],

  init() {
    if (!isFirebaseInitialized) {
      // Check localStorage for offline demo user
      const stored = localStorage.getItem('ps_local_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          this.notify();
        } catch (e) {}
      }
      return;
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null
        };
        localStorage.setItem('ps_local_user', JSON.stringify(this.currentUser));
      } else {
        this.currentUser = null;
        localStorage.removeItem('ps_local_user');
      }
      this.notify();
    });
  },

  onStateChange(callback) {
    this.listeners.push(callback);
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
  },

  notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  },

  async login(email, password) {
    if (!isFirebaseInitialized) {
      this.currentUser = { uid: 'offline_user_' + Date.now(), email, displayName: email.split('@')[0] };
      localStorage.setItem('ps_local_user', JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    }
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async register(email, password, displayName) {
    if (!isFirebaseInitialized) {
      this.currentUser = { uid: 'offline_user_' + Date.now(), email, displayName: displayName || email.split('@')[0] };
      localStorage.setItem('ps_local_user', JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    }
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName && cred.user) {
      await cred.user.updateProfile({ displayName });
    }
    return cred.user;
  },

  async loginWithGoogle() {
    if (!isFirebaseInitialized) {
      this.currentUser = { uid: 'demo_google_user', email: 'guest@pocketsmart.ai', displayName: 'Smart Planner Guest' };
      localStorage.setItem('ps_local_user', JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    }
    const result = await auth.signInWithPopup(googleProvider);
    return result.user;
  },

  async logout() {
    if (isFirebaseInitialized && auth) {
      await auth.signOut();
    }
    this.currentUser = null;
    localStorage.removeItem('ps_local_user');
    this.notify();
  }
};

// ==================== Firestore Database Service ====================

const FirestoreService = {
  LOCAL_STORAGE_KEY: 'ps_saved_recommendations',

  getLocalPlans() {
    try {
      return JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveLocalPlan(plan) {
    const plans = this.getLocalPlans();
    plans.unshift(plan);
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(plans));
    return plan;
  },

  deleteLocalPlan(planId) {
    const plans = this.getLocalPlans().filter(p => p.id !== planId);
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(plans));
  },

  async savePlan(planData) {
    const planId = 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const user = AuthService.currentUser;

    const fullPlan = {
      id: planId,
      user_id: user ? user.uid : 'guest',
      user_email: user ? user.email : 'guest',
      planner_type: planData.planner_type,
      title: planData.title,
      budget: Number(planData.budget),
      total_estimated_cost: Number(planData.total_estimated_cost),
      remaining_budget: Number(planData.remaining_budget),
      allocation: planData.allocation || [],
      recommendations: planData.recommendations || [],
      summary: planData.summary || '',
      savings_suggestions: planData.savings_suggestions || [],
      notes: planData.notes || [],
      input_data: planData.input_data || {},
      image_url: planData.image_url || null,
      created_at: new Date().toISOString()
    };

    // Always persist to local backup for instant access
    this.saveLocalPlan(fullPlan);

    // Save to Firestore if available and user is authenticated
    if (isFirebaseInitialized && db && user && user.uid !== 'guest') {
      try {
        await db.collection('recommendations').doc(planId).set(fullPlan);
        console.log(`Saved plan ${planId} to Cloud Firestore.`);
      } catch (e) {
        console.warn("Firestore write skipped (using local storage):", e.message);
      }
    }

    return fullPlan;
  },

  async getUserPlans() {
    const user = AuthService.currentUser;
    const localPlans = this.getLocalPlans();

    if (!isFirebaseInitialized || !db || !user || user.uid === 'guest') {
      return localPlans;
    }

    try {
      const snapshot = await db.collection('recommendations')
        .where('user_id', '==', user.uid)
        .get();

      if (!snapshot.empty) {
        const firestorePlans = [];
        snapshot.forEach(doc => firestorePlans.push(doc.data()));
        firestorePlans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return firestorePlans;
      }
    } catch (err) {
      console.warn("Firestore fetch notice (using cached local plans):", err.message);
    }

    return localPlans;
  },

  async deletePlan(planId) {
    this.deleteLocalPlan(planId);

    if (isFirebaseInitialized && db) {
      try {
        await db.collection('recommendations').doc(planId).delete();
      } catch (e) {
        console.warn("Firestore delete failed:", e.message);
      }
    }
  }
};

// ==================== Storage Service ====================

const StorageService = {
  async uploadImage(file, userId = 'guest') {
    if (!isFirebaseInitialized || !storage) {
      // Fallback: convert to base64 Data URL for local preview
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `uploads/${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const storageRef = storage.ref().child(filename);
      const snapshot = await storageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return downloadURL;
    } catch (e) {
      console.warn("Firebase Storage upload error, falling back to Data URL:", e);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    }
  }
};

// Initialize auth state monitoring
document.addEventListener('DOMContentLoaded', () => {
  AuthService.init();
});
