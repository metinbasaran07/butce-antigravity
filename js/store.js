/**
 * Bütçem - State & LocalStorage Store
 */

const STORAGE_KEY = 'butcem_app_data_v1';

const DEFAULT_CATEGORIES = [
  // Gider Kategorileri
  { id: 'cat-market', name: 'Market & Gıda', type: 'expense', color: '#10b981', icon: 'shopping-cart', monthlyBudget: 8000 },
  { id: 'cat-kira', name: 'Kira & Konut', type: 'expense', color: '#6366f1', icon: 'home', monthlyBudget: 15000 },
  { id: 'cat-fatura', name: 'Faturalar & Aidat', type: 'expense', color: '#f59e0b', icon: 'zap', monthlyBudget: 3500 },
  { id: 'cat-ulasim', name: 'Ulaşım & Akaryakıt', type: 'expense', color: '#06b6d4', icon: 'car', monthlyBudget: 4000 },
  { id: 'cat-yemek', name: 'Restoran & Kafe', type: 'expense', color: '#f97316', icon: 'utensils', monthlyBudget: 4500 },
  { id: 'cat-eglence', name: 'Eğlence & Hobi', type: 'expense', color: '#ec4899', icon: 'film', monthlyBudget: 2500 },
  { id: 'cat-saglik', name: 'Sağlık & Bakım', type: 'expense', color: '#ef4444', icon: 'heart-pulse', monthlyBudget: 2000 },
  { id: 'cat-egitim', name: 'Eğitim & Kitap', type: 'expense', color: '#8b5cf6', icon: 'book-open', monthlyBudget: 1500 },
  { id: 'cat-alisveris', name: 'Giyim & Alışveriş', type: 'expense', color: '#14b8a6', icon: 'shopping-bag', monthlyBudget: 3000 },
  { id: 'cat-diger-gider', name: 'Diğer Harcamalar', type: 'expense', color: '#64748b', icon: 'more-horizontal', monthlyBudget: 2000 },

  // Gelir Kategorileri
  { id: 'cat-maas', name: 'Maaş', type: 'income', color: '#10b981', icon: 'briefcase', monthlyBudget: null },
  { id: 'cat-ek-gelir', name: 'Ek Gelir & Freelance', type: 'income', color: '#06b6d4', icon: 'laptop', monthlyBudget: null },
  { id: 'cat-yatirim', name: 'Yatırım Getirisi', type: 'income', color: '#8b5cf6', icon: 'trending-up', monthlyBudget: null },
  { id: 'cat-kira-gelir', name: 'Kira Geliri', type: 'income', color: '#f59e0b', icon: 'key', monthlyBudget: null },
  { id: 'cat-diger-gelir', name: 'Diğer Gelirler', type: 'income', color: '#64748b', icon: 'plus-circle', monthlyBudget: null },
];

const DEFAULT_SAVINGS_GOALS = [
  { id: 'goal-1', name: 'Acil Durum Fonu', targetAmount: 50000, currentAmount: 22500, targetDate: '2026-12-31', color: '#10b981', icon: 'shield-check' },
  { id: 'goal-2', name: 'Yaz Tatili', targetAmount: 35000, currentAmount: 18000, targetDate: '2026-07-15', color: '#06b6d4', icon: 'palmtree' },
  { id: 'goal-3', name: 'Yeni Bilgisayar', targetAmount: 45000, currentAmount: 12000, targetDate: '2026-11-20', color: '#8b5cf6', icon: 'laptop' }
];

function generateDemoTransactions() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  
  return [
    { id: 'tx-1', type: 'income', amount: 48000, categoryId: 'cat-maas', date: `${y}-${m}-01`, note: 'Aylık Net Maaş', paymentMethod: 'transfer' },
    { id: 'tx-2', type: 'income', amount: 9500, categoryId: 'cat-ek-gelir', date: `${y}-${m}-05`, note: 'Freelance Web Tasarım Projesi', paymentMethod: 'transfer' },
    { id: 'tx-3', type: 'expense', amount: 15000, categoryId: 'cat-kira', date: `${y}-${m}-02`, note: 'Ev Kirası', paymentMethod: 'transfer' },
    { id: 'tx-4', type: 'expense', amount: 2450, categoryId: 'cat-market', date: `${y}-${m}-03`, note: 'Haftalık Süpermarket Alışverişi', paymentMethod: 'card' },
    { id: 'tx-5', type: 'expense', amount: 1120, categoryId: 'cat-fatura', date: `${y}-${m}-04`, note: 'Elektrik & Doğalgaz', paymentMethod: 'card' },
    { id: 'tx-6', type: 'expense', amount: 1400, categoryId: 'cat-ulasim', date: `${y}-${m}-06`, note: 'Akaryakıt Dolumu', paymentMethod: 'card' },
    { id: 'tx-7', type: 'expense', amount: 850, categoryId: 'cat-yemek', date: `${y}-${m}-07`, note: 'Arkadaşlarla Akşam Yemeği', paymentMethod: 'card' },
    { id: 'tx-8', type: 'expense', amount: 1950, categoryId: 'cat-market', date: `${y}-${m}-08`, note: 'Şarküteri ve Manav Alışverişi', paymentMethod: 'card' },
    { id: 'tx-9', type: 'expense', amount: 450, categoryId: 'cat-eglence', date: `${y}-${m}-08`, note: 'Sinema Bileti ve Atıştırmalık', paymentMethod: 'cash' },
  ];
}

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure backwards compatibility and default fields
        return {
          transactions: parsed.transactions || [],
          categories: parsed.categories && parsed.categories.length ? parsed.categories : [...DEFAULT_CATEGORIES],
          savingsGoals: parsed.savingsGoals || [...DEFAULT_SAVINGS_GOALS],
          settings: {
            currency: '₺',
            theme: 'dark',
            transferFee: 15.00,
            selectedMonth: this.getCurrentMonthString(),
            ...(parsed.settings || {})
          }
        };
      }
    } catch (e) {
      console.error('LocalStorage okuma hatası:', e);
    }

    // İlk kurulum / temiz başlangıç
    return {
      transactions: generateDemoTransactions(),
      categories: [...DEFAULT_CATEGORIES],
      savingsGoals: [...DEFAULT_SAVINGS_GOALS],
      settings: {
        currency: '₺',
        theme: 'dark',
        transferFee: 15.00,
        selectedMonth: this.getCurrentMonthString()
      }
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('LocalStorage kaydetme hatası:', e);
    }
  }

  getCurrentMonthString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // --- Transactions ---
  addTransaction(tx) {
    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: tx.type, // 'income' | 'expense'
      amount: parseFloat(tx.amount) || 0,
      categoryId: tx.categoryId,
      date: tx.date || new Date().toISOString().split('T')[0],
      note: (tx.note || '').trim(),
      paymentMethod: tx.paymentMethod || 'card',
      hasTransferFee: Boolean(tx.hasTransferFee),
      transferFeeAmount: parseFloat(tx.transferFeeAmount) || 0,
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  updateTransaction(id, updated) {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.transactions[index] = {
        ...this.data.transactions[index],
        ...updated,
        amount: parseFloat(updated.amount) || 0,
        hasTransferFee: Boolean(updated.hasTransferFee),
        transferFeeAmount: parseFloat(updated.transferFeeAmount) || 0
      };
      this.save();
      return true;
    }
    return false;
  }

  deleteTransaction(id) {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.save();
  }

  // --- Categories ---
  addCategory(category) {
    const newCat = {
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: category.name.trim(),
      type: category.type, // 'income' | 'expense'
      color: category.color || '#6366f1',
      icon: category.icon || 'tag',
      monthlyBudget: category.monthlyBudget ? parseFloat(category.monthlyBudget) : null
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  updateCategory(id, updated) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.categories[index] = {
        ...this.data.categories[index],
        ...updated,
        monthlyBudget: updated.monthlyBudget ? parseFloat(updated.monthlyBudget) : null
      };
      this.save();
      return true;
    }
    return false;
  }

  deleteCategory(id) {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.save();
  }

  getCategory(id) {
    return this.data.categories.find(c => c.id === id) || {
      id: 'unknown',
      name: 'Diğer',
      color: '#94a3b8',
      icon: 'help-circle'
    };
  }

  // --- Savings Goals ---
  addSavingsGoal(goal) {
    const newGoal = {
      id: 'goal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: goal.name.trim(),
      targetAmount: parseFloat(goal.targetAmount) || 0,
      currentAmount: parseFloat(goal.currentAmount) || 0,
      targetDate: goal.targetDate || '',
      color: goal.color || '#10b981',
      icon: goal.icon || 'piggy-bank'
    };
    this.data.savingsGoals.push(newGoal);
    this.save();
    return newGoal;
  }

  updateSavingsGoal(id, updated) {
    const index = this.data.savingsGoals.findIndex(g => g.id === id);
    if (index !== -1) {
      this.data.savingsGoals[index] = {
        ...this.data.savingsGoals[index],
        ...updated,
        targetAmount: parseFloat(updated.targetAmount) || 0,
        currentAmount: parseFloat(updated.currentAmount) || 0
      };
      this.save();
      return true;
    }
    return false;
  }

  deleteSavingsGoal(id) {
    this.data.savingsGoals = this.data.savingsGoals.filter(g => g.id !== id);
    this.save();
  }

  depositToSavingsGoal(id, amount) {
    const goal = this.data.savingsGoals.find(g => g.id === id);
    if (goal) {
      goal.currentAmount = Math.max(0, (goal.currentAmount || 0) + (parseFloat(amount) || 0));
      this.save();
      return true;
    }
    return false;
  }

  // --- Settings ---
  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  }

  getSetting(key) {
    return this.data.settings[key];
  }

  // --- Import / Export ---
  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    const date = new Date().toISOString().split('T')[0];
    dlAnchorElem.setAttribute("download", `butcem-yedek-${date}.json`);
    dlAnchorElem.click();
  }

  exportCSV() {
    const headers = ['Tarih', 'Tip', 'Kategori', 'Tutar', 'Para Birimi', 'Ödeme Yöntemi', 'Açıklama'];
    const rows = this.data.transactions.map(t => {
      const cat = this.getCategory(t.categoryId);
      const typeStr = t.type === 'income' ? 'Gelir' : 'Gider';
      const cleanNote = `"${(t.note || '').replace(/"/g, '""')}"`;
      return [
        t.date,
        typeStr,
        `"${cat.name}"`,
        t.amount.toFixed(2),
        this.data.settings.currency,
        t.paymentMethod || 'Kart',
        cleanNote
      ].join(',');
    });

    // UTF-8 BOM so Excel opens Turkish characters correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `butcem-islemler-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.transactions) && Array.isArray(parsed.categories)) {
        this.data = {
          transactions: parsed.transactions,
          categories: parsed.categories,
          savingsGoals: parsed.savingsGoals || [],
          settings: {
            ...this.data.settings,
            ...(parsed.settings || {})
          }
        };
        this.save();
        return { success: true };
      } else {
        return { success: false, message: 'Geçersiz dosya formatı.' };
      }
    } catch (e) {
      return { success: false, message: 'JSON okuma hatası: ' + e.message };
    }
  }

  resetData() {
    this.data = {
      transactions: [],
      categories: [...DEFAULT_CATEGORIES],
      savingsGoals: [],
      settings: {
        currency: '₺',
        theme: 'dark',
        selectedMonth: this.getCurrentMonthString()
      }
    };
    this.save();
  }

  loadDemoData() {
    this.data = {
      transactions: generateDemoTransactions(),
      categories: [...DEFAULT_CATEGORIES],
      savingsGoals: [...DEFAULT_SAVINGS_GOALS],
      settings: {
        currency: '₺',
        theme: 'dark',
        selectedMonth: this.getCurrentMonthString()
      }
    };
    this.save();
  }
}

window.store = new Store();
