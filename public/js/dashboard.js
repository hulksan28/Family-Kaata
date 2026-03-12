/* ==========================================
   Dashboard View — Charts & Metrics
   ========================================== */

let chartMonthly = null;
let chartCategory = null;
let chartMember = null;
let chartDaily = null;

const CHART_COLORS = [
  '#6C5CE7', '#00B894', '#E17055', '#0984E3', '#FDCB6E',
  '#E84393', '#00CEC9', '#A29BFE', '#FAB1A0', '#74B9FF',
  '#55EFC4', '#FF7675', '#DFE6E9', '#B2BEC3', '#636E72'
];

function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMonthLabel(year, month) {
  const d = new Date(year, month - 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

async function loadDashboard() {
  try {
    const memberFilter = document.getElementById('dashboard-member-filter').value;
    const params = {};
    // Use the profile selector's member OR the manual dropdown filter
    if (memberFilter) {
      params.userId = memberFilter;
    } else if (selectedMemberId) {
      params.userId = selectedMemberId;
      // Also set the dropdown to match
      document.getElementById('dashboard-member-filter').value = selectedMemberId;
    }

    const data = await TransactionsAPI.getSummary(params);
    renderSummaryCards(data.summary);
    renderMonthlyTrendsChart(data.monthlyTrends);
    renderCategoryBreakdownChart(data.categoryBreakdown);
    renderMemberComparisonChart(data.memberBreakdown);
    renderDailySpendingChart(data.dailySpending);
    renderTopSpending(data.topExpenseCategories);
    renderRecentTransactions(data.recentTransactions);
  } catch (error) {
    showToast('Failed to load dashboard', 'error');
  }
}

function renderSummaryCards(summary) {
  document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
  document.getElementById('total-expense').textContent = formatCurrency(summary.totalExpense);
  document.getElementById('net-balance').textContent = formatCurrency(summary.balance);
  document.getElementById('total-transactions').textContent = summary.totalTransactions;

  // Color balance based on positive/negative
  const balanceEl = document.getElementById('net-balance');
  balanceEl.style.color = summary.balance >= 0 ? 'var(--income)' : 'var(--expense)';
}

function renderMonthlyTrendsChart(trends) {
  const canvas = document.getElementById('chart-monthly-trends');
  if (chartMonthly) chartMonthly.destroy();

  // Group by month
  const months = {};
  trends.forEach(t => {
    const key = `${t._id.year}-${t._id.month}`;
    if (!months[key]) months[key] = { label: getMonthLabel(t._id.year, t._id.month), income: 0, expense: 0 };
    months[key][t._id.type] = t.total;
  });

  const labels = Object.values(months).map(m => m.label);
  const incomeData = Object.values(months).map(m => m.income);
  const expenseData = Object.values(months).map(m => m.expense);

  chartMonthly = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#00B894',
          backgroundColor: 'rgba(0, 184, 148, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: '#E17055',
          backgroundColor: 'rgba(225, 112, 85, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    },
    options: getChartOptions('Monthly Income vs Expense')
  });
}

function renderCategoryBreakdownChart(breakdown) {
  const canvas = document.getElementById('chart-category-breakdown');
  if (chartCategory) chartCategory.destroy();

  const expenseCategories = breakdown.filter(b => b._id.type === 'expense');
  const labels = expenseCategories.map(b => b._id.category);
  const data = expenseCategories.map(b => b.total);

  chartCategory = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#A0A0B8',
            font: { family: 'Inter', size: 11 },
            padding: 10,
            usePointStyle: true,
            pointStyleWidth: 8,
          }
        },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 35, 0.95)',
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      }
    }
  });
}

function renderMemberComparisonChart(memberData) {
  const canvas = document.getElementById('chart-member-comparison');
  if (chartMember) chartMember.destroy();

  const members = {};
  memberData.forEach(m => {
    if (!members[m.userName]) members[m.userName] = { income: 0, expense: 0, color: m.userColor };
    members[m.userName][m.type] = m.total;
  });

  const labels = Object.keys(members);
  const incomeData = labels.map(l => members[l].income);
  const expenseData = labels.map(l => members[l].expense);

  chartMember = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(0, 184, 148, 0.7)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: 'rgba(225, 112, 85, 0.7)',
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: getChartOptions('Income vs Expense by Member')
  });
}

function renderDailySpendingChart(daily) {
  const canvas = document.getElementById('chart-daily-spending');
  if (chartDaily) chartDaily.destroy();

  const labels = daily.map(d => `Day ${d._id}`);
  const data = daily.map(d => d.total);

  chartDaily = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending',
        data,
        backgroundColor: 'rgba(108, 92, 231, 0.6)',
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: getChartOptions('Daily Spending')
  });
}

function getChartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#A0A0B8',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 35, 0.95)',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#6B6B80', font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#6B6B80',
          font: { family: 'Inter', size: 10 },
          callback: v => formatCurrency(v)
        }
      }
    }
  };
}

function renderTopSpending(categories) {
  const container = document.getElementById('top-spending-list');
  if (!categories.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No spending data yet</div></div>';
    return;
  }

  container.innerHTML = categories.map((cat, i) => `
    <div class="spending-item">
      <div class="spending-rank">${i + 1}</div>
      <div class="spending-info">
        <div class="spending-name">${cat._id}</div>
        <div class="spending-count">${cat.count} transaction${cat.count > 1 ? 's' : ''}</div>
      </div>
      <div class="spending-amount">${formatCurrency(cat.total)}</div>
    </div>
  `).join('');
}

function renderRecentTransactions(transactions) {
  const container = document.getElementById('recent-transactions-list');
  if (!transactions.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No transactions yet</div></div>';
    return;
  }

  container.innerHTML = transactions.map(t => `
    <div class="txn-mini">
      <div class="txn-mini-avatar" style="background:${t.userId?.color || '#6C5CE7'}20">
        ${t.userId?.avatar || '👤'}
      </div>
      <div class="txn-mini-info">
        <div class="txn-mini-category">${t.category}</div>
        <div class="txn-mini-date">${t.userId?.name || 'Unknown'} · ${formatDate(t.date)}</div>
      </div>
      <div class="txn-mini-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </div>
    </div>
  `).join('');
}

// Filter handler
document.getElementById('dashboard-member-filter').addEventListener('change', loadDashboard);
