import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Transaction } from '../types';
import { useStore } from '../context/StoreContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface Props {
  transactions: Transaction[];
}

export const DailyTrendChart: React.FC<Props> = ({ transactions }) => {
  const { data } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  const isDark = data.settings.theme === 'dark';
  const currency = data.settings.currency || '₺';

  useEffect(() => {
    if (!canvasRef.current) return;

    const expenses = transactions.filter((t) => t.type === 'expense');
    const dayMap: Record<string, number> = {};
    expenses.forEach((t) => {
      if (!dayMap[t.date]) dayMap[t.date] = 0;
      dayMap[t.date] += t.amount;
    });

    const sortedDates = Object.keys(dayMap).sort();
    const chartData = sortedDates.map((d) => dayMap[d]);
    const formattedLabels = sortedDates.map((d) => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
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

    const lineColor = isDark ? '#818cf8' : '#4f46e5';
    const pointBg = isDark ? '#c7d2fe' : '#4338ca';
    const fillColor = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.08)';

    chartInstanceRef.current = new ChartJS(canvasRef.current, {
      type: 'line',
      data: {
        labels: formattedLabels.length ? formattedLabels : ['Veri Yok'],
        datasets: [
          {
            label: 'Günlük Gider',
            data: chartData.length ? chartData : [0],
            borderColor: lineColor,
            borderWidth: 2.5,
            backgroundColor: fillColor,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: pointBg,
            pointBorderColor: lineColor,
            pointRadius: 3.5,
            pointHoverRadius: 6,
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
              font: { family: 'Plus Jakarta Sans', size: 11 },
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
                return ` Harcama: ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;
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

  return (
    <div className="relative w-full h-64">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
