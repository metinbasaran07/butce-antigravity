import React from 'react';
import { useStore } from '../context/StoreContext';
import { ActiveTab } from '../types';
import { Sun, Moon, Plus } from 'lucide-react';

interface Props {
  onOpenNewTransaction: () => void;
}

export const Header: React.FC<Props> = ({ onOpenNewTransaction }) => {
  const { data, activeTab, setActiveTab, setSetting, toggleTheme } = useStore();

  const currentTheme = data.settings.theme;
  const currentMonth = data.settings.selectedMonth || 'all';

  // Generate month options
  const monthOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: 'all', label: 'Tüm Dönemler' }];
    const now = new Date();
    for (let i = -11; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    const allOpt = options.shift()!;
    options.reverse();
    options.unshift(allOpt);
    return options;
  }, []);

  const navItems: { tab: ActiveTab; label: string }[] = [
    { tab: 'dashboard', label: 'Özet' },
    { tab: 'transactions', label: 'İşlemler' },
    { tab: 'savings', label: 'Birikim' },
    { tab: 'categories', label: 'Kategoriler' },
    { tab: 'analytics', label: 'Grafik' },
    { tab: 'settings', label: 'Ayarlar' },
  ];

  return (
    <header className="header-glass sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveTab('dashboard')}
        >
          <img src="/icons/logo.svg" alt="Bütçem Logo" className="w-7 h-7 rounded-lg shadow-sm" />
          <span className="text-sm font-bold tracking-tight">Bütçem</span>
        </div>

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`tab-btn px-3 py-1.5 text-xs rounded-lg transition-all ${
                  isActive
                    ? 'font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <select
            value={currentMonth}
            onChange={(e) => setSetting('selectedMonth', e.target.value)}
            className="bg-transparent border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={toggleTheme}
            title="Tema Değiştir"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-zinc-300" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ekle</span>
          </button>
        </div>
      </div>
    </header>
  );
};
