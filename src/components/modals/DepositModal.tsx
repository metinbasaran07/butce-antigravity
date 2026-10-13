import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goalId: string | null;
}

export const DepositModal: React.FC<Props> = ({ isOpen, onClose, goalId }) => {
  const { data, depositToSavingsGoal, formatMoney, showToast } = useStore();
  const [amount, setAmount] = useState('');

  const goal = goalId ? data.savingsGoals.find((g) => g.id === goalId) : null;
  const currency = data.settings.currency || '₺';

  useEffect(() => {
    if (isOpen) {
      setAmount('');
    }
  }, [isOpen]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      showToast('Lütfen geçerli bir tutar girin', 'warning');
      return;
    }

    depositToSavingsGoal(goal.id, parsed);
    showToast(`${formatMoney(parsed)} birikime eklendi`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-xs rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Birikime Ekle</h3>
            <p className="text-[11px] text-zinc-400 truncate">{goal.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Tutar ({currency})</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-base font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl text-xs transition active:scale-95 shadow-sm"
          >
            Aktar
          </button>
        </form>
      </div>
    </div>
  );
};
