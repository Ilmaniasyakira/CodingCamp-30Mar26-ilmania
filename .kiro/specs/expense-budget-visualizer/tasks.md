00# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a fully client-side single-page app using HTML, CSS, and vanilla JavaScript. No build step, no framework. Chart.js via CDN. All state persisted in localStorage. All JS lives in a single IIFE in `js/app.js`.

## Tasks

- [x] 1. Project scaffolding
  - Create `index.html`, `css/styles.css`, and `js/app.js` as empty files with the correct directory structure
  - Add Chart.js CDN `<script>` tag and link to `css/styles.css` and `js/app.js` in `index.html`
  - _Requirements: 1.1, 4.1, 7.1, 8.1_

- [x] 2. HTML structure
  - [x] 2.1 Write all markup sections in `index.html`
    - `#header` with app title and theme toggle `<button>`
    - `#balance-panel` for total balance display
    - `#transaction-form` with item name `<input>`, amount `<input type="number">`, category `<select>`, and submit `<button>`
    - `#category-form` with category name `<input>` and add `<button>`
    - `#month-selector` with `<input type="month">` and monthly total `<span>`
    - `#transaction-list` as a `<ul>`
    - `#chart-panel` with a `<canvas id="spending-chart">` and a placeholder `<p>`
    - Inline validation error `<span>` elements adjacent to each form field
    - _Requirements: 1.1, 2.1, 3.1, 4.4, 5.1, 6.1, 6.5, 7.1_

- [x] 3. CSS styling
  - [x] 3.1 Define CSS custom properties and light/dark themes in `css/styles.css`
    - Declare all design tokens (`--bg`, `--surface`, `--text`, `--accent`, etc.) under `:root` for light mode
    - Override tokens under `[data-theme="dark"]` for dark mode
    - _Requirements: 7.2_
  - [x] 3.2 Write layout and component styles
    - Responsive single-column layout with a max-width container
    - Style all form controls, buttons, the transaction list, balance panel, and chart panel
    - Style inline validation error messages (hidden by default, visible when active)
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1_

- [ ] 4. Storage layer
  - [x] 4.1 Implement `storage.load()` and `storage.save(state)` inside the IIFE in `js/app.js`
    - `storage.load()` reads `ebv_transactions`, `ebv_categories`, `ebv_theme` from localStorage; returns parsed state or default state on any error
    - `storage.save(state)` serializes and writes all three keys; wrapped in `try/catch` to handle unavailable storage
    - Default state: `{ transactions: [], categories: ["Food", "Transport", "Fun"], theme: "light" }`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ]* 4.2 Write property test — P12: Full state round-trip through localStorage
    - `// Feature: expense-budget-visualizer, Property 12: Full state round-trip through localStorage`
    - Generate arbitrary valid state; call `storage.save(state)` then `storage.load()`; assert deep equality
    - **Property 12: Full state round-trip through localStorage**
    - **Validates: Requirements 8.4**
  - [ ]* 4.3 Write property test — P13: Corrupted or missing storage falls back to default state
    - `// Feature: expense-budget-visualizer, Property 13: Corrupted or missing storage falls back to default state`
    - Inject corrupted JSON strings or clear keys; assert `storage.load()` returns default state without throwing
    - **Property 13: Corrupted or missing storage falls back to default state**
    - **Validates: Requirements 8.5**

- [ ] 5. State object and utility functions
  - [x] 5.1 Declare the `state` object and implement utility functions in `js/app.js`
    - `state = { transactions, categories, theme, activeMonth }` initialized from `storage.load()`
    - `generateId()` using `crypto.randomUUID()` with `Date.now().toString()` fallback
    - `formatCurrency(amount)` using `Intl.NumberFormat`
    - `getTransactionsForMonth(month)` filters `state.transactions` by `YYYY-MM` prefix match on `date`
    - `groupByCategory(transactions)` reduces to `{ [category]: totalAmount }`
    - _Requirements: 3.2, 4.1, 6.2, 6.4_
  - [ ]* 5.2 Write property test — P5: Balance equals sum of all transaction amounts
    - `// Feature: expense-budget-visualizer, Property 5: Balance equals sum of all transaction amounts`
    - Generate random transaction arrays; assert `transactions.reduce((s, t) => s + t.amount, 0)` equals computed balance
    - **Property 5: Balance equals sum of all transaction amounts**
    - **Validates: Requirements 3.2**
  - [ ]* 5.3 Write property test — P6: groupByCategory produces correct per-category totals
    - `// Feature: expense-budget-visualizer, Property 6: groupByCategory produces correct per-category totals`
    - Generate random transactions; assert each key's value equals manual per-category sum
    - **Property 6: groupByCategory produces correct per-category totals**
    - **Validates: Requirements 4.1, 4.2**
  - [ ]* 5.4 Write property test — P7: Category percentages sum to 100
    - `// Feature: expense-budget-visualizer, Property 7: Category percentages sum to 100`
    - Generate non-empty transaction sets; derive percentages from `groupByCategory`; assert sum ≈ 100 within floating-point tolerance
    - **Property 7: Category percentages sum to 100**
    - **Validates: Requirements 4.3**
  - [ ]* 5.5 Write property test — P9: Month filter returns only transactions in the selected month
    - `// Feature: expense-budget-visualizer, Property 9: Month filter returns only transactions in the selected month`
    - Generate random transactions with random ISO dates and a random `YYYY-MM` month; assert `getTransactionsForMonth` returns exactly the matching subset
    - **Property 9: Month filter returns only transactions in the selected month**
    - **Validates: Requirements 6.2, 6.3**
  - [ ]* 5.6 Write property test — P10: Monthly total equals sum of filtered transactions
    - `// Feature: expense-budget-visualizer, Property 10: Monthly total equals sum of filtered transactions`
    - Generate random transactions and a month; assert monthly total equals sum of `getTransactionsForMonth` results
    - **Property 10: Monthly total equals sum of filtered transactions**
    - **Validates: Requirements 6.4**

- [ ] 6. Render functions
  - [x] 6.1 Implement `renderBalance()` in `js/app.js`
    - Sum all `state.transactions` amounts and write formatted result to `#balance-panel`
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 Implement `renderTransactionList()` in `js/app.js`
    - If `state.activeMonth` is set, use `getTransactionsForMonth`; otherwise use all transactions
    - Rebuild `#transaction-list` `<ul>` with one `<li>` per transaction showing name, amount, category, and a delete button carrying the transaction id
    - Show empty-state message when the filtered list is empty
    - _Requirements: 2.1, 2.2, 6.2, 6.5_
  - [ ]* 6.3 Write property test — P3: Transaction list renders all required fields
    - `// Feature: expense-budget-visualizer, Property 3: Transaction list renders all required fields`
    - Generate random transactions; call `renderTransactionList()`; assert each rendered `<li>` contains the transaction's name, formatted amount, and category
    - **Property 3: Transaction list renders all required fields**
    - **Validates: Requirements 2.2**
  - [x] 6.4 Implement `renderCategorySelects()` in `js/app.js`
    - Sync all `<select>` elements that list categories with `state.categories`
    - _Requirements: 1.1, 5.2_
  - [x] 6.5 Implement `renderMonthlyTotal()` in `js/app.js`
    - Sum amounts from `getTransactionsForMonth(state.activeMonth)` and update the monthly total `<span>`
    - _Requirements: 6.4_
  - [x] 6.6 Implement `renderChart()` in `js/app.js`
    - Use `groupByCategory` on the active transaction set (filtered or all)
    - If no data: hide `<canvas>`, show placeholder `<p>`
    - On first render: create `chartInstance` with `type: 'pie'`; on subsequent renders: mutate `chartInstance.data` and call `chartInstance.update()`
    - Assign a distinct color to each category slice using a 12-color palette, cycling when categories exceed 12
    - Render category name and percentage directly on each slice using `chartjs-plugin-datalabels` (loaded via CDN)
    - Wrap Chart.js and ChartDataLabels access in guards for CDN failure fallback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.3_

- [ ] 7. Action handlers and event wiring
  - [x] 7.1 Implement `handleAddTransaction(event)` in `js/app.js`
    - Validate: name non-empty, amount positive, category present; show inline errors on failure
    - On success: push new transaction object (with `generateId()` and today's ISO date) to `state.transactions`, call `storage.save(state)`, call `renderBalance`, `renderTransactionList`, `renderChart`, `renderMonthlyTotal`, reset form
    - _Requirements: 1.2, 1.3, 8.1_
  - [ ]* 7.2 Write property test — P1: Valid transaction submission grows the list
    - `// Feature: expense-budget-visualizer, Property 1: Valid transaction submission grows the list`
    - Generate valid transaction inputs; call `handleAddTransaction`; assert `state.transactions.length` increased by 1 and new transaction is present
    - **Property 1: Valid transaction submission grows the list**
    - **Validates: Requirements 1.2**
  - [ ]* 7.3 Write property test — P2: Invalid form input is rejected
    - `// Feature: expense-budget-visualizer, Property 2: Invalid form input is rejected`
    - Generate inputs with empty name or non-positive amount; call `handleAddTransaction`; assert `state.transactions` unchanged
    - **Property 2: Invalid form input is rejected**
    - **Validates: Requirements 1.3**
  - [x] 7.4 Implement `handleDeleteTransaction(id)` in `js/app.js`
    - Filter `state.transactions` to remove the matching id, call `storage.save(state)`, call `renderBalance`, `renderTransactionList`, `renderChart`, `renderMonthlyTotal`
    - _Requirements: 2.3, 8.1_
  - [ ]* 7.5 Write property test — P4: Deleting a transaction removes it
    - `// Feature: expense-budget-visualizer, Property 4: Deleting a transaction removes it`
    - Generate a non-empty transaction list; pick a random id; call `handleDeleteTransaction(id)`; assert that id is absent and all others remain
    - **Property 4: Deleting a transaction removes it**
    - **Validates: Requirements 2.3**
  - [x] 7.6 Implement `handleAddCategory(event)` in `js/app.js`
    - Validate: name non-empty, not a case-insensitive duplicate; show inline error on failure
    - On success: push to `state.categories`, call `storage.save(state)`, call `renderCategorySelects`
    - _Requirements: 5.2, 5.3, 5.4, 8.2_
  - [ ]* 7.7 Write property test — P8: Category validation — valid names added, invalid names rejected
    - `// Feature: expense-budget-visualizer, Property 8: Category validation — valid names added, invalid names rejected`
    - Generate valid and invalid category names; assert valid ones grow the list by 1, duplicates/empty leave it unchanged
    - **Property 8: Category validation — valid names added, invalid names rejected**
    - **Validates: Requirements 5.2, 5.3, 5.4**
  - [x] 7.8 Implement `handleMonthChange(event)` in `js/app.js`
    - Set `state.activeMonth` to the input value (or `null` if cleared), call `renderTransactionList`, `renderChart`, `renderMonthlyTotal`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 7.9 Implement `handleThemeToggle()` in `js/app.js`
    - Flip `state.theme` between `'light'` and `'dark'`, call `applyTheme(state.theme)`, call `storage.save(state)`
    - Update toggle button label/icon to reflect current mode
    - _Requirements: 7.2, 7.3_
  - [ ]* 7.10 Write property test — P11: Theme toggle round-trip persists and restores correctly
    - `// Feature: expense-budget-visualizer, Property 11: Theme toggle round-trip persists and restores correctly`
    - Set an initial theme; call `handleThemeToggle()`; assert theme flipped; call `storage.load()`; assert loaded theme matches new value
    - **Property 11: Theme toggle round-trip persists and restores correctly**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  - [x] 7.11 Wire all event listeners at the bottom of the IIFE
    - `#transaction-form` → `submit` → `handleAddTransaction`
    - `#category-form` → `submit` → `handleAddCategory`
    - `#month-selector input` → `change` → `handleMonthChange`
    - Theme toggle `<button>` → `click` → `handleThemeToggle`
    - `#transaction-list` → delegated `click` on delete buttons → `handleDeleteTransaction`
    - _Requirements: 1.2, 2.3, 5.1, 6.1, 7.1_

- [x] 8. Bootstrap and initial render
  - Load state from storage, call `applyTheme(state.theme)`, then call all render functions to paint the initial UI
  - _Requirements: 7.4, 8.4_

- [-] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with a minimum of 100 iterations each
- Each property test includes the comment tag `// Feature: expense-budget-visualizer, Property N: <text>`
- Checkpoints ensure incremental validation before moving to the next phase
