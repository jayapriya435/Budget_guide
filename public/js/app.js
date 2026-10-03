/**
 * PocketSmart AI — Master Application Controller
 * Handles SPA routing, dynamic multi-room planner forms, interactive results,
 * plan reuse, history filtering, auth state flow, and toast notifications.
 * Fully aligned with PocketSmart AI Product Specification.
 */

const App = {
  currentPlan: null,
  activeView: 'landing',
  historyFilter: 'all',
  additionalRoomCount: 0,

  init() {
    this.bindNavigation();
    this.bindAuthEvents();
    this.bindPlannerForms();
    this.bindDynamicRoomBuilder();
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

  // ==================== Auth Modal & Flow (Section 0.4) ====================
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

    // Sign In Form -> redirects to Dashboard per spec
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
          // Navigate to dashboard per spec Section 0.4
          this.navigateTo('dashboard');
        } catch (err) {
          this.showToast(err.message || 'Login failed. Please check credentials.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Sign In';
        }
      });
    }

    // Sign Up Form -> redirects to Dashboard per spec
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
          // Navigate to dashboard per spec Section 0.4
          this.navigateTo('dashboard');
        } catch (err) {
          this.showToast(err.message || 'Registration failed.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Create Account';
        }
      });
    }

    // Google Sign-In -> redirects to Dashboard with specific diagnostic messages
    const googleBtns = document.querySelectorAll('.google-signin-btn');
    googleBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          const user = await AuthService.loginWithGoogle();
          if (user) {
            authModal.classList.remove('modal-open');
            this.showToast('Signed in with Google!', 'success');
            this.navigateTo('dashboard');
          }
        } catch (err) {
          console.error("Google Sign-In Error:", err);
          if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
            this.showToast('Google Sign-In is disabled in Firebase Console. Please enable "Google" under Authentication > Sign-in method in Firebase Console.', 'error');
          } else if (err.code === 'auth/popup-blocked') {
            this.showToast('Popup window was blocked by your browser. Please allow popups or use Demo Guest mode.', 'error');
          } else if (err.code === 'auth/unauthorized-domain') {
            this.showToast(`Domain not authorized. Add ${window.location.hostname} in Firebase Console > Authentication > Settings > Authorized domains.`, 'error');
          } else if (err.code === 'auth/popup-closed-by-user') {
            this.showToast('Google sign-in window was closed.', 'info');
          } else {
            this.showToast(err.message || 'Google sign-in could not be completed.', 'error');
          }
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Guest / Demo Mode Quick Access
    const guestBtns = document.querySelectorAll('.guest-signin-btn');
    guestBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          await AuthService.loginAsGuest();
          authModal.classList.remove('modal-open');
          this.showToast('Logged in as Guest! Full access enabled.', 'success');
          this.navigateTo('dashboard');
        } catch (err) {
          this.showToast('Could not start guest session.', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Logout -> redirects to Landing
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
    const welcomeHeading = document.getElementById('dashboard-welcome-heading');

    if (user) {
      if (unauthNav) unauthNav.style.display = 'none';
      if (authNav) authNav.style.display = 'flex';
      const displayName = user.displayName || user.email.split('@')[0];
      if (userNameSpan) userNameSpan.textContent = displayName;
      if (userAvatar) {
        userAvatar.textContent = displayName.charAt(0).toUpperCase();
      }
      if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome back, ${displayName}! 👋`;
      }
    } else {
      if (unauthNav) unauthNav.style.display = 'flex';
      if (authNav) authNav.style.display = 'none';
      if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome, Smart Planner! 👋`;
      }
    }
  },

  // ==================== Dynamic Room Builder (Section 8.2) ====================
  bindDynamicRoomBuilder() {
    const addRoomBtn = document.getElementById('btn-add-extra-room');
    const container = document.getElementById('additional-rooms-container');

    if (addRoomBtn && container) {
      addRoomBtn.addEventListener('click', () => {
        this.additionalRoomCount++;
        const roomId = `room-${this.additionalRoomCount}`;
        const roomCard = document.createElement('div');
        roomCard.className = 'extra-room-card';
        roomCard.id = roomId;
        roomCard.innerHTML = `
          <div class="extra-room-header">
            <h4>🛋️ Additional Room #${this.additionalRoomCount + 1}</h4>
            <button type="button" class="btn-remove-room" onclick="App.removeRoom('${roomId}')" title="Remove Room">&times; Remove</button>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Room Type</label>
              <select class="form-control extra-room-type">
                <option value="Bedroom" selected>Bedroom</option>
                <option value="Kids Bedroom">Kids Bedroom</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Study / Home Office">Study / Home Office</option>
                <option value="Balcony / Outdoor Nook">Balcony / Outdoor Nook</option>
                <option value="Guest Bedroom">Guest Bedroom</option>
              </select>
            </div>
            <div class="form-group">
              <label>Key Furniture Required</label>
              <select class="form-control extra-room-furniture">
                <option value="Queen Size Bed + Wardrobe" selected>Queen Size Bed + Wardrobe</option>
                <option value="Kids Bunk Bed + Study Desk">Kids Bunk Bed + Study Desk</option>
                <option value="Ergonomic Desk + Office Chair">Ergonomic Desk + Office Chair</option>
                <option value="Wardrobe & Dresser">Wardrobe & Dresser</option>
                <option value="Coffee Seating + Planters">Coffee Seating + Planters</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label>Lights Count</label>
              <input type="number" class="form-control extra-room-lights" value="2" min="1" max="10">
            </div>
            <div class="form-group">
              <label>Ceiling Fans</label>
              <input type="number" class="form-control extra-room-fans" value="1" min="0" max="4">
            </div>
          </div>
        `;
        container.appendChild(roomCard);
        this.showToast(`Added Room #${this.additionalRoomCount + 1}`, 'info');
      });
    }
  },

  removeRoom(roomId) {
    const el = document.getElementById(roomId);
    if (el) {
      el.remove();
      this.showToast('Room removed.', 'info');
    }
  },

  // ==================== Planner Form Handlers ====================
  bindPlannerForms() {
    // 1. Home Interior Planner Form (Section 8.1 - 8.5)
    const homeForm = document.getElementById('form-home-planner');
    if (homeForm) {
      homeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect primary room
        const primaryRoom = {
          type: document.getElementById('home-room-type').value,
          sofa: document.getElementById('home-sofa').value,
          dining: document.getElementById('home-dining').value,
          lights: parseInt(document.getElementById('home-lights').value, 10) || 4,
          fans: parseInt(document.getElementById('home-fans').value, 10) || 1
        };

        // Collect additional dynamic rooms (Section 8.2)
        const additionalRooms = [];
        document.querySelectorAll('.extra-room-card').forEach(card => {
          additionalRooms.push({
            type: card.querySelector('.extra-room-type')?.value || 'Bedroom',
            furniture: card.querySelector('.extra-room-furniture')?.value || 'Bed + Wardrobe',
            lights: parseInt(card.querySelector('.extra-room-lights')?.value, 10) || 2,
            fans: parseInt(card.querySelector('.extra-room-fans')?.value, 10) || 1
          });
        });

        // Collect extra requirements / decor checkboxes
        const extraRequirements = [];
        if (document.getElementById('home-req-tv')?.checked) extraRequirements.push('TV Unit');
        if (document.getElementById('home-req-curtains')?.checked) extraRequirements.push('Curtains & Drapes');
        if (document.getElementById('home-req-rug')?.checked) extraRequirements.push('Floor Rug / Carpet');
        if (document.getElementById('home-req-plants')?.checked) extraRequirements.push('Indoor Plants & Planters');

        const totalRooms = 1 + additionalRooms.length;

        const data = {
          budget: parseFloat(document.getElementById('home-budget').value),
          room_type: primaryRoom.type,
          room_count: totalRooms,
          lights_count: primaryRoom.lights + additionalRooms.reduce((acc, r) => acc + r.lights, 0),
          fans_count: primaryRoom.fans + additionalRooms.reduce((acc, r) => acc + r.fans, 0),
          sofa_requirement: primaryRoom.sofa,
          dining_table: primaryRoom.dining,
          style_preference: document.getElementById('home-style').value,
          additional_rooms: additionalRooms,
          extra_requirements: extraRequirements,
          additional_notes: document.getElementById('home-notes').value
        };

        if (isNaN(data.budget) || data.budget <= 0) {
          this.showToast('Please enter a valid budget greater than ₹0.', 'error');
          return;
        }

        await this.executePlanGeneration('home', data);
      });
    }

    // 2. Party & Event Planner Form (Section 9.1 - 9.5)
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

    // 3. Jewelry Planner Form & Image Upload (Section 10.1 - 10.5)
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
          if (file.size > 8 * 1024 * 1024) {
            this.showToast('Image size exceeds 8MB. Please select a smaller photo.', 'error');
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

    // Step-by-step progress per spec Section 15.2
    const steps = [
      "Analyzing budget constraints and preferences...",
      "Calibrating mathematical category allocations...",
      "Matching verified products on Amazon, Flipkart, IKEA & Swiggy...",
      "Optimizing savings and preparing your plan..."
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
        this.showToast('Smart budget plan generated & saved to Firestore!', 'success');
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

    // Build Recommendations HTML with Section 9.4/12.3 platform distinction
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
            <a href="${rec.search_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary" title="Search for this item on ${rec.platform}">
              Search on ${rec.platform} ↗
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
            <span class="badge ${badgeClass}">✓ Mathematically Verified (${isUnderBudget ? 'Within Budget' : 'Exceeds Budget'})</span>
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
          <span class="subtitle">Platform search links calibrated to your spend limit</span>
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
            <li><span class="tip-icon">✓</span> This plan is safely persisted to your Cloud Firestore dashboard.</li>
            <li><span class="tip-icon">✓</span> Lock in delivery dates 1-2 weeks ahead of your deadline.</li>
          </ul>
        </div>
      </div>

      <!-- Results Action Bar with Reuse Plan per Section 14.4 -->
      <div class="results-action-bar">
        <button type="button" class="btn btn-primary" onclick="App.reusePlan('${plan.id}')">
          🔄 Edit & Reuse This Plan
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.print()">
          🖨️ Print / Save PDF
        </button>
        <button type="button" class="btn btn-secondary" onclick="App.navigateTo('${plan.planner_type}')">
          ✨ Plan Another Goal
        </button>
        <button type="button" class="btn btn-secondary" onclick="App.navigateTo('dashboard')">
          📂 Go to Dashboard
        </button>
      </div>

      <div style="text-align: center; margin-top: 1.5rem; font-size: 0.8rem; color: var(--gray-400);">
        ℹ️ Note: Store buttons direct you to live search queries on Amazon, Flipkart, IKEA, Swiggy, Zomato, and OYO.
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

  // ==================== Reuse Plan (Section 14.4) ====================
  async reusePlan(planId) {
    let plan = this.currentPlan;
    if (!plan || plan.id !== planId) {
      const plans = await FirestoreService.getUserPlans();
      plan = plans.find(p => p.id === planId);
    }

    if (!plan) {
      this.showToast('Plan not found for reuse.', 'error');
      return;
    }

    const inputData = plan.input_data || {};

    if (plan.planner_type === 'home') {
      if (document.getElementById('home-budget')) document.getElementById('home-budget').value = plan.budget;
      if (document.getElementById('home-room-type') && inputData.room_type) document.getElementById('home-room-type').value = inputData.room_type;
      if (document.getElementById('home-style') && inputData.style_preference) document.getElementById('home-style').value = inputData.style_preference;
      if (document.getElementById('home-sofa') && inputData.sofa_requirement) document.getElementById('home-sofa').value = inputData.sofa_requirement;
      if (document.getElementById('home-dining') && inputData.dining_table) document.getElementById('home-dining').value = inputData.dining_table;
      if (document.getElementById('home-lights') && inputData.lights_count) document.getElementById('home-lights').value = inputData.lights_count;
      if (document.getElementById('home-fans') && inputData.fans_count) document.getElementById('home-fans').value = inputData.fans_count;
      if (document.getElementById('home-notes') && inputData.additional_notes) document.getElementById('home-notes').value = inputData.additional_notes;
      this.navigateTo('home');
      this.showToast('Home plan loaded! Edit budget or requirements and generate again.', 'success');

    } else if (plan.planner_type === 'party') {
      if (document.getElementById('party-budget')) document.getElementById('party-budget').value = plan.budget;
      if (document.getElementById('party-event-type') && inputData.event_type) document.getElementById('party-event-type').value = inputData.event_type;
      if (document.getElementById('party-guests') && inputData.guest_count) document.getElementById('party-guests').value = inputData.guest_count;
      if (document.getElementById('party-venue') && inputData.venue_type) document.getElementById('party-venue').value = inputData.venue_type;
      if (document.getElementById('party-food') && inputData.food_preference) document.getElementById('party-food').value = inputData.food_preference;
      if (document.getElementById('party-theme') && inputData.theme) document.getElementById('party-theme').value = inputData.theme;
      if (document.getElementById('party-entertainment') && inputData.entertainment) document.getElementById('party-entertainment').value = inputData.entertainment;
      this.navigateTo('party');
      this.showToast('Event plan loaded! Adjust details and generate again.', 'success');

    } else if (plan.planner_type === 'jewelry') {
      if (document.getElementById('jewelry-budget')) document.getElementById('jewelry-budget').value = plan.budget;
      if (document.getElementById('jewelry-occasion') && inputData.occasion) document.getElementById('jewelry-occasion').value = inputData.occasion;
      if (document.getElementById('jewelry-style') && inputData.style) document.getElementById('jewelry-style').value = inputData.style;
      if (document.getElementById('jewelry-outfit-desc') && inputData.outfit_description) document.getElementById('jewelry-outfit-desc').value = inputData.outfit_description;
      if (document.getElementById('jewelry-types') && inputData.jewelry_types) document.getElementById('jewelry-types').value = inputData.jewelry_types;
      this.navigateTo('jewelry');
      this.showToast('Jewelry ensemble loaded! Adjust specs and generate again.', 'success');
    }
  },

  // ==================== Render Dashboard & History (Section 13.3 & 14.2) ====================
  async renderHistory() {
    const historyList = document.getElementById('history-list');
    const dashboardStats = document.getElementById('dashboard-stats-row');
    const recentList = document.getElementById('dashboard-recent-list');

    const allPlans = await FirestoreService.getUserPlans();

    // Filter plans for history view
    let filteredPlans = allPlans;
    if (this.historyFilter !== 'all') {
      filteredPlans = allPlans.filter(p => p.planner_type === this.historyFilter);
    }

    // Calculate Dashboard Stats
    if (dashboardStats) {
      const totalBudgetManaged = allPlans.reduce((acc, p) => acc + (p.budget || 0), 0);
      const totalSaved = allPlans.reduce((acc, p) => acc + (p.remaining_budget || 0), 0);

      dashboardStats.innerHTML = `
        <div class="stat-card">
          <span class="stat-label">Total Plans Created</span>
          <span class="stat-value">${allPlans.length}</span>
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

    // Render Recent in Dashboard (up to 3 items)
    if (recentList) {
      if (allPlans.length === 0) {
        recentList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">🛋️</span>
            <p>No saved recommendations yet. Start planning below!</p>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
              <button class="btn btn-sm btn-primary" onclick="App.navigateTo('home')">Home Planner</button>
              <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('party')">Party Planner</button>
            </div>
          </div>
        `;
      } else {
        recentList.innerHTML = allPlans.slice(0, 3).map(p => this.renderPlanCard(p)).join('');
      }
    }

    // Render Full History
    if (historyList) {
      if (filteredPlans.length === 0) {
        historyList.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📂</span>
            <h3>No Saved Plans Found</h3>
            <p>${this.historyFilter === 'all' ? 'Every recommendation you create is securely synced with Cloud Firestore.' : `No plans found for category: ${this.historyFilter}.`}</p>
            <div style="margin-top: 1rem; display: flex; gap: 0.75rem; justify-content: center;">
              <button class="btn btn-primary" onclick="App.navigateTo('home')">Home Planner</button>
              <button class="btn btn-secondary" onclick="App.navigateTo('party')">Party Planner</button>
              <button class="btn btn-secondary" onclick="App.navigateTo('jewelry')">Jewelry Planner</button>
            </div>
          </div>
        `;
      } else {
        historyList.innerHTML = filteredPlans.map(p => this.renderPlanCard(p)).join('');
      }
    }
  },

  setHistoryFilter(filterType) {
    this.historyFilter = filterType;
    document.querySelectorAll('[data-history-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-history-filter') === filterType);
    });
    this.renderHistory();
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
            <span class="label">Spend</span>
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
          <button class="btn btn-sm btn-secondary" onclick="App.reusePlan('${p.id}')" title="Pre-fill form and generate again">
            🔄 Reuse
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
    if (confirm('Are you sure you want to delete this saved plan from Cloud Firestore?')) {
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
