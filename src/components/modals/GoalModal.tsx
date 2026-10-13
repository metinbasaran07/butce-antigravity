import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editGoalId: string | null;
}

export const GoalModal: React.FC<Props> = ({ isOpen, onClose, editGoalId }) => {
  const { data, addSavingsGoal, updateSavingsGoal, showToast } = useStore();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [sharePercent, setSharePercent] = useState<number>(0);
  const [color, setColor] = useState('#10b981');

  const otherGoalsSum = data.savingsGoals
    .filter((g) => g.id !== editGoalId)
    .reduce((sum, g) => sum + (Number(g.sharePercent) || 0), 0);
  const maxAllowed = Math.max(0, 100 - otherGoalsSum);

  useEffect(() => {
    if (isOpen) {
      if (editGoalId) {
        const goal = data.savingsGoals.find((g) => g.id === editGoalId);
        if (goal) {
          setName(goal.name);
          setTargetAmount(String(goal.targetAmount));
          setCurrentAmount(String(goal.currentAmount ?? 0));
          setTargetDate(goal.targetDate || '');
          setSharePercent(goal.sharePercent || 0);
          setColor(goal.color || '#10b981');
          return;
        }
      }
      // New goal defaults
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setSharePercent(maxAllowed > 0 ? Math.min(25, maxAllowed) : 0);
      setColor('#10b981');
    }
  }, [isOpen, editGoalId, data.savingsGoals, maxAllowed]);

  if (!isOpen) return null;

  const handleShareChange = (valStr: string) => {
    let val = parseFloat(valStr);
    if (isNaN(val) || val < 0) val = 0;
    if (val > maxAllowed) {
      val = maxAllowed;
      showToast(`Toplam birikim payı %100'ü aşamaz. Bu hedefe en fazla %${maxAllowed} atayabilirsiniz.`, 'warning');
    }
    setSharePercent(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const targetNum = parseFloat(targetAmount);
    if (!trimmed || isNaN(targetNum) || targetNum <= 0) {
      showToast('Geçerli bir hedef adı ve tutar girin', 'warning');
      return;
    }

    const currentNum = parseFloat(currentAmount) || 0;
    let finalShare = sharePercent;
    if (finalShare > maxAllowed) {
      finalShare = maxAllowed;
    }

    if (editGoalId) {
      updateSavingsGoal(editGoalId, {
        name: trimmed,
        targetAmount: targetNum,
        currentAmount: currentNum,
        targetDate,
        sharePercent: finalShare,
        color,
        icon: 'piggy-bank',
      });
      showToast('Hedef güncellendi', 'success');
    } else {
      addSavingsGoal({
        name: trimmed,
        targetAmount: targetNum,
        currentAmount: currentNum,
        targetDate,
        sharePercent: finalShare,
        color,
        icon: 'piggy-bank',
      });
      showToast('Yeni hedef oluşturuldu', 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-xs rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {editGoalId ? 'Hedefi Düzenle' : 'Yeni Hedef'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Hedef Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: Tatil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Hedef Tutar</label>
              <input
                type="number"
                required
                placeholder="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Mevcut</label>
              <input
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Hedef Tarihi</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-zinc-400">Tasarruf Payı (%)</label>
                <span className="text-[10px] text-indigo-500 font-semibold">Max: %{maxAllowed}</span>
              </div>
              <input
                type="number"
                min={0}
                max={maxAllowed}
                placeholder="Örn: 40"
                value={sharePercent || ''}
                onChange={(e) => handleShareChange(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
              />
              <div className="text-[9px] text-zinc-400 mt-0.5">
                Kalan boş pay: %{Math.max(0, maxAllowed - sharePercent)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Renk</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl text-xs transition active:scale-95 shadow-sm"
          >
            Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};
