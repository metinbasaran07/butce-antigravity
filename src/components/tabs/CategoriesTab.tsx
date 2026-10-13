import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CategoryIcon } from '../CategoryIcon';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';

interface Props {
  onOpenNewCategory: () => void;
  onEditCategory: (id: string) => void;
}

export const CategoriesTab: React.FC<Props> = ({ onOpenNewCategory, onEditCategory }) => {
  const { data, setActiveTab, deleteCategory, formatMoney, showToast } = useStore();

  const handleDelete = (id: string) => {
    if (confirm('Kategoriyi silmek istediğinize emin misiniz?')) {
      deleteCategory(id);
      showToast('Kategori silindi', 'info');
    }
  };

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Kategoriler & Limitler
            </h2>
            <p className="text-xs text-zinc-400">
              Harcama kategorilerinizi yapılandırın ve limit belirleyin.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNewCategory}
          className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 hover:opacity-90"
        >
          + Yeni Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {data.categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 card-clean"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
              >
                <CategoryIcon name={cat.icon || 'tag'} className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {cat.name}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {cat.type === 'expense' && cat.monthlyBudget
                    ? `Limit: ${formatMoney(cat.monthlyBudget)}`
                    : cat.type === 'income'
                    ? 'Gelir'
                    : 'Limitsiz'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEditCategory(cat.id)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                title="Düzenle"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1 text-zinc-400 hover:text-rose-500 transition"
                title="Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
