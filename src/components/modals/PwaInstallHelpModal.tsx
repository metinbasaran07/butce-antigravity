import React from 'react';
import { X, Smartphone } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isIos: boolean;
}

export const PwaInstallHelpModal: React.FC<Props> = ({ isOpen, onClose, isIos }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-xs rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {isIos ? 'Safari - Ana Ekrana Ekle' : 'Uygulama Olarak Yükleme'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIos ? (
          <ol className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">1.</span>
              <span>
                Safari'nin altındaki <strong>Paylaş</strong> simgesine dokunun.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">2.</span>
              <span>
                Menüde aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong>yi seçin.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">3.</span>
              <span>
                Sağ üstteki <strong>Ekle</strong> butonuna basın.
              </span>
            </li>
          </ol>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Tarayıcınızın adres çubuğundaki veya menüdeki (üç nokta) "Yükle / Ana Ekrana Ekle" seçeneğini kullanarak Bütçem'i cihazınıza kurabilirsiniz.
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold transition active:scale-95"
        >
          {isIos ? 'Tamam' : 'Anladım'}
        </button>
      </div>
    </div>
  );
};
