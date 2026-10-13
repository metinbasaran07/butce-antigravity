import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Transaction } from '../types';
import { useStore } from '../context/StoreContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Props {
  transactions: Transaction[];
}

export const CategoryDistributionChart: React.FC<Props> = ({ transactions }) => {
  const { data, getCategory, formatMoney } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  const isDark = data.settings.theme === 'dark';
  const currency = data.settings.currency || '₺';

  useEffect(() => {
    if (!canvasRef.current) return;

    const expenses = transactions.filter((t) => t.type === 'expense');
    const catMap: Record<string, { total: number; color: string }> = {};

    expenses.forEach((t) => {
      const cat = getCategory(t.categoryId);
      if (!catMap[cat.name]) {
        catMap[cat.name] = { total: 0, color: cat.color || '#6366f1' };
      }
      catMap[cat.name].total += t.amount;
    });

    const sortedKeys = Object.keys(catMap).sort((a, b) => catMap[b].total - catMap[a].total);
    const labels = sortedKeys;
    const chartData = labels.map((l) => catMap[l].total);
    const colors = labels.map((l) => catMap[l].color);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (labels.length === 0) {
      return;
    }

    const theme = {
      textColor: isDark ? '#94a3b8' : '#64748b',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      tooltipBg: isDark ? '#0f172a' : '#ffffff',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
    };

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            data: chartData,
            backgroundColor: colors,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.65,
            categoryPercentage: 0.85,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: theme.gridColor, drawBorder: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'Plus Jakarta Sans', size: 10 },
              callback: (value) => `${Number(value).toLocaleString('tr-TR')} ${currency}`,
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.borderColor,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 12,
            callbacks: {
              label: function (context) {
                const val = (context.raw as number) || 0;
                const total = chartData.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` Harcama: ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency} (%${pct})`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [transactions, isDark, currency]);

  const hasExpenses = transactions.some((t) => t.type === 'expense');

  return (
    <div className="relative w-full h-52 flex items-center justify-center">
      {hasExpenses ? (
        <canvas ref={canvasRef} className="w-full h-full" />
      ) : (
        <div className="text-center text-zinc-400 text-xs">
          Bu dönem harcama kaydı yok.
        </div>
      )}
    </div>
  );
};
