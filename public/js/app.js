/* ==========================================
   App — Router, Navigation, Utilities
   Profile Selector (Netflix-style landing)
   ========================================== */

// ---------- Profile Selector ----------
let selectedMemberId = null; // null = all members

function renderProfileSelector() {
  const grid = document.getElementById('profile-selector-grid');
  if (!allUsers.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👨‍👩‍👧‍👦</div>
        <div class="empty-state-text" style="color: var(--text-secondary)">No family members yet.<br>Add your first member to get started!</div>
      </div>
    `;
    // Hide "View as Everyone" if no members
    document.getElementById('profile-viewall-btn').style.display = 'none';
    return;
  }
  document.getElementById('profile-viewall-btn').style.display = '';

  grid.innerHTML = allUsers.map(user => `
    <div class="profile-card" onclick="selectProfile('${user._id}')">
      <div class="profile-card-avatar" style="background: ${user.color}15; border-color: ${user.color}">
        ${user.avatar}
      </div>
      <div class="profile-card-name">${user.name}</div>
    </div>
  `).join('');
}

function selectProfile(userId) {
  selectedMemberId = userId;
  const user = allUsers.find(u => u._id === userId);
  if (user) {
    document.title = `${user.avatar} ${user.name} — Family Kaata`;
  }
  hideProfileSelector();
  loadDashboard();
}

function enterAppAsAll() {
  selectedMemberId = null;
  document.title = 'Family Kaata 💰 — Family Expense Tracker';
  hideProfileSelector();
  loadDashboard();
}

function hideProfileSelector() {
  document.getElementById('profile-selector').classList.remove('active');
}

function showProfileSelector() {
  renderProfileSelector();
  document.getElementById('profile-selector').classList.add('active');
}

// ---------- Navigation ----------
const views = ['dashboard', 'transactions', 'members', 'categories'];
let currentView = 'dashboard';

function switchView(viewName) {
  if (!views.includes(viewName)) return;
  currentView = viewName;

  // Update view visibility
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  // Update sidebar nav
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-view="${viewName}"]`)?.classList.add('active');

  // Update bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
  document.querySelector(`.bottom-nav-item[data-view="${viewName}"]`)?.classList.add('active');

  // Load view data
  switch (viewName) {
    case 'dashboard': loadDashboard(); break;
    case 'transactions': loadTransactions(); break;
    case 'members': loadMembers(); break;
    case 'categories': loadCategoriesView(); break;
  }
}

// Sidebar nav clicks
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

// Bottom nav clicks
document.querySelectorAll('.bottom-nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(item.dataset.view);
  });
});

// ---------- Modal Utilities ----------
function showModal(modalEl) {
  document.getElementById('modal-overlay').classList.add('active');
  // Hide all modals first
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  modalEl.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  // Re-render profile selector if it's still showing (after adding member from profile screen)
  if (document.getElementById('profile-selector').classList.contains('active')) {
    loadMembers().then(() => renderProfileSelector());
  }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---------- Toast Notifications ----------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

// ---------- Loading Overlay ----------
function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('active', show);
}

// ---------- App Initialization ----------
async function initApp() {
  showLoading(true);
  try {
    await loadMembers();
    await loadCategories();
    // Show Netflix-style profile selector on startup
    renderProfileSelector();
  } catch (error) {
    showToast('Failed to initialize app', 'error');
    console.error('Init error:', error);
  } finally {
    showLoading(false);
  }
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);
