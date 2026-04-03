# Design Document: Expense & Budget Visualizer

## Overview

A fully client-side single-page web application built with HTML, CSS, and vanilla JavaScript. All state (transactions, categories, theme) is persisted in the browser's `localStorage`. Chart.js renders the spending pie chart. The app is a single `index.html` with one CSS file and one JS file, requiring no build step or server.

---

## Architecture

```
expense-budget-visualizer/
├── index.html          # Single HTML entry point; all markup lives here
├── css/
│   └── styles.css      # All styling, including CSS custom properties for theming
└── js/
    └── app.js          # All application logic (storage, state, UI, chart)
```

The application follows a simple **state → render** cycle:

```
User Action
    │
    ▼
Mutate State (transactions / categories / theme)
    │
    ▼
Persist to localStorage
    │
    ▼
Re-render affected UI regions (balance, list, chart, selects)
```

There is no virtual DOM or reactive framework. Each mutation calls a focused `render*` function that rewrites only the relevant DOM section.

---

## Components and Interfaces

### HTML Sections (index.html)

| Section | ID / Role | Description |
|---|---|---|
| Header | `#header` | App title + theme toggle button |
| Balance Panel | `#balance-panel` | Displays total balance (all time) |
| Input Form | `#transaction-form` | Item name, amount, category select, submit |
| Category Manager | `#category-form` | Custom category input + add button |
| Month Selector | `#month-selector` | `<input type="month">` + monthly total display |
| Transaction List | `#transaction-list` | Scrollable `<ul>` of transaction items |
| Chart Panel | `#chart-panel` | Canvas for Chart.js pie chart + placeholder text |

### JavaScript Functions (app.js)

All code lives in a single IIFE to avoid polluting the global scope.

#### Storage Layer

```js
storage.load()          // → { transactions, categories, theme } | default state
storage.save(state)     // persists full state snapshot to localStorage
```

#### State

```js
let state = {
  transactions: [],   // Transaction[]
  categories: [],     // string[]
  theme: 'light',     // 'light' | 'dark'
  activeMonth: null   // 'YYYY-MM' | null (null = show all)
}
```

#### Render Functions

```js
renderBalance()          // recalculates and updates #balance-panel
renderTransactionList()  // rebuilds #transaction-list respecting activeMonth filter
renderChart()            // updates or creates Chart.js instance; shows placeholder if empty
renderCategorySelects()  // syncs all <select> elements with current categories
renderMonthlyTotal()     // updates monthly total display
```

#### Action Handlers

```js
handleAddTransaction(event)    // validates form, mutates state, persists, re-renders
handleDeleteTransaction(id)    // removes by id, persists, re-renders
handleAddCategory(event)       // validates name, mutates state, persists, re-renders selects
handleMonthChange(event)       // updates activeMonth, re-renders list + chart + monthly total
handleThemeToggle()            // flips theme, persists, applies CSS class
```

#### Utility

```js
generateId()                   // returns a unique string id (crypto.randomUUID or Date.now fallback)
formatCurrency(amount)         // returns locale-formatted currency string
getTransactionsForMonth(month) // filters state.transactions by 'YYYY-MM'
groupByCategory(transactions)  // returns { [category]: totalAmount }
```

---

## Data Models

### localStorage Keys

| Key | Type | Description |
|---|---|---|
| `ebv_transactions` | JSON string | Array of Transaction objects |
| `ebv_categories` | JSON string | Array of category name strings |
| `ebv_theme` | JSON string | `"light"` or `"dark"` |

### Transaction Object

```js
{
  id: string,        // unique identifier (UUID or timestamp string)
  name: string,      // item name, non-empty
  amount: number,    // positive number
  category: string,  // must match an entry in categories[]
  date: string       // ISO 8601 date string, e.g. "2024-06-15" (set at creation time)
}
```

### Categories

Stored as a plain `string[]`. Default categories are `["Food", "Transport", "Fun"]`. Custom categories are appended to this array. Comparison for duplicates is always case-insensitive (`name.toLowerCase()`).

### Theme

Stored as a plain string: `"light"` or `"dark"`. Defaults to `"light"` if absent or unreadable.

### Default State (fallback)

```js
{
  transactions: [],
  categories: ["Food", "Transport", "Fun"],
  theme: "light"
}
```

---

## Chart.js Integration

Chart.js and the `chartjs-plugin-datalabels` plugin are loaded via CDN in `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
```

The datalabels plugin is registered at runtime (guarded against CDN failure) before the first chart creation:

```js
if (typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}
```

A single `Chart` instance is created on first render and stored in a module-level variable (`let chartInstance = null`). On subsequent renders, `chartInstance.data` is mutated and `chartInstance.update()` is called — avoiding destroy/recreate flicker.

### Color Palette

A fixed 12-color palette is defined at module level. Colors are assigned to categories by index, cycling when the number of categories exceeds 12:

```js
const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#E7E9ED', '#71B37C',
  '#F7464A', '#46BFBD', '#FDB45C', '#949FB1',
];
const backgroundColors = labels.map((_, i) => COLORS[i % COLORS.length]);
```

### Chart Configuration

```js
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
          label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
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
```

Labels are rendered directly on each slice showing the category name and percentage. Tooltips provide the same information on hover. On update, `backgroundColor` is also refreshed to keep colors consistent with the current label order.

---

## Theme Switching

Theming is implemented entirely with CSS custom properties. A `data-theme` attribute on `<html>` controls which variable set is active.

```css
:root {
  --bg: #ffffff;
  --surface: #f5f5f5;
  --text: #111111;
  --accent: #4f46e5;
  /* ... */
}

[data-theme="dark"] {
  --bg: #121212;
  --surface: #1e1e1e;
  --text: #f0f0f0;
  --accent: #818cf8;
  /* ... */
}
```

```js
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
```

On load, `applyTheme` is called before any rendering so there is no flash of unstyled content. The toggle button updates its label/icon to reflect the current mode.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction submission grows the list

*For any* valid transaction (non-empty name, positive amount, existing category), adding it to the transaction list should result in the list length increasing by exactly one, and the new transaction should be present in the list.

**Validates: Requirements 1.2**

---

### Property 2: Invalid form input is rejected

*For any* form submission where the name is empty or whitespace-only, or the amount is zero or negative, the transaction list should remain unchanged (same length and same contents as before the submission attempt).

**Validates: Requirements 1.3**

---

### Property 3: Transaction list renders all required fields

*For any* transaction in the transaction list, the rendered list item should contain the transaction's item name, amount, and category as visible text.

**Validates: Requirements 2.2**

---

### Property 4: Deleting a transaction removes it

*For any* transaction list containing at least one transaction, after deleting a specific transaction by its id, that transaction should no longer appear in the list, and all other transactions should remain unchanged.

**Validates: Requirements 2.3**

---

### Property 5: Balance equals sum of all transaction amounts

*For any* set of transactions, the displayed balance should equal the arithmetic sum of all transaction amounts. This invariant must hold after every add and delete operation.

**Validates: Requirements 3.2**

---

### Property 6: groupByCategory produces correct per-category totals

*For any* set of transactions, `groupByCategory` should return an object where each key is a category name and each value equals the sum of amounts of all transactions in that category. No category should be missing, and no extra categories should appear.

**Validates: Requirements 4.1, 4.2**

---

### Property 7: Category percentages sum to 100

*For any* non-empty set of transactions, the percentage values derived from `groupByCategory` output (each category's total divided by the grand total, multiplied by 100) should sum to 100 (within floating-point tolerance).

**Validates: Requirements 4.3**

---

### Property 8: Category validation — valid names added, invalid names rejected

*For any* category name that is non-empty and does not match any existing category name case-insensitively, adding it should grow the category list by one. *For any* category name that is empty, whitespace-only, or matches an existing name case-insensitively, the category list should remain unchanged.

**Validates: Requirements 5.2, 5.3, 5.4**

---

### Property 9: Month filter returns only transactions in the selected month

*For any* set of transactions and any selected month string (`YYYY-MM`), `getTransactionsForMonth` should return exactly the transactions whose `date` field falls within that calendar month — no more, no fewer.

**Validates: Requirements 6.2, 6.3**

---

### Property 10: Monthly total equals sum of filtered transactions

*For any* set of transactions and any selected month, the displayed monthly total should equal the sum of amounts of all transactions returned by `getTransactionsForMonth` for that month.

**Validates: Requirements 6.4**

---

### Property 11: Theme toggle round-trip persists and restores correctly

*For any* initial theme value, toggling the theme should change it to the opposite value, persist it to storage, and a subsequent `storage.load()` call should return the new theme value.

**Validates: Requirements 7.2, 7.3, 7.4**

---

### Property 12: Full state round-trip through localStorage

*For any* valid application state (arbitrary transactions, categories, and theme), calling `storage.save(state)` followed by `storage.load()` should return a state object that is deeply equal to the saved state.

**Validates: Requirements 8.4**

---

### Property 13: Corrupted or missing storage falls back to default state

*For any* corrupted JSON string or missing key in localStorage, `storage.load()` should return the default state (`{ transactions: [], categories: ["Food", "Transport", "Fun"], theme: "light" }`) without throwing an error.

**Validates: Requirements 8.5**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private mode, quota exceeded) | `try/catch` in `storage.load()` and `storage.save()`; falls back to in-memory default state; app continues normally |
| Corrupted JSON in localStorage | `JSON.parse` wrapped in `try/catch`; returns default state on failure |
| Form submitted with empty name | Inline validation error shown; transaction not added |
| Form submitted with non-positive amount | Inline validation error shown; transaction not added |
| Duplicate category submitted | Inline validation error shown; category not added |
| Empty category name submitted | Inline validation error shown; category not added |
| No transactions for selected month | Placeholder message shown in list and chart panel |
| Chart.js not loaded (CDN failure) | Chart panel shows a static fallback message; rest of app functions normally |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** catch concrete bugs at specific inputs and verify integration points
- **Property tests** verify universal correctness across the full input space

### Unit Tests

Focus on specific examples, edge cases, and integration points:

- `storage.load()` returns default state when localStorage is empty
- `storage.load()` returns default state when localStorage contains invalid JSON
- `storage.save()` + `storage.load()` round-trip with a known state object
- `groupByCategory([])` returns `{}`
- `getTransactionsForMonth([], 'YYYY-MM')` returns `[]`
- `formatCurrency(0)` returns a valid formatted string
- Deleting the only transaction leaves an empty list
- Adding a transaction with a category not in the list is rejected

### Property-Based Tests

Use [fast-check](https://github.com/dubzzz/fast-check). Each test runs a minimum of **100 iterations**.

Each test must include a comment tag in the format:
`// Feature: expense-budget-visualizer, Property N: <property_text>`

| Property | Test Description |
|---|---|
| P1 | Generate random valid transactions; assert list grows by 1 after each add |
| P2 | Generate invalid inputs (empty name, ≤0 amount); assert list unchanged |
| P3 | Generate random transactions; assert rendered HTML contains name, amount, category |
| P4 | Generate random list; delete random item; assert item absent, others present |
| P5 | Generate random transaction sets; assert balance === sum of amounts |
| P6 | Generate random transactions; assert groupByCategory totals match manual sum per category |
| P7 | Generate random non-empty transactions; assert percentage values sum to ~100 |
| P8 | Generate random category names; assert valid ones added, duplicates/empty rejected |
| P9 | Generate random transactions with random dates; assert month filter returns correct subset |
| P10 | Generate random transactions and month; assert monthly total === sum of filtered amounts |
| P11 | Generate random theme; toggle; assert opposite theme persisted and restored |
| P12 | Generate random full state; save then load; assert deep equality |
| P13 | Generate corrupted strings; assert storage.load() returns default state without throwing |

Each correctness property must be implemented by a **single** property-based test.
