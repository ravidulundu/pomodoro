# Pomodoro Timer

A professional Pomodoro timer for Linux, built with Tauri v2 and React.

[![AUR version](https://img.shields.io/aur/version/pomodoro-tauri)](https://aur.archlinux.org/packages/pomodoro-tauri)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/ravidulundu/pomodoro)](https://github.com/ravidulundu/pomodoro/releases)

---

## Overview

Pomodoro Timer is a desktop application that helps you stay focused using the Pomodoro Technique. Work in focused 25-minute intervals, take short breaks, and track your productivity over time.

### Key Features

| Feature | Description |
|---------|-------------|
| **Timer Modes** | Work (25 min), Short Break (5 min), Long Break (15 min) |
| **System Tray** | Runs in background with tray icon status |
| **Notifications** | Desktop notifications when sessions complete |
| **Statistics** | Daily, weekly, and monthly session tracking |
| **D-Bus Integration** | Control via CLI or status bar scripts |
| **Idle Detection** | Auto-pause when you're away |
| **Strict Break** | Fullscreen mode to enforce breaks |
| **Global Shortcut** | `Ctrl+Alt+P` to toggle timer |

---

## Installation

### Arch Linux (AUR)

```bash
# Using yay
yay -S pomodoro-tauri

# Using paru
paru -S pomodoro-tauri
```

### Manual Build

#### Prerequisites

```bash
# Arch Linux / CachyOS
sudo pacman -S webkit2gtk-4.1 libayatana-appindicator sqlite rust npm nodejs

# Fedora
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel sqlite-devel rust cargo npm

# Ubuntu / Debian
sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev libsqlite3-dev rustc cargo npm
```

#### Build from Source

```bash
# Clone repository
git clone https://github.com/ravidulundu/pomodoro.git
cd pomodoro

# Install dependencies and build
npm install
npm run tauri build

# Binary location
./src-tauri/target/release/pomodoro
```

#### Install with makepkg (Arch)

```bash
git clone https://github.com/ravidulundu/pomodoro.git
cd pomodoro
makepkg -si
```

---

## Usage

### Starting the Application

```bash
# Launch GUI
pomodoro-tauri

# Or from application menu: "Pomodoro Pro"
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+P` | Toggle timer (global) |
| `Space` | Start/Pause timer |
| `R` | Reset current session |
| `S` | Skip to next session |

### System Tray

- **Left click**: Show/hide window
- **Right click**: Open menu
  - Göster/Gizle (Show/Hide)
  - Başlat/Durdur (Start/Stop)
  - Duraklat/Devam (Pause/Resume)
  - Atla (Skip)
  - Sıfırla (Reset)
  - Çıkış (Quit)

---

## D-Bus Integration

Pomodoro Timer exposes a D-Bus service for external control. Perfect for polybar, waybar, or custom scripts.

### Service Details

```
Service:   com.osmandulundu.pomodoro
Path:      /com/osmandulundu/pomodoro
Interface: com.osmandulundu.pomodoro
```

### CLI Commands

```bash
# Toggle timer
pomodoro-tauri toggle

# Start timer (if not running)
pomodoro-tauri start

# Stop timer (if running)
pomodoro-tauri stop

# Skip current session
pomodoro-tauri skip

# Reset timer
pomodoro-tauri reset

# Add time (seconds)
pomodoro-tauri extend 60

# Get current status (JSON)
pomodoro-tauri status
```

### Status Output

```json
{
  "state": "work",
  "time_left": 1234,
  "is_active": true,
  "sessions_completed": 3
}
```

### Polybar Module

```ini
[module/pomodoro]
type = custom/script
exec = pomodoro-tauri status | jq -r '"🍅 " + (if .is_active then (.time_left | tostring | split(".")[0] | tonumber | "\(. / 60 | floor):\(. % 60 | tostring | if length == 1 then "0" + . else . end)") else "paused" end)'
interval = 1
click-left = pomodoro-tauri toggle
click-right = pomodoro-tauri skip
```

### Waybar Module

```json
{
  "custom/pomodoro": {
    "exec": "pomodoro-tauri status | jq -r '.time_left | . / 60 | floor | tostring + \" min\"'",
    "interval": 1,
    "format": "🍅 {}",
    "on-click": "pomodoro-tauri toggle",
    "on-click-right": "pomodoro-tauri skip"
  }
}
```

---

## Configuration

Settings are stored in localStorage and persist across sessions.

### Timer Durations

| Setting | Default | Description |
|---------|---------|-------------|
| Work | 25 min | Focus session duration |
| Short Break | 5 min | Break after each work session |
| Long Break | 15 min | Break after 4 work sessions |
| Long Break Interval | 4 | Sessions before long break |

### Sound Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Ticking Sound | Off | Play sound while timer runs |
| Break Sound | On | Play sound when session ends |

### Behavior Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-start Breaks | Off | Automatically start break timer |
| Auto-start Work | Off | Automatically start work timer |
| Pause When Idle | Off | Pause timer when away (5 min) |
| Strict Break | Off | Fullscreen during breaks |

---

## Data Storage

### Database Location

```bash
# Session statistics
~/.local/share/com.osmandulundu.pomodoro/database.sqlite
```

### LocalStorage

```bash
# Settings and timer state
# Key: pomodoro-storage
# Stored in WebView localStorage
```

### Data Retention

- Session data is automatically pruned after 365 days
- Settings persist until manually cleared

---

## Troubleshooting

### Application won't start

**Symptom**: Window doesn't appear or crashes immediately.

```bash
# Check dependencies
ldd /usr/bin/pomodoro-tauri | grep "not found"

# Install missing dependencies
sudo pacman -S webkit2gtk-4.1 libayatana-appindicator
```

### Tray icon not showing

**Symptom**: No icon in system tray.

```bash
# Ensure libayatana-appindicator is installed
pacman -Qi libayatana-appindicator

# For KDE Plasma, install:
sudo pacman -S libappindicator-gtk3
```

### Notifications not working

**Symptom**: No desktop notifications appear.

```bash
# Check notification daemon
notify-send "Test" "Testing notifications"

# Ensure notification service is running
systemctl --user status xdg-desktop-portal
```

### D-Bus commands fail

**Symptom**: CLI commands return errors.

```bash
# Check if service is registered
dbus-send --session --print-reply \
  --dest=org.freedesktop.DBus /org/freedesktop/DBus \
  org.freedesktop.DBus.ListNames | grep pomodoro

# Ensure application is running
pgrep -a pomodoro
```

### Sound not playing

**Symptom**: No alarm or ticking sounds.

```bash
# Check PulseAudio/PipeWire
pactl info

# Test sound playback
paplay /usr/share/pomodoro-tauri/bell.ogg
```

### High CPU usage

**Symptom**: Application uses excessive CPU.

This is typically caused by:
1. Ticking sound on long sessions - disable in settings
2. WebKit rendering issues - restart the application

---

## File Locations

| File | Location |
|------|----------|
| Binary | `/usr/bin/pomodoro-tauri` |
| Desktop Entry | `/usr/share/applications/pomodoro-tauri.desktop` |
| Icons | `/usr/share/icons/hicolor/*/apps/pomodoro-tauri.png` |
| Sounds | `/usr/share/pomodoro-tauri/*.ogg` |
| Tray Icons | `/usr/share/pomodoro-tauri/*.png` |
| Database | `~/.local/share/com.osmandulundu.pomodoro/database.sqlite` |

---

## Development

### Project Structure

```
pomodoro/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── store/              # Zustand state management
│   └── App.tsx             # Main application
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri commands & setup
│   │   ├── audio.rs        # Sound playback (rodio)
│   │   ├── db.rs           # SQLite database
│   │   ├── dbus.rs         # D-Bus service
│   │   ├── idle.rs         # Idle detection
│   │   └── cli.rs          # CLI interface
│   └── Cargo.toml
├── public/
│   ├── sounds/             # Audio files
│   └── icons/              # Application icons
├── PKGBUILD                # Arch Linux package
└── data/
    └── pomodoro-tauri.desktop
```

### Running in Development

```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Rust, Tauri v2
- **Audio**: rodio
- **Database**: SQLite (rusqlite)
- **IPC**: D-Bus (zbus)
- **State**: Zustand with persist middleware

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [rodio](https://github.com/RustAudio/rodio) - Audio playback

---

<p align="center">
  Made with ❤️ for the Linux community
</p>
