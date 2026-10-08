/**
 * Bütçem - Sade & Minimalist UI Mantığı
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

// Tarih Formatlayıcı
function formatDateTR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// Başlangıç
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupMonthFilter();
  populateCategorySelects();
  bindEvents();
  renderApp();
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'new-transaction') {
    openTransactionModal();
  } else if (params.get('tab')) {
    switchTab(params.get('tab'));
  }
});

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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }
  
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    const isDark = html.classList.contains('dark');
    themeToggle.innerHTML = isDark 
      ? '<i data-lucide="sun" class="w-4 h-4 text-zinc-300"></i>' 
      : '<i data-lucide="moon" class="w-4 h-4 text-zinc-600"></i>';
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

function setupMonthFilter() {
  const monthSelect = document.getElementById('monthSelector');
  if (!monthSelect) return;

  const currentMonth = window.store.data.settings.selectedMonth || window.store.getCurrentMonthString();
  const options = [{ value: 'all', label: 'Tüm Dönemler' }];

  const now = new Date();
  for (let i = -11; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

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

function switchTab(tabName) {
  activeTab = tabName;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isThis = btn.dataset.tab === tabName;
    if (isThis) {
      btn.className = 'tab-btn px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 transition-all shadow-sm';
    } else {
      btn.className = 'tab-btn px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all';
    }
  });

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    const isThis = btn.dataset.tab === tabName;
    if (isThis) {
      btn.classList.add('text-zinc-900', 'dark:text-white', 'font-semibold');
      btn.classList.remove('text-zinc-400', 'dark:text-zinc-500');
    } else {
      btn.classList.remove('text-zinc-900', 'dark:text-white', 'font-semibold');
      btn.classList.add('text-zinc-400', 'dark:text-zinc-500');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });

  renderApp();
}

// Yalnızca seçili döneme (aya) göre işlemler - Bakiye ve Grafikler bunu kullanır
function getPeriodTransactions() {
  const selectedMonth = window.store.data.settings.selectedMonth;
  return window.store.data.transactions.filter(t => {
    if (selectedMonth && selectedMonth !== 'all') {
      if (!t.date || !t.date.startsWith(selectedMonth)) return false;
    }
    return true;
  });
}

// Filtrelenmiş işlemler - SADECE İşlemler listesi araması ve kategori filtresi için kullanılır
function getFilteredTransactions() {
  const periodTransactions = getPeriodTransactions();
  const searchInput = document.getElementById('txSearchInput')?.value?.toLowerCase() || '';
  const filterType = document.getElementById('filterType')?.value || 'all';
  const filterCat = document.getElementById('filterCategory')?.value || 'all';

  return periodTransactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCat !== 'all' && t.categoryId !== filterCat) return false;

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

function renderApp() {
  const periodTxs = getPeriodTransactions();
  const filteredTxs = getFilteredTransactions();
  
  // Bakiye ve Özet kartları HER ZAMAN o dönemin genel toplamını gösterir (filtrelerden etkilenmez!)
  renderSummaryCards(periodTxs);
  renderRecentTransactions(periodTxs);
  renderTransactionsList(filteredTxs);
  renderSavingsGoals();
  renderBudgetCategories(periodTxs);
  renderCharts(periodTxs);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

let isBalanceHidden = localStorage.getItem('butcem_hide_balance') === 'true';

function toggleBalanceVisibility() {
  isBalanceHidden = !isBalanceHidden;
  localStorage.setItem('butcem_hide_balance', isBalanceHidden);
  const periodTxs = getPeriodTransactions();
  renderSummaryCards(periodTxs);
  if (window.lucide) window.lucide.createIcons();
}

function renderSummaryCards(periodTxs) {
  let totalIncome = 0;
  let totalExpense = 0;

  periodTxs.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

  const totalIncomeEl = document.getElementById('totalIncomeEl');
  const totalExpenseEl = document.getElementById('totalExpenseEl');
  const netEl = document.getElementById('netBalanceEl');
  const eyeIcon = document.getElementById('balanceEyeIcon');
  const monthlySavingsEl = document.getElementById('monthlySavingsAmountEl');
  const savingsRateEl = document.getElementById('monthlySavingsRateEl');

  if (totalIncomeEl) totalIncomeEl.textContent = formatMoney(totalIncome);
  if (totalExpenseEl) totalExpenseEl.textContent = formatMoney(totalExpense);
  
  if (netEl) {
    if (isBalanceHidden) {
      netEl.textContent = '•••••••• ₺';
      netEl.classList.add('tracking-widest');
    } else {
      netEl.textContent = formatMoney(netBalance);
      netEl.classList.remove('tracking-widest');
    }
  }

  if (eyeIcon) {
    eyeIcon.setAttribute('data-lucide', isBalanceHidden ? 'eye-off' : 'eye');
    eyeIcon.className = `w-4 h-4 ${isBalanceHidden ? 'text-indigo-500' : 'text-zinc-400'}`;
  }

  if (monthlySavingsEl) {
    if (netBalance >= 0) {
      monthlySavingsEl.textContent = `+${formatMoney(netBalance)}`;
      monthlySavingsEl.className = 'text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate';
      if (savingsRateEl) savingsRateEl.textContent = `(%${Math.max(0, savingsRate).toFixed(0)})`;
    } else {
      monthlySavingsEl.textContent = `-${formatMoney(Math.abs(netBalance))}`;
      monthlySavingsEl.className = 'text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums truncate';
      if (savingsRateEl) savingsRateEl.textContent = '(Açık)';
    }
  }
}

function renderRecentTransactions(filtered) {
  const container = document.getElementById('recentTransactionsList');
  if (!container) return;

  const recents = filtered.slice(0, 5);
  if (recents.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-zinc-400 dark:text-zinc-500">
        <p class="text-xs">Bu dönem henüz kayıtlı işlem yok.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recents.map(t => createTransactionItemHTML(t)).join('');
}

function renderTransactionsList(filtered) {
  const container = document.getElementById('allTransactionsList');
  const countEl = document.getElementById('txCountBadge');
  if (!container) return;

  if (countEl) countEl.textContent = `${filtered.length} işlem`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-zinc-400 dark:text-zinc-500">
        <i data-lucide="receipt" class="w-8 h-8 mx-auto mb-2 opacity-30"></i>
        <p class="text-xs font-medium">Kriterlere uygun işlem bulunamadı.</p>
      </div>
    `;
    return;
  }

  const grouped = {};
  filtered.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  container.innerHTML = sortedDates.map(date => `
    <div class="mb-5">
      <div class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 px-1 tracking-wide">
        ${formatDateTR(date)}
      </div>
      <div class="space-y-1.5">
        ${grouped[date].map(t => createTransactionItemHTML(t, true)).join('')}
      </div>
    </div>
  `).join('');
}

function createTransactionItemHTML(t, withActions = false) {
  const cat = window.store.getCategory(t.categoryId);
  const isIncome = t.type === 'income';
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100';

  return `
    <div class="group flex items-center justify-between py-3 px-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800" style="background-color: ${cat.color}10; color: ${cat.color};">
          <i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4"></i>
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">${cat.name}</div>
          <div class="text-[11px] text-zinc-400 truncate mt-0.5">${t.note || (t.paymentMethod === 'card' ? 'Kart' : t.paymentMethod === 'cash' ? 'Nakit' : 'Havale')}</div>
        </div>
      </div>
      
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-xs font-semibold ${amountColor} tabular-nums">
          ${sign}${formatMoney(t.amount)}
        </span>
        ${withActions ? `
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="editTransaction('${t.id}')" title="Düzenle" class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="confirmDeleteTransaction('${t.id}')" title="Sil" class="p-1 rounded text-zinc-400 hover:text-rose-500">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderSavingsGoals() {
  const container = document.getElementById('savingsGoalsList');
  if (!container) return;

  const goals = window.store.data.savingsGoals;
  if (goals.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-10 text-center text-zinc-400">
        <p class="text-xs">Henüz bir birikim hedefi eklenmedi.</p>
        <button onclick="openGoalModal()" class="mt-2 text-xs font-semibold text-zinc-900 dark:text-white underline">
          + Hedef Ekle
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = goals.map(goal => {
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    return `
      <div class="card-clean rounded-2xl p-4 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs" style="background-color: ${goal.color}15; color: ${goal.color};">
              <i data-lucide="${goal.icon || 'piggy-bank'}" class="w-4 h-4"></i>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="editGoal('${goal.id}')" class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="deleteGoal('${goal.id}')" class="p-1 text-zinc-400 hover:text-rose-500">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-zinc-900 dark:text-zinc-100">${goal.name}</h4>
            <span class="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">%${goal.sharePercent || 0} Dağıtım Payı</span>
          </div>
          <div class="text-[11px] text-zinc-400 mt-1 flex justify-between">
            <span>${formatMoney(goal.currentAmount)}</span>
            <span>${formatMoney(goal.targetAmount)}</span>
          </div>

          <div class="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full my-2.5 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300" style="width: ${pct}%; background-color: ${goal.color};"></div>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-between text-[11px]">
          <span class="text-zinc-400">%${pct} tamamlandı</span>
          <button onclick="openDepositModal('${goal.id}')" class="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">
            + Para Ekle
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderBudgetCategories() {
  const container = document.getElementById('budgetLimitList');
  const catManagerContainer = document.getElementById('categoriesManagerList');
  const selectedMonth = window.store.data.settings.selectedMonth;

  const expenseCategories = window.store.data.categories.filter(c => c.type === 'expense');

  const catSpent = {};
  window.store.data.transactions.forEach(t => {
    if (t.type === 'expense') {
      if (!selectedMonth || selectedMonth === 'all' || (t.date && t.date.startsWith(selectedMonth))) {
        catSpent[t.categoryId] = (catSpent[t.categoryId] || 0) + t.amount;
      }
    }
  });

  if (container) {
    const budgetedCats = expenseCategories.filter(c => (c.monthlyBudget && c.monthlyBudget > 0) || (catSpent[c.id] && catSpent[c.id] > 0));
    if (budgetedCats.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-zinc-400 text-xs">
          Kayıtlı harcama kategorisi yok.
        </div>
      `;
    } else {
      // Kompakt 2 sütunlu mini grid kartları
      container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${budgetedCats.slice(0, 8).map(cat => {
            const spent = catSpent[cat.id] || 0;
            const budget = cat.monthlyBudget || 0;
            const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
            const isOver = budget > 0 && spent > budget;

            return `
              <div class="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
                <div class="flex items-center justify-between text-xs mb-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${cat.color};"></span>
                    <span class="font-medium text-zinc-800 dark:text-zinc-200 truncate text-[11px]">${cat.name}</span>
                  </div>
                  <span class="text-[11px] font-semibold ${isOver ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'} tabular-nums shrink-0">
                    ${formatMoney(spent)}
                  </span>
                </div>
                ${budget > 0 ? `
                  <div class="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div class="h-full rounded-full" style="width: ${Math.min(100, pct)}%; background-color: ${isOver ? '#f43f5e' : cat.color};"></div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  if (catManagerContainer) {
    const allCats = window.store.data.categories;
    catManagerContainer.innerHTML = allCats.map(cat => {
      return `
        <div class="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 card-clean">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style="background-color: ${cat.color}15; color: ${cat.color};">
              <i data-lucide="${cat.icon || 'tag'}" class="w-3.5 h-3.5"></i>
            </div>
            <div>
              <div class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">${cat.name}</div>
              <div class="text-[10px] text-zinc-400">${cat.type === 'expense' && cat.monthlyBudget ? `Limit: ${formatMoney(cat.monthlyBudget)}` : (cat.type === 'income' ? 'Gelir' : 'Limitsiz')}</div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="editCategory('${cat.id}')" class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteCategory('${cat.id}')" class="p-1 text-zinc-400 hover:text-rose-500">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function renderFinancialHealth(filtered) {
  const container = document.getElementById('financialHealthCard');
  if (!container) return;

  let totalIncome = 0;
  let totalExpense = 0;
  filtered.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  let message = 'Tasarruf oranınız dengeli ve bütçeniz kontrol altında.';
  if (totalIncome > 0) {
    const ratio = (totalExpense / totalIncome) * 100;
    if (ratio > 100) message = 'Bu dönem giderler gelirinizin üzerinde seyrediyor.';
    else if (ratio < 60) message = 'Mükemmel tasarruf performansı! Hedeflerinize hızla yaklaşıyorsunuz.';
  }

  container.innerHTML = `
    <div class="flex items-center justify-between text-xs">
      <span class="text-zinc-400">Finansal Durum</span>
      <span class="font-medium text-zinc-800 dark:text-zinc-200">${message}</span>
    </div>
  `;
}

function renderCharts(filtered) {
  if (typeof updateCharts === 'function') {
    const list = filtered || getFilteredTransactions();
    updateCharts(list);
  }
}

function bindEvents() {
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

  document.querySelectorAll('input[name="txType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateCategorySelects(e.target.value);
    });
  });

  const txForm = document.getElementById('transactionForm');
  if (txForm) {
    txForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTransaction();
    });
  }

  const catForm = document.getElementById('categoryForm');
  if (catForm) {
    catForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCategory();
    });
  }

  const goalForm = document.getElementById('goalForm');
  if (goalForm) {
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveGoal();
    });
  }

  const depositForm = document.getElementById('depositForm');
  if (depositForm) {
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveDeposit();
    });
  }

  const curSelect = document.getElementById('settingsCurrency');
  if (curSelect) {
    curSelect.value = window.store.data.settings.currency || '₺';
    curSelect.addEventListener('change', (e) => {
      window.store.setSetting('currency', e.target.value);
      renderApp();
      showToast('Para birimi güncellendi', 'success');
    });
  }

  // Havale / EFT Komisyonu Ayarı
  const feeInput = document.getElementById('settingsTransferFee');
  if (feeInput) {
    feeInput.value = window.store.data.settings.transferFee ?? 15.00;
    feeInput.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value) || 0;
      window.store.setSetting('transferFee', val);
      updateIbanFeeUI();
      showToast(`Havale komisyonu ${val.toFixed(2)} olarak kaydedildi`, 'success');
    });
  }

  // Modal içindeki ödeme yöntemi ve tutar değiştiğinde IBAN komisyonunu güncelle
  const paymentSelect = document.getElementById('txPaymentMethod');
  if (paymentSelect) {
    paymentSelect.addEventListener('change', () => updateIbanFeeUI());
  }

  const txAmountInput = document.getElementById('txAmount');
  if (txAmountInput) {
    txAmountInput.addEventListener('input', () => updateIbanFeePreview());
  }

  const ibanCheckbox = document.getElementById('txIbanFeeCheckbox');
  if (ibanCheckbox) {
    ibanCheckbox.addEventListener('change', () => updateIbanFeePreview());
  }

  const jsonFileInput = document.getElementById('jsonFileInput');
  if (jsonFileInput) {
    jsonFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.store.importJSON(event.target.result);
        if (res.success) {
          showToast('Yedek başarıyla yüklendi', 'success');
          renderApp();
        } else {
          showToast(res.message || 'Hata oluştu', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }
}

// IBAN Komisyonu Görünürlük ve Metin Güncelleyici
function updateIbanFeeUI() {
  const isExpense = document.querySelector('input[name="txType"]:checked')?.value === 'expense';
  const isTransfer = document.getElementById('txPaymentMethod')?.value === 'transfer';
  const wrapper = document.getElementById('ibanFeeWrapper');
  const feeAmountLabel = document.getElementById('ibanFeeAmountLabel');
  
  const fee = window.store.data.settings.transferFee ?? 15.00;
  const currency = window.store.data.settings.currency || '₺';

  if (wrapper) {
    if (isExpense && isTransfer) {
      wrapper.classList.remove('hidden');
      if (feeAmountLabel) feeAmountLabel.textContent = `+${fee.toFixed(2)} ${currency}`;
    } else {
      wrapper.classList.add('hidden');
      const checkbox = document.getElementById('txIbanFeeCheckbox');
      if (checkbox) checkbox.checked = false;
    }
  }
  updateIbanFeePreview();
}

function updateIbanFeePreview() {
  const preview = document.getElementById('ibanFeePreview');
  const checkbox = document.getElementById('txIbanFeeCheckbox');
  const amountInput = document.getElementById('txAmount');
  if (!preview || !checkbox || !amountInput) return;

  const fee = window.store.data.settings.transferFee ?? 15.00;
  const currency = window.store.data.settings.currency || '₺';
  const baseAmount = parseFloat(amountInput.value) || 0;

  if (checkbox.checked && baseAmount > 0) {
    const total = baseAmount + fee;
    preview.textContent = `Komisyon dahil toplam: ${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${currency}`;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

// Modal İşlemleri
function openTransactionModal(editId = null, forcedType = null) {
  editingTransactionId = editId;
  const modal = document.getElementById('transactionModal');
  const title = document.getElementById('txModalTitle');
  const amountInput = document.getElementById('txAmount');
  const noteInput = document.getElementById('txNote');
  const dateInput = document.getElementById('txDate');
  const paymentSelect = document.getElementById('txPaymentMethod');
  const ibanCheckbox = document.getElementById('txIbanFeeCheckbox');

  if (editId) {
    const tx = window.store.data.transactions.find(t => t.id === editId);
    if (!tx) return;
    title.textContent = 'İşlemi Düzenle';
    amountInput.value = tx.amount;
    noteInput.value = tx.note || '';
    dateInput.value = tx.date;
    paymentSelect.value = tx.paymentMethod || 'card';
    if (ibanCheckbox) ibanCheckbox.checked = Boolean(tx.hasTransferFee);
    
    const typeRadio = document.querySelector(`input[name="txType"][value="${tx.type}"]`);
    if (typeRadio) typeRadio.checked = true;
    populateCategorySelects(tx.type);
    document.getElementById('txCategory').value = tx.categoryId;
  } else {
    const targetType = forcedType || 'expense';
    title.textContent = targetType === 'income' ? 'Gelir Ekle' : 'Gider Ekle';
    amountInput.value = '';
    noteInput.value = '';
    dateInput.value = new Date().toISOString().split('T')[0];
    paymentSelect.value = 'card';
    if (ibanCheckbox) ibanCheckbox.checked = false;
    
    const typeRadio = document.querySelector(`input[name="txType"][value="${targetType}"]`);
    if (typeRadio) typeRadio.checked = true;
    populateCategorySelects(targetType);
  }

  updateIbanFeeUI();
  modal.classList.remove('hidden');
  setTimeout(() => amountInput.focus(), 100);
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.add('hidden');
  editingTransactionId = null;
}

function saveTransaction() {
  const baseAmount = parseFloat(document.getElementById('txAmount').value);
  if (!baseAmount || baseAmount <= 0) {
    showToast('Lütfen geçerli bir tutar girin', 'warning');
    return;
  }

  const type = document.querySelector('input[name="txType"]:checked').value;
  const categoryId = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value || new Date().toISOString().split('T')[0];
  let note = document.getElementById('txNote').value.trim();
  const paymentMethod = document.getElementById('txPaymentMethod').value;
  const ibanCheckbox = document.getElementById('txIbanFeeCheckbox');
  const hasTransferFee = Boolean(type === 'expense' && paymentMethod === 'transfer' && ibanCheckbox && ibanCheckbox.checked);
  const feeAmount = hasTransferFee ? (window.store.data.settings.transferFee ?? 15.00) : 0;
  
  const finalAmount = baseAmount + feeAmount;
  if (hasTransferFee && !note.includes('Komisyon')) {
    note = note ? `${note} (+${feeAmount} ₺ Havale Komisyonu)` : `+${feeAmount} ₺ Havale Komisyonu Dahil`;
  }

  if (editingTransactionId) {
    window.store.updateTransaction(editingTransactionId, {
      amount: finalAmount, type, categoryId, date, note, paymentMethod, hasTransferFee, transferFeeAmount: feeAmount
    });
    showToast('İşlem güncellendi', 'success');
  } else {
    window.store.addTransaction({
      amount: finalAmount, type, categoryId, date, note, paymentMethod, hasTransferFee, transferFeeAmount: feeAmount
    });
    showToast(hasTransferFee ? `İşlem ve ${feeAmount} ₺ komisyon kaydedildi` : 'İşlem eklendi', 'success');
  }

  closeTransactionModal();
  renderApp();
}

function editTransaction(id) {
  openTransactionModal(id);
}

function confirmDeleteTransaction(id) {
  if (confirm('İşlemi silmek istediğinize emin misiniz?')) {
    window.store.deleteTransaction(id);
    showToast('İşlem silindi', 'info');
    renderApp();
  }
}

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
  if (!name) return;

  const type = document.getElementById('catType').value;
  const color = document.getElementById('catColor').value;
  const icon = document.getElementById('catIcon').value || 'tag';
  const monthlyBudget = document.getElementById('catBudget').value;

  window.store.addCategory({ name, type, color, icon, monthlyBudget });
  showToast('Kategori kaydedildi', 'success');
  closeCategoryModal();
  populateCategorySelects();
  renderApp();
}

function deleteCategory(id) {
  if (confirm('Kategoriyi silmek istediğinize emin misiniz?')) {
    window.store.deleteCategory(id);
    showToast('Kategori silindi', 'info');
    populateCategorySelects();
    renderApp();
  }
}

function openGoalModal(editId = null) {
  editingGoalId = editId;
  const modal = document.getElementById('goalModal');
  const title = document.getElementById('goalModalTitle');
  const nameInput = document.getElementById('goalName');
  const targetInput = document.getElementById('goalTargetAmount');
  const currentInput = document.getElementById('goalCurrentAmount');
  const dateInput = document.getElementById('goalDate');
  const shareInput = document.getElementById('goalSharePercent');
  const colorInput = document.getElementById('goalColor');

  if (editId) {
    const goal = window.store.data.savingsGoals.find(g => g.id === editId);
    if (!goal) return;
    if (title) title.textContent = 'Hedefi Düzenle';
    if (nameInput) nameInput.value = goal.name || '';
    if (targetInput) targetInput.value = goal.targetAmount || '';
    if (currentInput) currentInput.value = goal.currentAmount ?? 0;
    if (dateInput) dateInput.value = goal.targetDate || '';
    if (shareInput) shareInput.value = goal.sharePercent || '';
    if (colorInput) colorInput.value = goal.color || '#10b981';
  } else {
    if (title) title.textContent = 'Yeni Hedef';
    if (nameInput) nameInput.value = '';
    if (targetInput) targetInput.value = '';
    if (currentInput) currentInput.value = '0';
    if (dateInput) dateInput.value = '';
    if (shareInput) shareInput.value = '';
    if (colorInput) colorInput.value = '#10b981';
  }

  modal.classList.remove('hidden');
}

function closeGoalModal() {
  document.getElementById('goalModal').classList.add('hidden');
  editingGoalId = null;
}

function saveGoal() {
  const name = document.getElementById('goalName')?.value.trim();
  const targetAmount = parseFloat(document.getElementById('goalTargetAmount')?.value);
  const currentAmount = parseFloat(document.getElementById('goalCurrentAmount')?.value) || 0;
  const targetDate = document.getElementById('goalDate')?.value || '';
  const sharePercent = parseFloat(document.getElementById('goalSharePercent')?.value) || 0;
  const color = document.getElementById('goalColor')?.value || '#10b981';
  const icon = 'piggy-bank';

  if (!name || !targetAmount || targetAmount <= 0) {
    showToast('Geçerli bir hedef adı ve tutar girin', 'warning');
    return;
  }

  if (editingGoalId) {
    window.store.updateSavingsGoal(editingGoalId, {
      name, targetAmount, currentAmount, targetDate, sharePercent, color, icon
    });
    showToast('Hedef güncellendi', 'success');
  } else {
    window.store.addSavingsGoal({
      name, targetAmount, currentAmount, targetDate, sharePercent, color, icon
    });
    showToast('Yeni hedef oluşturuldu', 'success');
  }

  closeGoalModal();
  renderApp();
}

function editGoal(id) {
  openGoalModal(id);
}

function deleteGoal(id) {
  if (confirm('Hedefi silmek istediğinize emin misiniz?')) {
    window.store.deleteSavingsGoal(id);
    showToast('Hedef silindi', 'info');
    renderApp();
  }
}

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
  if (!amount || amount <= 0) return;

  window.store.depositToSavingsGoal(selectedGoalForDeposit, amount);
  showToast(`${formatMoney(amount)} birikime eklendi`, 'success');
  closeDepositModal();
  renderApp();
}

function exportDataJSON() {
  window.store.exportJSON();
  showToast('JSON indirildi', 'success');
}

function exportDataCSV() {
  window.store.exportCSV();
  showToast('CSV dökümü indirildi', 'success');
}

function triggerImportJSON() {
  document.getElementById('jsonFileInput').click();
}

function resetAllData() {
  if (confirm('Tüm veriler silinsin mi?')) {
    window.store.resetData();
    showToast('Veriler sıfırlandı', 'info');
    renderApp();
  }
}

function loadSampleData() {
  if (confirm('Örnek veriler yüklensin mi?')) {
    window.store.loadDemoData();
    showToast('Örnek veriler yüklendi', 'success');
    renderApp();
  }
}

// --- TASARRUF DAĞITIM SİSTEMİ ---
let currentDistributableSavings = 0;

function openDistributeSavingsModal() {
  const periodTxs = getPeriodTransactions();
  let totalIncome = 0;
  let totalExpense = 0;

  periodTxs.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const netSavings = totalIncome - totalExpense;
  if (netSavings <= 0) {
    showToast('Bu ay için dağıtılabilecek pozitif bir tasarruf miktarı bulunmuyor.', 'warning');
    return;
  }

  const goals = window.store.data.savingsGoals;
  if (!goals || goals.length === 0) {
    showToast('Önce birikim hedefi oluşturmalısınız.', 'info');
    switchTab('savings');
    return;
  }

  currentDistributableSavings = netSavings;
  const modal = document.getElementById('distributeSavingsModal');
  const totalLabel = document.getElementById('distributeTotalSavingsLabel');
  if (totalLabel) totalLabel.textContent = formatMoney(netSavings);

  renderDistributeGoalsList();
  distributeSavingsEqually();
  modal.classList.remove('hidden');
}

function closeDistributeSavingsModal() {
  const modal = document.getElementById('distributeSavingsModal');
  if (modal) modal.classList.add('hidden');
}

function renderDistributeGoalsList() {
  const container = document.getElementById('distributeGoalsList');
  if (!container) return;

  const goals = window.store.data.savingsGoals;
  container.innerHTML = goals.map(g => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    return `
      <div class="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <div class="min-w-0 pr-2">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">${g.name}</span>
            <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">%${g.sharePercent || 0} Pay</span>
          </div>
          <div class="text-[10px] text-zinc-400">Hedefe Kalan: ${formatMoney(remaining)}</div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <input type="number" step="1" data-goal-id="${g.id}" class="distribute-goal-input w-24 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-right text-zinc-900 dark:text-zinc-100 focus:outline-none" value="0">
          <span class="text-xs text-zinc-500 font-semibold">${window.store.data.settings.currency || '₺'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function distributeSavingsEqually() {
  const inputs = document.querySelectorAll('.distribute-goal-input');
  if (!inputs.length || currentDistributableSavings <= 0) return;

  const perGoal = Math.floor(currentDistributableSavings / inputs.length);
  inputs.forEach(input => {
    input.value = perGoal;
  });
}

function distributeSavingsProportionally() {
  const inputs = document.querySelectorAll('.distribute-goal-input');
  const goals = window.store.data.savingsGoals;
  if (!inputs.length || currentDistributableSavings <= 0) return;

  // 1. Kullanıcının Birikim sayfasında belirlediği Tasarruf Payı (%) oranlarını kontrol et
  let totalUserPercent = 0;
  goals.forEach(g => {
    totalUserPercent += (parseFloat(g.sharePercent) || 0);
  });

  if (totalUserPercent > 0) {
    // Kullanıcının kendi belirlediği yüzdelere göre paylaştır
    inputs.forEach(input => {
      const goalId = input.dataset.goalId;
      const goal = goals.find(g => g.id === goalId);
      const userPct = (goal && parseFloat(goal.sharePercent)) || 0;
      const share = Math.floor((userPct / totalUserPercent) * currentDistributableSavings);
      input.value = share;
    });
    showToast('Tasarruf, belirlediğiniz pay yüzdelerine göre orantılandı 📊', 'info');
  } else {
    // Eğer yüzde tanımlanmamışsa kalan hedef tutarlarına göre orantıla
    let totalRemaining = 0;
    goals.forEach(g => {
      totalRemaining += Math.max(0, g.targetAmount - g.currentAmount);
    });

    if (totalRemaining <= 0) {
      distributeSavingsEqually();
      return;
    }

    inputs.forEach(input => {
      const goalId = input.dataset.goalId;
      const goal = goals.find(g => g.id === goalId);
      const rem = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0;
      const share = Math.floor((rem / totalRemaining) * currentDistributableSavings);
      input.value = share;
    });
  }
}

function confirmDistributeSavings() {
  const inputs = document.querySelectorAll('.distribute-goal-input');
  let allocatedTotal = 0;
  let count = 0;

  inputs.forEach(input => {
    const goalId = input.dataset.goalId;
    const amount = parseFloat(input.value) || 0;
    if (amount > 0) {
      window.store.depositToSavingsGoal(goalId, amount);
      allocatedTotal += amount;
      count++;
    }
  });

  if (allocatedTotal > 0) {
    showToast(`${formatMoney(allocatedTotal)} birikim hedeflerinize başarıyla aktarıldı! 🎯`, 'success');
    closeDistributeSavingsModal();
    renderApp();
  } else {
    showToast('Lütfen hedeflere eklenecek bir tutar girin.', 'warning');
  }
}
