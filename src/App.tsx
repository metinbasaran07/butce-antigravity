import React, { useState, useEffect } from 'react';
import { useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PwaBanner } from './components/PwaBanner';
import { ToastContainer } from './components/ToastContainer';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { SavingsTab } from './components/tabs/SavingsTab';
import { CategoriesTab } from './components/tabs/CategoriesTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SettingsTab } from './components/tabs/SettingsTab';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { GoalModal } from './components/modals/GoalModal';
import { DepositModal } from './components/modals/DepositModal';
import { DistributeSavingsModal } from './components/modals/DistributeSavingsModal';
import { IosShortcutsGuideModal } from './components/modals/IosShortcutsGuideModal';
import { PwaInstallHelpModal } from './components/modals/PwaInstallHelpModal';
import { TransactionType } from './types';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, showToast } = useStore();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('expense');
  const [txInitialAmount, setTxInitialAmount] = useState('');
  const [txInitialNote, setTxInitialNote] = useState('');
  const [txInitialCatId, setTxInitialCatId] = useState('');

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);

  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [isShortcutsGuideOpen, setIsShortcutsGuideOpen] = useState(false);

  const [isPwaHelpOpen, setIsPwaHelpOpen] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Detect iOS and listen for beforeinstallprompt
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('ServiceWorker registered:', reg.scope))
        .catch((err) => console.warn('ServiceWorker registration error:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const type = params.get('type') as TransactionType | null;
    const amount = params.get('amount');
    const note = params.get('note');
    const category = params.get('category') || params.get('categoryId');

    if (action === 'income' || type === 'income') {
      setEditingTxId(null);
      setTxInitialType('income');
      setTxInitialAmount(amount || '');
      setTxInitialNote(note || '');
      setTxInitialCatId(category || '');
      setIsTxModalOpen(true);
    } else if (action === 'expense' || type === 'expense') {
      setEditingTxId(null);
      setTxInitialType('expense');
      setTxInitialAmount(amount || '');
      setTxInitialNote(note || '');
      setTxInitialCatId(category || '');
      setIsTxModalOpen(true);
    } else if (action === 'new-transaction' || action === 'add') {
      setEditingTxId(null);
      setTxInitialType('expense');
      setTxInitialAmount(amount || '');
      setTxInitialNote(note || '');
      setTxInitialCatId(category || '');
      setIsTxModalOpen(true);
    }

    if (action || type || amount || note || category) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // PWA install trigger
  const triggerPwaInstall = () => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      showToast('Uygulama zaten yüklü ve tam ekran modunda çalışıyor! 🎉', 'success');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('Bütçem ana ekranınıza eklendi! ✨', 'success');
        }
        setDeferredPrompt(null);
      });
    } else {
      setIsPwaHelpOpen(true);
    }
  };

  // Transaction modal triggers
  const handleOpenTransactionModal = (
    editId: string | null = null,
    forcedType: TransactionType = 'expense'
  ) => {
    setEditingTxId(editId);
    setTxInitialType(forcedType);
    setTxInitialAmount('');
    setTxInitialNote('');
    setTxInitialCatId('');
    setIsTxModalOpen(true);
  };

  const handleQuickPreset = (
    type: TransactionType,
    catId: string,
    note: string,
    amount: number
  ) => {
    setEditingTxId(null);
    setTxInitialType(type);
    setTxInitialAmount(String(amount));
    setTxInitialNote(note);
    setTxInitialCatId(catId);
    setIsTxModalOpen(true);
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen transition-colors duration-200 select-none pb-safe">
      <PwaBanner onInstall={triggerPwaInstall} />
      <Header onOpenNewTransaction={() => handleOpenTransactionModal(null, 'expense')} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            onOpenTransactionModal={handleOpenTransactionModal}
            onOpenDistributeModal={() => setIsDistributeModalOpen(true)}
            onOpenCategoryModal={() => {
              setEditingCatId(null);
              setIsCatModalOpen(true);
            }}
            onQuickPreset={handleQuickPreset}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            onOpenNewTransaction={() => handleOpenTransactionModal(null, 'expense')}
            onEditTransaction={(id) => handleOpenTransactionModal(id)}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsTab
            onOpenDistributeModal={() => setIsDistributeModalOpen(true)}
            onOpenNewGoalModal={() => {
              setEditingGoalId(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(id) => {
              setEditingGoalId(id);
              setIsGoalModalOpen(true);
            }}
            onOpenDepositModal={(id) => {
              setDepositGoalId(id);
              setIsDepositModalOpen(true);
            }}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            onOpenNewCategory={() => {
              setEditingCatId(null);
              setIsCatModalOpen(true);
            }}
            onEditCategory={(id) => {
              setEditingCatId(id);
              setIsCatModalOpen(true);
            }}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsTab />}

        {activeTab === 'settings' && (
          <SettingsTab
            onOpenShortcutsGuide={() => setIsShortcutsGuideOpen(true)}
            onOpenPwaInstall={triggerPwaInstall}
            onQuickAdd={(type) => handleOpenTransactionModal(null, type)}
          />
        )}
      </main>

      <BottomNav onOpenNewTransaction={() => handleOpenTransactionModal(null, 'expense')} />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        editTransactionId={editingTxId}
        initialType={txInitialType}
        initialAmount={txInitialAmount}
        initialNote={txInitialNote}
        initialCategoryId={txInitialCatId}
        onOpenNewCategory={() => {
          setEditingCatId(null);
          setIsCatModalOpen(true);
        }}
      />

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        editCategoryId={editingCatId}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editGoalId={editingGoalId}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setDepositGoalId(null);
        }}
        goalId={depositGoalId}
      />

      <DistributeSavingsModal
        isOpen={isDistributeModalOpen}
        onClose={() => setIsDistributeModalOpen(false)}
      />

      <IosShortcutsGuideModal
        isOpen={isShortcutsGuideOpen}
        onClose={() => setIsShortcutsGuideOpen(false)}
        onQuickAdd={(type) => handleOpenTransactionModal(null, type)}
      />

      <PwaInstallHelpModal
        isOpen={isPwaHelpOpen}
        onClose={() => setIsPwaHelpOpen(false)}
        isIos={isIosDevice}
      />

      <ToastContainer />
    </div>
  );
};
