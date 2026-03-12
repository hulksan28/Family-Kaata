/* ==========================================
   Categories View — Manage categories
   ========================================== */

async function loadCategoriesView() {
  try {
    allCategories = await CategoriesAPI.getAll();
    renderCategoriesView();
    populateCategoryDropdowns();
  } catch (error) {
    showToast('Failed to load categories', 'error');
  }
}

function renderCategoriesView() {
  const incomeContainer = document.getElementById('income-categories');
  const expenseContainer = document.getElementById('expense-categories');

  const incomeCategories = allCategories.filter(c => c.type === 'income');
  const expenseCategories = allCategories.filter(c => c.type === 'expense');

  incomeContainer.innerHTML = incomeCategories.map(c => `
    <div class="category-chip ${c.isDefault ? 'default' : ''}">
      <span>${c.emoji}</span>
      <span>${c.name}</span>
      ${!c.isDefault ? `<button class="delete-chip" onclick="confirmDeleteCategory('${c._id}', '${c.name}')">&times;</button>` : ''}
    </div>
  `).join('');

  expenseContainer.innerHTML = expenseCategories.map(c => `
    <div class="category-chip ${c.isDefault ? 'default' : ''}">
      <span>${c.emoji}</span>
      <span>${c.name}</span>
      ${!c.isDefault ? `<button class="delete-chip" onclick="confirmDeleteCategory('${c._id}', '${c.name}')">&times;</button>` : ''}
    </div>
  `).join('');
}

function openCategoryModal() {
  const modal = document.getElementById('category-modal');
  document.getElementById('category-form').reset();
  showModal(modal);
}

async function saveCategory(event) {
  event.preventDefault();

  const name = document.getElementById('cat-name').value.trim();
  const type = document.getElementById('cat-type').value;
  const emoji = document.getElementById('cat-emoji').value.trim() || '📋';

  if (!name) return showToast('Please enter a category name', 'error');

  try {
    showLoading(true);
    await CategoriesAPI.create({ name, type, emoji });
    showToast('Category added! 🏷️', 'success');
    closeModal();
    await loadCategoriesView();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function confirmDeleteCategory(id, name) {
  const msg = document.getElementById('confirm-message');
  msg.textContent = `Delete the custom category "${name}"?`;
  const btn = document.getElementById('confirm-delete-btn');
  btn.onclick = () => deleteCategory(id);
  showModal(document.getElementById('confirm-modal'));
}

async function deleteCategory(id) {
  try {
    showLoading(true);
    await CategoriesAPI.delete(id);
    showToast('Category deleted', 'success');
    closeModal();
    await loadCategoriesView();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    showLoading(false);
  }
}
