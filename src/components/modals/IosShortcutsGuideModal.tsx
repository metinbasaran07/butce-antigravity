import React from 'react';
import { X, Zap, CheckCircle2, Plus, Minus } from 'lucide-react';
import { TransactionType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onQuickAdd: (type: TransactionType) => void;
}

export const IosShortcutsGuideModal: React.FC<Props> = ({ isOpen, onClose, onQuickAdd }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-sm rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                iPhone Hızlı İşlem & Kestirme
              </h3>
              <p className="text-[10px] text-zinc-400">Safari açılmadan tam ekran çalıştırma</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* YÖNTEM 1 */}
        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20 text-xs space-y-1.5">
          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>1. Yöntem: Simgeden Hızlı Eylem (Safari Açılmaz)</span>
          </div>
          <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 leading-relaxed">
            Ana ekranınızdaki <strong>Bütçem</strong> simgesine parmağınızla{' '}
            <strong>1 saniye basılı tutun (Haptic Touch)</strong>. Açılan menüden doğrudan{' '}
            <strong>"Hızlı Gelir Ekle"</strong> veya <strong>"Hızlı Gider Ekle"</strong>ye dokunun.
            Asla Safari açılmaz, doğrudan uygulama içinde açılır!
          </p>
        </div>

        {/* YÖNTEM 2 */}
        <div className="space-y-2.5 my-3 text-xs text-zinc-600 dark:text-zinc-300">
          <div className="font-bold text-zinc-800 dark:text-zinc-200">
            2. Yöntem: Apple Kestirmeler & Eylem Düğmesi (Action Button)
          </div>
          <ol className="space-y-2 pl-1 text-[11px]">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <span>
                Kestirmeler uygulamasında yeni kestirme oluşturup <strong>"+"</strong> butonuna basın.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <span>
                Arama kutusuna <strong>"Bütçem"</strong> yazın ve çıkan listeden{' '}
                <strong>"Bütçem Uygulamasını Aç"</strong> (Open App) eylemini seçin. (Kesinlikle
                "URL Aç" seçmeyin, o Safari'yi açar).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <span>
                Bu kestirmeyi iPhone 15/16 Pro <strong>Eylem Düğmesine (Action Button)</strong>, Kilit
                Ekranına veya Siri sesli komutuna bağlayın!
              </span>
            </li>
          </ol>
        </div>

        {/* Doğrudan Test */}
        <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
          <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
            Anında Aç / Test Et:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickAdd('income');
              }}
              className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gelir Ekle</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onQuickAdd('expense');
              }}
              className="py-2 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Gider Ekle</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold transition active:scale-95"
        >
          Tamam, Anladım
        </button>
      </div>
    </div>
  );
};
