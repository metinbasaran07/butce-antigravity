import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DistributeSavingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    data,
    getDistributedSavings,
    addDistributedSavings,
    resetDistributedSavings,
    depositToSavingsGoal,
    formatMoney,
    showToast,
  } = useStore();

  const selectedMonth = data.settings.selectedMonth;
  const currentMonthKey =
    selectedMonth === 'all'
      ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      : selectedMonth;

  // Calculate net savings for this period
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

  const netSavings = totalIncome - totalExpense;
  const alreadyDistributed = getDistributedSavings(currentMonthKey);
  const distributableSavings = Math.max(0, netSavings - alreadyDistributed);

  // Sliders state: mapping goalId -> percent (0-100)
  const [goalPercentages, setGoalPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      if (distributableSavings <= 0) return;

      const goals = data.savingsGoals;
      const hasDefinedShares = goals.some((g) => (g.sharePercent || 0) > 0);

      if (hasDefinedShares) {
        const initial: Record<string, number> = {};
        goals.forEach((g) => {
          initial[g.id] = g.sharePercent || 0;
        });
        setGoalPercentages(initial);
      } else if (goals.length > 0) {
        // Equal distribution
        const count = goals.length;
        const base = Math.floor(100 / count);
        const remainder = 100 - base * count;
        const initial: Record<string, number> = {};
        goals.forEach((g, idx) => {
          initial[g.id] = idx < remainder ? base + 1 : base;
        });
        setGoalPercentages(initial);
      }
    }
  }, [isOpen, distributableSavings, data.savingsGoals]);

  if (!isOpen) return null;

  const totalPercent = Object.values(goalPercentages).reduce((acc, v) => acc + (v || 0), 0);
  const remainingPercent = Math.max(0, 100 - totalPercent);
  const totalAllocatedAmount = Math.min(
    distributableSavings,
    Math.round(distributableSavings * (totalPercent / 100) * 100) / 100
  );
  const remainingUndistributed = Math.max(0, distributableSavings - totalAllocatedAmount);

  const handleSliderChange = (goalId: string, val: number) => {
    let target = Math.max(0, Math.min(100, Math.round(val)));
    const otherSum = Object.entries(goalPercentages)
      .filter(([id]) => id !== goalId)
      .reduce((acc, [, v]) => acc + (v || 0), 0);
    const maxAllowed = Math.max(0, 100 - otherSum);
    if (target > maxAllowed) target = maxAllowed;

    setGoalPercentages((prev) => ({
      ...prev,
      [goalId]: target,
    }));
  };

  const handleAmountChange = (goalId: string, amtStr: string) => {
    if (distributableSavings <= 0) return;
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt < 0) {
      handleSliderChange(goalId, 0);
      return;
    }

    const otherSumPercent = Object.entries(goalPercentages)
      .filter(([id]) => id !== goalId)
      .reduce((acc, [, v]) => acc + (v || 0), 0);
    const maxAllowedPercent = Math.max(0, 100 - otherSumPercent);
    const maxAllowedAmount = Math.round(distributableSavings * (maxAllowedPercent / 100) * 100) / 100;

    const clampedAmount = Math.min(amt, maxAllowedAmount);
    let computedPercent = Math.round((clampedAmount / distributableSavings) * 100);
    if (computedPercent > maxAllowedPercent) computedPercent = maxAllowedPercent;

    handleSliderChange(goalId, computedPercent);
  };

  const distributeEqually = () => {
    const goals = data.savingsGoals;
    if (!goals.length || distributableSavings <= 0) return;
    const count = goals.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    const next: Record<string, number> = {};
    goals.forEach((g, idx) => {
      next[g.id] = idx < remainder ? base + 1 : base;
    });
    setGoalPercentages(next);
  };

  const distributeByConfiguredShares = () => {
    const goals = data.savingsGoals;
    if (!goals.length || distributableSavings <= 0) return;
    const next: Record<string, number> = {};
    goals.forEach((g) => {
      next[g.id] = Math.min(100, Math.max(0, Math.round(g.sharePercent || 0)));
    });
    setGoalPercentages(next);
    showToast('Tasarruf, hedeflerinizde ayarladığınız yüzdelere göre dağıtıldı 🎯', 'success');
  };

  const resetSliders = () => {
    const next: Record<string, number> = {};
    data.savingsGoals.forEach((g) => {
      next[g.id] = 0;
    });
    setGoalPercentages(next);
  };

  const handleConfirm = () => {
    if (distributableSavings <= 0) {
      showToast('Bu dönemde dağıtılacak serbest tasarruf kalmadı.', 'warning');
      return;
    }

    let allocatedTotal = 0;
    data.savingsGoals.forEach((g) => {
      const p = goalPercentages[g.id] || 0;
      if (p > 0) {
        const amount = Math.round(distributableSavings * (p / 100) * 100) / 100;
        if (amount > 0) {
          depositToSavingsGoal(g.id, amount);
          allocatedTotal += amount;
        }
      }
    });

    if (allocatedTotal > 0) {
      addDistributedSavings(currentMonthKey, allocatedTotal);
      showToast(`${formatMoney(allocatedTotal)} birikim hedeflerinize başarıyla aktarıldı! 🎯`, 'success');
      onClose();
    } else {
      showToast('Lütfen hedeflere pay veya tutar belirleyin.', 'warning');
    }
  };

  const handleResetPast = () => {
    if (
      confirm(
        'Bu döneme ait önceki birikim dağıtım kaydını sıfırlamak istiyor musunuz? (Hedeflerdeki mevcut bakiyeler korunur, tasarruf tekrar serbest kalır)'
      )
    ) {
      resetDistributedSavings(currentMonthKey);
      showToast('Önceki dağıtım sıfırlandı. Tasarruf tekrar serbest bırakıldı.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-md rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Tasarrufu Hedeflere Dağıt
            </h3>
            <p className="text-[11px] text-zinc-400">
              Sürgüleri kullanarak serbest tasarrufunuzu birikim kumbaralarınıza paylaştırın.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tasarruf Durum Özeti */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800/80 my-2">
          <div>
            <div className="text-[10px] text-zinc-400 font-medium truncate">Net Tasarruf</div>
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tabular-nums truncate">
              {formatMoney(netSavings)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium truncate">Önceki Dağıtılan</div>
            <div className="text-xs font-bold text-zinc-500 tabular-nums truncate">
              {formatMoney(alreadyDistributed)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-indigo-500 font-semibold truncate">Dağıtılabilir Havuz</div>
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {formatMoney(distributableSavings)}
            </div>
          </div>
        </div>

        {/* Toplam Dağıtım Oranı ve İlerleme Çubuğu */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 space-y-1.5 my-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-1">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <span>Dağıtım Oranı:</span>
              <span
                className={`font-bold tabular-nums ${
                  totalPercent === 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                %{totalPercent} / %100
              </span>
            </span>
            <span className="text-[11px] font-medium text-zinc-500">
              {remainingPercent === 0 ? 'Tamamı Dağıtıldı ✓' : `Kalan: %${remainingPercent}`}
            </span>
          </div>

          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-150 ${
                totalPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, totalPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Dağıtılacak:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatMoney(totalAllocatedAmount)}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Kalan:</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatMoney(remainingUndistributed)}
              </span>
            </div>
          </div>
        </div>

        {/* Hızlı Bölüşüm Butonları */}
        <div className="flex gap-2 my-2">
          <button
            type="button"
            onClick={distributeEqually}
            className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-semibold transition text-center active:scale-95"
          >
            ⚡ Eşit Böl (%100)
          </button>
          <button
            type="button"
            onClick={distributeByConfiguredShares}
            className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-semibold transition text-center active:scale-95 border border-indigo-200/50"
          >
            🎯 Hedefe Göre
          </button>
          <button
            type="button"
            onClick={resetSliders}
            className="py-1.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 rounded-xl text-[11px] font-medium transition text-center"
            title="Sıfırla"
          >
            Sıfırla
          </button>
        </div>

        {/* Hedefler Listesi */}
        <div className="space-y-2.5 my-3 max-h-64 overflow-y-auto pr-1">
          {data.savingsGoals.map((g) => {
            const p = goalPercentages[g.id] || 0;
            const allocatedAmt = Math.round(distributableSavings * (p / 100) * 100) / 100;
            const remainingToTarget = Math.max(0, g.targetAmount - g.currentAmount);

            return (
              <div
                key={g.id}
                className="p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: g.color || '#10b981' }}
                      />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {g.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Hedefe Kalan:{' '}
                      <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
                        {formatMoney(remainingToTarget)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Elle Tutar Girişi (₺) */}
                    <div className="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1 shadow-xs">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={allocatedAmt > 0 ? allocatedAmt : ''}
                        onChange={(e) => handleAmountChange(g.id, e.target.value)}
                        className="w-16 sm:w-20 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-transparent text-right focus:outline-none"
                      />
                      <span className="text-[10px] font-bold text-zinc-400 ml-1">₺</span>
                    </div>

                    {/* Elle Yüzde Girişi (%) */}
                    <div className="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1 shadow-xs">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={p || ''}
                        onChange={(e) => handleSliderChange(g.id, parseInt(e.target.value) || 0)}
                        className="w-9 sm:w-11 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-transparent text-right focus:outline-none"
                      />
                      <span className="text-[10px] font-bold text-zinc-400 ml-0.5">%</span>
                    </div>
                  </div>
                </div>

                {/* Sürgü ve - / + Butonları */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleSliderChange(g.id, p - 5)}
                    className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 transition select-none active:scale-95"
                  >
                    -
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={p}
                    onChange={(e) => handleSliderChange(g.id, parseInt(e.target.value) || 0)}
                    className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  <button
                    type="button"
                    onClick={() => handleSliderChange(g.id, p + 5)}
                    className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 transition select-none active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800">
          {alreadyDistributed > 0 && (
            <button
              type="button"
              onClick={handleResetPast}
              className="text-[11px] font-medium text-rose-500 hover:underline"
            >
              Önceki Dağıtımı Sıfırla
            </button>
          )}
          <div className="flex gap-2 ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-zinc-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={distributableSavings <= 0}
              onClick={handleConfirm}
              className={`flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition active:scale-95 ${
                distributableSavings <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Dağıtımı Tamamla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
