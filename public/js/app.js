/**
 * PocketSmart AI — Master Application Controller
 * Handles SPA routing, interactive planners, results rendering, history management,
 * auth state UI, and toast notifications.
 */

const App = {
  currentPlan: null,
  activeView: 'landing',

  init() {
    this.bindNavigation();
    this.bindAuthEvents();
    this.bindPlannerForms();
    this.bindSettings();
    this.handleInitialRoute();

    // Listen to Firebase auth changes to update navigation and dashboard
    AuthService.onStateChange((user) => {
      this.updateAuthUI(user);
      if (this.activeView === 'dashboard' || this.activeView === 'history') {
        this.renderHistory();
      }
    });
  },

  // ==================== Routing & View Switching ====================
  navigateTo(viewId, pushState = true) {
    const validViews = ['landing', 'home', 'party', 'jewelry', 'results', 'dashboard', 'history'];
    if (!validViews.includes(viewId)) viewId = 'landing';

    this.activeView = viewId;

    // Hide all view containers
    document.querySelectorAll('.app-view').forEach(el => el.classList.remove('active'));

    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update browser URL hash
    if (pushState) {
      history.pushState(null, '', `#${viewId}`);
    }

    // View-specific initializers
    if (viewId === 'dashboard' || viewId === 'history') {
      this.renderHistory();
    }
  },

  handleInitialRoute() {
    const hash = window.location.hash.replace('#', '') || 'landing';
    this.navigateTo(hash, false);

    window.addEventListener('popstate', () => {
      const h = window.location.hash.replace('#', '') || 'landing';
      this.navigateTo(h, false);
    });
  },

  bindNavigation() {
    document.querySelectorAll('[data-navigate]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-navigate');
        this.navigateTo(targetView);
      });
    });
  },

  // ==================== Toast Notifications ====================
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  },

  // ==================== Auth Modal & State ====================
  bindAuthEvents() {
    const authModal = document.getElementById('auth-modal');
    const openBtns = document.querySelectorAll('.open-auth-btn');
    const closeBtn = document.getElementById('close-auth-modal');
    const switchTabBtns = document.querySelectorAll('[data-auth-tab]');

    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-auth-mode') || 'signin';
        this.switchAuthTab(mode);
        authModal.classList.add('modal-open');
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => authModal.classList.remove('modal-open'));
    }

    switchTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchAuthTab(btn.getAttribute('data-auth-tab'));
      });
    });

    // Sign In Form
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
      signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const pass = document.getElementById('signin-password').value;
        const submitBtn = signinForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Signing in...';
          await AuthService.login(email, pass);
          authModal.classList.remove('modal-open');
          this.showToast('Welcome back! Successfully signed in.', 'success');
        } catch (err) {
          this.showToast(err.message || 'Login failed. Please check credentials.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Sign In';
        }
      });
    }

    // Sign Up Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-password').value;
        const submitBtn = signupForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Creating account...';
          await AuthService.register(email, pass, name);
          authModal.classList.remove('modal-open');
          this.showToast('Account created successfully!', 'success');
        } catch (err) {
          this.showToast(err.message || 'Registration failed.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Create Account';
        }
      });
    }

    // Google Sign-In
    const googleBtns = document.querySelectorAll('.google-signin-btn');
    googleBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await AuthService.loginWithGoogle();
          authModal.classList.remove('modal-open');
          this.showToast('Signed in with Google!', 'success');
        } catch (err) {
          this.showToast('Google sign-in cancelled or failed.', 'error');
        }
      });
    });

    // Logout
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await AuthService.logout();
        this.showToast('Signed out successfully.', 'info');
        this.navigateTo('landing');
      });
    });
  },

  switchAuthTab(tab) {
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-auth-tab') === tab);
    });
    document.getElementById('signin-tab-content').style.display = tab === 'signin' ? 'block' : 'none';
    document.getElementById('signup-tab-content').style.display = tab === 'signup' ? 'block' : 'none';
  },

  updateAuthUI(user) {
    const unauthNav = document.getElementById('nav-unauthenticated');
    const authNav = document.getElementById('nav-authenticated');
    const userNameSpan = document.getElementById('nav-user-name');
    const userAvatar = document.getElementById('nav-user-avatar');

    if (user) {
      if (unauthNav) unauthNav.style.display = 'none';
      if (authNav) authNav.style.display = 'flex';
      if (userNameSpan) userNameSpan.textContent = user.displayName || user.email;
      if (userAvatar) {
        userAvatar.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
      }
    } else {
      if (unauthNav) unauthNav.style.display = 'flex';
      if (authNav) authNav.style.display = 'none';
    }
  },

  // ==================== Planner Form Handlers ====================
  bindPlannerForms() {
    // 1. Home Interior Planner Form
    const homeForm = document.getElementById('form-home-planner');
    if (homeForm) {
      homeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          budget: parseFloat(document.getElementById('home-budget').value),
          room_type: document.getElementById('home-room-type').value,
          room_count: parseInt(document.getElementById('home-room-count').value, 10) || 1,
          lights_count: parseInt(document.getElementById('home-lights').value, 10) || 4,
          fans_count: parseInt(document.getElementById('home-fans').value, 10) || 1,
          sofa_requirement: document.getElementById('home-sofa').value,
          dining_table: document.getElementById('home-dining').value,
          style_preference: document.getElementById('home-style').value,
          additional_notes: document.getElementById('home-notes').value
        };

        if (isNaN(data.budget) || data.budget <= 0) {
          this.showToast('Please enter a valid budget greater than ₹0.', 'error');
          return;
        }

        await this.executePlanGeneration('home', data);
      });
    }

    // 2. Party & Event Planner Form
    const partyForm = document.getElementById('form-party-planner');
    if (partyForm) {
      partyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          budget: parseFloat(document.getElementById('party-budget').value),
          event_type: document.getElementById('party-event-type').value,
          guest_count: parseInt(document.getElementById('party-guests').value, 10) || 30,
          venue_type: document.getElementById('party-venue').value,
          food_preference: document.getElementById('party-food').value,
          theme: document.getElementById('party-theme').value,
          entertainment: document.getElementById('party-entertainment').value,
          additional_notes: document.getElementById('party-notes').value
        };

        if (isNaN(data.budget) || data.budget <= 0) {
          this.showToast('Please enter a valid budget greater than ₹0.', 'error');
          return;
        }

        await this.executePlanGeneration('party', data);
      });
    }

    // 3. Jewelry Planner Form & Image Upload
    const jewelryForm = document.getElementById('form-jewelry-planner');
    const imageInput = document.getElementById('jewelry-outfit-image');
    const imagePreviewContainer = document.getElementById('jewelry-image-preview');
    let loadedImageBase64 = null;
    let selectedImageFile = null;

    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (!file.type.startsWith('image/')) {
            this.showToast('Please upload a valid image file (JPEG, PNG, WebP).', 'error');
            return;
          }
          selectedImageFile = file;
          const reader = new FileReader();
          reader.onload = (ev) => {
            loadedImageBase64 = ev.target.result;
            if (imagePreviewContainer) {
              imagePreviewContainer.innerHTML = `
                <div class="image-preview-card">
                  <img src="${loadedImageBase64}" alt="Outfit preview" />
                  <button type="button" class="btn-remove-image" id="btn-remove-outfit">&times;</button>
                  <span class="preview-caption">✨ Outfit loaded for AI vision matching</span>
                </div>
              `;
              document.getElementById('btn-remove-outfit')?.addEventListener('click', () => {
                imageInput.value = '';
                loadedImageBase64 = null;
                selectedImageFile = null;
                imagePreviewContainer.innerHTML = '';
              });
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (jewelryForm) {
      jewelryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
          budget: parseFloat(document.getElementById('jewelry-budget').value),
          occasion: document.getElementById('jewelry-occasion').value,
          style: document.getElementById('jewelry-style').value,
          outfit_description: document.getElementById('jewelry-outfit-desc').value,
          jewelry_types: document.getElementById('jewelry-types').value,
          additional_notes: document.getElementById('jewelry-notes').value
        };

        if (isNaN(data.budget) || data.budget <= 0) {
          this.showToast('Please enter a valid budget greater than ₹0.', 'error');
          return;
        }

        // Upload to Firebase Storage in parallel if file selected
        let uploadedUrl = null;
        if (selectedImageFile) {
          const user = AuthService.currentUser;
          uploadedUrl = await StorageService.uploadImage(selectedImageFile, user ? user.uid : 'guest');
        }

        await this.executePlanGeneration('jewelry', data, loadedImageBase64, uploadedUrl);
      });
    }
  },

  // ==================== Plan Generation Execution ====================
  async executePlanGeneration(plannerType, formData, imageBase64 = null, imageUrl = null) {
    const loadingOverlay = document.getElementById('ai-loading-overlay');
    const loadingStepText = document.getElementById('loading-step-text');
    const loadingBarFill = document.getElementById('loading-bar-fill');

    if (loadingOverlay) loadingOverlay.classList.add('loading-active');

    const steps = [
      "Analyzing budget and constraints...",
      "Calibrating mathematical category allocations...",
      "Matching verified products on Amazon, Flipkart, IKEA & Swiggy...",
      "Optimizing savings and final calculations..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      if (loadingStepText) loadingStepText.textContent = steps[stepIdx];
      if (loadingBarFill) loadingBarFill.style.width = `${((stepIdx + 1) / steps.length) * 85}%`;
    }, 700);

    try {
      const plan = await GeminiService.generatePlan(plannerType, formData, imageBase64);
      if (imageUrl) plan.image_url = imageUrl;

      this.currentPlan = plan;

      // Auto-save plan to Firestore/Local
      await FirestoreService.savePlan(plan);

      clearInterval(interval);
      if (loadingBarFill) loadingBarFill.style.width = '100%';

      setTimeout(() => {
        if (loadingOverlay) loadingOverlay.classList.remove('loading-active');
        this.renderResults(plan);
        this.navigateTo('results');
        this.showToast('Smart budget plan generated successfully!', 'success');
      }, 400);

    } catch (err) {
      clearInterval(interval);
      if (loadingOverlay) loadingOverlay.classList.remove('loading-active');
      this.showToast('Plan generation encountered an error: ' + err.message, 'error');
    }
  },

  // ==================== Render Results View ====================
  renderResults(plan) {
    const container = document.getElementById('results-content');
    if (!container) return;

    const remaining = plan.remaining_budget;
    const isUnderBudget = remaining >= 0;
    const badgeClass = isUnderBudget ? 'badge-success' : 'badge-warning';

    // Build Allocations HTML
    const allocTotal = plan.allocation.reduce((sum, a) => sum + a.allocated_budget, 0) || plan.budget;
    const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    let barSegmentsHtml = '';
    let allocLegendHtml = '';

    plan.allocation.forEach((item, idx) => {
      const color = colors[idx % colors.length];
      const pct = item.percentage || Math.round((item.allocated_budget / allocTotal) * 100);
      barSegmentsHtml += `
        <div class="allocation-segment" style="width: ${pct}%; background-color: ${color};" title="${item.category}: ₹${item.allocated_budget.toLocaleString('en-IN')} (${pct}%)"></div>
      `;
      allocLegendHtml += `
        <div class="legend-item">
          <span class="legend-dot" style="background-color: ${color};"></span>
          <span class="legend-cat">${item.category}</span>
          <span class="legend-amt">₹${item.allocated_budget.toLocaleString('en-IN')}</span>
          <span class="legend-pct">(${pct}%)</span>
        </div>
      `;
    });

    // Build Recommendations HTML
    let recsHtml = '';
    plan.recommendations.forEach(rec => {
      const platformLogo = this.getPlatformLogo(rec.platform);
      recsHtml += `
        <div class="rec-card">
          <div class="rec-card-header">
            <span class="rec-category-badge">${rec.category}</span>
            <span class="rec-platform-pill ${rec.platform.toLowerCase()}">
              ${platformLogo} ${rec.platform}
            </span>
          </div>
          <h4 class="rec-item-name">${rec.name}</h4>
          <p class="rec-reason">${rec.reason}</p>
          <div class="rec-card-footer">
            <div class="rec-price-block">
              <span class="price-label">Estimated Price</span>
              <span class="price-val">₹${rec.estimated_price.toLocaleString('en-IN')}</span>
            </div>
            <a href="${rec.search_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary">
              View on ${rec.platform} &rarr;
            </a>
          </div>
        </div>
      `;
    });

    // Build Savings Tips
    let savingsHtml = '';
    (plan.savings_suggestions || []).forEach(tip => {
      savingsHtml += `<li><span class="tip-icon">💡</span> ${tip}</li>`;
    });

    // Image preview if present
    let outfitImageHtml = '';
    if (plan.image_url) {
      outfitImageHtml = `
        <div class="results-outfit-preview">
          <img src="${plan.image_url}" alt="Analyzed Outfit" />
          <span>Multimodal Vision Analyzed</span>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Results Header -->
      <div class="results-header-card">
        <div class="results-header-meta">
          <div class="meta-left">
            <span class="badge ${badgeClass}">✓ Mathematically Verified</span>
            <h2>${plan.title}</h2>
            <p class="results-summary">${plan.summary}</p>
          </div>
          ${outfitImageHtml}
        </div>

        <!-- Budget Quick Stats -->
        <div class="budget-stat-grid">
          <div class="stat-card">
            <span class="stat-label">Total Budget</span>
            <span class="stat-value">₹${plan.budget.toLocaleString('en-IN')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Estimated Cost</span>
            <span class="stat-value text-primary">₹${plan.total_estimated_cost.toLocaleString('en-IN')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">${isUnderBudget ? 'Remaining Savings' : 'Budget Deficit'}</span>
            <span class="stat-value ${isUnderBudget ? 'text-success' : 'text-danger'}">₹${Math.abs(remaining).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <!-- Budget Allocation Bar -->
      <div class="allocation-card">
        <h3>Budget Distribution</h3>
        <div class="allocation-bar-track">
          ${barSegmentsHtml}
        </div>
        <div class="allocation-legend-grid">
          ${allocLegendHtml}
        </div>
      </div>

      <!-- Item Recommendations -->
      <div class="recommendations-section">
        <div class="section-title-row">
          <h3>Curated Recommendations (${plan.recommendations.length} items)</h3>
          <span class="subtitle">Direct platform links calibrated to your spend limit</span>
        </div>
        <div class="rec-grid">
          ${recsHtml}
        </div>
      </div>

      <!-- Savings & Notes -->
      <div class="tips-grid">
        <div class="tips-card">
          <h4>💡 Smart Money-Saving Suggestions</h4>
          <ul class="tips-list">
            ${savingsHtml}
          </ul>
        </div>
        <div class="tips-card">
          <h4>📋 Actionable Next Steps</h4>
          <ul class="tips-list">
            <li><span class="tip-icon">✓</span> Compare seasonal combo coupons on verified partner websites.</li>
            <li><span class="tip-icon">✓</span> Save this plan to your dashboard for one-click reference.</li>
            <li><span class="tip-icon">✓</span> Lock in delivery dates 1-2 weeks ahead of your deadline.</li>
          </ul>
        </div>
      </div>

      <!-- Results Action Bar -->
      <div class="results-action-bar">
        <button type="button" class="btn btn-secondary" onclick="window.print()">
          🖨️ Print / Save PDF
        </button>
        <button type="button" class="btn btn-primary" onclick="App.navigateTo('${plan.planner_type}')">
          ✨ Plan Another Goal
        </button>
        <button type="button" class="btn btn-secondary" onclick="App.navigateTo('dashboard')">
          📂 Go to Dashboard
        </button>
      </div>
    `;
  },

  getPlatformLogo(platform) {
    const p = (platform || '').toLowerCase();
    if (p.includes('amazon')) return '📦';
    if (p.includes('flipkart')) return '🛍️';
    if (p.includes('ikea')) return '🛋️';
    if (p.includes('zomato')) return '🍽️';
    if (p.includes('swiggy')) return '🛵';
    if (p.includes('oyo')) return '🏨';
    if (p.includes('myntra')) return '👗';
    return '🛒';
  },

  // ==================== Render Dashboard & History ====================
  async renderHistory() {
    const historyList = document.getElementById('history-list');
    const dashboardStats = document.getElementById('dashboard-stats-row');
    const recentList = document.getElementById('dashboard-recent-list');

    const plans = await FirestoreService.getUserPlans();

    // Calculate Dashboard Stats
    if (dashboardStats) {
      const totalBudgetManaged = plans.reduce((acc, p) => acc + (p.budget || 0), 0);
      const totalSaved = plans.reduce((acc, p) => acc + (p.remaining_budget || 0), 0);

      dashboardStats.innerHTML = `
        <div class="stat-card">
          <span class="stat-label">Total Plans Created</span>
          <span class="stat-value">${plans.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Budget Optimized</span>
          <span class="stat-value">₹${totalBudgetManaged.toLocaleString('en-IN')}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Potential Money Saved</span>
          <span class="stat-value text-success">₹${totalSaved.toLocaleString('en-IN')}</span>
        </div>
      `;
    }

    // Render Recent in Dashboard
    if (recentList) {
      if (plans.length === 0) {
        recentList.innerHTML = `
          <div class="empty-state">
            <p>No saved recommendations yet. Start by creating a plan below!</p>
            <button class="btn btn-sm btn-primary" onclick="App.navigateTo('home')">Create Home Plan</button>
          </div>
        `;
      } else {
        recentList.innerHTML = plans.slice(0, 3).map(p => this.renderPlanCard(p)).join('');
      }
    }

    // Render Full History
    if (historyList) {
      if (plans.length === 0) {
        historyList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📂</span>
            <h3>No Saved Plans Yet</h3>
            <p>Every time you generate a budget recommendation, it's securely stored in Cloud Firestore.</p>
            <div style="margin-top: 1rem; display: flex; gap: 0.75rem; justify-content: center;">
              <button class="btn btn-primary" onclick="App.navigateTo('home')">Home Planner</button>
              <button class="btn btn-secondary" onclick="App.navigateTo('party')">Party Planner</button>
              <button class="btn btn-secondary" onclick="App.navigateTo('jewelry')">Jewelry Planner</button>
            </div>
          </div>
        `;
      } else {
        historyList.innerHTML = plans.map(p => this.renderPlanCard(p)).join('');
      }
    }
  },

  renderPlanCard(p) {
    const formattedDate = new Date(p.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const plannerIcons = { home: '🛋️', party: '🎉', jewelry: '💎' };
    const icon = plannerIcons[p.planner_type] || '⚡';

    return `
      <div class="plan-history-card" id="card-${p.id}">
        <div class="card-top-row">
          <div class="plan-badge">
            <span>${icon}</span>
            <span style="text-transform: capitalize;">${p.planner_type} Planner</span>
          </div>
          <span class="plan-date">${formattedDate}</span>
        </div>
        <h4 class="plan-card-title">${p.title}</h4>
        <div class="plan-card-metrics">
          <div>
            <span class="label">Budget</span>
            <span class="val">₹${(p.budget || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span class="label">Estimated Spend</span>
            <span class="val text-primary">₹${(p.total_estimated_cost || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span class="label">Savings</span>
            <span class="val text-success">₹${(p.remaining_budget || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div class="plan-card-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="App.viewHistoricalPlan('${p.id}')">
            View Details &rarr;
          </button>
          <button class="btn btn-sm btn-danger-outline" onclick="App.deleteHistoricalPlan('${p.id}')">
            Delete
          </button>
        </div>
      </div>
    `;
  },

  async viewHistoricalPlan(planId) {
    const plans = await FirestoreService.getUserPlans();
    const found = plans.find(p => p.id === planId);
    if (found) {
      this.currentPlan = found;
      this.renderResults(found);
      this.navigateTo('results');
    }
  },

  async deleteHistoricalPlan(planId) {
    if (confirm('Are you sure you want to delete this saved plan?')) {
      await FirestoreService.deletePlan(planId);
      this.showToast('Plan deleted from Cloud Firestore.', 'info');
      this.renderHistory();
    }
  },

  // ==================== Settings Modal ====================
  bindSettings() {
    const settingsModal = document.getElementById('settings-modal');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const saveKeyBtn = document.getElementById('save-api-key-btn');
    const testKeyBtn = document.getElementById('test-api-key-btn');
    const keyInput = document.getElementById('gemini-api-key-input');

    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        if (keyInput) keyInput.value = GeminiService.getApiKey();
        if (settingsModal) settingsModal.classList.add('modal-open');
      });
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.remove('modal-open');
      });
    }

    if (saveKeyBtn) {
      saveKeyBtn.addEventListener('click', () => {
        const val = keyInput.value;
        GeminiService.setApiKey(val);
        this.showToast('Gemini API key saved successfully!', 'success');
        if (settingsModal) settingsModal.classList.remove('modal-open');
      });
    }

    if (testKeyBtn) {
      testKeyBtn.addEventListener('click', async () => {
        const key = keyInput.value.trim();
        if (!key) {
          this.showToast('Please enter an API key to test.', 'error');
          return;
        }

        testKeyBtn.disabled = true;
        testKeyBtn.textContent = 'Testing...';

        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply with JSON {"status":"ok"}' }] }]
            })
          });

          if (res.ok) {
            this.showToast('✓ Gemini API Key verified and working!', 'success');
          } else {
            const err = await res.json();
            this.showToast(`API Key Error: ${err.error?.message || 'Invalid key'}`, 'error');
          }
        } catch (e) {
          this.showToast('Network error during API key verification.', 'error');
        } finally {
          testKeyBtn.disabled = false;
          testKeyBtn.textContent = 'Test Connection';
        }
      });
    }
  }
};

// Auto-start application
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
