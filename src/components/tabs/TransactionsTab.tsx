import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CategoryIcon } from '../CategoryIcon';
import { Search, Plus, Edit2, Trash2, Receipt } from 'lucide-react';
import { Transaction } from '../../types';

interface Props {
  onOpenNewTransaction: () => void;
  onEditTransaction: (id: string) => void;
}

export const TransactionsTab: React.FC<Props> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const { data, getCategory, deleteTransaction, formatMoney, showToast } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const selectedMonth = data.settings.selectedMonth;

  // Filter by selected period first
  const periodTxs = useMemo(() => {
    return data.transactions.filter((t) => {
      if (selectedMonth && selectedMonth !== 'all') {
        return t.date && t.date.startsWith(selectedMonth);
      }
      return true;
    });
  }, [data.transactions, selectedMonth]);

  // Apply filters and search
  const filteredTxs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return periodTxs.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;

      if (q) {
        const cat = getCategory(t.categoryId);
        const matchNote = (t.note || '').toLowerCase().includes(q);
        const matchCat = cat.name.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        if (!matchNote && !matchCat && !matchAmount) return false;
      }

      return true;
    });
  }, [periodTxs, filterType, filterCategory, searchTerm, getCategory]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filteredTxs.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({ date, items: map[date] }));
  }, [filteredTxs]);

  const formatDateTR = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const handleDelete = (id: string) => {
    if (confirm('İşlemi silmek istediğinize emin misiniz?')) {
      deleteTransaction(id);
      showToast('İşlem silindi', 'info');
    }
  };

  return (
    <section className="space-y-4 animate-fade-in">
      {/* Filtreler & Arama */}
      <div className="card-clean p-3 rounded-2xl flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="İşlem ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              Tümü
            </option>
            <option value="expense" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              Gider
            </option>
            <option value="income" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              Gelir
            </option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              Kategoriler
            </option>
            {data.categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              >
                {c.name} ({c.type === 'income' ? 'Gelir' : 'Gider'})
              </option>
            ))}
          </select>

          <button
            onClick={onOpenNewTransaction}
            className="px-2.5 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold hover:opacity-90 transition active:scale-95"
          >
            + Yeni
          </button>
        </div>
      </div>

      {/* Başlık ve Sayaç */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-zinc-400">Geçmiş</span>
        <span className="text-xs text-zinc-400">{filteredTxs.length} işlem</span>
      </div>

      {/* Liste */}
      <div className="card-clean p-4 rounded-2xl">
        {filteredTxs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">Kriterlere uygun işlem bulunamadı.</p>
          </div>
        ) : (
          groupedByDate.map(({ date, items }) => (
            <div key={date} className="mb-5 last:mb-0">
              <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-1 tracking-wide">
                {formatDateTR(date)}
              </div>
              <div className="space-y-1.5">
                {items.map((t) => {
                  const cat = getCategory(t.categoryId);
                  const isIncome = t.type === 'income';
                  const sign = isIncome ? '+' : '-';
                  const amountColor = isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-900 dark:text-zinc-100';

                  return (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between py-3 px-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
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

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-semibold ${amountColor} tabular-nums`}>
                          {sign}
                          {formatMoney(t.amount)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(t.id)}
                            title="Düzenle"
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            title="Sil"
                            className="p-1 rounded text-zinc-400 hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
