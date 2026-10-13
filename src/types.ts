export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'card' | 'cash';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  monthlyBudget: number | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  paymentMethod: PaymentMethod;
  hasTransferFee?: boolean;
  transferFeeAmount?: number;
  createdAt?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  sharePercent: number;
  color: string;
  icon: string;
}

export interface Settings {
  currency: string;
  theme: 'dark' | 'light';
  transferFee: number;
  selectedMonth: string;
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  distributedSavings: Record<string, number>;
  settings: Settings;
}

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'savings' | 'categories' | 'analytics' | 'settings';
