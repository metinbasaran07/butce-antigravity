import React from 'react';
import { useStore } from '../../context/StoreContext';
import { MonthlyComparisonChart } from '../MonthlyComparisonChart';
import { DailyTrendChart } from '../DailyTrendChart';

export const AnalyticsTab: React.FC = () => {
  const { data } = useStore();

  const selectedMonth = data.settings.selectedMonth;
  const periodTxs = data.transactions.filter((t) => {
    if (selectedMonth && selectedMonth !== 'all') {
      return t.date && t.date.startsWith(selectedMonth);
    }
    return true;
  });

  return (
    <section className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Finansal İstatistikler
        </h2>
        <p className="text-xs text-zinc-400">Dönemsel eğilimlerinizi inceleyin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-clean p-5 rounded-2xl">
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
            Son 6 Ay Gelir / Gider
          </h3>
          <MonthlyComparisonChart />
        </div>

        <div className="card-clean p-5 rounded-2xl">
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
            Günlük Harcama Eğilimi
          </h3>
          <DailyTrendChart transactions={periodTxs} />
        </div>
      </div>
    </section>
  );
};
