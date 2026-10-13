import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AppData,
  Category,
  SavingsGoal,
  Transaction,
  Settings,
  ActiveTab,
  ToastMessage,
  ToastType,
} from '../types';
import {
  STORAGE_KEY,
  HIDE_BALANCE_KEY,
  DEFAULT_CATEGORIES,
  DEFAULT_SAVINGS_GOALS,
  generateDemoTransactions,
} from '../constants';

function getCurrentMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadInitialData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : [...DEFAULT_CATEGORIES],
        savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [...DEFAULT_SAVINGS_GOALS],
        distributedSavings: parsed.distributedSavings || {},
        settings: {
          currency: '₺',
          theme: 'dark',
          transferFee: 15.00,
          selectedMonth: getCurrentMonthString(),
          ...(parsed.settings || {})
        }
      };
    }
  } catch (e) {
    console.error('LocalStorage okuma hatası:', e);
  }

  return {
    transactions: generateDemoTransactions(),
    categories: [...DEFAULT_CATEGORIES],
    savingsGoals: [...DEFAULT_SAVINGS_GOALS],
    distributedSavings: {},
    settings: {
      currency: '₺',
      theme: 'dark',
      transferFee: 15.00,
      selectedMonth: getCurrentMonthString()
    }
  };
}

interface StoreContextValue {
  data: AppData;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isBalanceHidden: boolean;
  toggleBalanceVisibility: () => void;
  
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, updated: Partial<Transaction>) => boolean;
  deleteTransaction: (id: string) => void;

  // Categories
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updated: Partial<Category>) => boolean;
  deleteCategory: (id: string) => void;
  getCategory: (id: string) => Category;

  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => SavingsGoal;
  updateSavingsGoal: (id: string, updated: Partial<SavingsGoal>) => boolean;
  deleteSavingsGoal: (id: string) => void;
  depositToSavingsGoal: (id: string, amount: number) => boolean;

  // Distributed Savings
  getDistributedSavings: (monthKey: string) => number;
  addDistributedSavings: (monthKey: string, amount: number) => void;
  resetDistributedSavings: (monthKey: string) => void;

  // Settings
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  toggleTheme: () => void;

  // Import / Export
  exportJSON: () => void;
  exportCSV: () => void;
  importJSON: (jsonString: string) => { success: boolean; message?: string };
  resetData: () => void;
  loadDemoData: () => void;

  // Formatting
  formatMoney: (amount: number) => string;

  // Toast
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadInitialData);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem(HIDE_BALANCE_KEY) === 'true';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // LocalStorage sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage kaydetme hatası:', e);
    }
  }, [data]);

  // Theme sync
  useEffect(() => {
    const theme = data.settings.theme;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // URL parameters handler on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ActiveTab;
    if (tab && ['dashboard', 'transactions', 'savings', 'categories', 'analytics', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const showToast = (text: string, type: ToastType = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem(HIDE_BALANCE_KEY, String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setData((prev) => {
      const newTheme = prev.settings.theme === 'dark' ? 'light' : 'dark';
      return {
        ...prev,
        settings: {
          ...prev.settings,
          theme: newTheme,
        },
      };
    });
  };

  const formatMoney = (amount: number) => {
    const currency = data.settings.currency || '₺';
    const val = Number(amount) || 0;
    return `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  // --- Transactions ---
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: tx.type,
      amount: Number(tx.amount) || 0,
      categoryId: tx.categoryId,
      date: tx.date || new Date().toISOString().split('T')[0],
      note: (tx.note || '').trim(),
      paymentMethod: tx.paymentMethod || 'card',
      hasTransferFee: Boolean(tx.hasTransferFee),
      transferFeeAmount: Number(tx.transferFeeAmount) || 0,
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    return newTx;
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    let found = false;
    setData((prev) => {
      const nextTxs = prev.transactions.map((t) => {
        if (t.id === id) {
          found = true;
          return {
            ...t,
            ...updated,
            amount: updated.amount !== undefined ? Number(updated.amount) || 0 : t.amount,
            hasTransferFee: updated.hasTransferFee !== undefined ? Boolean(updated.hasTransferFee) : t.hasTransferFee,
            transferFeeAmount: updated.transferFeeAmount !== undefined ? Number(updated.transferFeeAmount) || 0 : t.transferFeeAmount,
          };
        }
        return t;
      });
      return { ...prev, transactions: nextTxs };
    });
    return found;
  };

  const deleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  // --- Categories ---
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCat: Category = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: category.name.trim(),
      type: category.type,
      color: category.color || '#6366f1',
      icon: category.icon || 'tag',
      monthlyBudget: category.monthlyBudget ? Number(category.monthlyBudget) : null,
    };

    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));

    return newCat;
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    let found = false;
    setData((prev) => {
      const nextCats = prev.categories.map((c) => {
        if (c.id === id) {
          found = true;
          return {
            ...c,
            ...updated,
            monthlyBudget: updated.monthlyBudget !== undefined && updated.monthlyBudget !== null
              ? (Number(updated.monthlyBudget) || null)
              : c.monthlyBudget,
          };
        }
        return c;
      });
      return { ...prev, categories: nextCats };
    });
    return found;
  };

  const deleteCategory = (id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  const getCategory = (id: string): Category => {
    const found = data.categories.find((c) => c.id === id);
    if (found) return found;
    return {
      id: 'unknown',
      name: 'Diğer',
      type: 'expense',
      color: '#94a3b8',
      icon: 'more-horizontal',
      monthlyBudget: null,
    };
  };

  // --- Savings Goals ---
  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      id: 'goal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: goal.name.trim(),
      targetAmount: Number(goal.targetAmount) || 0,
      currentAmount: Number(goal.currentAmount) || 0,
      targetDate: goal.targetDate || '',
      sharePercent: Number(goal.sharePercent) || 0,
      color: goal.color || '#10b981',
      icon: goal.icon || 'piggy-bank',
    };

    setData((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));

    return newGoal;
  };

  const updateSavingsGoal = (id: string, updated: Partial<SavingsGoal>) => {
    let found = false;
    setData((prev) => {
      const nextGoals = prev.savingsGoals.map((g) => {
        if (g.id === id) {
          found = true;
          return {
            ...g,
            ...updated,
            targetAmount: updated.targetAmount !== undefined ? Number(updated.targetAmount) || 0 : g.targetAmount,
            currentAmount: updated.currentAmount !== undefined ? Number(updated.currentAmount) || 0 : g.currentAmount,
            sharePercent: updated.sharePercent !== undefined ? Number(updated.sharePercent) || 0 : g.sharePercent,
          };
        }
        return g;
      });
      return { ...prev, savingsGoals: nextGoals };
    });
    return found;
  };

  const deleteSavingsGoal = (id: string) => {
    setData((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));
  };

  const depositToSavingsGoal = (id: string, amount: number) => {
    let found = false;
    setData((prev) => {
      const nextGoals = prev.savingsGoals.map((g) => {
        if (g.id === id) {
          found = true;
          return {
            ...g,
            currentAmount: Math.max(0, (g.currentAmount || 0) + (Number(amount) || 0)),
          };
        }
        return g;
      });
      return { ...prev, savingsGoals: nextGoals };
    });
    return found;
  };

  // --- Distributed Savings ---
  const getDistributedSavings = (monthKey: string): number => {
    if (!data.distributedSavings) return 0;
    return Number(data.distributedSavings[monthKey]) || 0;
  };

  const addDistributedSavings = (monthKey: string, amount: number) => {
    setData((prev) => {
      const curr = Number(prev.distributedSavings?.[monthKey]) || 0;
      return {
        ...prev,
        distributedSavings: {
          ...(prev.distributedSavings || {}),
          [monthKey]: Math.max(0, curr + (Number(amount) || 0)),
        },
      };
    });
  };

  const resetDistributedSavings = (monthKey: string) => {
    setData((prev) => {
      const nextDist = { ...(prev.distributedSavings || {}) };
      delete nextDist[monthKey];
      return {
        ...prev,
        distributedSavings: nextDist,
      };
    });
  };

  // --- Settings ---
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  // --- Export / Import ---
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    const date = new Date().toISOString().split('T')[0];
    dlAnchorElem.setAttribute('download', `butcem-yedek-${date}.json`);
    dlAnchorElem.click();
  };

  const exportCSV = () => {
    const headers = ['Tarih', 'Tip', 'Kategori', 'Tutar', 'Para Birimi', 'Ödeme Yöntemi', 'Açıklama'];
    const rows = data.transactions.map((t) => {
      const cat = getCategory(t.categoryId);
      const typeStr = t.type === 'income' ? 'Gelir' : 'Gider';
      const cleanNote = `"${(t.note || '').replace(/"/g, '""')}"`;
      return [
        t.date,
        typeStr,
        `"${cat.name}"`,
        t.amount.toFixed(2),
        data.settings.currency,
        t.paymentMethod === 'cash' ? 'Nakit' : 'Kart',
        cleanNote,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `butcem-islemler-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const importJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.transactions) && Array.isArray(parsed.categories)) {
        setData({
          transactions: parsed.transactions,
          categories: parsed.categories,
          savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
          distributedSavings: parsed.distributedSavings || {},
          settings: {
            currency: '₺',
            theme: 'dark',
            transferFee: 15.00,
            selectedMonth: getCurrentMonthString(),
            ...(parsed.settings || {}),
          },
        });
        return { success: true };
      } else {
        return { success: false, message: 'Geçersiz dosya formatı.' };
      }
    } catch (e: any) {
      return { success: false, message: 'JSON okuma hatası: ' + e.message };
    }
  };

  const resetData = () => {
    setData({
      transactions: [],
      categories: [...DEFAULT_CATEGORIES],
      savingsGoals: [],
      distributedSavings: {},
      settings: {
        currency: '₺',
        theme: 'dark',
        transferFee: 15.00,
        selectedMonth: getCurrentMonthString(),
      },
    });
  };

  const loadDemoData = () => {
    setData({
      transactions: generateDemoTransactions(),
      categories: [...DEFAULT_CATEGORIES],
      savingsGoals: [...DEFAULT_SAVINGS_GOALS],
      distributedSavings: {},
      settings: {
        currency: '₺',
        theme: 'dark',
        transferFee: 15.00,
        selectedMonth: getCurrentMonthString(),
      },
    });
  };

  const contextValue = useMemo<StoreContextValue>(() => ({
    data,
    activeTab,
    setActiveTab,
    isBalanceHidden,
    toggleBalanceVisibility,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToSavingsGoal,
    getDistributedSavings,
    addDistributedSavings,
    resetDistributedSavings,
    setSetting,
    toggleTheme,
    exportJSON,
    exportCSV,
    importJSON,
    resetData,
    loadDemoData,
    formatMoney,
    toasts,
    showToast,
    removeToast,
  }), [data, activeTab, isBalanceHidden, toasts]);

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
};
