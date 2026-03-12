/* ==========================================
   Transactions View — Add/View/Filter
   ========================================== */

let allCategories = [];
let currentPage = 1;

async function loadTransactions(page = 1) {
  try {
    currentPage = page;
    const params = getFilterParams();
    params.page = page;
    params.limit = 20;

    const data = await TransactionsAPI.getAll(params);
    renderTransactionsList(data.transactions);
    renderPagination(data.pages, data.page);
  } catch (error) {
    showToast('Failed to load transactions', 'error');
  }
}

function getFilterParams() {
  return {
    userId: document.getElementById('filter-member').value,
    type: document.getElementById('filter-type').value,
    category: document.getElementById('filter-category').value,
    startDate: document.getElementById('filter-start-date').value,
    endDate: document.getElementById('filter-end-date').value,
  };
}

function renderTransactionsList(transactions) {
  const container = document.getElementById('transactions-list');

  if (!transactions.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💸</div>
        <div class="empty-state-text">No transactions found</div>
        <div class="empty-state-sub">Add your first transaction to get started!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = transactions.map(t => {
    const userName = t.userId?.name || 'Unknown';
    const userAvatar = t.userId?.avatar || '👤';
    const userColor = t.userId?.color || '#6C5CE7';

    return `
      <div class="txn-item">
        <div class="txn-avatar" style="background:${userColor}20">${userAvatar}</div>
        <div class="txn-details">
          <div class="txn-top-row">
            <span class="txn-category-name">${t.category}</span>
            <span class="txn-badge ${t.type}">${t.type}</span>
          </div>
          ${t.description ? `<div class="txn-description">${t.description}</div>` : ''}
          <div class="txn-meta">
            <span>${userName}</span>
            ${t.currency !== 'INR' ? `<span>· ${t.currency}</span>` : ''}
          </div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</div>
          <div class="txn-date">${formatDate(t.date)}</div>
        </div>
        <div class="txn-actions">
          <button class="txn-action-btn" onclick="editTransaction('${t._id}')" title="Edit">✏️</button>
          <button class="txn-action-btn" onclick="confirmDeleteTransaction('${t._id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPagination(totalPages, current) {
  const container = document.getElementById('transactions-pagination');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadTransactions(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

async function loadCategories() {
  try {
    allCategories = await CategoriesAPI.getAll();
    populateCategoryDropdowns();
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

function populateCategoryDropdowns(type = null) {
  // Transaction form category dropdown
  const txnCategory = document.getElementById('txn-category');
  const currentType = type || document.getElementById('txn-type')?.value || 'expense';
  const filtered = allCategories.filter(c => c.type === currentType);

  if (txnCategory) {
    const currentVal = txnCategory.value;
    txnCategory.innerHTML = filtered.map(c =>
      `<option value="${c.name}">${c.emoji} ${c.name}</option>`
    ).join('');
    if (currentVal && filtered.some(c => c.name === currentVal)) {
      txnCategory.value = currentVal;
    }
  }

  // Filter category dropdown (all categories)
  const filterCategory = document.getElementById('filter-category');
  if (filterCategory) {
    const currentFilterVal = filterCategory.value;
    filterCategory.innerHTML = '<option value="">All Categories</option>';
    allCategories.forEach(c => {
      filterCategory.innerHTML += `<option value="${c.name}">${c.emoji} ${c.name}</option>`;
    });
    if (currentFilterVal) filterCategory.value = currentFilterVal;
  }
}

function onTransactionTypeChange() {
  const type = document.getElementById('txn-type').value;
  populateCategoryDropdowns(type);
}

function openTransactionModal(transactionId = null) {
  const modal = document.getElementById('transaction-modal');
  const title = document.getElementById('transaction-modal-title');
  const form = document.getElementById('transaction-form');
  const submitBtn = document.getElementById('txn-submit-btn');

  form.reset();
  document.getElementById('transaction-id').value = '';
  document.getElementById('txn-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('txn-type').value = 'expense';
  populateCategoryDropdowns('expense');

  if (transactionId) {
    title.textContent = 'Edit Transaction';
    submitBtn.textContent = 'Save Changes';
    // We'll load the transaction data asynchronously
    loadTransactionForEdit(transactionId);
  } else {
    title.textContent = 'Add Transaction';
    submitBtn.textContent = 'Add Transaction';
  }

  showModal(modal);
}

async function loadTransactionForEdit(id) {
  try {
    const data = await TransactionsAPI.getAll({ limit: 1 });
    // Find the transaction
    const allTxns = await TransactionsAPI.getAll({ limit: 999 });
    const txn = allTxns.transactions.find(t => t._id === id);
    if (!txn) return showToast('Transaction not found', 'error');

    document.getElementById('transaction-id').value = txn._id;
    document.getElementById('txn-member').value = txn.userId?._id || '';
    document.getElementById('txn-type').value = txn.type;
    populateCategoryDropdowns(txn.type);
    document.getElementById('txn-category').value = txn.category;
    document.getElementById('txn-amount').value = txn.amount;
    document.getElementById('txn-currency').value = txn.currency || 'INR';
    document.getElementById('txn-description').value = txn.description || '';
    document.getElementById('txn-date').value = new Date(txn.date).toISOString().split('T')[0];
  } catch (error) {
    showToast('Failed to load transaction', 'error');
  }
}

function editTransaction(id) {
  openTransactionModal(id);
}

async function saveTransaction(event) {
  event.preventDefault();

  const id = document.getElementById('transaction-id').value;
  const data = {
    userId: document.getElementById('txn-member').value,
    type: document.getElementById('txn-type').value,
    category: document.getElementById('txn-category').value,
    amount: parseFloat(document.getElementById('txn-amount').value),
    currency: document.getElementById('txn-currency').value,
    description: document.getElementById('txn-description').value.trim(),
    date: document.getElementById('txn-date').value,
  };

  if (!data.userId) return showToast('Please select a member', 'error');
  if (!data.amount || data.amount <= 0) return showToast('Please enter a valid amount', 'error');

  try {
    showLoading(true);
    if (id) {
      await TransactionsAPI.update(id, data);
      showToast('Transaction updated! ✅', 'success');
    } else {
      await TransactionsAPI.create(data);
      showToast('Transaction added! 💸', 'success');
    }
    closeModal();
    await loadTransactions(currentPage);
    await loadDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function confirmDeleteTransaction(id) {
  const msg = document.getElementById('confirm-message');
  msg.textContent = 'Are you sure you want to delete this transaction? This cannot be undone.';
  const btn = document.getElementById('confirm-delete-btn');
  btn.onclick = () => deleteTransaction(id);
  showModal(document.getElementById('confirm-modal'));
}

async function deleteTransaction(id) {
  try {
    showLoading(true);
    await TransactionsAPI.delete(id);
    showToast('Transaction deleted', 'success');
    closeModal();
    await loadTransactions(currentPage);
    await loadDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function applyTransactionFilters() {
  loadTransactions(1);
}

function clearTransactionFilters() {
  document.getElementById('filter-member').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-start-date').value = '';
  document.getElementById('filter-end-date').value = '';
  loadTransactions(1);
}
