import { Category, SavingsGoal, Transaction } from './types';

export const STORAGE_KEY = 'butcem_app_data_v1';
export const HIDE_BALANCE_KEY = 'butcem_hide_balance';

export const DEFAULT_CATEGORIES: Category[] = [
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

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  { id: 'goal-1', name: 'Acil Durum Fonu', targetAmount: 50000, currentAmount: 22500, targetDate: '2026-12-31', sharePercent: 50, color: '#10b981', icon: 'shield-check' },
  { id: 'goal-2', name: 'Yaz Tatili', targetAmount: 35000, currentAmount: 18000, targetDate: '2026-07-15', sharePercent: 30, color: '#06b6d4', icon: 'palmtree' },
  { id: 'goal-3', name: 'Yeni Bilgisayar', targetAmount: 45000, currentAmount: 12000, targetDate: '2026-11-20', sharePercent: 20, color: '#8b5cf6', icon: 'laptop' }
];

export function generateDemoTransactions(): Transaction[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');

  return [
    { id: 'tx-1', type: 'income', amount: 48000, categoryId: 'cat-maas', date: `${y}-${m}-01`, note: 'Aylık Net Maaş', paymentMethod: 'card' },
    { id: 'tx-2', type: 'income', amount: 9500, categoryId: 'cat-ek-gelir', date: `${y}-${m}-05`, note: 'Freelance Web Tasarım Projesi', paymentMethod: 'card' },
    { id: 'tx-3', type: 'expense', amount: 15000, categoryId: 'cat-kira', date: `${y}-${m}-02`, note: 'Ev Kirası', paymentMethod: 'card' },
    { id: 'tx-4', type: 'expense', amount: 2450, categoryId: 'cat-market', date: `${y}-${m}-03`, note: 'Haftalık Süpermarket Alışverişi', paymentMethod: 'card' },
    { id: 'tx-5', type: 'expense', amount: 1120, categoryId: 'cat-fatura', date: `${y}-${m}-04`, note: 'Elektrik & Doğalgaz', paymentMethod: 'card' },
    { id: 'tx-6', type: 'expense', amount: 1400, categoryId: 'cat-ulasim', date: `${y}-${m}-06`, note: 'Akaryakıt Dolumu', paymentMethod: 'card' },
    { id: 'tx-7', type: 'expense', amount: 850, categoryId: 'cat-yemek', date: `${y}-${m}-07`, note: 'Arkadaşlarla Akşam Yemeği', paymentMethod: 'card' },
    { id: 'tx-8', type: 'expense', amount: 1950, categoryId: 'cat-market', date: `${y}-${m}-08`, note: 'Şarküteri ve Manav Alışverişi', paymentMethod: 'card' },
    { id: 'tx-9', type: 'expense', amount: 450, categoryId: 'cat-eglence', date: `${y}-${m}-08`, note: 'Sinema Bileti ve Atıştırmalık', paymentMethod: 'cash' },
  ];
}
