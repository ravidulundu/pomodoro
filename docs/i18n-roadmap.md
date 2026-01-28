# Internationalization (i18n) Roadmap

This document outlines the plan for adding multi-language support to Pomodoro Timer.

## 🎯 Critical Requirement

> **The app MUST automatically detect system language and adapt accordingly.**
> No manual configuration should be required for basic usage.

## Target Languages

| Language | Code | Priority | Status |
|----------|------|----------|--------|
| English | `en` | High | 🔲 Planned (Default fallback) |
| Turkish | `tr` | High | ✅ Current |
| Brazilian Portuguese | `pt-BR` | Medium | 🔲 Planned |

## Goals (Priority Order)

1. **🔴 CRITICAL: System Language Detection**
   - Automatically detect system locale (`$LANG`, `$LC_ALL`, `$LANGUAGE`)
   - Zero configuration required
   - Works on first launch

2. **🔴 CRITICAL: Fallback Chain**
   ```
   system_locale → regional_variant → base_language → en

   Example: pt_BR.UTF-8 → pt-BR → pt → en
   ```

3. **🟡 IMPORTANT: Seamless Experience**
   - App language matches desktop environment
   - Notifications in system language
   - Tray menu in system language

4. **🟢 OPTIONAL: Manual Override**
   - Settings option to override system language
   - Persistent preference (only if manually changed)

---

## Phase 0: System Locale Detection (CRITICAL)

This phase MUST be completed first. Everything else depends on it.

### 0.1 Linux Locale Detection

```typescript
// src/i18n/detectLocale.ts

/**
 * Detects system locale from environment variables
 * Priority: LANGUAGE > LC_ALL > LC_MESSAGES > LANG
 */
export async function detectSystemLocale(): Promise<string> {
  // In Tauri, we can get env vars from Rust
  const locale = await invoke<string>('get_system_locale');
  return parseLocale(locale);
}

function parseLocale(locale: string): string {
  // "tr_TR.UTF-8" → "tr"
  // "pt_BR.UTF-8" → "pt-BR"
  // "en_US.UTF-8" → "en"

  const match = locale.match(/^([a-z]{2})(?:_([A-Z]{2}))?/);
  if (!match) return 'en';

  const [, lang, region] = match;

  // Special case for regional variants we support
  if (lang === 'pt' && region === 'BR') return 'pt-BR';

  return lang;
}
```

### 0.2 Rust Backend Locale Detection

```rust
// src-tauri/src/locale.rs

use std::env;

#[tauri::command]
pub fn get_system_locale() -> String {
    // Priority order for Linux
    env::var("LANGUAGE")
        .or_else(|_| env::var("LC_ALL"))
        .or_else(|_| env::var("LC_MESSAGES"))
        .or_else(|_| env::var("LANG"))
        .unwrap_or_else(|_| String::from("en_US.UTF-8"))
}

// Alternative: Use sys-locale crate
// use sys_locale::get_locale;
// get_locale().unwrap_or_else(|| String::from("en"))
```

### 0.3 Integration with Desktop Environment

```rust
// For more accurate detection, also check:
// - GNOME: gsettings get org.gnome.system.locale region
// - KDE: ~/.config/plasma-localerc
// - XDG: ~/.config/locale.conf

use std::process::Command;

fn get_desktop_locale() -> Option<String> {
    // Try gsettings first (GNOME/GTK)
    if let Ok(output) = Command::new("gsettings")
        .args(["get", "org.gnome.system.locale", "region"])
        .output()
    {
        if output.status.success() {
            let locale = String::from_utf8_lossy(&output.stdout);
            return Some(locale.trim().trim_matches('\'').to_string());
        }
    }

    // Fallback to env vars
    None
}
```

### 0.4 Initialization Flow

```
┌─────────────────────────────────────────────────────────┐
│                    App Startup                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  1. Check localStorage for manual override              │
│     → If exists, use it                                 │
└─────────────────────────────────────────────────────────┘
                           │ (no override)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. Detect system locale via Rust backend               │
│     → LANGUAGE > LC_ALL > LC_MESSAGES > LANG            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. Parse locale string                                 │
│     → "pt_BR.UTF-8" → "pt-BR"                          │
│     → "tr_TR.UTF-8" → "tr"                             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  4. Check if language is supported                      │
│     → Supported: en, tr, pt-BR                         │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐   ┌──────────────────────┐
│  Supported           │   │  Not Supported       │
│  → Use detected      │   │  → Fallback to 'en'  │
└──────────────────────┘   └──────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  5. Initialize i18next with detected language           │
│  6. Update tray menu language                           │
│  7. App ready                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Infrastructure Setup

### 1.1 Install Dependencies

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 1.2 Create Translation Structure

```
src/
├── i18n/
│   ├── index.ts           # i18n configuration
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   ├── tr/
│   │   │   └── translation.json
│   │   └── pt-BR/
│   │       └── translation.json
│   └── types.ts           # TypeScript types for translations
```

### 1.3 i18n Configuration

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import tr from './locales/tr/translation.json';
import ptBR from './locales/pt-BR/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      'pt-BR': { translation: ptBR },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

---

## Phase 2: Translation Files

### 2.1 English (en/translation.json)

```json
{
  "app": {
    "name": "Pomodoro Timer"
  },
  "timer": {
    "work": "Focus",
    "shortBreak": "Short Break",
    "longBreak": "Long Break",
    "start": "Start",
    "pause": "Pause",
    "reset": "Reset",
    "skip": "Skip"
  },
  "settings": {
    "title": "Settings",
    "durations": "Durations",
    "workDuration": "Work Duration",
    "shortBreakDuration": "Short Break Duration",
    "longBreakDuration": "Long Break Duration",
    "longBreakInterval": "Long Break Interval",
    "sound": "Sound",
    "tickingSound": "Ticking Sound",
    "breakSound": "Break Sound",
    "behavior": "Behavior",
    "autoStartBreaks": "Auto-start Breaks",
    "autoStartWork": "Auto-start Work",
    "strictBreak": "Strict Break Mode",
    "pauseWhenIdle": "Pause When Idle",
    "language": "Language"
  },
  "stats": {
    "title": "Statistics",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "sessions": "Sessions",
    "totalTime": "Total Time",
    "minutes": "minutes"
  },
  "tray": {
    "showHide": "Show/Hide",
    "startStop": "Start/Stop",
    "pauseResume": "Pause/Resume",
    "skip": "Skip",
    "reset": "Reset",
    "quit": "Quit"
  },
  "notifications": {
    "workComplete": "Great work! Time for a break.",
    "breakComplete": "Break is over, back to work!",
    "longBreakComplete": "Long break complete!"
  },
  "about": {
    "title": "About",
    "version": "Version",
    "description": "A professional Pomodoro timer for focused work sessions."
  }
}
```

### 2.2 Turkish (tr/translation.json)

```json
{
  "app": {
    "name": "Pomodoro Zamanlayıcı"
  },
  "timer": {
    "work": "Odaklan",
    "shortBreak": "Kısa Mola",
    "longBreak": "Uzun Mola",
    "start": "Başlat",
    "pause": "Duraklat",
    "reset": "Sıfırla",
    "skip": "Atla"
  },
  "settings": {
    "title": "Ayarlar",
    "durations": "Süreler",
    "workDuration": "Çalışma Süresi",
    "shortBreakDuration": "Kısa Mola Süresi",
    "longBreakDuration": "Uzun Mola Süresi",
    "longBreakInterval": "Uzun Mola Aralığı",
    "sound": "Ses",
    "tickingSound": "Tik Tak Sesi",
    "breakSound": "Mola Sesi",
    "behavior": "Davranış",
    "autoStartBreaks": "Molaları Otomatik Başlat",
    "autoStartWork": "Çalışmayı Otomatik Başlat",
    "strictBreak": "Zorunlu Mola Modu",
    "pauseWhenIdle": "Boştayken Duraklat",
    "language": "Dil"
  },
  "stats": {
    "title": "İstatistikler",
    "daily": "Günlük",
    "weekly": "Haftalık",
    "monthly": "Aylık",
    "sessions": "Oturum",
    "totalTime": "Toplam Süre",
    "minutes": "dakika"
  },
  "tray": {
    "showHide": "Göster/Gizle",
    "startStop": "Başlat/Durdur",
    "pauseResume": "Duraklat/Devam",
    "skip": "Atla",
    "reset": "Sıfırla",
    "quit": "Çıkış"
  },
  "notifications": {
    "workComplete": "Harika iş! Mola zamanı.",
    "breakComplete": "Mola bitti, çalışmaya devam!",
    "longBreakComplete": "Uzun mola tamamlandı!"
  },
  "about": {
    "title": "Hakkında",
    "version": "Sürüm",
    "description": "Odaklı çalışma seansları için profesyonel bir Pomodoro zamanlayıcı."
  }
}
```

### 2.3 Brazilian Portuguese (pt-BR/translation.json)

```json
{
  "app": {
    "name": "Temporizador Pomodoro"
  },
  "timer": {
    "work": "Foco",
    "shortBreak": "Pausa Curta",
    "longBreak": "Pausa Longa",
    "start": "Iniciar",
    "pause": "Pausar",
    "reset": "Reiniciar",
    "skip": "Pular"
  },
  "settings": {
    "title": "Configurações",
    "durations": "Durações",
    "workDuration": "Duração do Trabalho",
    "shortBreakDuration": "Duração da Pausa Curta",
    "longBreakDuration": "Duração da Pausa Longa",
    "longBreakInterval": "Intervalo da Pausa Longa",
    "sound": "Som",
    "tickingSound": "Som de Tique-taque",
    "breakSound": "Som de Pausa",
    "behavior": "Comportamento",
    "autoStartBreaks": "Iniciar Pausas Automaticamente",
    "autoStartWork": "Iniciar Trabalho Automaticamente",
    "strictBreak": "Modo de Pausa Rigorosa",
    "pauseWhenIdle": "Pausar Quando Ocioso",
    "language": "Idioma"
  },
  "stats": {
    "title": "Estatísticas",
    "daily": "Diário",
    "weekly": "Semanal",
    "monthly": "Mensal",
    "sessions": "Sessões",
    "totalTime": "Tempo Total",
    "minutes": "minutos"
  },
  "tray": {
    "showHide": "Mostrar/Ocultar",
    "startStop": "Iniciar/Parar",
    "pauseResume": "Pausar/Continuar",
    "skip": "Pular",
    "reset": "Reiniciar",
    "quit": "Sair"
  },
  "notifications": {
    "workComplete": "Ótimo trabalho! Hora de uma pausa.",
    "breakComplete": "Pausa terminada, de volta ao trabalho!",
    "longBreakComplete": "Pausa longa completa!"
  },
  "about": {
    "title": "Sobre",
    "version": "Versão",
    "description": "Um temporizador Pomodoro profissional para sessões de trabalho focado."
  }
}
```

---

## Phase 3: Component Integration

### 3.1 Usage in Components

```typescript
// Before
<Button>Başlat</Button>

// After
import { useTranslation } from 'react-i18next';

function Timer() {
  const { t } = useTranslation();
  return <Button>{t('timer.start')}</Button>;
}
```

### 3.2 Language Selector Component

```typescript
// src/components/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
```

---

## Phase 4: Rust Backend (Tray Menu)

### 4.1 System Locale Detection

```rust
// src-tauri/src/lib.rs
use sys_locale::get_locale;

fn get_system_language() -> String {
    get_locale()
        .unwrap_or_else(|| String::from("en"))
        .split('-')
        .next()
        .unwrap_or("en")
        .to_string()
}
```

### 4.2 Tray Menu Translations

```rust
// src-tauri/src/i18n.rs
use std::collections::HashMap;

pub struct Translations {
    strings: HashMap<String, HashMap<String, String>>,
}

impl Translations {
    pub fn new() -> Self {
        let mut strings = HashMap::new();

        // English
        let mut en = HashMap::new();
        en.insert("show_hide".to_string(), "Show/Hide".to_string());
        en.insert("start_stop".to_string(), "Start/Stop".to_string());
        en.insert("quit".to_string(), "Quit".to_string());
        strings.insert("en".to_string(), en);

        // Turkish
        let mut tr = HashMap::new();
        tr.insert("show_hide".to_string(), "Göster/Gizle".to_string());
        tr.insert("start_stop".to_string(), "Başlat/Durdur".to_string());
        tr.insert("quit".to_string(), "Çıkış".to_string());
        strings.insert("tr".to_string(), tr);

        // Portuguese
        let mut pt = HashMap::new();
        pt.insert("show_hide".to_string(), "Mostrar/Ocultar".to_string());
        pt.insert("start_stop".to_string(), "Iniciar/Parar".to_string());
        pt.insert("quit".to_string(), "Sair".to_string());
        strings.insert("pt".to_string(), pt);

        Self { strings }
    }

    pub fn get(&self, lang: &str, key: &str) -> &str {
        self.strings
            .get(lang)
            .and_then(|l| l.get(key))
            .or_else(|| self.strings.get("en").and_then(|l| l.get(key)))
            .map(|s| s.as_str())
            .unwrap_or(key)
    }
}
```

---

## Phase 5: Testing & QA

### 5.1 Testing Checklist

- [ ] All UI strings translated
- [ ] No hardcoded strings in components
- [ ] System language detection works
- [ ] Language switching works
- [ ] Language preference persists
- [ ] Tray menu translates
- [ ] Notifications translate
- [ ] Date/time formats localized
- [ ] RTL support (future: Arabic, Hebrew)

### 5.2 Test Commands

```bash
# Test with different locales
LANG=en_US.UTF-8 ./pomodoro-tauri
LANG=tr_TR.UTF-8 ./pomodoro-tauri
LANG=pt_BR.UTF-8 ./pomodoro-tauri
```

---

## Implementation Timeline

| Phase | Description | Estimated Effort |
|-------|-------------|------------------|
| Phase 1 | Infrastructure Setup | 1 day |
| Phase 2 | Translation Files | 1 day |
| Phase 3 | Component Integration | 2-3 days |
| Phase 4 | Rust Backend | 1 day |
| Phase 5 | Testing & QA | 1 day |

**Total**: ~1 week

---

## Future Considerations

### Additional Languages (Community Contributions)
- Spanish (es)
- German (de)
- French (fr)
- Japanese (ja)
- Chinese (zh)
- Russian (ru)
- Arabic (ar) - requires RTL support

### Crowdin/Weblate Integration
For community translations, consider integrating with:
- [Crowdin](https://crowdin.com/)
- [Weblate](https://weblate.org/)

### Contributing Translations
Add a `CONTRIBUTING.md` with translation guidelines:
1. Fork the repo
2. Copy `en/translation.json` to `{lang}/translation.json`
3. Translate all strings
4. Submit PR

---

## References

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Tauri Localization](https://tauri.app/v1/guides/features/system-tray/)
- [sys-locale crate](https://crates.io/crates/sys-locale)
