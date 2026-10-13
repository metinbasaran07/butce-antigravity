import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CategoryDistributionChart } from '../CategoryDistributionChart';
import { CategoryIcon } from '../CategoryIcon';
import { Eye, EyeOff, Plus, Minus, Sparkles, Zap } from 'lucide-react';
import { TransactionType } from '../../types';

interface Props {
  onOpenTransactionModal: (editId?: string | null, forcedType?: TransactionType) => void;
  onOpenDistributeModal: () => void;
  onOpenCategoryModal: () => void;
  onQuickPreset: (type: TransactionType, catId: string, note: string, amount: number) => void;
}

export const DashboardTab: React.FC<Props> = ({
  onOpenTransactionModal,
  onOpenDistributeModal,
  onOpenCategoryModal,
  onQuickPreset,
}) => {
  const {
    data,
    activeTab,
    setActiveTab,
    isBalanceHidden,
    toggleBalanceVisibility,
    getCategory,
    getDistributedSavings,
    formatMoney,
  } = useStore();

  const selectedMonth = data.settings.selectedMonth;
  const currentMonthKey =
    selectedMonth === 'all'
      ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      : selectedMonth;

  // Filter transactions by selected month for the dashboard
  const periodTxs = data.transactions.filter((t) => {
    if (selectedMonth && selectedMonth !== 'all') {
      return t.date && t.date.startsWith(selectedMonth);
    }
    return true;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  periodTxs.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;
  const distributed = getDistributedSavings(currentMonthKey);
  const remainingSavings = Math.max(0, netBalance - distributed);

  // Categories budget calculations
  const expenseCategories = data.categories.filter((c) => c.type === 'expense');
  const catSpentMap: Record<string, number> = {};
  periodTxs.forEach((t) => {
    if (t.type === 'expense') {
      catSpentMap[t.categoryId] = (catSpentMap[t.categoryId] || 0) + t.amount;
    }
  });

  const budgetedCats = expenseCategories.filter(
    (c) => (c.monthlyBudget && c.monthlyBudget > 0) || (catSpentMap[c.id] && catSpentMap[c.id] > 0)
  );

  const recentTransactions = periodTxs.slice(0, 5);

  return (
    <section className="space-y-6 animate-fade-in">
      {/* Ana Bakiye ve Özet Kartı */}
      <div className="card-clean rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
          <span className="uppercase tracking-wider">Net Bakiye</span>
        </div>

        <div className="my-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${isBalanceHidden ? 'tracking-widest' : ''}`}>
              {isBalanceHidden ? '•••••••• ₺' : formatMoney(netBalance)}
            </div>
            <button
              onClick={toggleBalanceVisibility}
              title={isBalanceHidden ? 'Bakiyeyi Göster' : 'Bakiyeyi Gizle'}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
            >
              {isBalanceHidden ? (
                <EyeOff className="w-4 h-4 text-indigo-500" />
              ) : (
                <Eye className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Hızlı Gelir / Gider Ekle Butonları */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTransactionModal(null, 'income')}
              title="Gelir Ekle"
              className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition active:scale-95 shadow-xs"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              onClick={() => onOpenTransactionModal(null, 'expense')}
              title="Gider Ekle"
              className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition active:scale-95 shadow-xs"
            >
              <Minus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 3 Sütunlu Metrik Alanı */}
        <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-3 gap-1.5 sm:gap-3">
          {/* Toplam Gelir */}
          <div className="p-2 sm:p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                Toplam Gelir
              </span>
            </div>
            <div className={`text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums truncate ${isBalanceHidden ? 'tracking-widest' : ''}`}>
              {isBalanceHidden ? '•••••••• ₺' : formatMoney(totalIncome)}
            </div>
          </div>

          {/* Toplam Gider */}
          <div className="p-2 sm:p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                Toplam Gider
              </span>
            </div>
            <div className={`text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums truncate ${isBalanceHidden ? 'tracking-widest' : ''}`}>
              {isBalanceHidden ? '•••••••• ₺' : formatMoney(totalExpense)}
            </div>
          </div>

          {/* Aylık Tasarruf */}
          <div className="p-2 sm:p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    Tasarruf
                  </span>
                </div>
                {!isBalanceHidden && (
                  <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-medium truncate">
                    {netBalance >= 0 ? `(%${Math.max(0, savingsRate).toFixed(0)})` : '(Açık)'}
                  </span>
                )}
              </div>
              <div
                className={`text-xs sm:text-sm tabular-nums truncate ${
                  isBalanceHidden
                    ? 'font-extrabold text-indigo-600 dark:text-indigo-400 tracking-widest'
                    : netBalance >= 0
                    ? 'font-extrabold text-indigo-600 dark:text-indigo-400'
                    : 'font-bold text-rose-600 dark:text-rose-400'
                }`}
              >
                {isBalanceHidden
                  ? '•••••••• ₺'
                  : netBalance >= 0
                  ? formatMoney(netBalance)
                  : `-${formatMoney(Math.abs(netBalance))}`}
              </div>

              {!isBalanceHidden && (
                <div className="text-[9px] sm:text-[10px] truncate mt-0.5">
                  {remainingSavings > 0 ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ● {formatMoney(remainingSavings)} boşta
                    </span>
                  ) : distributed > 0 ? (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      ✓ Tümü dağıtıldı
                    </span>
                  ) : (
                    <span className="font-medium text-zinc-400">0,00 ₺ boşta</span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onOpenDistributeModal}
              title="Tasarrufu Hedeflere Dağıt"
              className="w-full mt-2 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{remainingSavings <= 0 && distributed > 0 ? 'İncele' : 'Dağıt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hızlı Kestirmeler (1-Dokunuşla Harcama Şablonları) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mt-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
          <Zap className="w-3 h-3 text-indigo-500" /> Hızlı:
        </span>
        <button
          type="button"
          onClick={() => onQuickPreset('expense', 'cat-yemek', 'Kahve', 120)}
          className="shrink-0 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-zinc-200/50 dark:border-zinc-800"
        >
          <span>☕</span> <span>Kahve</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset('expense', 'cat-market', 'Market', 250)}
          className="shrink-0 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-zinc-200/50 dark:border-zinc-800"
        >
          <span>🛒</span> <span>Market</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset('expense', 'cat-yemek', 'Yemek', 300)}
          className="shrink-0 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-zinc-200/50 dark:border-zinc-800"
        >
          <span>🍽️</span> <span>Yemek</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset('expense', 'cat-ulasim', 'Ulaşım', 150)}
          className="shrink-0 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-zinc-200/50 dark:border-zinc-800"
        >
          <span>🚌</span> <span>Ulaşım</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset('expense', 'cat-fatura', 'Fatura', 500)}
          className="shrink-0 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-zinc-200/50 dark:border-zinc-800"
        >
          <span>💡</span> <span>Fatura</span>
        </button>
      </div>

      {/* Harcama Dağılımı & Bütçe Limitleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Harcama Dağılımı */}
        <div className="card-clean rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Gider Dağılımı</h3>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Detay →
            </button>
          </div>
          <CategoryDistributionChart transactions={periodTxs} />
        </div>

        {/* Kategoriler */}
        <div className="card-clean rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Kategoriler</h3>
              <button
                onClick={() => setActiveTab('categories')}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Tümü →
              </button>
            </div>

            {budgetedCats.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-xs">
                Kayıtlı harcama kategorisi yok.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {budgetedCats.slice(0, 8).map((cat) => {
                  const spent = catSpentMap[cat.id] || 0;
                  const budget = cat.monthlyBudget || 0;
                  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                  const isOver = budget > 0 && spent > budget;

                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate text-[11px]">
                            {cat.name}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-semibold tabular-nums shrink-0 ${
                            isOver ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {formatMoney(spent)}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: isOver ? '#f43f5e' : cat.color,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Dönem içi harcama takibi</span>
            <button
              onClick={onOpenCategoryModal}
              className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline"
            >
              + Yeni
            </button>
          </div>
        </div>
      </div>

      {/* Son İşlemler */}
      <div className="card-clean rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Son İşlemler</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Tümü →
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
            <p className="text-xs">Bu dönem henüz kayıtlı işlem yok.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {recentTransactions.map((t) => {
              const cat = getCategory(t.categoryId);
              const isIncome = t.type === 'income';
              const sign = isIncome ? '+' : '-';
              const amountColor = isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-900 dark:text-zinc-100';

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 px-1 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon || 'tag'} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {t.note || (t.paymentMethod === 'cash' ? 'Nakit' : 'Kart')}
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-semibold ${amountColor} tabular-nums shrink-0`}>
                    {sign}
                    {formatMoney(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
