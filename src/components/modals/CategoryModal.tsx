import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { TransactionType } from '../../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editCategoryId: string | null;
}

export const CategoryModal: React.FC<Props> = ({ isOpen, onClose, editCategoryId }) => {
  const { data, addCategory, updateCategory, showToast } = useStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('tag');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editCategoryId) {
        const cat = data.categories.find((c) => c.id === editCategoryId);
        if (cat) {
          setType(cat.type);
          setName(cat.name);
          setColor(cat.color || '#6366f1');
          setIcon(cat.icon || 'tag');
          setMonthlyBudget(cat.monthlyBudget ? String(cat.monthlyBudget) : '');
          return;
        }
      }
      // Reset for new
      setType('expense');
      setName('');
      setColor('#6366f1');
      setIcon('tag');
      setMonthlyBudget('');
    }
  }, [isOpen, editCategoryId, data.categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Lütfen bir kategori adı girin', 'warning');
      return;
    }

    const budgetNum = monthlyBudget ? parseFloat(monthlyBudget) : null;

    if (editCategoryId) {
      updateCategory(editCategoryId, {
        name: trimmed,
        type,
        color,
        icon,
        monthlyBudget: budgetNum,
      });
      showToast('Kategori güncellendi', 'success');
    } else {
      addCategory({
        name: trimmed,
        type,
        color,
        icon,
        monthlyBudget: budgetNum,
      });
      showToast('Kategori kaydedildi', 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-xs rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {editCategoryId ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
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
            <label className="block text-[11px] text-zinc-400 mb-1">Tür</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="expense" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                Gider (-)
              </option>
              <option value="income" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                Gelir (+)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Kategori Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: Market & Gıda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Renk</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">İkon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="tag" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Etiket</option>
                <option value="shopping-cart" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Market & Alışveriş</option>
                <option value="utensils" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Yemek & Kafe</option>
                <option value="coffee" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Kahve & İçecek</option>
                <option value="home" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Kira & Ev</option>
                <option value="zap" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Faturalar</option>
                <option value="car" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Ulaşım & Yakıt</option>
                <option value="film" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Sinema & Eğlence</option>
                <option value="heart-pulse" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Sağlık & Bakım</option>
                <option value="book-open" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Eğitim & Kitap</option>
                <option value="shopping-bag" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Giyim & Çanta</option>
                <option value="briefcase" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Maaş & İş</option>
                <option value="laptop" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Teknoloji & Freelance</option>
                <option value="trending-up" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Yatırım & Borsa</option>
                <option value="key" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Kira Geliri</option>
                <option value="shield-check" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Güvence & Sigorta</option>
                <option value="dumbbell" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Spor & Fitness</option>
                <option value="plane" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Seyahat & Tatil</option>
                <option value="gift" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Hediye</option>
                <option value="wallet" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Cüzdan</option>
                <option value="more-horizontal" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Aylık Limit</label>
            <input
              type="number"
              placeholder="0"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
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
