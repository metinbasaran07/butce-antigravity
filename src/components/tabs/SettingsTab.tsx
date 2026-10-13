import React, { useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Zap, CheckCircle2, Plus, Minus, Smartphone } from 'lucide-react';
import { TransactionType } from '../../types';

interface Props {
  onOpenShortcutsGuide: () => void;
  onOpenPwaInstall: () => void;
  onQuickAdd: (type: TransactionType) => void;
}

export const SettingsTab: React.FC<Props> = ({
  onOpenShortcutsGuide,
  onOpenPwaInstall,
  onQuickAdd,
}) => {
  const {
    data,
    setActiveTab,
    setSetting,
    exportJSON,
    exportCSV,
    importJSON,
    resetData,
    loadDemoData,
    showToast,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCurrencyChange = (val: string) => {
    setSetting('currency', val);
    showToast('Para birimi güncellendi', 'success');
  };

  const handleTransferFeeChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setSetting('transferFee', num);
    showToast(`İBAN komisyonu ${num.toFixed(2)} ${data.settings.currency} olarak kaydedildi`, 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importJSON(content);
      if (res.success) {
        showToast('Yedek başarıyla yüklendi', 'success');
      } else {
        showToast(res.message || 'Hata oluştu', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Tüm veriler silinsin mi?')) {
      resetData();
      showToast('Veriler sıfırlandı', 'info');
    }
  };

  const handleLoadDemo = () => {
    if (confirm('Örnek veriler yüklensin mi?')) {
      loadDemoData();
      showToast('Örnek veriler yüklendi', 'success');
    }
  };

  return (
    <section className="space-y-4 max-w-lg mx-auto animate-fade-in">
      <div>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Ayarlar</h2>
        <p className="text-xs text-zinc-400">Tercihler ve veri yönetimi.</p>
      </div>

      {/* Kategoriler & Limitler Hızlı Erişim */}
      <div className="card-clean p-4 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Kategoriler & Bütçe Limitleri
          </div>
          <div className="text-[11px] text-zinc-400">
            Kategori isimleri, renkleri ve aylık bütçe sınırları
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-800 dark:text-zinc-200"
        >
          Yönet →
        </button>
      </div>

      {/* Para Birimi */}
      <div className="card-clean p-4 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Para Birimi</div>
          <div className="text-[11px] text-zinc-400">Görüntülenen para sembolü</div>
        </div>
        <select
          value={data.settings.currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer text-zinc-800 dark:text-zinc-200"
        >
          <option value="₺" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            ₺ (TRY)
          </option>
          <option value="$" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            $ (USD)
          </option>
          <option value="€" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            € (EUR)
          </option>
          <option value="£" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            £ (GBP)
          </option>
        </select>
      </div>

      {/* İBAN Komisyon Tutarı Ayarı */}
      <div className="card-clean p-4 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            İBAN Komisyon Tutarı
          </div>
          <div className="text-[11px] text-zinc-400">
            İBAN komisyonu uygulandığında eklenecek tutar
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.5"
            value={data.settings.transferFee}
            onChange={(e) => handleTransferFeeChange(e.target.value)}
            className="w-20 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-right text-zinc-900 dark:text-zinc-100 focus:outline-none"
          />
          <span className="text-xs font-semibold text-zinc-500">{data.settings.currency}</span>
        </div>
      </div>

      {/* Hızlı İşlem & Kısayollar Bölümü */}
      <div className="card-clean p-4 sm:p-5 rounded-2xl space-y-4 border-l-4 border-l-indigo-500">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Hızlı İşlemler & Kısayollar
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                Safari açılmadan tek dokunuşla gelir / gider ekleyin
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenShortcutsGuide}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Rehber →
          </button>
        </div>

        {/* 1. Kesin Çözüm: Ana Ekran Haptic Touch */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>1. Yöntem: Ana Ekran Simgesine Basılı Tutun (En Hızlısı)</span>
          </div>
          <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90 leading-relaxed">
            Bütçem ana ekranınıza eklendiğinde, simgeye <strong>1 saniye basılı tutun</strong> (Haptic
            Touch). Açılan menüden doğrudan <strong>"Hızlı Gelir Ekle"</strong> veya{' '}
            <strong>"Hızlı Gider Ekle"</strong>ye dokunun. Apple PWA motoru sayesinde{' '}
            <strong>Safari asla açılmaz</strong>, uygulama içi pencere anında açılır!
          </p>
          <div className="flex items-center gap-2 pt-1.5 border-t border-emerald-500/15">
            <button
              type="button"
              onClick={() => onQuickAdd('income')}
              className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold transition active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gelir Ekle</span>
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd('expense')}
              className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-semibold transition active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Gider Ekle</span>
            </button>
          </div>
        </div>

        {/* 2. Apple Shortcuts (Kestirmeler) */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>2. Yöntem: Apple Kestirmeler'de "Uygulamayı Aç" Eylemi</span>
          </div>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1 leading-relaxed">
            <div>
              💡 <strong>Safari'nin Açılmasını Engelleme:</strong> Kestirmeler uygulamasında "URL Aç"
              seçmeyin. Bunun yerine arama kutusuna <strong>"Bütçem"</strong> yazıp{' '}
              <strong>"Bütçem Uygulamasını Aç"</strong> eylemini seçin.
            </div>
            <div className="text-zinc-400">
              Bu eylemi iPhone 15/16 Pro Eylem Düğmesine (Action Button) veya Kilit Ekranına
              atayabilirsiniz.
            </div>
          </div>
        </div>
      </div>

      {/* PWA Yükleme Butonu */}
      <div className="card-clean p-4 rounded-2xl space-y-2">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
          <span>Ana Ekrana Ekle (PWA)</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Uygulamayı tarayıcıdan bağımsız, tam ekran çalıştırmak için cihazınıza ekleyin.
        </p>
        <button
          onClick={onOpenPwaInstall}
          className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold transition active:scale-95 shadow-xs"
        >
          Cihaza Ekle
        </button>
      </div>

      {/* Veri Yedekleme */}
      <div className="card-clean p-4 rounded-2xl space-y-3">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          Veri Yedekleme & Aktarım
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportJSON}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 text-center transition"
          >
            JSON İndir
          </button>
          <button
            onClick={exportCSV}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 text-center transition"
          >
            Excel / CSV İndir
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 text-center transition"
        >
          Yedekten Geri Yükle
        </button>
      </div>

      {/* Sıfırlama */}
      <div className="card-clean p-4 rounded-2xl flex gap-2">
        <button
          onClick={handleLoadDemo}
          className="flex-1 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
        >
          Demo Veri Yükle
        </button>
        <button
          onClick={handleReset}
          className="flex-1 py-2 text-xs font-medium text-rose-500 border border-rose-200/40 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
        >
          Tümünü Sıfırla
        </button>
      </div>
    </section>
  );
};
