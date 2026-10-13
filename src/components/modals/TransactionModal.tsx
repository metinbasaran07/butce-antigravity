import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editTransactionId: string | null;
  initialType?: TransactionType;
  initialAmount?: string;
  initialNote?: string;
  initialCategoryId?: string;
  onOpenNewCategory: () => void;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  editTransactionId,
  initialType = 'expense',
  initialAmount = '',
  initialNote = '',
  initialCategoryId = '',
  onOpenNewCategory,
}) => {
  const { data, addTransaction, updateTransaction, formatMoney, showToast } = useStore();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [hasTransferFee, setHasTransferFee] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  const availableCategories = data.categories.filter((c) => c.type === type);
  const transferFee = data.settings.transferFee ?? 15.00;
  const currency = data.settings.currency || '₺';

  useEffect(() => {
    if (isOpen) {
      if (editTransactionId) {
        const tx = data.transactions.find((t) => t.id === editTransactionId);
        if (tx) {
          setType(tx.type);
          setAmount(tx.amount.toString());
          setCategoryId(tx.categoryId);
          setDate(tx.date);
          setPaymentMethod(tx.paymentMethod);
          setHasTransferFee(Boolean(tx.hasTransferFee));
          setNote(tx.note);
          return;
        }
      }

      // New transaction mode
      const selectedType = initialType || 'expense';
      setType(selectedType);
      setAmount(initialAmount);
      setNote(initialNote);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('card');
      setHasTransferFee(false);

      const matchingCats = data.categories.filter((c) => c.type === selectedType);
      if (initialCategoryId && matchingCats.some((c) => c.id === initialCategoryId)) {
        setCategoryId(initialCategoryId);
      } else if (matchingCats.length > 0) {
        setCategoryId(matchingCats[0].id);
      }
    }
  }, [isOpen, editTransactionId, initialType, initialAmount, initialNote, initialCategoryId, data.categories, data.transactions]);

  // When type changes, ensure valid category is selected
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = data.categories.filter((c) => c.type === newType);
    if (!validCats.some((c) => c.id === categoryId)) {
      setCategoryId(validCats.length > 0 ? validCats[0].id : '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseAmount = parseFloat(amount);
    if (!baseAmount || baseAmount <= 0) {
      showToast('Lütfen geçerli bir tutar girin', 'warning');
      return;
    }

    if (!categoryId) {
      showToast('Lütfen bir kategori seçin', 'warning');
      return;
    }

    const isIbanFeeApplicable = Boolean(type === 'expense' && paymentMethod === 'card' && hasTransferFee);
    const feeAmount = isIbanFeeApplicable ? transferFee : 0;
    const finalAmount = baseAmount + feeAmount;

    let finalNote = note.trim();
    if (isIbanFeeApplicable && !finalNote.includes('Komisyon')) {
      finalNote = finalNote
        ? `${finalNote} (+${feeAmount} ${currency} İBAN Komisyonu)`
        : `+${feeAmount} ${currency} İBAN Komisyonu Dahil`;
    }

    if (editTransactionId) {
      updateTransaction(editTransactionId, {
        amount: finalAmount,
        type,
        categoryId,
        date: date || new Date().toISOString().split('T')[0],
        note: finalNote,
        paymentMethod,
        hasTransferFee: isIbanFeeApplicable,
        transferFeeAmount: feeAmount,
      });
      showToast('İşlem güncellendi', 'success');
    } else {
      addTransaction({
        amount: finalAmount,
        type,
        categoryId,
        date: date || new Date().toISOString().split('T')[0],
        note: finalNote,
        paymentMethod,
        hasTransferFee: isIbanFeeApplicable,
        transferFeeAmount: feeAmount,
      });
      showToast(
        isIbanFeeApplicable
          ? `İşlem ve ${feeAmount} ${currency} komisyon kaydedildi`
          : 'İşlem eklendi',
        'success'
      );
    }

    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const showIbanOption = type === 'expense' && paymentMethod === 'card';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-sm rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 animate-modal shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {editTransactionId
              ? 'İşlemi Düzenle'
              : type === 'income'
              ? 'Gelir Ekle'
              : 'Gider Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Tip Switch */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-center text-xs font-semibold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              Gider (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-center text-xs font-semibold rounded-lg transition ${
                type === 'income'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              Gelir (+)
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Tutar ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-base font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewCategory();
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Yeni Kategori
              </button>
            </div>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tarih & Ödeme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Tarih
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Ödeme
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="card">Kart</option>
                <option value="cash">Nakit</option>
              </select>
            </div>
          </div>

          {/* İBAN Komisyonu Checkbox */}
          {showIbanOption && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={hasTransferFee}
                  onChange={(e) => setHasTransferFee(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4 shrink-0"
                />
                <span className="leading-snug">
                  İBAN Komisyonu Ekle (
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    +{transferFee.toFixed(2)} {currency}
                  </strong>
                  )
                </span>
              </label>
              {hasTransferFee && parsedAmount > 0 && (
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pl-6.5">
                  Komisyon dahil toplam:{' '}
                  {(parsedAmount + transferFee).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  {currency}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Açıklama (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Açıklama..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl text-xs transition active:scale-98 shadow-sm"
          >
            Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};
