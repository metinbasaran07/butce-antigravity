# 💰 Bütçem - Modern & Akıllı Bütçe Takip Uygulaması (PWA)

**Bütçem**, kişisel finansınızı, gelir ve giderlerinizi, aylık bütçe limitlerinizi ve birikim hedeflerinizi şık, modern ve kesintisiz bir deneyimle yönetmenizi sağlayan yeni nesil bir **Progressive Web App (PWA)** uygulamasıdır.

Tüm verileriniz **yalnızca sizin cihazınızda (LocalStorage)** saklanır. Uygulamayı kapatsanız, tarayıcıyı yenileseniz bile hiçbir bilginiz kaybolmaz.

---

## ✨ Öne Çıkan Özellikler

- 💎 **Modern & Şık Tasarım:** Glassmorphism arayüz, akıcı animasyonlar, karanlık/aydınlık (Dark/Light) tema geçişi.
- 📱 **Gerçek Bir Uygulama Gibi Çalışır (PWA):**
  - **Ana Ekrana Ekle (Installable):** Safari, Chrome, Edge veya mobil tarayıcılardan tek tıkla cihazınıza native bir uygulama gibi yüklenir.
  - **Çevrimdışı (Offline) Desteği:** İnternetiniz olmasa dahi Service Worker sayesinde sorunsuz çalışır.
- 💸 **Gelir & Gider Yönetimi:**
  - Hızlı işlem ekleme (Tutar, Tip, Kategori, Tarih, Not, Nakit/Kart/Havale seçimi).
  - Tarihe göre gruplandırılmış işlem dökümü.
  - Arama, kategori ve gelir/gider bazlı anlık filtreleme.
- 🎯 **Birikim Hedefleri (Savings Goals):**
  - Hedeflenen tutar, biriken tutar ve hedef tarihi belirleme.
  - Görsel ilerleme çubuğu (% yüzdelik ve kalan tutar).
  - Tek tıkla birikime para aktarma / ekleme.
- 📊 **Aylık Bütçe Limitleri:**
  - Kategori bazında aylık harcama limitleri tanımlama (örn. "Market: 8.000 TL").
  - Harcama oranı takibi ve bütçe aşımında renkli uyarı göstergeleri.
- 📈 **Detaylı Analiz & Grafikler (Chart.js):**
  - Kategori bazlı harcama dağılımı (Doughnut / Pasta Grafik).
  - Son 6 ayın Gelir & Gider karşılaştırması (Bar Chart).
  - Ay içi günlük harcama eğilim grafiği (Trend Line Chart).
  - **Finansal Sağlık Skoru:** Bütçe dengenize göre otomatik tasarruf analizi ve öneriler.
- 💾 **Veri Yedekleme & İçe/Dışa Aktarma:**
  - Tek tıkla JSON formatında tam yedek indirme ve geri yükleme.
  - Excel ile tam uyumlu Türkçe karakter destekli CSV dökümü.
  - İsteğe bağlı zengin demo verileri yükleme veya tek tıkla sıfırlama.
- 🌍 **Çoklu Para Birimi:** ₺ (TRY), $ (USD), € (EUR), £ (GBP).

---

## 🚀 Vercel'de Yayınlama (1 Tıklamayla Canlıya Alma)

Bu proje sıfır konfigürasyonla (zero-config) doğrudan Vercel'de çalışacak şekilde hazırlanmıştır.

1. **[Vercel](https://vercel.com)** hesabınıza giriş yapın.
2. **"Add New..." -> "Project"** butonuna tıklayın.
3. GitHub hesabınızı bağlayıp bu repoyu seçin (`bütçe` / `butcem-app`).
4. Hiçbir ayarı değiştirmeden doğrudan **"Deploy"** butonuna basın!
5. 5-10 saniye içinde uygulamanız `https://projeniz.vercel.app` adresinde canlıya çıkacaktır! 🎉

---

## 📲 Ana Ekrana Nasıl Eklenir? (PWA Kurulumu)

- **iPhone / iPad (iOS Safari):**
  1. Safari'de sitenizi açın.
  2. Alt ortadaki **Paylaş (Share)** simgesine dokunun.
  3. Aşağı kaydırıp **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
- **Android (Chrome):**
  1. Chrome'da sitenizi açın.
  2. Ekranda beliren **"Uygulama Yap / Yükle"** butonuna veya sağ üst menüdeki **"Uygulamayı Yükle"** seçeneğine dokunun.
- **Masaüstü (Chrome / Edge / Brave):**
  1. Adres çubuğunun sağ tarafındaki **"Yükle"** simgesine tıklayın.

---

## 🛠️ Teknolojiler

- **HTML5 & Vanilla JavaScript (ES6+ Modules)** - Hafif, sıfır bağımlılık karmaşası.
- **Tailwind CSS (Modern CDN)** - Şık tasarım, dark mode, responsive düzen.
- **Lucide Icons** - Modern ve keskin vektör ikonlar.
- **Chart.js** - İnteraktif ve pürüzsüz grafikler.
- **Service Worker & Web Manifest** - PWA ve çevrimdışı önbellekleme mimarisi.
- **LocalStorage API** - Güvenli ve kalıcı yerel veri saklama.
