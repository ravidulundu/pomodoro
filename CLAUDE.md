# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tauri v2 (Rust + React) desktop Pomodoro timer application for Linux. Turkish-localized UI with system tray integration, D-Bus service, CLI control, and SQLite-backed statistics. Targets Arch/CachyOS with webkit2gtk and libappindicator-gtk3 dependencies.

## Build & Development Commands

```bash
# Full Tauri dev (launches Rust backend + Vite frontend)
cargo tauri dev

# Frontend only (Vite dev server on localhost:5173)
npm run dev

# Production build
cargo tauri build

# Frontend type check + bundle
npm run build

# Rust-only check/build
cd src-tauri && cargo check
cd src-tauri && cargo build
```

No test framework is configured. No linter or formatter config exists.

## Architecture

### Frontend → Backend IPC

React frontend communicates with Rust backend via Tauri IPC commands (`@tauri-apps/api/core` invoke). All Tauri commands are defined in [lib.rs](src-tauri/src/lib.rs) and registered in `invoke_handler`. Commands cover: audio playback, window management, tray icon updates, database operations, D-Bus state sync, and idle detection toggling.

### State Management

[useTimerStore.ts](src/store/useTimerStore.ts) is the single Zustand store with persist middleware (localStorage key: `pomodoro-storage`). It manages all timer state, settings, and actions. On hydration, it recalculates elapsed time for timers active during app closure.

### Backend Modules (src-tauri/src/)

- **lib.rs** — Tauri app setup, all IPC command handlers, tray menu builder, global shortcut (Ctrl+Alt+P), window close-to-tray behavior
- **audio.rs** — `AudioPlayer` struct using rodio with play (one-shot) and play_loop (fade-in looping) methods, thread-safe via Mutex
- **db.rs** — SQLite via rusqlite. Sessions table with daily/weekly/monthly stat queries. DB path: `app_data_dir/pomodoro.db`
- **dbus.rs** — `SharedTimerState` (Arc+Mutex shared state) and `PomodoroService` D-Bus object at `com.osmandulundu.Pomodoro` on session bus. Exposes toggle/start/stop/skip/reset/extend methods and state properties for external tools (polybar, waybar)
- **idle.rs** — `IdleDetector` polls `org.freedesktop.ScreenSaver` D-Bus interface. 5-minute idle threshold, 10-second poll interval. Emits `idle-detected`/`idle-resumed` events to frontend
- **cli.rs** — Clap-based CLI (toggle, start, stop, skip, reset, extend, status) communicating via D-Bus to running instance

### Resource Resolution

`resolve_path()` in lib.rs tries Tauri resource directory first (production), then falls back to project directory (dev mode). Used for sound files (`public/sounds/*.ogg`) and tray icons (`src-tauri/icons/`).

### Event Flow

Tray menu actions and D-Bus commands emit Tauri events (`tray-start-stop`, `tray-pause-resume`, `tray-skip`, `reset-timer`, `dbus-*`, `idle-*`) that the React frontend listens to in [App.tsx](src/App.tsx) and dispatches to the Zustand store.

## Key Conventions

- All user-facing strings are in Turkish (e.g., "Odaklan", "Kısa Mola", "Uzun Mola")
- Rust code comments are in Turkish
- Window close is intercepted to hide (close-to-tray), not quit
- UI uses shadcn/ui (new-york style) with glass-morphism custom utilities (glass-card, glass-nav, premium-glow)
- Path alias: `@/*` maps to `./src/*` in both TypeScript and Vite configs
- Tauri v2 capabilities system is used for permissions (see `src-tauri/capabilities/`)
