import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useStore } from '../context/StoreContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export const MonthlyComparisonChart: React.FC = () => {
  const { data } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  const isDark = data.settings.theme === 'dark';
  const currency = data.settings.currency || '₺';

  useEffect(() => {
    if (!canvasRef.current) return;

    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = d.toLocaleString('tr-TR', { month: 'short' });
      months.push({ key: mStr, label: mLabel });
    }

    const incomeData: number[] = [];
    const expenseData: number[] = [];

    months.forEach((m) => {
      let inc = 0;
      let exp = 0;
      data.transactions.forEach((t) => {
        if (t.date && t.date.startsWith(m.key)) {
          if (t.type === 'income') inc += t.amount;
          if (t.type === 'expense') exp += t.amount;
        }
      });
      incomeData.push(inc);
      expenseData.push(exp);
    });

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
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
        labels: months.map((m) => m.label),
        datasets: [
          {
            label: 'Gelir',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 8,
            barPercentage: 0.5,
            categoryPercentage: 0.6,
          },
          {
            label: 'Gider',
            data: expenseData,
            backgroundColor: '#f43f5e',
            borderRadius: 8,
            barPercentage: 0.5,
            categoryPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'Plus Jakarta Sans', size: 12 },
            },
          },
          y: {
            grid: { color: theme.gridColor, drawBorder: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: (value) => `${Number(value).toLocaleString('tr-TR')} ${currency}`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: theme.textColor,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: 'Plus Jakarta Sans', size: 12 },
            },
          },
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
                return ` ${context.dataset.label}: ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;
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
  }, [data.transactions, isDark, currency]);

  return (
    <div className="relative w-full h-64">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
