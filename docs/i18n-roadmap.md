# Internationalization (i18n) Roadmap

This document outlines the plan for adding multi-language support to Pomodoro Timer.

## Target Languages

| Language | Code | Priority | Status |
|----------|------|----------|--------|
| Turkish | `tr` | Current | ✅ Default |
| English | `en` | High | 🔲 Planned |
| Brazilian Portuguese | `pt-BR` | Medium | 🔲 Planned |

## Goals

1. **System Language Detection**: Automatically detect and use system locale
2. **Fallback Chain**: `system_locale → en → tr`
3. **Runtime Switching**: Allow users to change language in settings
4. **Persistent Preference**: Save user's language choice

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
