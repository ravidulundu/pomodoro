1. Product Requirements Document (PRD)

Proje İsmi: cachy-pomo-tray Tip: Desktop Menu Bar App (System Tray)
1.1. Teknik Stack

    Core: Tauri v2 (Rust + Webview) - Native performans, düşük RAM.

    Frontend: React, TypeScript, Vite.

    State Management: Zustand (Persist middleware ile config saklamak için).

    UI Library: Shadcn/UI (Radix UI tabanlı) + TailwindCSS.

    System Integration:

        tauri-plugin-notification: Native KDE bildirimleri için.

        tauri-plugin-positioner (veya v2 built-in): Pencerenin tray icon yanında açılması için.

        tauri-plugin-store: Ayarların diske yazılması için.

1.2. MVP Özellikleri

    Timer Logic:

        Work (25dk), Short Break (5dk), Long Break (15dk) modları.

        Custom süre ayarlanabilirliği.

    System Tray Entegrasyonu:

        Uygulama arka planda çalışmalı.

        Tray icon üzerinde kalan süre (opsiyonel) veya durum (renk) gösterimi.

        Sağ tık menüsü: Start/Stop, Quit.

    Bildirimler:

        Süre bittiğinde sesli ve görsel native Linux bildirimi.

        "Focus" modu sırasında DND (Do Not Disturb) tetikleme (opsiyonel/advanced).

    UI/UX:

        KDE Dark moda uyumlu minimalist arayüz.

        Pencere dekorasyonu yok (frameless), sadece içerik.

1.3. Arch/CachyOS Gereksinimleri

    webkit2gtk ve libappindicator-gtk3 paketlerine bağımlılık (Tauri için standart).
