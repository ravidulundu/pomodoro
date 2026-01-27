# Maintainer: Osman Dulundu <osman@dulundu.dev>
pkgname=pomodoro-tauri
pkgver=0.1.0
pkgrel=1
pkgdesc="A professional Pomodoro Timer built with Tauri and React, optimized for Arch Linux."
arch=('x86_64' 'aarch64')
url="https://github.com/ravidulundu/pomodoro"
license=('GPL3')
depends=('webkit2gtk-4.1' 'libayatana-appindicator' 'gst-plugins-good' 'gst-plugins-base')
makedepends=('npm' 'cargo' 'nodejs')
source=("$pkgname-$pkgver.tar.gz::https://github.com/ravidulundu/pomodoro/archive/v$pkgver.tar.gz")
sha256sums=('SKIP') # Run updpkgsums before actual submission

check() {
  cd "$pkgname-$pkgver"
  # Optional: run tests if available
  # npm test
}

build() {
  cd "$pkgname-$pkgver"
  npm install
  npm run tauri build
}

package() {
  cd "$pkgname-$pkgver"
  install -Dm755 "src-tauri/target/release/pomodoro" "$pkgdir/usr/bin/pomodoro-tauri"

  # Icons
  install -Dm644 "public/icons/kde-pomodoro.svg" "$pkgdir/usr/share/icons/hicolor/scalable/apps/pomodoro-tauri.svg"

  # Desktop Entry
  install -Dm644 "data/pomodoro-tauri.desktop" "$pkgdir/usr/share/applications/pomodoro-tauri.desktop"
}
