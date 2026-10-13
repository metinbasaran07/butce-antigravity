import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

interface Props {
  onInstall: () => void;
}

export const PwaBanner: React.FC<Props> = ({ onInstall }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      // Check if dismissed previously in this session
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setVisible(true);
      }
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-xs font-medium flex items-center justify-between sticky top-0 z-50 animate-fade-in border-b border-zinc-800">
      <div className="flex items-center gap-2">
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate sm:overflow-visible">Bütçem'i ana ekranınıza ekleyip bağımsız uygulama olarak kullanabilirsiniz.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onInstall}
          className="px-2.5 py-1 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white rounded-md font-semibold text-[11px] shadow-sm hover:opacity-90 transition active:scale-95"
        >
          Yükle
        </button>
        <button
          onClick={handleDismiss}
          className="opacity-70 hover:opacity-100 p-0.5"
          title="Kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
