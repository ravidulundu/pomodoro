# AUR & Linux Masaüstü Uygulama Yayın Kontrol Listesi

Bu dosya pomodoro-tauri uygulamasının AUR'a yayınlanmadan önce yapılması gereken tüm kontrolleri içerir.

**Son Kontrol Tarihi:** 2026-01-28

---

## 📦 1. PKGBUILD & AUR Kontrolleri

- [x] **namcap PKGBUILD analizi** - `namcap PKGBUILD` ✅ Hata yok
- [x] **namcap paket analizi** - `namcap *.pkg.tar.zst` (build sonrası)
- [x] **shellcheck PKGBUILD** - `shellcheck PKGBUILD` ✅ PKGBUILD formatı için normal uyarılar
- [x] **SPDX lisans formatı** - `license=('GPL-3.0-or-later')` ✅
- [x] **source URL doğrulaması** - GitHub release URL formatı doğru
- [ ] **sha256sums kontrolü** - Release sonrası `updpkgsums` ile güncelle
- [x] **.SRCINFO güncel mi?** - `makepkg --printsrcinfo > .SRCINFO` ✅
- [ ] **Temiz chroot build** - `makepkg -Ccsr` (release öncesi)
- [x] **pkgver/pkgrel doğru mu?** - 0.1.0-1 ✅
- [ ] **Paket adı AUR'da var mı?** - https://aur.archlinux.org/ kontrol et
- [x] **base-devel varsayılıyor mu?** - makedepends'te gcc/make yok ✅

---

## 🖥️ 2. Freedesktop/XDG Standartları

- [x] **Desktop entry doğrulama** - `desktop-file-validate` ✅ Hata yok
- [x] **İkon hicolor tema yapısı** - Tüm boyutlar PKGBUILD'de ✅
- [x] **İkon boyutları (PNG)** - 16, 24, 32, 48, 64, 128, 256, 512 ✅
- [x] **Scalable SVG ikonu** - `kde-pomodoro.svg` mevcut ✅
- [x] **XDG_DATA_HOME uyumu** - SQLite DB app_data_dir'da ✅
- [x] **XDG_CONFIG_HOME uyumu** - N/A (localStorage kullanılıyor)
- [x] **XDG_CACHE_HOME uyumu** - N/A

---

## 🦀 3. Rust/Tauri Backend Memory Leak Kontrolleri

- [ ] **Heaptrack profiling** - `heaptrack ./target/release/pomodoro` (opsiyonel)
- [ ] **Valgrind memcheck** - `valgrind --leak-check=full` (opsiyonel)
- [x] **Debug symbols** - Release modda mevcut değil (prod için OK)
- [x] **Arc/Mutex döngüsel referans** - Kod incelemesi ✅ Yok
- [x] **Spawned task lifecycle** - D-Bus ve IdleDetector düzgün ✅
- [x] **Drop trait implementasyonu** - IdleDetector'da var ✅
- [x] **Channel receiver cleanup** - N/A
- [x] **D-Bus connection lifetime** - `std::future::pending` ile canlı ✅

---

## ⚛️ 4. Frontend (React/TypeScript) Memory Leak Kontrolleri

- [ ] **Chrome DevTools Memory** - Manuel test gerekli
- [x] **useEffect cleanup** - Tüm useEffect'lerde return var ✅
- [x] **Event listener temizliği** - `unlisten()` çağrılıyor ✅
- [x] **Tauri event unlisten** - App.tsx'de cleanup var ✅
- [x] **Async cancellation** - StatsView'da `cancelled` pattern ✅
- [x] **setInterval/setTimeout** - Timer.tsx'de `clearInterval` var ✅
- [x] **Zustand subscription** - N/A (doğrudan store kullanımı)

---

## 🔧 5. Tauri-Specific Kontroller

- [x] **Capabilities doğru mu?** - Sadece gerekli izinler ✅
- [x] **Bundle icons doğru boyut** - 32x32, 128x128, 256x256, 512x512 ✅ DÜZELTİLDİ
- [x] **Resource resolution** - resolve_path() 3 lokasyonu deniyor ✅
- [x] **Window close-to-tray** - on_window_event'te hide() ✅
- [x] **Tray icon güncelleme** - update_tray_icon komutu mevcut ✅
- [x] **IPC command registration** - Tüm komutlar invoke_handler'da ✅
- [x] **Event emission/listening** - App.tsx'de dinleniyor ✅

---

## 🧪 6. Fonksiyonel Testler (Manuel)

- [ ] **Timer başlat/durdur** - Manuel test
- [ ] **Bildirimler** - Manuel test
- [ ] **Ses çalma** - Manuel test
- [ ] **D-Bus CLI** - `pomodoro-tauri status/toggle` test et
- [ ] **İstatistikler** - SQLite kayıt kontrolü
- [ ] **Idle detection** - 5 dk boşta bekleme testi
- [ ] **Strict break** - Fullscreen mola testi
- [ ] **Ayarlar kalıcılığı** - Uygulama restart testi

---

## 🔒 7. Güvenlik Kontrolleri

- [x] **Input sanitization** - Kullanıcı girdisi yok (timer app) ✅
- [x] **CSP (Content Security Policy)** - `null` (lokal app için OK)
- [x] **Capabilities minimum yetki** - Sadece gerekli izinler ✅
- [x] **Hassas veri frontend'de yok** - Secret yok ✅
- [x] **SQL injection koruması** - `params![]` ile parametreli sorgular ✅

---

## 📋 8. Yayın Öncesi Son Kontroller

- [x] **Version bump** - Tüm dosyalarda 0.1.0 ✅
- [ ] **Git tag** - `git tag v0.1.0`
- [ ] **GitHub release** - Tarball oluştur
- [ ] **PKGBUILD source URL** - Release URL'i test et
- [ ] **Temiz kurulum testi** - Yeni kullanıcı hesabında
- [ ] **Uninstall temizliği** - Artık dosya kontrolü

---

## 🛠️ Gerekli Araçlar

```bash
# AUR/PKGBUILD
sudo pacman -S namcap shellcheck desktop-file-utils

# Memory profiling (opsiyonel)
sudo pacman -S valgrind heaptrack

# Build testing
sudo pacman -S devtools
```

---

## 📝 Yapılan Düzeltmeler (2026-01-28)

1. **İkon boyutları düzeltildi:**
   - `src-tauri/icons/128x128.png`: 512x512 → 128x128
   - `src-tauri/icons/128x128@2x.png`: 512x512 → 256x256

2. **Eksik ikon boyutları eklendi:**
   - `public/icons/64x64/kde-pomodoro.png`
   - `public/icons/128x128/kde-pomodoro.png`

3. **PKGBUILD güncellendi:**
   - Tüm hicolor ikon boyutları kurulacak (16-512px + SVG)

---

## 📚 Kaynaklar

- https://wiki.archlinux.org/title/AUR_submission_guidelines
- https://wiki.archlinux.org/title/Namcap
- https://specifications.freedesktop.org/desktop-entry/latest/
- https://specifications.freedesktop.org/
- https://github.com/KDE/heaptrack
- https://v2.tauri.app/concept/process-model/
