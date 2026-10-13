import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CategoryIcon } from '../CategoryIcon';
import { Sparkles, PieChart, Edit2, Trash2 } from 'lucide-react';

interface Props {
  onOpenDistributeModal: () => void;
  onOpenNewGoalModal: () => void;
  onEditGoal: (id: string) => void;
  onOpenDepositModal: (id: string) => void;
}

export const SavingsTab: React.FC<Props> = ({
  onOpenDistributeModal,
  onOpenNewGoalModal,
  onEditGoal,
  onOpenDepositModal,
}) => {
  const { data, deleteSavingsGoal, formatMoney, showToast } = useStore();

  const goals = data.savingsGoals;
  const totalAssignedShare = goals.reduce((s, g) => s + (Number(g.sharePercent) || 0), 0);
  const remainingShare = Math.max(0, 100 - totalAssignedShare);

  const handleDelete = (id: string) => {
    if (confirm('Hedefi silmek istediğinize emin misiniz?')) {
      deleteSavingsGoal(id);
      showToast('Hedef silindi', 'info');
    }
  };

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Birikim Hedefleri</h2>
          <p className="text-xs text-zinc-400">Planladığınız hedefleri takip edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDistributeModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tasarrufu Dağıt</span>
          </button>
          <button
            onClick={onOpenNewGoalModal}
            className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:opacity-90 transition active:scale-95"
          >
            + Yeni Hedef
          </button>
        </div>
      </div>

      {/* Toplam Dağıtım Payı Özeti (Maksimum %100 Takibi) */}
      <div className="card-clean p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
              <span>Hedef Dağıtım Payı:</span>
              <span
                className={`font-bold tabular-nums ${
                  totalAssignedShare === 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : totalAssignedShare > 100
                    ? 'text-rose-600'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                %{totalAssignedShare} / %100
              </span>
            </div>
            <div
              className={`text-[10px] truncate ${
                totalAssignedShare === 100
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : totalAssignedShare > 100
                  ? 'text-rose-600 font-bold'
                  : 'text-zinc-400'
              }`}
            >
              {totalAssignedShare === 100
                ? 'Tüm paylar hedeflere paylaştırıldı (%100) ✓'
                : totalAssignedShare > 100
                ? `Toplam pay %100'ü aşıyor! (%${totalAssignedShare})`
                : `Kalan boş pay: %${remainingShare}`}
            </div>
          </div>
        </div>

        <div className="w-20 sm:w-28 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              totalAssignedShare === 100
                ? 'bg-emerald-500'
                : totalAssignedShare > 100
                ? 'bg-rose-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, totalAssignedShare)}%` }}
          />
        </div>
      </div>

      {/* Hedefler Listesi */}
      {goals.length === 0 ? (
        <div className="py-12 text-center text-zinc-400 card-clean rounded-2xl p-6">
          <p className="text-xs">Henüz bir birikim hedefi eklenmedi.</p>
          <button
            onClick={onOpenNewGoalModal}
            className="mt-2 text-xs font-semibold text-zinc-900 dark:text-white underline"
          >
            + Hedef Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {goals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;

            return (
              <div
                key={goal.id}
                className="card-clean rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
                    >
                      <CategoryIcon name={goal.icon || 'piggy-bank'} className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditGoal(goal.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {goal.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                      %{goal.sharePercent || 0} Dağıtım Payı
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 mt-1 flex justify-between">
                    <span>{formatMoney(goal.currentAmount)}</span>
                    <span>{formatMoney(goal.targetAmount)}</span>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full my-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">%{pct} tamamlandı</span>
                  <button
                    onClick={() => onOpenDepositModal(goal.id)}
                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                  >
                    + Para Ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
