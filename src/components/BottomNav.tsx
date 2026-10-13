import React from 'react';
import { useStore } from '../context/StoreContext';
import { LayoutGrid, List, PiggyBank, Sliders, Plus } from 'lucide-react';

interface Props {
  onOpenNewTransaction: () => void;
}

export const BottomNav: React.FC<Props> = ({ onOpenNewTransaction }) => {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bottom-bar-glass z-40 px-3 flex items-center justify-around bottom-nav-safe select-none">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation ${
          activeTab === 'dashboard'
            ? 'text-zinc-900 dark:text-white font-semibold'
            : 'text-zinc-400 dark:text-zinc-500'
        }`}
      >
        <LayoutGrid className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Özet</span>
      </button>

      <button
        onClick={() => setActiveTab('transactions')}
        className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation ${
          activeTab === 'transactions'
            ? 'text-zinc-900 dark:text-white font-semibold'
            : 'text-zinc-400 dark:text-zinc-500'
        }`}
      >
        <List className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">İşlemler</span>
      </button>

      <button
        onClick={onOpenNewTransaction}
        aria-label="Yeni İşlem Ekle"
        className="-mt-3.5 w-11 h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-lg transition active:scale-95 touch-manipulation shrink-0 border-2 border-white dark:border-zinc-900"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      <button
        onClick={() => setActiveTab('savings')}
        className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation ${
          activeTab === 'savings'
            ? 'text-zinc-900 dark:text-white font-semibold'
            : 'text-zinc-400 dark:text-zinc-500'
        }`}
      >
        <PiggyBank className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Birikim</span>
      </button>

      <button
        onClick={() => setActiveTab('settings')}
        className={`mobile-nav-btn flex flex-col items-center justify-center gap-0.5 transition active:scale-95 touch-manipulation ${
          activeTab === 'settings'
            ? 'text-zinc-900 dark:text-white font-semibold'
            : 'text-zinc-400 dark:text-zinc-500'
        }`}
      >
        <Sliders className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Ayarlar</span>
      </button>
    </nav>
  );
};
