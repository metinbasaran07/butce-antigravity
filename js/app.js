/**
 * Bütçem - Sade & Minimalist UI Mantığı
 */

let activeTab = 'dashboard';
let editingTransactionId = null;
let editingGoalId = null;
let editingCategoryId = null;
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
  
  // Popup modunda doğrudan popup.html'e yönlendir
  if (params.get('mode') === 'popup' || params.has('popup')) {
    window.location.replace('popup.html' + window.location.search);
    return;
  }

  // 1. Sayfa ilk açıldığında paylaşılan önbellekten kontrol et ve birleştir
  window.store.syncFromSharedCache(({ newTxCount }) => {
    renderApp();
    if (newTxCount > 0) {
      showToast(`${newTxCount} kestirme harcaması senkronize edildi! ⚡`, 'success');
    }
  });

  // 2. Kullanıcı popup'tan veya başka bir sekmeden PWA'ya döndüğünde anında eşitle
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.store.syncFromSharedCache(({ newTxCount }) => {
        renderApp();
        if (newTxCount > 0) {
          showToast(`${newTxCount} kestirme harcaması senkronize edildi! ⚡`, 'success');
        }
      });
    }
  });

  window.addEventListener('focus', () => {
    window.store.syncFromSharedCache(({ newTxCount }) => {
      renderApp();
      if (newTxCount > 0) {
        showToast(`${newTxCount} kestirme harcaması senkronize edildi! ⚡`, 'success');
      }
    });
  });

  window.addEventListener('pageshow', () => {
    window.store.syncFromSharedCache(({ newTxCount }) => {
      renderApp();
      if (newTxCount > 0) {
        showToast(`${newTxCount} kestirme harcaması senkronize edildi! ⚡`, 'success');
      }
    });
  });

  // 3. Düzenli arka plan eşitleme (her 3 saniyede bir sessiz kontrol)
  setInterval(() => {
    window.store.syncFromSharedCache(({ newTxCount }) => {
      renderApp();
      if (newTxCount > 0) {
        showToast(`${newTxCount} kestirme harcaması senkronize edildi! ⚡`, 'success');
      }
    });
  }, 3000);

  // 4. Firebase Firestore Canlı Bulut Dinleyicisi
  function setupFirebaseSync() {
    if (!window.firebaseSync) return;
    if (typeof updateCloudSyncUI === 'function') updateCloudSyncUI();

    try {
      window.firebaseSync.listenToVault((cloudData) => {
        const changed = window.store.mergeCloudData(cloudData, ({ newTxCount }) => {
          renderApp();
          if (newTxCount > 0) {
            showToast(`${newTxCount} yeni kestirme harcaması buluttan senkronize edildi! ⚡`, 'success');
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
          }
        });
        if (changed) {
          renderApp();
          if (typeof updateCloudSyncUI === 'function') updateCloudSyncUI();
        }
      });

      // İlk yerel veriyi buluta eşitle
      window.store.syncToCloud();

      // Auth durumunu dinle
      if (window.firebaseSync.auth) {
        window.firebaseSync.auth.onAuthStateChanged((user) => {
          if (typeof updateGoogleAuthUI === 'function') updateGoogleAuthUI(user);
        });
      }
    } catch (err) {
      console.warn('Firebase kurulum dinleme uyarısı:', err);
    }
  }

  if (window.firebaseSync) {
    setupFirebaseSync();
  } else {
    window.addEventListener('firebaseSyncReady', () => {
      setupFirebaseSync();
    });
  }

  // 5. Storage ve BroadcastChannel anlık bildirim dinleyicisi
  window.addEventListener('storage', (e) => {
    if (e.key === 'butcem_app_data_v1') {
      window.store.data = window.store.load();
      renderApp();
    }
  });

  try {
    const syncChannel = new BroadcastChannel('butcem_sync');
    syncChannel.onmessage = () => {
      window.store.syncFromSharedCache(({ newTxCount }) => {
        renderApp();
        if (newTxCount > 0) {
          showToast(`${newTxCount} kestirme harcaması senkronize edildi! ⚡`, 'success');
        }
      });
    };
  } catch (err) {}

  const action = params.get('action');
  const type = params.get('type');
  const amount = params.get('amount');
  const note = params.get('note');
  const category = params.get('category') || params.get('categoryId');
  const hash = window.location.hash;

  // iPhone Eylem Düğmesi (Action Button) veya Kestirme tetikleyicisi
  const isExpenseAction = action === 'expense' || type === 'expense' || params.has('expense') || params.has('gider') || hash === '#expense' || hash === '#gider';

  if (isExpenseAction) {
    openTransactionModal(null, 'expense');
    if (amount) { const el = document.getElementById('txAmount'); if (el) el.value = amount; }
    if (note) { const el = document.getElementById('txNote'); if (el) el.value = note; }
    if (category) { const el = document.getElementById('txCategory'); if (el) el.value = category; }
  } else if (action === 'income' || type === 'income' || params.has('income') || params.has('gelir') || hash === '#income' || hash === '#gelir') {
    openTransactionModal(null, 'income');
    if (amount) { const el = document.getElementById('txAmount'); if (el) el.value = amount; }
    if (note) { const el = document.getElementById('txNote'); if (el) el.value = note; }
    if (category) { const el = document.getElementById('txCategory'); if (el) el.value = category; }
  } else if (action === 'new-transaction' || action === 'add') {
    openTransactionModal();
    if (amount) { const el = document.getElementById('txAmount'); if (el) el.value = amount; }
    if (note) { const el = document.getElementById('txNote'); if (el) el.value = note; }
  } else if (params.get('tab')) {
    switchTab(params.get('tab'));
  }

  // URL parametrelerini temizle ki sayfa yenilendiğinde tekrar açılmasın
  if (action || type || isExpenseAction || hash || params.get('tab')) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});

// Sayfa arka planda açıkken kestirme ile hash değişirse doğrudan gider modalını aç
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#expense' || window.location.hash === '#gider') {
    openTransactionModal(null, 'expense');
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

  const currentMonthKey = window.store.data.settings.selectedMonth === 'all' 
    ? window.store.getCurrentMonthString() 
    : window.store.data.settings.selectedMonth;
  const distributed = window.store.getDistributedSavings(currentMonthKey);
  const remainingSavings = Math.max(0, netBalance - distributed);

  const totalIncomeEl = document.getElementById('totalIncomeEl');
  const totalExpenseEl = document.getElementById('totalExpenseEl');
  const netEl = document.getElementById('netBalanceEl');
  const eyeIcon = document.getElementById('balanceEyeIcon');
  const monthlySavingsEl = document.getElementById('monthlySavingsAmountEl');
  const monthlySavingsDistributedEl = document.getElementById('monthlySavingsDistributedEl');
  const savingsRateEl = document.getElementById('monthlySavingsRateEl');
  const openDistributeBtn = document.getElementById('btnOpenDistributeModal');

  if (eyeIcon) {
    eyeIcon.setAttribute('data-lucide', isBalanceHidden ? 'eye-off' : 'eye');
  }

  if (isBalanceHidden) {
    if (totalIncomeEl) {
      totalIncomeEl.textContent = '•••••••• ₺';
      totalIncomeEl.classList.add('tracking-widest');
    }
    if (totalExpenseEl) {
      totalExpenseEl.textContent = '•••••••• ₺';
      totalExpenseEl.classList.add('tracking-widest');
    }
    if (netEl) {
      netEl.textContent = '•••••••• ₺';
      netEl.classList.add('tracking-widest');
    }
    if (monthlySavingsEl) {
      monthlySavingsEl.textContent = '•••••••• ₺';
      monthlySavingsEl.classList.add('tracking-widest');
    }
    if (monthlySavingsDistributedEl) {
      monthlySavingsDistributedEl.classList.add('hidden');
    }
    if (savingsRateEl) savingsRateEl.textContent = '';
  } else {
    if (totalIncomeEl) {
      totalIncomeEl.textContent = formatMoney(totalIncome);
      totalIncomeEl.classList.remove('tracking-widest');
    }
    if (totalExpenseEl) {
      totalExpenseEl.textContent = formatMoney(totalExpense);
      totalExpenseEl.classList.remove('tracking-widest');
    }
    if (netEl) {
      netEl.textContent = formatMoney(netBalance);
      netEl.classList.remove('tracking-widest');
    }

    if (monthlySavingsEl) {
      monthlySavingsEl.classList.remove('tracking-widest');
      if (netBalance >= 0) {
        monthlySavingsEl.textContent = formatMoney(netBalance);
        monthlySavingsEl.className = 'text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums truncate';
        
        if (monthlySavingsDistributedEl) {
          if (remainingSavings > 0) {
            monthlySavingsDistributedEl.textContent = `● ${formatMoney(remainingSavings)} boşta`;
            monthlySavingsDistributedEl.className = 'text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate mt-0.5';
          } else if (distributed > 0) {
            monthlySavingsDistributedEl.textContent = '✓ Tümü dağıtıldı';
            monthlySavingsDistributedEl.className = 'text-[9px] sm:text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate mt-0.5';
          } else {
            monthlySavingsDistributedEl.textContent = '0,00 ₺ boşta';
            monthlySavingsDistributedEl.className = 'text-[9px] sm:text-[10px] font-medium text-zinc-400 truncate mt-0.5';
          }
        }
        if (savingsRateEl) savingsRateEl.textContent = `(%${Math.max(0, savingsRate).toFixed(0)})`;
      } else {
        monthlySavingsEl.textContent = `-${formatMoney(Math.abs(netBalance))}`;
        monthlySavingsEl.className = 'text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums truncate';
        if (monthlySavingsDistributedEl) {
          monthlySavingsDistributedEl.textContent = '';
          monthlySavingsDistributedEl.className = 'hidden';
        }
        if (savingsRateEl) savingsRateEl.textContent = '(Açık)';
      }
    }
  }

  const distributeAvailableBadge = document.getElementById('distributeAvailableBadge');
  const distributeButtonSubtext = document.getElementById('distributeButtonSubtext');
  const distributeButtonActionText = document.getElementById('distributeButtonActionText');

  if (distributeAvailableBadge) {
    distributeAvailableBadge.textContent = '';
    distributeAvailableBadge.className = 'hidden';
  }

  if (distributeButtonSubtext) {
    if (remainingSavings > 0) {
      distributeButtonSubtext.textContent = `${formatMoney(remainingSavings)} serbest tasarruf hedeflere dağıtılabilir`;
    } else if (distributed > 0) {
      distributeButtonSubtext.textContent = `${formatMoney(distributed)} bu ayki hedeflere aktarıldı`;
    } else {
      distributeButtonSubtext.textContent = 'Bu dönemde dağıtılacak serbest tasarruf bulunmuyor';
    }
  }

  if (distributeButtonActionText) {
    distributeButtonActionText.textContent = (remainingSavings <= 0 && distributed > 0) ? 'İncele' : 'Dağıt';
  }

  if (eyeIcon) {
    eyeIcon.setAttribute('data-lucide', isBalanceHidden ? 'eye-off' : 'eye');
    eyeIcon.className = `w-4 h-4 ${isBalanceHidden ? 'text-indigo-500' : 'text-zinc-400'}`;
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
          <div class="text-[11px] text-zinc-400 truncate mt-0.5">${t.note || (t.paymentMethod === 'cash' ? 'Nakit' : 'Kart')}</div>
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

  const totalAssignedShare = goals.reduce((s, g) => s + (parseFloat(g.sharePercent) || 0), 0);
  const remainingShare = Math.max(0, 100 - totalAssignedShare);

  const totalBadge = document.getElementById('savingsTotalShareBadge');
  const remText = document.getElementById('savingsShareRemainingText');
  const bar = document.getElementById('savingsTotalShareBar');

  if (totalBadge) {
    totalBadge.textContent = `%${totalAssignedShare} / %100`;
    totalBadge.className = `font-bold tabular-nums ${totalAssignedShare === 100 ? 'text-emerald-600 dark:text-emerald-400' : totalAssignedShare > 100 ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`;
  }
  if (remText) {
    if (totalAssignedShare === 100) {
      remText.textContent = 'Tüm paylar hedeflere paylaştırıldı (%100) ✓';
      remText.className = 'text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate';
    } else if (totalAssignedShare > 100) {
      remText.textContent = `Toplam pay %100'ü aşıyor! (%${totalAssignedShare})`;
      remText.className = 'text-[10px] text-rose-600 font-bold truncate';
    } else {
      remText.textContent = `Kalan boş pay: %${remainingShare}`;
      remText.className = 'text-[10px] text-zinc-400 truncate';
    }
  }
  if (bar) {
    bar.style.width = `${Math.min(100, totalAssignedShare)}%`;
    bar.className = `h-full rounded-full transition-all duration-300 ${totalAssignedShare === 100 ? 'bg-emerald-500' : totalAssignedShare > 100 ? 'bg-rose-500' : 'bg-indigo-600'}`;
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
      showToast(`İBAN komisyonu ${val.toFixed(2)} ₺ olarak kaydedildi`, 'success');
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
  const paymentMethod = document.getElementById('txPaymentMethod')?.value;
  const isCardOrBank = paymentMethod === 'card';
  const wrapper = document.getElementById('ibanFeeWrapper');
  const feeAmountLabel = document.getElementById('ibanFeeAmountLabel');
  
  const fee = window.store.data.settings.transferFee ?? 15.00;
  const currency = window.store.data.settings.currency || '₺';

  if (wrapper) {
    if (isExpense && isCardOrBank) {
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
  const hasTransferFee = Boolean(type === 'expense' && paymentMethod === 'card' && ibanCheckbox && ibanCheckbox.checked);
  const feeAmount = hasTransferFee ? (window.store.data.settings.transferFee ?? 15.00) : 0;
  
  const finalAmount = baseAmount + feeAmount;
  if (hasTransferFee && !note.includes('Komisyon')) {
    note = note ? `${note} (+${feeAmount} ₺ İBAN Komisyonu)` : `+${feeAmount} ₺ İBAN Komisyonu Dahil`;
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

function openCategoryModal(catId = null) {
  editingCategoryId = catId;
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('catModalTitle');
  const nameInput = document.getElementById('catName');
  const typeSelect = document.getElementById('catType');
  const colorInput = document.getElementById('catColor');
  const iconSelect = document.getElementById('catIcon');
  const budgetInput = document.getElementById('catBudget');

  if (catId) {
    const cat = window.store.getCategory(catId);
    if (title) title.textContent = 'Kategoriyi Düzenle';
    if (nameInput) nameInput.value = cat.name || '';
    if (typeSelect) typeSelect.value = cat.type || 'expense';
    if (colorInput) colorInput.value = cat.color || '#6366f1';
    if (iconSelect) iconSelect.value = cat.icon || 'tag';
    if (budgetInput) budgetInput.value = cat.monthlyBudget || '';
  } else {
    if (title) title.textContent = 'Yeni Kategori';
    if (nameInput) nameInput.value = '';
    if (typeSelect) typeSelect.value = 'expense';
    if (colorInput) colorInput.value = '#6366f1';
    if (iconSelect) iconSelect.value = 'tag';
    if (budgetInput) budgetInput.value = '';
  }

  modal.classList.remove('hidden');
  setTimeout(() => nameInput && nameInput.focus(), 100);
}

function editCategory(id) {
  openCategoryModal(id);
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
  editingCategoryId = null;
}

function saveCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) {
    showToast('Lütfen bir kategori adı girin', 'warning');
    return;
  }

  const type = document.getElementById('catType').value;
  const color = document.getElementById('catColor').value;
  const icon = document.getElementById('catIcon').value || 'tag';
  const monthlyBudget = document.getElementById('catBudget').value;

  if (editingCategoryId) {
    window.store.updateCategory(editingCategoryId, { name, type, color, icon, monthlyBudget });
    showToast('Kategori güncellendi', 'success');
  } else {
    window.store.addCategory({ name, type, color, icon, monthlyBudget });
    showToast('Kategori kaydedildi', 'success');
  }

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

  const maxLabel = document.getElementById('goalShareMaxLabel');
  const hintEl = document.getElementById('goalSharePercentHint');

  const otherGoalsSum = window.store.data.savingsGoals
    .filter(g => g.id !== editId)
    .reduce((sum, g) => sum + (parseFloat(g.sharePercent) || 0), 0);
  const maxAllowed = Math.max(0, 100 - otherGoalsSum);

  if (maxLabel) maxLabel.textContent = `Max: %${maxAllowed}`;
  if (hintEl) hintEl.textContent = `Diğer hedeflerin toplamı: %${otherGoalsSum} (Kalan boş pay: %${maxAllowed})`;
  if (shareInput) shareInput.max = maxAllowed;

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
    if (shareInput) shareInput.value = maxAllowed > 0 ? Math.min(25, maxAllowed) : 0;
    if (colorInput) colorInput.value = '#10b981';
  }

  modal.classList.remove('hidden');
}

function validateGoalSharePercent(input) {
  const otherGoalsSum = window.store.data.savingsGoals
    .filter(g => g.id !== editingGoalId)
    .reduce((sum, g) => sum + (parseFloat(g.sharePercent) || 0), 0);
  const maxAllowed = Math.max(0, 100 - otherGoalsSum);
  let val = parseFloat(input.value) || 0;
  if (val < 0) {
    val = 0;
    input.value = 0;
  }
  if (val > maxAllowed) {
    input.value = maxAllowed;
    showToast(`Toplam birikim payı %100'ü aşamaz. Bu hedefe en fazla %${maxAllowed} atayabilirsiniz.`, 'warning');
  }
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
  let sharePercent = parseFloat(document.getElementById('goalSharePercent')?.value) || 0;
  const color = document.getElementById('goalColor')?.value || '#10b981';
  const icon = 'piggy-bank';

  if (!name || !targetAmount || targetAmount <= 0) {
    showToast('Geçerli bir hedef adı ve tutar girin', 'warning');
    return;
  }

  const otherGoalsSum = window.store.data.savingsGoals
    .filter(g => g.id !== editingGoalId)
    .reduce((sum, g) => sum + (parseFloat(g.sharePercent) || 0), 0);
  const maxAllowed = Math.max(0, 100 - otherGoalsSum);

  if (sharePercent > maxAllowed) {
    sharePercent = maxAllowed;
    showToast(`Toplam pay %100'ü aşamaz! Maksimum %${maxAllowed} atanabilir.`, 'warning');
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

// --- TASARRUF DAĞITIM SİSTEMİ (SÜRGÜLÜ & %100 LİMİTLİ) ---
let currentDistributableSavings = 0;
let currentPeriodNetSavings = 0;
let currentPeriodDistributed = 0;
let currentPeriodKey = '';

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
    showToast('Bu dönem için dağıtılabilecek pozitif bir tasarruf miktarı bulunmuyor.', 'warning');
    return;
  }

  const goals = window.store.data.savingsGoals;
  if (!goals || goals.length === 0) {
    showToast('Önce birikim hedefi oluşturmalısınız.', 'info');
    switchTab('savings');
    return;
  }

  currentPeriodKey = window.store.data.settings.selectedMonth === 'all'
    ? window.store.getCurrentMonthString()
    : window.store.data.settings.selectedMonth;

  currentPeriodNetSavings = netSavings;
  currentPeriodDistributed = window.store.getDistributedSavings(currentPeriodKey);
  currentDistributableSavings = Math.max(0, netSavings - currentPeriodDistributed);

  const modal = document.getElementById('distributeSavingsModal');
  const netTotalEl = document.getElementById('distributeNetSavingsTotal');
  const alreadyEl = document.getElementById('distributeAlreadyDistributed');
  const totalLabel = document.getElementById('distributeTotalSavingsLabel');
  const resetPastBtn = document.getElementById('btnResetPastDistribution');
  const confirmBtn = document.getElementById('btnConfirmDistribute');

  if (netTotalEl) netTotalEl.textContent = formatMoney(netSavings);
  if (alreadyEl) alreadyEl.textContent = formatMoney(currentPeriodDistributed);
  if (totalLabel) totalLabel.textContent = formatMoney(currentDistributableSavings);

  if (resetPastBtn) {
    if (currentPeriodDistributed > 0) {
      resetPastBtn.classList.remove('hidden');
    } else {
      resetPastBtn.classList.add('hidden');
    }
  }

  if (confirmBtn) {
    confirmBtn.disabled = currentDistributableSavings <= 0;
    if (currentDistributableSavings <= 0) {
      confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  renderDistributeGoalsList();

  if (currentDistributableSavings > 0) {
    const hasDefinedShares = goals.some(g => (g.sharePercent || 0) > 0);
    if (hasDefinedShares) {
      const sliders = document.querySelectorAll('.distribute-goal-slider');
      sliders.forEach(s => {
        const goal = goals.find(g => g.id === s.dataset.goalId);
        s.value = goal ? (goal.sharePercent || 0) : 0;
      });
      updateDistributeMeters();
    } else {
      distributeSavingsEqually();
    }
  } else {
    resetDistributeSliders();
    showToast('Bu dönemin tüm net tasarrufu zaten dağıtılmış.', 'info');
  }

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
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
      <div class="p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0 pr-1">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${g.color || '#10b981'};"></span>
              <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">${g.name}</span>
            </div>
            <div class="text-[10px] text-zinc-400 mt-0.5">Hedefe Kalan: <strong class="text-zinc-700 dark:text-zinc-300 font-semibold">${formatMoney(remaining)}</strong></div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Elle Tutar Girişi (₺) (Max dağıtılabilir tutar ile sınırlandırılmış) -->
            <div class="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1 shadow-sm">
              <input type="number" step="0.5" min="0" placeholder="0" 
                data-goal-id="${g.id}" 
                class="distribute-goal-amount-input w-16 sm:w-20 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-transparent text-right focus:outline-none"
                oninput="handleGoalAmountInput('${g.id}', this.value)"
                onblur="handleGoalAmountBlur('${g.id}', this)">
              <span class="text-[10px] font-bold text-zinc-400 ml-1">₺</span>
            </div>
            <!-- Elle Yüzde Girişi (%) (Max %100 ile sınırlandırılmış) -->
            <div class="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1 shadow-sm">
              <input type="number" step="1" min="0" max="100" placeholder="0" 
                data-goal-id="${g.id}" 
                class="distribute-goal-percent-input w-9 sm:w-11 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-transparent text-right focus:outline-none"
                oninput="handleGoalPercentInput('${g.id}', this.value)"
                onblur="handleGoalPercentBlur('${g.id}', this)">
              <span class="text-[10px] font-bold text-zinc-400 ml-0.5">%</span>
            </div>
          </div>
        </div>

        <!-- Sürgü ve - / + Butonları -->
        <div class="flex items-center gap-2 pt-0.5">
          <button type="button" onclick="adjustGoalSlider('${g.id}', -5)" class="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 transition select-none active:scale-95">-</button>
          
          <input type="range" min="0" max="100" step="1" value="0" 
            data-goal-id="${g.id}" 
            class="distribute-goal-slider flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            oninput="handleGoalSliderInput('${g.id}', this.value)">
          
          <button type="button" onclick="adjustGoalSlider('${g.id}', 5)" class="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 transition select-none active:scale-95">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function handleGoalSliderInput(goalId, targetVal) {
  let val = Math.max(0, Math.min(100, parseInt(targetVal) || 0));
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  
  // Diğer tüm hedeflerin yüzde toplamını hesapla
  let otherSum = 0;
  sliders.forEach(s => {
    if (s.dataset.goalId !== goalId) {
      otherSum += (parseInt(s.value) || 0);
    }
  });

  // Toplam 100'ü ASLA geçemez
  const maxAllowed = Math.max(0, 100 - otherSum);
  if (val > maxAllowed) {
    val = maxAllowed;
  }

  const activeSlider = document.querySelector(`.distribute-goal-slider[data-goal-id="${goalId}"]`);
  if (activeSlider) {
    activeSlider.value = val;
  }

  updateDistributeMeters(goalId, 'slider');
}

function handleGoalPercentInput(goalId, targetVal) {
  let val = parseInt(targetVal);
  if (isNaN(val) || val < 0) val = 0;

  const sliders = document.querySelectorAll('.distribute-goal-slider');
  let otherSum = 0;
  sliders.forEach(s => {
    if (s.dataset.goalId !== goalId) {
      otherSum += (parseInt(s.value) || 0);
    }
  });

  const maxAllowed = Math.max(0, 100 - otherSum);
  if (val > maxAllowed) {
    val = maxAllowed;
    const pInput = document.querySelector(`.distribute-goal-percent-input[data-goal-id="${goalId}"]`);
    if (pInput) pInput.value = val;
    showToast(`Maksimum dağıtım payı (%${maxAllowed}) aşılamaz!`, 'warning');
  }

  handleGoalSliderInput(goalId, val);
}

function handleGoalPercentBlur(goalId, inputEl) {
  let val = parseInt(inputEl.value) || 0;
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  let otherSum = 0;
  sliders.forEach(s => {
    if (s.dataset.goalId !== goalId) {
      otherSum += (parseInt(s.value) || 0);
    }
  });

  const maxAllowed = Math.max(0, 100 - otherSum);
  val = Math.max(0, Math.min(maxAllowed, val));
  inputEl.value = val;
  handleGoalSliderInput(goalId, val);
}

function handleGoalAmountInput(goalId, targetAmount) {
  if (currentDistributableSavings <= 0) return;
  
  const aInput = document.querySelector(`.distribute-goal-amount-input[data-goal-id="${goalId}"]`);
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  let otherSumPercent = 0;
  sliders.forEach(s => {
    if (s.dataset.goalId !== goalId) {
      otherSumPercent += (parseInt(s.value) || 0);
    }
  });

  const maxAllowedPercent = Math.max(0, 100 - otherSumPercent);
  const maxAllowedAmount = Math.round(currentDistributableSavings * (maxAllowedPercent / 100) * 100) / 100;

  let amt = parseFloat(targetAmount);
  if (isNaN(amt) || amt < 0) amt = 0;

  // Max dağıtılabilecek miktardan fazla yazılmasını engelle ve anında sınırla!
  if (amt > maxAllowedAmount) {
    amt = maxAllowedAmount;
    if (aInput) aInput.value = maxAllowedAmount > 0 ? maxAllowedAmount : '';
    showToast(`Maksimum dağıtılabilir tutar (${formatMoney(maxAllowedAmount)}) aşılamaz!`, 'warning');
  }

  // Tutar üzerinden yüzde hesapla
  let computedPercent = currentDistributableSavings > 0 ? Math.round((amt / currentDistributableSavings) * 100) : 0;
  if (computedPercent > maxAllowedPercent) computedPercent = maxAllowedPercent;

  const activeSlider = document.querySelector(`.distribute-goal-slider[data-goal-id="${goalId}"]`);
  if (activeSlider) {
    activeSlider.value = computedPercent;
  }

  updateDistributeMeters(goalId, 'amount');
}

function handleGoalAmountBlur(goalId, inputEl) {
  if (currentDistributableSavings <= 0) {
    inputEl.value = '';
    return;
  }
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  let otherSumPercent = 0;
  sliders.forEach(s => {
    if (s.dataset.goalId !== goalId) {
      otherSumPercent += (parseInt(s.value) || 0);
    }
  });

  const maxAllowedPercent = Math.max(0, 100 - otherSumPercent);
  const maxAllowedAmount = Math.round(currentDistributableSavings * (maxAllowedPercent / 100) * 100) / 100;

  let amt = parseFloat(inputEl.value) || 0;
  if (amt > maxAllowedAmount) {
    amt = maxAllowedAmount;
    showToast(`Maksimum dağıtılabilir tutar (${formatMoney(maxAllowedAmount)}) aşılamaz!`, 'warning');
  }
  inputEl.value = amt > 0 ? amt : '';
  handleGoalAmountInput(goalId, amt);
}

function adjustGoalSlider(goalId, delta) {
  const slider = document.querySelector(`.distribute-goal-slider[data-goal-id="${goalId}"]`);
  if (!slider) return;
  const current = parseInt(slider.value) || 0;
  handleGoalSliderInput(goalId, current + delta);
}

function updateDistributeMeters(sourceGoalId = null, sourceType = null) {
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  let totalPercent = 0;
  
  sliders.forEach(s => {
    const p = parseInt(s.value) || 0;
    totalPercent += p;
    const goalId = s.dataset.goalId;
    const allocated = Math.round(currentDistributableSavings * (p / 100) * 100) / 100;

    const pInput = document.querySelector(`.distribute-goal-percent-input[data-goal-id="${goalId}"]`);
    const aInput = document.querySelector(`.distribute-goal-amount-input[data-goal-id="${goalId}"]`);

    if (pInput && (goalId !== sourceGoalId || sourceType !== 'slider')) {
      pInput.value = p;
    }
    if (aInput && (goalId !== sourceGoalId || sourceType !== 'amount')) {
      aInput.value = allocated > 0 ? allocated : '';
    }
  });

  // Toplam dağıtılan tutar ve kalan henüz dağıtılmamış tutar
  const totalAllocatedAmount = Math.min(currentDistributableSavings, Math.round(currentDistributableSavings * (totalPercent / 100) * 100) / 100);
  const remainingUndistributed = Math.max(0, currentDistributableSavings - totalAllocatedAmount);
  const remainingPercent = Math.max(0, 100 - totalPercent);

  const totalPercentEl = document.getElementById('distributeTotalPercentLabel');
  const remPercentEl = document.getElementById('distributeRemainingPercentLabel');
  const progressBar = document.getElementById('distributeProgressBar');
  const allocatedAmountEl = document.getElementById('distributeAllocatedAmountLabel');
  const remainingAmountEl = document.getElementById('distributeRemainingAmountLabel');

  if (totalPercentEl) {
    totalPercentEl.textContent = `%${totalPercent} / %100`;
    totalPercentEl.className = `font-bold tabular-nums ${totalPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`;
  }

  if (remPercentEl) {
    remPercentEl.textContent = remainingPercent === 0 ? 'Tamamı Dağıtıldı ✓' : `Kalan Pay: %${remainingPercent}`;
    remPercentEl.className = `text-[11px] font-medium ${remainingPercent === 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'}`;
  }

  if (progressBar) {
    progressBar.style.width = `${Math.min(100, totalPercent)}%`;
    progressBar.className = `h-full transition-all duration-150 ${totalPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`;
  }

  if (allocatedAmountEl) {
    allocatedAmountEl.textContent = formatMoney(totalAllocatedAmount);
  }

  if (remainingAmountEl) {
    remainingAmountEl.textContent = formatMoney(remainingUndistributed);
  }
}

function distributeSavingsEqually() {
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  if (!sliders.length || currentDistributableSavings <= 0) return;
  const count = sliders.length;
  const basePercent = Math.floor(100 / count);
  let remainder = 100 - (basePercent * count);

  sliders.forEach((s, idx) => {
    let p = basePercent;
    if (idx < remainder) p += 1;
    s.value = p;
  });

  updateDistributeMeters();
}

// "🎯 Hedefe Göre" Dağıtım: Kullanıcının her hedef için bizzat belirlediği sharePercent yüzdelerine göre dağıtır
function distributeSavingsByConfiguredShares() {
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  const goals = window.store.data.savingsGoals;
  if (!sliders.length || currentDistributableSavings <= 0) return;

  const totalUserShares = goals.reduce((sum, g) => sum + (parseFloat(g.sharePercent) || 0), 0);

  if (totalUserShares <= 0) {
    showToast('Hedeflerinizde tanımlı pay yüzdesi bulunamadı. Eşit dağıtılıyor...', 'info');
    distributeSavingsEqually();
    return;
  }

  // Kullanıcının ayarladığı yüzdelere göre ayarla
  sliders.forEach(s => {
    const goal = goals.find(g => g.id === s.dataset.goalId);
    const configuredPercent = goal ? Math.min(100, Math.max(0, Math.round(parseFloat(goal.sharePercent) || 0))) : 0;
    s.value = configuredPercent;
  });

  updateDistributeMeters();
  showToast('Tasarruf, hedeflerinizde ayarladığınız yüzdelere göre dağıtıldı 🎯', 'success');
}

function distributeSavingsProportionally() {
  distributeSavingsByConfiguredShares();
}

function resetDistributeSliders() {
  const sliders = document.querySelectorAll('.distribute-goal-slider');
  sliders.forEach(s => s.value = 0);
  updateDistributeMeters();
}

function confirmDistributeSavings() {
  if (currentDistributableSavings <= 0) {
    showToast('Bu dönemde dağıtılacak serbest tasarruf kalmadı.', 'warning');
    return;
  }

  const sliders = document.querySelectorAll('.distribute-goal-slider');
  let allocatedTotal = 0;
  let count = 0;

  sliders.forEach(s => {
    const goalId = s.dataset.goalId;
    const p = parseInt(s.value) || 0;
    if (p > 0) {
      const amount = Math.round(currentDistributableSavings * (p / 100) * 100) / 100;
      if (amount > 0) {
        window.store.depositToSavingsGoal(goalId, amount);
        allocatedTotal += amount;
        count++;
      }
    }
  });

  if (allocatedTotal > 0) {
    // Dağıtılan tutarı döneme kaydet (tasarruf miktarından düşer)
    window.store.addDistributedSavings(currentPeriodKey, allocatedTotal);
    showToast(`${formatMoney(allocatedTotal)} birikim hedeflerinize başarıyla aktarıldı! 🎯`, 'success');
    closeDistributeSavingsModal();
    renderApp();
  } else {
    showToast('Lütfen hedeflere pay veya tutar belirleyin.', 'warning');
  }
}

function resetPastDistribution() {
  if (confirm('Bu döneme ait önceki birikim dağıtım kaydını sıfırlamak istiyor musunuz? (Hedeflerdeki mevcut bakiyeler korunur, tasarruf tekrar serbest kalır)')) {
    window.store.resetDistributedSavings(currentPeriodKey);
    showToast('Önceki dağıtım sıfırlandı. Tasarruf tekrar serbest bırakıldı.', 'info');
    openDistributeSavingsModal();
    renderApp();
  }
}

// --- iPHONE EYLEM DÜĞMESİ & KESTİRME YÖNETİMİ ---
function copyExpenseShortcutUrl() {
  const origin = window.location.origin;
  const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  const fullUrl = `${origin}${basePath}popup.html`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Popup kestirme bağlantısı kopyalandı! Kestirmeler uygulamasında "Web Sayfasını Göster" eylemine yapıştırın ⚡', 'success');
    }).catch(() => {
      fallbackCopyText(fullUrl);
    });
  } else {
    fallbackCopyText(fullUrl);
  }
}
window.copyExpenseShortcutUrl = copyExpenseShortcutUrl;

function openExpensePopup() {
  const width = 420;
  const height = 620;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  window.open('popup.html', 'ButcemExpensePopup', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no`);
}
window.openExpensePopup = openExpensePopup;

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('Popup kestirme bağlantısı kopyalandı! Kestirmeler uygulamasında "Web Sayfasını Göster" eylemine yapıştırın ⚡', 'success');
  } catch (err) {
    showToast('Kopyalama başarısız oldu.', 'error');
  }
  document.body.removeChild(textArea);
}

function openActionButtonGuideModal() {
  const modal = document.getElementById('actionButtonGuideModal');
  if (modal) modal.classList.remove('hidden');
}
window.openActionButtonGuideModal = openActionButtonGuideModal;

function closeActionButtonGuideModal() {
  const modal = document.getElementById('actionButtonGuideModal');
  if (modal) modal.classList.add('hidden');
}
window.closeActionButtonGuideModal = closeActionButtonGuideModal;

async function triggerManualSync() {
  const btn = document.getElementById('btnManualSync');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-70');
  }

  showToast('Senkronizasyon kontrol ediliyor...', 'info');

  let updatedCount = 0;
  const hasUpdated = await window.store.syncFromSharedCache(({ newTxCount }) => {
    updatedCount = newTxCount;
  });

  await window.store.syncToSharedCache();
  renderApp();

  if (hasUpdated && updatedCount > 0) {
    showToast(`${updatedCount} yeni işlem senkronize edildi! ✨`, 'success');
  } else {
    showToast('Tüm veriler zaten PWA ile eşit ve güncel! ✅', 'success');
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('opacity-70');
  }
}
window.triggerManualSync = triggerManualSync;




