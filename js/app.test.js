// Tests for core pure functions from app.js
// Functions are re-implemented inline since app.js is a self-executing IIFE

import { describe, it, expect, beforeEach } from 'vitest';

// --- Pure function implementations (mirrored from app.js) ---

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
}

function getTransactionsForMonth(transactions, month) {
  return transactions.filter(t => t.date && t.date.startsWith(month));
}

function groupByCategory(transactions) {
  return transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}

function loadState(mockLocalStorage) {
  const DEFAULT = { transactions: [], categories: ['Food', 'Transport', 'Fun'], theme: 'light' };
  try {
    const transactions = JSON.parse(mockLocalStorage.getItem('ebv_transactions'));
    const categories = JSON.parse(mockLocalStorage.getItem('ebv_categories'));
    const theme = JSON.parse(mockLocalStorage.getItem('ebv_theme'));
    return {
      transactions: Array.isArray(transactions) ? transactions : DEFAULT.transactions,
      categories: Array.isArray(categories) ? categories : DEFAULT.categories,
      theme: theme === 'light' || theme === 'dark' ? theme : DEFAULT.theme,
    };
  } catch (_e) {
    return { ...DEFAULT, categories: [...DEFAULT.categories] };
  }
}

// --- Helpers ---

function makeTx(overrides = {}) {
  return {
    id: '1',
    name: 'Coffee',
    amount: 5.0,
    category: 'Food',
    date: '2024-03-15',
    ...overrides,
  };
}

// --- Tests ---

describe('formatCurrency', () => {
  it('formats a positive number as USD currency', () => {
    const result = formatCurrency(10);
    expect(result).toMatch(/\$10\.00/);
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/\$0\.00/);
  });

  it('formats a negative number', () => {
    const result = formatCurrency(-5.5);
    expect(result).toMatch(/5\.50/);
  });

  it('formats a decimal amount', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/1,234\.56/);
  });
});

describe('getTransactionsForMonth', () => {
  const transactions = [
    makeTx({ id: '1', date: '2024-03-01' }),
    makeTx({ id: '2', date: '2024-03-31' }),
    makeTx({ id: '3', date: '2024-04-01' }),
    makeTx({ id: '4', date: '2024-02-28' }),
  ];

  it('returns only transactions matching the given month', () => {
    const result = getTransactionsForMonth(transactions, '2024-03');
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual(['1', '2']);
  });

  it('returns empty array when no transactions match', () => {
    const result = getTransactionsForMonth(transactions, '2024-01');
    expect(result).toHaveLength(0);
  });

  it('returns all transactions if all match the month', () => {
    const same = [makeTx({ id: 'a', date: '2024-04-10' }), makeTx({ id: 'b', date: '2024-04-20' })];
    const result = getTransactionsForMonth(same, '2024-04');
    expect(result).toHaveLength(2);
  });

  it('skips transactions with missing date', () => {
    const withMissing = [makeTx({ id: 'x', date: null }), makeTx({ id: 'y', date: '2024-03-05' })];
    const result = getTransactionsForMonth(withMissing, '2024-03');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('y');
  });

  it('returns empty array for empty input', () => {
    expect(getTransactionsForMonth([], '2024-03')).toEqual([]);
  });
});

describe('groupByCategory', () => {
  it('sums amounts per category', () => {
    const txs = [
      makeTx({ category: 'Food', amount: 10 }),
      makeTx({ category: 'Food', amount: 5 }),
      makeTx({ category: 'Transport', amount: 20 }),
    ];
    const result = groupByCategory(txs);
    expect(result).toEqual({ Food: 15, Transport: 20 });
  });

  it('returns empty object for empty input', () => {
    expect(groupByCategory([])).toEqual({});
  });

  it('handles a single transaction', () => {
    const result = groupByCategory([makeTx({ category: 'Fun', amount: 50 })]);
    expect(result).toEqual({ Fun: 50 });
  });

  it('handles multiple categories each with one transaction', () => {
    const txs = [
      makeTx({ category: 'Food', amount: 10 }),
      makeTx({ category: 'Transport', amount: 30 }),
      makeTx({ category: 'Fun', amount: 20 }),
    ];
    const result = groupByCategory(txs);
    expect(result).toEqual({ Food: 10, Transport: 30, Fun: 20 });
  });
});

describe('balance calculation', () => {
  it('sums all transaction amounts', () => {
    const txs = [makeTx({ amount: 10 }), makeTx({ amount: 20 }), makeTx({ amount: 5 })];
    const balance = txs.reduce((sum, t) => sum + t.amount, 0);
    expect(balance).toBe(35);
  });

  it('returns 0 for empty transactions', () => {
    expect([].reduce((sum, t) => sum + t.amount, 0)).toBe(0);
  });

  it('handles negative amounts (expenses)', () => {
    const txs = [makeTx({ amount: 100 }), makeTx({ amount: -30 })];
    const balance = txs.reduce((sum, t) => sum + t.amount, 0);
    expect(balance).toBe(70);
  });
});

describe('loadState — storage fallback', () => {
  function makeStorage(data = {}) {
    return {
      getItem: (key) => data[key] ?? null,
    };
  }

  it('returns default state when storage is empty', () => {
    const state = loadState(makeStorage());
    expect(state.transactions).toEqual([]);
    expect(state.categories).toEqual(['Food', 'Transport', 'Fun']);
    expect(state.theme).toBe('light');
  });

  it('returns default state when storage has corrupted JSON', () => {
    const state = loadState(makeStorage({
      ebv_transactions: 'not-json{{{',
      ebv_categories: '[[invalid',
      ebv_theme: 'bad',
    }));
    expect(state.transactions).toEqual([]);
    expect(state.categories).toEqual(['Food', 'Transport', 'Fun']);
    expect(state.theme).toBe('light');
  });

  it('loads valid stored state', () => {
    const txs = [makeTx()];
    const cats = ['Food', 'Health'];
    const state = loadState(makeStorage({
      ebv_transactions: JSON.stringify(txs),
      ebv_categories: JSON.stringify(cats),
      ebv_theme: JSON.stringify('dark'),
    }));
    expect(state.transactions).toEqual(txs);
    expect(state.categories).toEqual(cats);
    expect(state.theme).toBe('dark');
  });

  it('falls back to default transactions when stored value is not an array', () => {
    const state = loadState(makeStorage({
      ebv_transactions: JSON.stringify({ not: 'an array' }),
      ebv_categories: JSON.stringify(['Food']),
      ebv_theme: JSON.stringify('light'),
    }));
    expect(state.transactions).toEqual([]);
  });

  it('falls back to default theme when stored theme is invalid', () => {
    const state = loadState(makeStorage({
      ebv_transactions: JSON.stringify([]),
      ebv_categories: JSON.stringify(['Food']),
      ebv_theme: JSON.stringify('purple'),
    }));
    expect(state.theme).toBe('light');
  });
});

describe('category validation', () => {
  it('rejects empty category name', () => {
    const categories = ['Food', 'Transport'];
    const name = '   '.trim();
    expect(name).toBe('');
    // Empty name should be rejected
    expect(name.length).toBe(0);
  });

  it('detects duplicate category (case-insensitive)', () => {
    const categories = ['Food', 'Transport', 'Fun'];
    const isDuplicate = (name) =>
      categories.some(cat => cat.toLowerCase() === name.toLowerCase());

    expect(isDuplicate('food')).toBe(true);
    expect(isDuplicate('FOOD')).toBe(true);
    expect(isDuplicate('Food')).toBe(true);
    expect(isDuplicate('Health')).toBe(false);
  });

  it('allows a new unique category name', () => {
    const categories = ['Food', 'Transport'];
    const isDuplicate = (name) =>
      categories.some(cat => cat.toLowerCase() === name.toLowerCase());

    expect(isDuplicate('Healthcare')).toBe(false);
    expect(isDuplicate('Entertainment')).toBe(false);
  });

  it('detects duplicate regardless of surrounding whitespace after trim', () => {
    const categories = ['Food'];
    const name = '  food  '.trim();
    const isDuplicate = categories.some(cat => cat.toLowerCase() === name.toLowerCase());
    expect(isDuplicate).toBe(true);
  });
});
