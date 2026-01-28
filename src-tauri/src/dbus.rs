use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use zbus::{connection, interface};

/// Frontend'den güncellenen timer durumu
#[derive(Clone, Debug)]
pub struct TimerStatus {
    pub state: String,
    pub time_left: u32,
    pub is_active: bool,
    pub sessions_completed: u32,
}

impl Default for TimerStatus {
    fn default() -> Self {
        Self {
            state: "work".to_string(),
            time_left: 25 * 60,
            is_active: false,
            sessions_completed: 0,
        }
    }
}

/// Rust ve D-Bus arasında paylaşılan durum
pub struct SharedTimerState {
    pub status: Mutex<TimerStatus>,
}

impl SharedTimerState {
    pub fn new() -> Self {
        Self {
            status: Mutex::new(TimerStatus::default()),
        }
    }

    pub fn update(&self, state: String, time_left: u32, is_active: bool, sessions_completed: u32) {
        match self.status.lock() {
            Ok(mut s) => {
                s.state = state;
                s.time_left = time_left;
                s.is_active = is_active;
                s.sessions_completed = sessions_completed;
            }
            Err(e) => eprintln!("SharedTimerState::update mutex poisoned: {}", e),
        }
    }
}

/// D-Bus servisi: com.osmandulundu.Pomodoro
/// Harici araçlar (waybar, polybar, scriptler) bu arayüz üzerinden
/// timer'ı kontrol edebilir ve durumunu sorgulayabilir.
struct PomodoroService {
    shared_state: Arc<SharedTimerState>,
    app_handle: AppHandle,
}

#[interface(name = "com.osmandulundu.pomodoro")]
impl PomodoroService {
    /// Timer'ı başlat veya duraklat (toggle)
    async fn toggle(&self) {
        let _ = self.app_handle.emit("dbus-toggle", ());
    }

    /// Timer çalışmıyorsa başlat
    async fn start(&self) {
        let _ = self.app_handle.emit("dbus-start", ());
    }

    /// Timer çalışıyorsa durdur
    async fn stop(&self) {
        let _ = self.app_handle.emit("dbus-stop", ());
    }

    /// Mevcut oturumu atla
    async fn skip(&self) {
        let _ = self.app_handle.emit("dbus-skip", ());
    }

    /// Timer'ı sıfırla
    async fn reset(&self) {
        let _ = self.app_handle.emit("dbus-reset", ());
    }

    /// Timer'a saniye ekle
    async fn extend(&self, seconds: u32) {
        let _ = self.app_handle.emit("dbus-extend", seconds);
    }

    /// Mevcut mod (work, shortBreak, longBreak)
    #[zbus(property)]
    async fn state(&self) -> String {
        self.shared_state
            .status
            .lock()
            .map(|s| s.state.clone())
            .unwrap_or_else(|e| {
                eprintln!("D-Bus state property mutex poisoned: {}", e);
                "work".to_string()
            })
    }

    /// Kalan süre (saniye)
    #[zbus(property)]
    async fn time_left(&self) -> u32 {
        self.shared_state
            .status
            .lock()
            .map(|s| s.time_left)
            .unwrap_or_else(|e| {
                eprintln!("D-Bus time_left property mutex poisoned: {}", e);
                0
            })
    }

    /// Timer aktif mi
    #[zbus(property)]
    async fn is_active(&self) -> bool {
        self.shared_state
            .status
            .lock()
            .map(|s| s.is_active)
            .unwrap_or_else(|e| {
                eprintln!("D-Bus is_active property mutex poisoned: {}", e);
                false
            })
    }

    /// Tamamlanan oturum sayısı
    #[zbus(property)]
    async fn sessions_completed(&self) -> u32 {
        self.shared_state
            .status
            .lock()
            .map(|s| s.sessions_completed)
            .unwrap_or_else(|e| {
                eprintln!("D-Bus sessions_completed property mutex poisoned: {}", e);
                0
            })
    }
}

/// D-Bus servisini başlat (tokio async task olarak)
pub async fn start_dbus_service(
    app_handle: AppHandle,
    shared_state: Arc<SharedTimerState>,
) -> Result<connection::Connection, zbus::Error> {
    let service = PomodoroService {
        shared_state,
        app_handle,
    };

    let conn = connection::Builder::session()?
        .name("com.osmandulundu.pomodoro")?
        .serve_at("/com/osmandulundu/pomodoro", service)?
        .build()
        .await?;

    Ok(conn)
}
