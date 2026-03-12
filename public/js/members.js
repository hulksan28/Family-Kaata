/* ==========================================
   Members View — Profile management
   ========================================== */

let allUsers = [];

async function loadMembers() {
  try {
    allUsers = await UsersAPI.getAll();
    renderMemberCards();
    populateMemberDropdowns();
  } catch (error) {
    showToast('Failed to load members', 'error');
  }
}

function renderMemberCards() {
  const container = document.getElementById('members-grid');

  if (!allUsers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👨‍👩‍👧‍👦</div>
        <div class="empty-state-text">No family members yet</div>
        <div class="empty-state-sub">Click "Add Member" to get started!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = allUsers.map(user => `
    <div class="member-card" style="--member-color: ${user.color}">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${user.color}"></div>
      <div class="member-avatar" style="background: ${user.color}15; border-color: ${user.color}">
        ${user.avatar}
      </div>
      <div class="member-name">${user.name}</div>
      <div class="member-stats" id="member-stats-${user._id}">
        <div class="member-stat">
          <div class="member-stat-label">Income</div>
          <div class="member-stat-value income">Loading...</div>
        </div>
        <div class="member-stat">
          <div class="member-stat-label">Expense</div>
          <div class="member-stat-value expense">Loading...</div>
        </div>
      </div>
      <div class="member-actions">
        <button class="btn btn-secondary btn-sm" onclick="editMember('${user._id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteMember('${user._id}', '${user.name}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');

  // Load individual member stats
  allUsers.forEach(user => loadMemberStats(user._id));
}

async function loadMemberStats(userId) {
  try {
    const data = await TransactionsAPI.getSummary({ userId });
    const statsEl = document.getElementById(`member-stats-${userId}`);
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="member-stat">
          <div class="member-stat-label">Income</div>
          <div class="member-stat-value income">${formatCurrency(data.summary.totalIncome)}</div>
        </div>
        <div class="member-stat">
          <div class="member-stat-label">Expense</div>
          <div class="member-stat-value expense">${formatCurrency(data.summary.totalExpense)}</div>
        </div>
      `;
    }
  } catch (error) {
    // Silently fail for individual stats
  }
}

function populateMemberDropdowns() {
  const dropdowns = [
    document.getElementById('txn-member'),
    document.getElementById('filter-member'),
    document.getElementById('dashboard-member-filter')
  ];

  dropdowns.forEach(dropdown => {
    if (!dropdown) return;
    const currentValue = dropdown.value;
    const firstOption = dropdown.querySelector('option:first-child');
    dropdown.innerHTML = '';
    if (firstOption && firstOption.value === '') {
      dropdown.appendChild(firstOption);
    }
    allUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user._id;
      option.textContent = `${user.avatar} ${user.name}`;
      dropdown.appendChild(option);
    });
    if (currentValue) dropdown.value = currentValue;
  });
}

function openMemberModal(userId = null) {
  const modal = document.getElementById('member-modal');
  const title = document.getElementById('member-modal-title');
  const form = document.getElementById('member-form');
  const submitBtn = document.getElementById('member-submit-btn');

  form.reset();
  document.getElementById('member-id').value = '';

  // Reset pickers
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
  document.querySelector('.avatar-option[data-avatar="👤"]').classList.add('selected');
  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
  document.querySelector('.color-option[data-color="#6C5CE7"]').classList.add('selected');

  if (userId) {
    const user = allUsers.find(u => u._id === userId);
    if (user) {
      title.textContent = 'Edit Member';
      submitBtn.textContent = 'Save Changes';
      document.getElementById('member-id').value = user._id;
      document.getElementById('member-name').value = user.name;

      // Select avatar
      document.querySelectorAll('.avatar-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.avatar === user.avatar);
      });

      // Select color
      document.querySelectorAll('.color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === user.color);
      });
    }
  } else {
    title.textContent = 'Add Family Member';
    submitBtn.textContent = 'Add Member';
  }

  showModal(modal);
}

function editMember(userId) {
  openMemberModal(userId);
}

async function saveMember(event) {
  event.preventDefault();

  const id = document.getElementById('member-id').value;
  const name = document.getElementById('member-name').value.trim();
  const avatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '👤';
  const color = document.querySelector('.color-option.selected')?.dataset.color || '#6C5CE7';

  if (!name) return showToast('Please enter a name', 'error');

  try {
    showLoading(true);
    if (id) {
      await UsersAPI.update(id, { name, avatar, color });
      showToast('Member updated! ✅', 'success');
    } else {
      await UsersAPI.create({ name, avatar, color });
      showToast('Member added! 🎉', 'success');
    }
    closeModal();
    await loadMembers();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function confirmDeleteMember(id, name) {
  const msg = document.getElementById('confirm-message');
  msg.textContent = `Are you sure you want to remove "${name}" and all their transactions? This cannot be undone.`;
  const btn = document.getElementById('confirm-delete-btn');
  btn.onclick = () => deleteMember(id);
  showModal(document.getElementById('confirm-modal'));
}

async function deleteMember(id) {
  try {
    showLoading(true);
    await UsersAPI.delete(id);
    showToast('Member removed', 'success');
    closeModal();
    await loadMembers();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Avatar picker click handler
document.getElementById('avatar-picker').addEventListener('click', (e) => {
  const btn = e.target.closest('.avatar-option');
  if (!btn) return;
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
  btn.classList.add('selected');
});

// Color picker click handler
document.getElementById('color-picker').addEventListener('click', (e) => {
  const btn = e.target.closest('.color-option');
  if (!btn) return;
  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
  btn.classList.add('selected');
});
