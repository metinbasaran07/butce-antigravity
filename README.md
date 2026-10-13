# 💰 Bütçem - Modern & Akıllı Bütçe Takip Uygulaması (React + PWA)

**Bütçem**, kişisel finansınızı, gelir ve giderlerinizi, aylık bütçe limitlerinizi ve birikim hedeflerinizi şık, modern ve kesintisiz bir deneyimle yönetmenizi sağlayan **React + TypeScript + Vite** tabanlı **Progressive Web App (PWA)** uygulamasıdır.

Tüm verileriniz **yalnızca sizin cihazınızda (LocalStorage)** saklanır. Uygulamayı kapatsanız, tarayıcıyı yenileseniz bile hiçbir bilginiz kaybolmaz.

---

## ✨ Öne Çıkan Özellikler

- 💎 **Modern & Şık Tasarım:** Glassmorphism arayüz, akıcı animasyonlar, karanlık/aydınlık (Dark/Light) tema geçişi.
- 📱 **Gerçek Bir Uygulama Gibi Çalışır (PWA):**
  - **Ana Ekrana Ekle (Installable):** Safari, Chrome, Edge veya mobil tarayıcılardan tek tıkla cihazınıza native bir uygulama gibi yüklenir.
  - **Haptic Touch & Kısayollar:** Ana ekran simgesine basılı tutarak doğrudan Hızlı Gelir / Gider ekleme.
  - **Çevrimdışı (Offline) Desteği:** Service Worker sayesinde internet bağlantısı olmadan da çalışır.
- 💸 **Gelir & Gider Yönetimi:**
  - Hızlı işlem ekleme (Tutar, Tip, Kategori, Tarih, Not, Nakit/Kart seçimi).
  - İBAN Transfer Komisyonu otomatik hesaplama (+15.00 ₺ veya özel tutar).
  - Tarihe göre gruplandırılmış işlem dökümü.
  - Arama, kategori ve gelir/gider bazlı anlık filtreleme.
  - 1-Dokunuşla harcama şablonları (Kahve, Market, Yemek, Ulaşım, Fatura).
- 🎯 **Birikim Hedefleri & Tasarruf Dağıtımı:**
  - Hedeflenen tutar, biriken tutar ve hedef tarihi belirleme.
  - Görsel ilerleme çubuğu (% yüzdelik ve kalan tutar).
  - Sürgülü Tasarruf Dağıtım Modalı (%100 dağıtım kuralı, otomatik veya hedefe göre paylaştırma).
  - Tek tıkla birikime para aktarma / ekleme.
- 📊 **Aylık Bütçe Limitleri:**
  - Kategori bazında aylık harcama limitleri tanımlama.
  - Harcama oranı takibi ve bütçe aşımında renkli uyarı göstergeleri.
- 📈 **Detaylı Analiz & Grafikler (Chart.js):**
  - Kategori bazlı harcama dağılımı (Yatay çubuk grafiği).
  - Son 6 ayın Gelir & Gider karşılaştırması (Çift çubuk grafiği).
  - Ay içi günlük harcama eğilim grafiği (Trend çizgi grafiği).
- 💾 **Veri Yedekleme & İçe/Dışa Aktarma:**
  - Tek tıkla JSON formatında tam yedek indirme ve geri yükleme.
  - Excel ile tam uyumlu Türkçe karakter destekli CSV dökümü.
  - İsteğe bağlı zengin demo verileri yükleme veya tek tıkla sıfırlama.
- 🌍 **Çoklu Para Birimi:** ₺ (TRY), $ (USD), € (EUR), £ (GBP).

---

## 🛠️ Teknolojiler

- **React 19 & TypeScript** - Modüler bileşen mimarisi ve tip güvenliği
- **Vite** - Yüksek performanslı geliştirme ve üretim derlemesi
- **Tailwind CSS v4** - Şık tasarım, dark mode, responsive düzen
- **Lucide Icons (`lucide-react`)** - Modern ve keskin vektör ikonlar
- **Chart.js** - İnteraktif ve pürüzsüz grafikler
- **Service Worker & Web Manifest** - PWA ve çevrimdışı önbellekleme mimarisi
- **LocalStorage API** - Güvenli ve kalıcı yerel veri saklama

---

## 🚀 Geliştirme ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (Port 3000)
npm run dev

# Üretim derlemesi oluşturun
npm run build
```
