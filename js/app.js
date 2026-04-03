// Expense & Budget Visualizer
(function () {
  'use strict';

  // --- Constants ---
  const STORAGE_KEYS = {
    transactions: 'ebv_transactions',
    categories: 'ebv_categories',
    theme: 'ebv_theme',
  };

  const DEFAULT_STATE = {
    transactions: [],
    categories: ['Food', 'Transport', 'Fun'],
    theme: 'light',
  };

  // --- Storage Layer ---
  const storage = {
    load() {
      try {
        const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions));
        const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories));
        const theme = JSON.parse(localStorage.getItem(STORAGE_KEYS.theme));

        return {
          transactions: Array.isArray(transactions) ? transactions : DEFAULT_STATE.transactions,
          categories: Array.isArray(categories) ? categories : DEFAULT_STATE.categories,
          theme: theme === 'light' || theme === 'dark' ? theme : DEFAULT_STATE.theme,
        };
      } catch (_e) {
        return { ...DEFAULT_STATE, categories: [...DEFAULT_STATE.categories] };
      }
    },

    save(state) {
      try {
        localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
        localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
        localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(state.theme));
      } catch (_e) {
        // Storage unavailable (e.g. private mode, quota exceeded) — continue in-memory
      }
    },
  };

  // --- State ---
  let state = {
    ...storage.load(),
    activeMonth: null, // 'YYYY-MM' | null (null = show all)
  };

  // --- Utility Functions ---

  function generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function getTransactionsForMonth(month) {
    // month is 'YYYY-MM'; match transactions whose date starts with that prefix
    return state.transactions.filter((t) => t.date && t.date.startsWith(month));
  }

  function groupByCategory(transactions) {
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  }

  // --- Render Functions ---

  function renderBalance() {
    const total = state.transactions.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('balance-amount').textContent = formatCurrency(total);
  }

  function renderTransactionList() {
    const transactions = state.activeMonth
      ? getTransactionsForMonth(state.activeMonth)
      : state.transactions;

    const ul = document.getElementById('transaction-list');
    ul.innerHTML = '';

    if (transactions.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = state.activeMonth
        ? 'No transactions for this month.'
        : 'No transactions yet. Add one above.';
      ul.appendChild(li);
      return;
    }

    transactions.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.innerHTML = `
        <span class="transaction-name">${t.name}</span>
        <span class="transaction-category">${t.category}</span>
        <span class="transaction-amount">${formatCurrency(t.amount)}</span>
        <button class="delete-btn" data-id="${t.id}" aria-label="Delete ${t.name}">Delete</button>
      `;
      ul.appendChild(li);
    });
  }

  function renderCategorySelects() {
    const selects = document.querySelectorAll('select[name="category"]');
    selects.forEach((select) => {
      // Preserve current selection
      const current = select.value;
      // Remove all options except the first placeholder (if it has no value)
      while (select.options.length > 1) {
        select.remove(1);
      }
      // Ensure placeholder exists
      if (select.options.length === 0 || select.options[0].value !== '') {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = 'Select category';
        select.insertBefore(placeholder, select.firstChild);
      }
      state.categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
      // Restore previous selection if still valid
      if (current && state.categories.includes(current)) {
        select.value = current;
      }
    });
  }

  function renderMonthlyTotal() {
    const span = document.getElementById('monthly-total');
    if (!span) return;
    if (!state.activeMonth) {
      span.textContent = '';
      return;
    }
    const total = getTransactionsForMonth(state.activeMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    span.textContent = 'Total: ' + formatCurrency(total);
  }

  // --- Chart ---
  let chartInstance = null;

  function renderChart() {
    const transactions = state.activeMonth
      ? getTransactionsForMonth(state.activeMonth)
      : state.transactions;

    const grouped = groupByCategory(transactions);
    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    const canvas = document.getElementById('spending-chart');
    const placeholder = document.getElementById('chart-placeholder');

    if (labels.length === 0) {
      canvas.hidden = true;
      placeholder.hidden = false;
      return;
    }

    // Guard against CDN failure
    if (typeof Chart === 'undefined') {
      canvas.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = 'Chart unavailable — could not load Chart.js.';
      return;
    }

    // Register datalabels plugin if available
    if (typeof ChartDataLabels !== 'undefined') {
      Chart.register(ChartDataLabels);
    }

    canvas.hidden = false;
    placeholder.hidden = true;

    const COLORS = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#E7E9ED', '#71B37C',
      '#F7464A', '#46BFBD', '#FDB45C', '#949FB1',
    ];
    const backgroundColors = labels.map((_, i) => COLORS[i % COLORS.length]);

    if (!chartInstance) {
      const ctx = canvas.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: backgroundColors,
            borderColor: '#fff',
            borderWidth: 2,
          }],
        },
        options: {
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (tooltipCtx) =>
                  `${tooltipCtx.label}: ${tooltipCtx.parsed.toFixed(1)}%`,
              },
            },
            datalabels: {
              color: '#fff',
              font: { weight: 'bold', size: 12 },
              formatter: (value, ctx) => {
                const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const pct = ((value / total) * 100).toFixed(1);
                return `${ctx.chart.data.labels[ctx.dataIndex]}\n${pct}%`;
              },
            },
          },
        },
      });
    } else {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = data;
      chartInstance.data.datasets[0].backgroundColor = backgroundColors;
      chartInstance.update();
    }
  }

  // --- Action Handlers ---

  function handleDeleteTransaction(id) {
    state.transactions = state.transactions.filter((t) => t.id !== id);
    storage.save(state);
    renderBalance();
    renderTransactionList();
    renderChart();
    renderMonthlyTotal();
  }

  function handleAddTransaction(event) {
    event.preventDefault();

    const nameInput = document.getElementById('item-name');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category-select');

    const nameError = document.getElementById('item-name-error');
    const amountError = document.getElementById('amount-error');
    const categoryError = document.getElementById('category-error');

    // Clear previous errors
    nameError.hidden = true;
    nameError.textContent = '';
    amountError.hidden = true;
    amountError.textContent = '';
    categoryError.hidden = true;
    categoryError.textContent = '';

    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    let valid = true;

    if (!name) {
      nameError.textContent = 'Item name is required.';
      nameError.hidden = false;
      valid = false;
    }

    if (!amountInput.value || isNaN(amount) || amount <= 0) {
      amountError.textContent = 'Amount must be a positive number.';
      amountError.hidden = false;
      valid = false;
    }

    if (!category) {
      categoryError.textContent = 'Please select a category.';
      categoryError.hidden = false;
      valid = false;
    }

    if (!valid) return;

    const transaction = {
      id: generateId(),
      name,
      amount,
      category,
      date: new Date().toISOString().slice(0, 10), // 'YYYY-MM-DD'
    };

    state.transactions.push(transaction);
    storage.save(state);

    renderBalance();
    renderTransactionList();
    renderChart();
    renderMonthlyTotal();

    event.target.reset();
    // Reset category select to placeholder after form reset
    categorySelect.value = '';
  }

  function handleMonthChange(event) {
    state.activeMonth = event.target.value || null;
    renderTransactionList();
    renderChart();
    renderMonthlyTotal();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  function handleThemeToggle() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    storage.save(state);
  }

  function handleAddCategory(event) {
    event.preventDefault();

    const nameInput = document.getElementById('category-name');
    const nameError = document.getElementById('category-name-error');

    // Clear previous error
    nameError.hidden = true;
    nameError.textContent = '';

    const name = nameInput.value.trim();

    if (!name) {
      nameError.textContent = 'Category name is required.';
      nameError.hidden = false;
      return;
    }

    const isDuplicate = state.categories.some(
      (cat) => cat.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
      nameError.textContent = 'Category already exists.';
      nameError.hidden = false;
      return;
    }

    state.categories.push(name);
    storage.save(state);
    renderCategorySelects();
    event.target.reset();
  }

  // --- Event Listeners ---

  document.getElementById('transaction-form').addEventListener('submit', handleAddTransaction);
  document.getElementById('category-form').addEventListener('submit', handleAddCategory);
  document.querySelector('#month-selector input').addEventListener('change', handleMonthChange);
  document.getElementById('theme-toggle').addEventListener('click', handleThemeToggle);
  document.getElementById('transaction-list').addEventListener('click', function (event) {
    const btn = event.target.closest('.delete-btn');
    if (btn) {
      handleDeleteTransaction(btn.dataset.id);
    }
  });

  // --- Bootstrap ---
  applyTheme(state.theme);
  renderBalance();
  renderCategorySelects();
  renderTransactionList();
  renderChart();
  renderMonthlyTotal();

})();
