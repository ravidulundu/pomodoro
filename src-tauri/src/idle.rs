use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use zbus::Connection;

/// Idle algılama modülü.
/// KDE Plasma'nın org.freedesktop.ScreenSaver D-Bus arayüzünü kullanarak
/// kullanıcının boşta kalma süresini izler.
/// Eşik aşıldığında timer'ı duraklatır, kullanıcı döndüğünde devam ettirir.

const IDLE_THRESHOLD_SECS: u64 = 300; // 5 dakika
const POLL_INTERVAL_SECS: u64 = 10;

pub struct IdleDetector {
    enabled: Arc<AtomicBool>,
}

impl IdleDetector {
    pub fn new() -> Self {
        Self {
            enabled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, Ordering::SeqCst);
    }

    /// Arka plan görevi olarak idle algılamayı başlat
    pub fn start(&self, app_handle: AppHandle) {
        let enabled = self.enabled.clone();

        tauri::async_runtime::spawn(async move {
            let conn = match Connection::session().await {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Idle detection: D-Bus bağlantısı kurulamadı: {}", e);
                    return;
                }
            };

            let proxy: zbus::Proxy<'_> = match zbus::proxy::Builder::new(&conn)
                .destination("org.freedesktop.ScreenSaver")
                .expect("valid destination")
                .path("/ScreenSaver")
                .expect("valid path")
                .interface("org.freedesktop.ScreenSaver")
                .expect("valid interface")
                .build()
                .await
            {
                Ok(p) => p,
                Err(e) => {
                    eprintln!("Idle detection: Proxy oluşturulamadı: {}", e);
                    return;
                }
            };

            let mut was_idle = false;

            loop {
                tokio::time::sleep(Duration::from_secs(POLL_INTERVAL_SECS)).await;

                if !enabled.load(Ordering::SeqCst) {
                    was_idle = false;
                    continue;
                }

                let idle_ms: u32 = match proxy.call("GetSessionIdleTime", &()).await {
                    Ok(r) => r,
                    Err(_) => continue,
                };

                let idle_secs = (idle_ms / 1000) as u64;
                let is_idle = idle_secs >= IDLE_THRESHOLD_SECS;

                if is_idle && !was_idle {
                    // Kullanıcı boşta kaldı → timer'ı duraklat
                    let _ = app_handle.emit("idle-pause", ());
                } else if !is_idle && was_idle {
                    // Kullanıcı döndü → bildirim gönder
                    let _ = app_handle.emit("idle-resume", ());
                }

                was_idle = is_idle;
            }
        });
    }
}
