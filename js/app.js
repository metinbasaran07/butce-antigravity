/**
 * Bütçem - Ana Uygulama Mantığı (UI & Olaylar)
 */

let activeTab = 'dashboard';
let editingTransactionId = null;
let editingGoalId = null;
let selectedGoalForDeposit = null;

// Para Formatlayıcı
function formatMoney(amount) {
  const currency = window.store.data.settings.currency || '₺';
  const val = Number(amount) || 0;
  return `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

// Tarih Formatlayıcı (GG Ay YYYY)
function formatDateTR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Başlangıç Ayarları & Olay Dinleyicileri
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupMonthFilter();
  populateCategorySelects();
  bindEvents();
  renderApp();
  
  // URL parametre kontrolü (PWA shortcut desteği)
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'new-transaction') {
    openTransactionModal();
  } else if (params.get('tab')) {
    switchTab(params.get('tab'));
  }
});

// Tema Başlatıcı
function initTheme() {
  const savedTheme = window.store.data.settings.theme || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    // Sistem tercihi
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }
  
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    const isDark = html.classList.contains('dark');
    themeToggle.innerHTML = isDark 
      ? '<i data-lucide="sun" class="w-5 h-5 text-amber-400"></i>' 
      : '<i data-lucide="moon" class="w-5 h-5 text-indigo-600"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  window.store.setSetting('theme', newTheme);
  applyTheme(newTheme);
  renderCharts();
}

// Ay Seçici Başlatıcı
function setupMonthFilter() {
  const monthSelect = document.getElementById('monthSelector');
  if (!monthSelect) return;

  const currentMonth = window.store.data.settings.selectedMonth || window.store.getCurrentMonthString();
  
  // Son 12 ay ve Gelecek 2 ayı listele
  const options = [];
  options.push({ value: 'all', label: 'Tüm Zamanlar' });

  const now = new Date();
  for (let i = -11; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  // Ters çevir (en yeni en üstte)
  const allOption = options.shift();
  options.reverse();
  options.unshift(allOption);

  monthSelect.innerHTML = options.map(opt => `
    <option value="${opt.value}" ${opt.value === currentMonth ? 'selected' : ''}>${opt.label}</option>
  `).join('');

  monthSelect.addEventListener('change', (e) => {
    window.store.setSetting('selectedMonth', e.target.value);
    renderApp();
  });
}

// Kategori Seçim Kutularını Doldur
function populateCategorySelects(targetType = 'all') {
  const select = document.getElementById('txCategory');
  const filterCatSelect = document.getElementById('filterCategory');
  if (!select) return;

  const currentType = document.querySelector('input[name="txType"]:checked')?.value || 'expense';
  const categories = window.store.data.categories.filter(c => targetType === 'all' ? c.type === currentType : c.type === targetType);

  select.innerHTML = categories.map(c => `
    <option value="${c.id}">${c.name}</option>
  `).join('');

  if (filterCatSelect) {
    const allCats = window.store.data.categories;
    filterCatSelect.innerHTML = '<option value="all">Tüm Kategoriler</option>' + allCats.map(c => `
      <option value="${c.id}">${c.name} (${c.type === 'income' ? 'Gelir' : 'Gider'})</option>
    `).join('');
  }
}

// Sekme Değiştirici
function switchTab(tabName) {
  activeTab = tabName;

  // Tab butonlarının stilleri
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isThis = btn.dataset.tab === tabName;
    if (isThis) {
      btn.classList.add('text-indigo-600', 'dark:text-indigo-400', 'border-indigo-600', 'dark:border-indigo-400', 'font-semibold');
      btn.classList.remove('text-slate-500', 'dark:text-slate-400', 'border-transparent');
    } else {
      btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'border-indigo-600', 'dark:border-indigo-400', 'font-semibold');
      btn.classList.add('text-slate-500', 'dark:text-slate-400', 'border-transparent');
    }
  });

  // Mobil alt nav butonları
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    const isThis = btn.dataset.tab === tabName;
    if (isThis) {
      btn.classList.add('text-indigo-600', 'dark:text-indigo-400', 'font-semibold');
      btn.classList.remove('text-slate-500', 'dark:text-slate-400');
    } else {
      btn.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'font-semibold');
      btn.classList.add('text-slate-500', 'dark:text-slate-400');
    }
  });

  // Paneller
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });

  renderApp();
}

// İşlemleri Filtreleme (Ay, Kategori, Tip, Arama)
function getFilteredTransactions() {
  const selectedMonth = window.store.data.settings.selectedMonth;
  const searchInput = document.getElementById('txSearchInput')?.value?.toLowerCase() || '';
  const filterType = document.getElementById('filterType')?.value || 'all';
  const filterCat = document.getElementById('filterCategory')?.value || 'all';

  return window.store.data.transactions.filter(t => {
    // Ay Filtresi
    if (selectedMonth && selectedMonth !== 'all') {
      if (!t.date || !t.date.startsWith(selectedMonth)) return false;
    }

    // Tip Filtresi (Gelir/Gider)
    if (filterType !== 'all' && t.type !== filterType) return false;

    // Kategori Filtresi
    if (filterCat !== 'all' && t.categoryId !== filterCat) return false;

    // Arama Kelimesi
    if (searchInput) {
      const cat = window.store.getCategory(t.categoryId);
      const matchNote = (t.note || '').toLowerCase().includes(searchInput);
      const matchCat = cat.name.toLowerCase().includes(searchInput);
      const matchAmount = t.amount.toString().includes(searchInput);
      if (!matchNote && !matchCat && !matchAmount) return false;
    }

    return true;
  });
}

// Genel Render Döngüsü
function renderApp() {
  const filtered = getFilteredTransactions();
  
  renderSummaryCards(filtered);
  renderRecentTransactions(filtered);
  renderTransactionsList(filtered);
  renderSavingsGoals();
  renderBudgetCategories();
  renderFinancialHealth(filtered);
  renderCharts(filtered);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Özet Kartları (Gelir, Gider, Net Bakiye, Tasarruf Oranı)
function renderSummaryCards(filtered) {
  let totalIncome = 0;
  let totalExpense = 0;

  filtered.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  document.getElementById('totalIncomeEl').textContent = formatMoney(totalIncome);
  document.getElementById('totalExpenseEl').textContent = formatMoney(totalExpense);
  
  const netEl = document.getElementById('netBalanceEl');
  netEl.textContent = formatMoney(netBalance);
  if (netBalance >= 0) {
    netEl.className = 'text-2xl font-extrabold text-emerald-600 dark:text-emerald-400';
  } else {
    netEl.className = 'text-2xl font-extrabold text-rose-600 dark:text-rose-400';
  }

  const rateEl = document.getElementById('savingsRateEl');
  if (rateEl) {
    rateEl.textContent = `%${savingsRate.toFixed(0)}`;
  }
}

// Son İşlemler (Dashboard İçin ilk 5 işlem)
function renderRecentTransactions(filtered) {
  const container = document.getElementById('recentTransactionsList');
  if (!container) return;

  const recents = filtered.slice(0, 5);
  if (recents.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400 dark:text-slate-500">
        <i data-lucide="receipt" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm">Bu dönem için henüz işlem kaydedilmemiş.</p>
        <button onclick="openTransactionModal()" class="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          + İlk İşlemi Ekle
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = recents.map(t => createTransactionItemHTML(t)).join('');
}

// Tüm İşlemler Listesi
function renderTransactionsList(filtered) {
  const container = document.getElementById('allTransactionsList');
  const countEl = document.getElementById('txCountBadge');
  if (!container) return;

  if (countEl) countEl.textContent = `${filtered.length} İşlem`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400 dark:text-slate-500">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
        <p class="text-base font-medium">Aramanıza veya filtreye uygun işlem bulunamadı.</p>
        <p class="text-xs text-slate-400 mt-1">Filtreleri temizleyebilir veya yeni bir gelir/gider ekleyebilirsiniz.</p>
      </div>
    `;
    return;
  }

  // Tarihe göre gruplandırma
  const grouped = {};
  filtered.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  container.innerHTML = sortedDates.map(date => `
    <div class="mb-4">
      <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
        <span>${formatDateTR(date)}</span>
        <span>${grouped[date].length} işlem</span>
      </div>
      <div class="space-y-2">
        ${grouped[date].map(t => createTransactionItemHTML(t, true)).join('')}
      </div>
    </div>
  `).join('');
}

// Tek Bir İşlem Satırı HTML
function createTransactionItemHTML(t, withActions = false) {
  const cat = window.store.getCategory(t.categoryId);
  const isIncome = t.type === 'income';
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const badgeBg = isIncome ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
  const methodIcon = t.paymentMethod === 'cash' ? 'banknote' : (t.paymentMethod === 'card' ? 'credit-card' : 'arrow-left-right');
  const methodLabel = t.paymentMethod === 'cash' ? 'Nakit' : (t.paymentMethod === 'card' ? 'Kart' : 'Havale');

  return `
    <div class="group flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
      <div class="flex items-center gap-3.5 min-w-0">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background-color: ${cat.color}15; color: ${cat.color};">
          <i data-lucide="${cat.icon || 'tag'}" class="w-5 h-5"></i>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${cat.name}</h4>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              <i data-lucide="${methodIcon}" class="w-2.5 h-2.5"></i> ${methodLabel}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${t.note || 'Açıklama yok'}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-sm font-bold ${amountColor}">
          ${sign}${formatMoney(t.amount)}
        </span>
        ${withActions ? `
          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button onclick="editTransaction('${t.id}')" title="Düzenle" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="confirmDeleteTransaction('${t.id}')" title="Sil" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Birikim Hedefleri
function renderSavingsGoals() {
  const container = document.getElementById('savingsGoalsList');
  if (!container) return;

  const goals = window.store.data.savingsGoals;
  if (goals.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">
        <i data-lucide="piggy-bank" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
        <p class="text-base font-medium">Henüz bir birikim hedefi eklemediniz.</p>
        <button onclick="openGoalModal()" class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:bg-indigo-700 transition">
          <i data-lucide="plus" class="w-4 h-4"></i> İlk Hedefini Belirle
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = goals.map(goal => {
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const isCompleted = goal.currentAmount >= goal.targetAmount;

    return `
      <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm relative overflow-hidden flex flex-col justify-between">
        ${isCompleted ? `
          <div class="absolute -right-12 top-4 bg-emerald-500 text-white text-[10px] font-bold py-1 px-12 rotate-45 shadow-sm">
            TAMAMLANDI
          </div>
        ` : ''}

        <div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color: ${goal.color}20; color: ${goal.color};">
              <i data-lucide="${goal.icon || 'piggy-bank'}" class="w-6 h-6"></i>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="editGoal('${goal.id}')" title="Düzenle" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteGoal('${goal.id}')" title="Sil" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">${goal.name}</h3>
          ${goal.targetDate ? `<p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Hedef: ${formatDateTR(goal.targetDate)}</p>` : ''}

          <div class="my-4">
            <div class="flex justify-between items-baseline mb-1.5">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">%${pct} Tamamlandı</span>
              <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${formatMoney(goal.currentAmount)} / ${formatMoney(goal.targetAmount)}</span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${goal.color};"></div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <span class="text-xs text-slate-500 dark:text-slate-400">
            ${isCompleted ? 'Hedefe ulaşıldı! 🚀' : `Kalan: <strong class="text-slate-700 dark:text-slate-200">${formatMoney(remaining)}</strong>`}
          </span>
          <button onclick="openDepositModal('${goal.id}')" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> Para Ekle
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Bütçe Limitleri & Kategoriler
function renderBudgetCategories() {
  const container = document.getElementById('budgetLimitList');
  const catManagerContainer = document.getElementById('categoriesManagerList');
  const selectedMonth = window.store.data.settings.selectedMonth;

  const expenseCategories = window.store.data.categories.filter(c => c.type === 'expense');

  // Bu ayki harcamaları hesapla
  const catSpent = {};
  window.store.data.transactions.forEach(t => {
    if (t.type === 'expense') {
      if (!selectedMonth || selectedMonth === 'all' || (t.date && t.date.startsWith(selectedMonth))) {
        catSpent[t.categoryId] = (catSpent[t.categoryId] || 0) + t.amount;
      }
    }
  });

  // 1. Dashboard Bütçe Limit Kartları
  if (container) {
    const budgetedCats = expenseCategories.filter(c => c.monthlyBudget && c.monthlyBudget > 0);
    if (budgetedCats.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-slate-400 dark:text-slate-500">
          <p class="text-xs">Henüz bir bütçe limiti belirlemediniz.</p>
          <button onclick="switchTab('categories')" class="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Kategorilere Limit Belirle →
          </button>
        </div>
      `;
    } else {
      container.innerHTML = budgetedCats.map(cat => {
        const spent = catSpent[cat.id] || 0;
        const budget = cat.monthlyBudget;
        const pct = Math.round((spent / budget) * 100);
        const isOver = spent > budget;
        const barColor = isOver ? '#ef4444' : (pct > 80 ? '#f59e0b' : cat.color);

        return `
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style="background-color: ${cat.color}20; color: ${cat.color};">
                  <i data-lucide="${cat.icon || 'tag'}" class="w-3.5 h-3.5"></i>
                </div>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${cat.name}</span>
              </div>
              <span class="text-xs font-semibold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}">
                ${formatMoney(spent)} / ${formatMoney(budget)}
              </span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, pct)}%; background-color: ${barColor};"></div>
            </div>
            ${isOver ? `<p class="text-[10px] text-rose-500 font-semibold mt-1">⚠️ Bütçe ${formatMoney(spent - budget)} aşıldı!</p>` : ''}
          </div>
        `;
      }).join('');
    }
  }

  // 2. Kategori Yönetim Listesi
  if (catManagerContainer) {
    const allCats = window.store.data.categories;
    catManagerContainer.innerHTML = allCats.map(cat => {
      const isExpense = cat.type === 'expense';
      return `
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background-color: ${cat.color}20; color: ${cat.color};">
              <i data-lucide="${cat.icon || 'tag'}" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">${cat.name}</h4>
              <p class="text-xs text-slate-400">
                ${isExpense ? `Aylık Bütçe: ${cat.monthlyBudget ? formatMoney(cat.monthlyBudget) : 'Limit yok'}` : 'Gelir Kategorisi'}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="editCategory('${cat.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteCategory('${cat.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Finansal Sağlık Skoru & Akıllı Öneriler
function renderFinancialHealth(filtered) {
  const container = document.getElementById('financialHealthCard');
  if (!container) return;

  let totalIncome = 0;
  let totalExpense = 0;
  filtered.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  let score = 100;
  let status = 'Harika';
  let message = 'Tasarruf oranınız çok yüksek, bütçeniz mükemmel dengede.';
  let badgeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';

  if (totalIncome === 0 && totalExpense > 0) {
    score = 25;
    status = 'Dikkat';
    message = 'Bu dönem henüz bir gelir girişi kaydedilmedi, giderler devam ediyor.';
    badgeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
  } else if (totalIncome > 0) {
    const expenseRatio = (totalExpense / totalIncome) * 100;
    if (expenseRatio > 100) {
      score = 35;
      status = 'Kritik';
      message = `Gelirinizden fazla harcama yaptınız (%${expenseRatio.toFixed(0)} harcandı). Acil gider kısıtlaması önerilir.`;
      badgeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
    } else if (expenseRatio > 80) {
      score = 65;
      status = 'Orta';
      message = `Gelirinizin %${expenseRatio.toFixed(0)} kadarı harcandı. Tasarruf için lüks harcamaları gözden geçirebilirsiniz.`;
      badgeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
    } else if (expenseRatio > 50) {
      score = 85;
      status = 'İyi';
      message = `İdeal bütçe dengesindesiniz (%${(100 - expenseRatio).toFixed(0)} birikim oranı).`;
      badgeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
    } else {
      score = 98;
      status = 'Mükemmel';
      message = 'Olağanüstü bir tasarruf disiplini! Birikim hedeflerinize hızlı adımlarla ilerliyorsunuz.';
      badgeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
  }

  container.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
        </div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bütçe Analizi</span>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor}">
        ${score} / 100 - ${status}
      </span>
    </div>
    <p class="text-sm text-slate-700 dark:text-slate-300 font-medium">${message}</p>
  `;
}

// Grafik Güncelleme Tetikleyicisi
function renderCharts(filtered) {
  if (typeof updateCharts === 'function') {
    const list = filtered || getFilteredTransactions();
    updateCharts(list);
  }
}

// Olay Dinleyicileri Kurulumu
function bindEvents() {
  // Arama & Filtre dinleyicileri
  const searchInput = document.getElementById('txSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const filtered = getFilteredTransactions();
      renderTransactionsList(filtered);
      if (window.lucide) window.lucide.createIcons();
    });
  }

  const filterType = document.getElementById('filterType');
  if (filterType) filterType.addEventListener('change', () => renderApp());

  const filterCategory = document.getElementById('filterCategory');
  if (filterCategory) filterCategory.addEventListener('change', () => renderApp());

  // Modal içindeki Gelir / Gider Radyo Değişimi
  document.querySelectorAll('input[name="txType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateCategorySelects(e.target.value);
    });
  });

  // İşlem Formu Submit
  const txForm = document.getElementById('transactionForm');
  if (txForm) {
    txForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTransaction();
    });
  }

  // Kategori Formu Submit
  const catForm = document.getElementById('categoryForm');
  if (catForm) {
    catForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCategory();
    });
  }

  // Birikim Hedefi Formu Submit
  const goalForm = document.getElementById('goalForm');
  if (goalForm) {
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveGoal();
    });
  }

  // Para Yatırma Formu Submit
  const depositForm = document.getElementById('depositForm');
  if (depositForm) {
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveDeposit();
    });
  }

  // Para Birimi Seçimi
  const curSelect = document.getElementById('settingsCurrency');
  if (curSelect) {
    curSelect.value = window.store.data.settings.currency || '₺';
    curSelect.addEventListener('change', (e) => {
      window.store.setSetting('currency', e.target.value);
      renderApp();
      showToast('Para birimi güncellendi: ' + e.target.value, 'success');
    });
  }

  // JSON Yükleme Dosya Girişi
  const jsonFileInput = document.getElementById('jsonFileInput');
  if (jsonFileInput) {
    jsonFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.store.importJSON(event.target.result);
        if (res.success) {
          showToast('Yedek başarıyla yüklendi!', 'success');
          renderApp();
        } else {
          showToast(res.message || 'Yedek yüklenirken hata oluştu', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }
}

// --- MODAL İŞLEMLERİ ---

// İşlem Modalı
function openTransactionModal(editId = null) {
  editingTransactionId = editId;
  const modal = document.getElementById('transactionModal');
  const title = document.getElementById('txModalTitle');
  const amountInput = document.getElementById('txAmount');
  const noteInput = document.getElementById('txNote');
  const dateInput = document.getElementById('txDate');
  const paymentSelect = document.getElementById('txPaymentMethod');

  if (editId) {
    const tx = window.store.data.transactions.find(t => t.id === editId);
    if (!tx) return;
    title.textContent = 'İşlemi Düzenle';
    amountInput.value = tx.amount;
    noteInput.value = tx.note || '';
    dateInput.value = tx.date;
    paymentSelect.value = tx.paymentMethod || 'card';
    
    const typeRadio = document.querySelector(`input[name="txType"][value="${tx.type}"]`);
    if (typeRadio) typeRadio.checked = true;
    populateCategorySelects(tx.type);

    document.getElementById('txCategory').value = tx.categoryId;
  } else {
    title.textContent = 'Yeni İşlem Ekle';
    amountInput.value = '';
    noteInput.value = '';
    dateInput.value = new Date().toISOString().split('T')[0];
    paymentSelect.value = 'card';
    
    document.querySelector('input[name="txType"][value="expense"]').checked = true;
    populateCategorySelects('expense');
  }

  modal.classList.remove('hidden');
  setTimeout(() => amountInput.focus(), 100);
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.add('hidden');
  editingTransactionId = null;
}

function saveTransaction() {
  const amount = parseFloat(document.getElementById('txAmount').value);
  if (!amount || amount <= 0) {
    showToast('Lütfen geçerli bir tutar girin.', 'warning');
    return;
  }

  const type = document.querySelector('input[name="txType"]:checked').value;
  const categoryId = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('txNote').value;
  const paymentMethod = document.getElementById('txPaymentMethod').value;

  if (editingTransactionId) {
    window.store.updateTransaction(editingTransactionId, {
      amount, type, categoryId, date, note, paymentMethod
    });
    showToast('İşlem güncellendi.', 'success');
  } else {
    window.store.addTransaction({
      amount, type, categoryId, date, note, paymentMethod
    });
    showToast('Yeni işlem kaydedildi.', 'success');
  }

  closeTransactionModal();
  renderApp();
}

function editTransaction(id) {
  openTransactionModal(id);
}

function confirmDeleteTransaction(id) {
  if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
    window.store.deleteTransaction(id);
    showToast('İşlem silindi.', 'info');
    renderApp();
  }
}

// Kategori Modalı
function openCategoryModal() {
  const modal = document.getElementById('categoryModal');
  document.getElementById('catName').value = '';
  document.getElementById('catBudget').value = '';
  document.getElementById('catColor').value = '#6366f1';
  modal.classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

function saveCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) {
    showToast('Kategori adı boş olamaz.', 'warning');
    return;
  }

  const type = document.getElementById('catType').value;
  const color = document.getElementById('catColor').value;
  const icon = document.getElementById('catIcon').value || 'tag';
  const monthlyBudget = document.getElementById('catBudget').value;

  window.store.addCategory({ name, type, color, icon, monthlyBudget });
  showToast('Kategori eklendi.', 'success');
  closeCategoryModal();
  populateCategorySelects();
  renderApp();
}

function deleteCategory(id) {
  if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
    window.store.deleteCategory(id);
    showToast('Kategori silindi.', 'info');
    populateCategorySelects();
    renderApp();
  }
}

// Birikim Hedefi Modalı
function openGoalModal(editId = null) {
  editingGoalId = editId;
  const modal = document.getElementById('goalModal');
  const title = document.getElementById('goalModalTitle');
  const nameInput = document.getElementById('goalName');
  const targetInput = document.getElementById('goalTargetAmount');
  const currentInput = document.getElementById('goalCurrentAmount');
  const dateInput = document.getElementById('goalDate');
  const colorInput = document.getElementById('goalColor');

  if (editId) {
    const goal = window.store.data.savingsGoals.find(g => g.id === editId);
    if (!goal) return;
    title.textContent = 'Hedefi Düzenle';
    nameInput.value = goal.name;
    targetInput.value = goal.targetAmount;
    currentInput.value = goal.currentAmount;
    dateInput.value = goal.targetDate || '';
    colorInput.value = goal.color || '#10b981';
  } else {
    title.textContent = 'Yeni Birikim Hedefi';
    nameInput.value = '';
    targetInput.value = '';
    currentInput.value = '0';
    dateInput.value = '';
    colorInput.value = '#10b981';
  }

  modal.classList.remove('hidden');
}

function closeGoalModal() {
  document.getElementById('goalModal').classList.add('hidden');
  editingGoalId = null;
}

function saveGoal() {
  const name = document.getElementById('goalName').value.trim();
  const targetAmount = parseFloat(document.getElementById('goalTargetAmount').value);
  const currentAmount = parseFloat(document.getElementById('goalCurrentAmount').value) || 0;
  const targetDate = document.getElementById('goalDate').value;
  const color = document.getElementById('goalColor').value;
  const icon = document.getElementById('goalIcon').value || 'piggy-bank';

  if (!name || !targetAmount || targetAmount <= 0) {
    showToast('Lütfen geçerli bir isim ve hedef tutar girin.', 'warning');
    return;
  }

  if (editingGoalId) {
    window.store.updateSavingsGoal(editingGoalId, {
      name, targetAmount, currentAmount, targetDate, color, icon
    });
    showToast('Hedef güncellendi.', 'success');
  } else {
    window.store.addSavingsGoal({
      name, targetAmount, currentAmount, targetDate, color, icon
    });
    showToast('Yeni birikim hedefi oluşturuldu.', 'success');
  }

  closeGoalModal();
  renderApp();
}

function editGoal(id) {
  openGoalModal(id);
}

function deleteGoal(id) {
  if (confirm('Bu birikim hedefini silmek istediğinize emin misiniz?')) {
    window.store.deleteSavingsGoal(id);
    showToast('Hedef silindi.', 'info');
    renderApp();
  }
}

// Hedefe Para Ekleme Modalı
function openDepositModal(goalId) {
  selectedGoalForDeposit = goalId;
  const goal = window.store.data.savingsGoals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('depositGoalName').textContent = goal.name;
  document.getElementById('depositAmount').value = '';
  document.getElementById('depositModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('depositAmount').focus(), 100);
}

function closeDepositModal() {
  document.getElementById('depositModal').classList.add('hidden');
  selectedGoalForDeposit = null;
}

function saveDeposit() {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  if (!amount || amount <= 0) {
    showToast('Lütfen geçerli bir tutar girin.', 'warning');
    return;
  }

  window.store.depositToSavingsGoal(selectedGoalForDeposit, amount);
  showToast(`${formatMoney(amount)} birikime eklendi! 🎯`, 'success');
  closeDepositModal();
  renderApp();
}

// Dışa / İçe Aktarma & Sıfırlama
function exportDataJSON() {
  window.store.exportJSON();
  showToast('JSON yedek dosyası indirildi.', 'success');
}

function exportDataCSV() {
  window.store.exportCSV();
  showToast('Excel/CSV harcama dökümü indirildi.', 'success');
}

function triggerImportJSON() {
  document.getElementById('jsonFileInput').click();
}

function resetAllData() {
  if (confirm('Tüm verilerinizi silip uygulamayı sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
    window.store.resetData();
    showToast('Tüm veriler sıfırlandı.', 'info');
    renderApp();
  }
}

function loadSampleData() {
  if (confirm('Örnek gelir, gider ve birikim verileri yüklensin mi?')) {
    window.store.loadDemoData();
    showToast('Örnek veriler başarıyla yüklendi! 🌟', 'success');
    renderApp();
  }
}
