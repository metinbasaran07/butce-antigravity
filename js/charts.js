/**
 * Bütçem - Chart.js Entegrasyonu
 */

let categoryChartInstance = null;
let monthlyComparisonChartInstance = null;
let dailyTrendChartInstance = null;

function getChartThemeColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    textColor: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    borderColor: isDark ? '#334155' : '#e2e8f0'
  };
}

function updateCharts(filteredTransactions) {
  const currency = window.store.data.settings.currency || '₺';
  const theme = getChartThemeColors();

  // 1. Kategori Bazlı Gider Dağılımı (Doughnut Chart)
  renderCategoryDoughnut(filteredTransactions, currency, theme);

  // 2. Aylık Gelir & Gider Karşılaştırması (Bar Chart)
  renderMonthlyBarChart(currency, theme);

  // 3. Günlük Harcama Trendi (Line Chart)
  renderDailyTrendChart(filteredTransactions, currency, theme);
}

function renderCategoryDoughnut(transactions, currency, theme) {
  const ctx = document.getElementById('categoryDoughnutChart');
  if (!ctx) return;

  const expenses = transactions.filter(t => t.type === 'expense');
  const catMap = {};

  expenses.forEach(t => {
    const cat = window.store.getCategory(t.categoryId);
    if (!catMap[cat.name]) {
      catMap[cat.name] = { total: 0, color: cat.color || '#6366f1' };
    }
    catMap[cat.name].total += t.amount;
  });

  const labels = Object.keys(catMap);
  const data = labels.map(l => catMap[l].total);
  const colors = labels.map(l => catMap[l].color);

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const emptyState = document.getElementById('categoryChartEmpty');
  if (labels.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    ctx.classList.add('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    ctx.classList.remove('hidden');
  }

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: theme.tooltipBg,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14,
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.tooltipText,
          borderColor: theme.borderColor,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency} (%${pct})`;
            }
          }
        }
      }
    }
  });
}

function renderMonthlyBarChart(currency, theme) {
  const ctx = document.getElementById('monthlyBarChart');
  if (!ctx) return;

  // Son 6 ayın listesi
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mLabel = d.toLocaleString('tr-TR', { month: 'short' });
    months.push({ key: mStr, label: mLabel });
  }

  const incomeData = [];
  const expenseData = [];

  months.forEach(m => {
    let inc = 0;
    let exp = 0;
    window.store.data.transactions.forEach(t => {
      if (t.date && t.date.startsWith(m.key)) {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      }
    });
    incomeData.push(inc);
    expenseData.push(exp);
  });

  if (monthlyComparisonChartInstance) {
    monthlyComparisonChartInstance.destroy();
  }

  monthlyComparisonChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: 'Gelir',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        },
        {
          label: 'Gider',
          data: expenseData,
          backgroundColor: 'rgba(244, 63, 94, 0.85)',
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans' } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            font: { family: 'Plus Jakarta Sans' },
            callback: value => `${value.toLocaleString('tr-TR')} ${currency}`
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: theme.textColor,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.tooltipText,
          borderColor: theme.borderColor,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.raw.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;
            }
          }
        }
      }
    }
  });
}

function renderDailyTrendChart(transactions, currency, theme) {
  const ctx = document.getElementById('dailyTrendChart');
  if (!ctx) return;

  const expenses = transactions.filter(t => t.type === 'expense');
  
  // Günlere göre grupla (son 14 gün veya seçili aydaki günler)
  const dayMap = {};
  expenses.forEach(t => {
    if (!dayMap[t.date]) dayMap[t.date] = 0;
    dayMap[t.date] += t.amount;
  });

  const sortedDates = Object.keys(dayMap).sort();
  const data = sortedDates.map(d => dayMap[d]);
  const formattedLabels = sortedDates.map(d => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  if (dailyTrendChartInstance) {
    dailyTrendChartInstance.destroy();
  }

  dailyTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedLabels.length ? formattedLabels : ['Veri Yok'],
      datasets: [{
        label: 'Günlük Gider',
        data: data.length ? data : [0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            font: { family: 'Plus Jakarta Sans', size: 11 },
            callback: value => `${value.toLocaleString('tr-TR')} ${currency}`
          }
        }
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
          callbacks: {
            label: function(context) {
              return ` Harcama: ${context.raw.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;
            }
          }
        }
      }
    }
  });
}
