/**
 * Bütçem - PWA & Kurulum Yöneticisi
 */

let deferredPrompt = null;

// Service Worker Kaydı
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('ServiceWorker başarıyla kaydedildi:', reg.scope);
      })
      .catch(err => {
        console.warn('ServiceWorker kaydı başarısız:', err);
      });
  });
}

// Android / Chrome "beforeinstallprompt" Yakalama
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Ana ekrana ekle butonlarını görünür yap
  const installBanner = document.getElementById('pwaInstallBanner');
  const installNavBtn = document.getElementById('btnInstallNav');
  
  if (installBanner) installBanner.classList.remove('hidden');
  if (installNavBtn) installNavBtn.classList.remove('hidden');
});

// Kurulum Butonu Aksiyonu
function triggerPwaInstall() {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if (isStandalone) {
    showToast('Uygulama zaten yüklü ve tam ekran modunda çalışıyor! 🎉', 'success');
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('Bütçem ana ekranınıza eklendi! ✨', 'success');
        const installBanner = document.getElementById('pwaInstallBanner');
        if (installBanner) installBanner.classList.add('hidden');
      }
      deferredPrompt = null;
    });
  } else if (isIos) {
    // iOS Safari Kurulum Rehberi Modalı
    openIosInstallModal();
  } else {
    // Tarayıcı menüsü uyarısı
    openBrowserInstallHelpModal();
  }
}

function openIosInstallModal() {
  const modal = document.getElementById('iosInstallModal');
  if (modal) modal.classList.remove('hidden');
}

function closeIosInstallModal() {
  const modal = document.getElementById('iosInstallModal');
  if (modal) modal.classList.add('hidden');
}

function openBrowserInstallHelpModal() {
  const modal = document.getElementById('browserInstallHelpModal');
  if (modal) modal.classList.remove('hidden');
}

function closeBrowserInstallHelpModal() {
  const modal = document.getElementById('browserInstallHelpModal');
  if (modal) modal.classList.add('hidden');
}

// Ağ Durumu Takibi
window.addEventListener('online', () => {
  showToast('İnternet bağlantısı yeniden kuruldu.', 'info');
});

window.addEventListener('offline', () => {
  showToast('Çevrimdışı moddasınız. Tüm verileriniz cihazınızda kaydedilmeye devam eder.', 'warning');
});

// Toast Bildirim Fonksiyonu
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white dark:bg-slate-700'
  };

  const icons = {
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'alert-circle',
    info: 'info'
  };

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-3 opacity-0 text-sm font-medium ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
