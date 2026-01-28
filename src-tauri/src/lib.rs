mod audio;
pub mod cli;
mod db;
mod dbus;
mod idle;

use audio::AudioPlayer;
use db::{Database, DayStat};
use dbus::SharedTimerState;
use idle::IdleDetector;

use std::sync::Arc;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use std::path::PathBuf;

fn resolve_path(app: &AppHandle, name: &str, subdir: &str) -> Option<PathBuf> {
    // Production: Tauri bundle resource dizini
    if let Ok(path) = app
        .path()
        .resolve(name, tauri::path::BaseDirectory::Resource)
    {
        if path.exists() {
            return Some(path);
        }
    }
    // System-wide kurulum: /usr/share/pomodoro-tauri/
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            let sys_path = exe_dir.join("../share/pomodoro-tauri").join(name);
            if sys_path.exists() {
                return Some(sys_path);
            }
        }
    }
    // Dev modu: proje dizini
    if let Ok(cwd) = std::env::current_dir() {
        let dev_path = cwd.join(subdir).join(name);
        if dev_path.exists() {
            return Some(dev_path);
        }
    }
    None
}

// -- Ses Komutları (rodio) --

#[tauri::command]
fn play_sound(
    app: AppHandle,
    player: State<'_, AudioPlayer>,
    name: String,
) -> Result<(), String> {
    let sound_name = format!("{}.ogg", name);
    let sound_path = resolve_path(&app, &sound_name, "../public/sounds")
        .ok_or_else(|| format!("Sound not found: {}", sound_name))?;

    player.play(&sound_path, 0)
}

#[tauri::command]
fn play_sound_loop(
    app: AppHandle,
    player: State<'_, AudioPlayer>,
    name: String,
) -> Result<(), String> {
    let sound_name = format!("{}.ogg", name);
    let sound_path = resolve_path(&app, &sound_name, "../public/sounds")
        .ok_or_else(|| format!("Sound not found: {}", sound_name))?;

    // Ticking sesleri: 1.5s fade-in, döngüde çal
    player.play_loop(&sound_path, 1500)
}

#[tauri::command]
fn stop_sound(player: State<'_, AudioPlayer>) -> Result<(), String> {
    player.stop();
    Ok(())
}

// -- Pencere Komutları --

#[tauri::command]
fn set_always_on_top(window: tauri::Window, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_fullscreen(window: tauri::Window, fullscreen: bool) -> Result<(), String> {
    window
        .set_fullscreen(fullscreen)
        .map_err(|e| e.to_string())
}

// -- Tray Komutları --

#[tauri::command]
fn update_tray_icon(app: AppHandle, mode: String) -> Result<(), String> {
    let tray = app.tray_by_id("main_tray").ok_or("Tray not found")?;

    let icon_file = match mode.as_str() {
        "work" => "work.png",
        "shortBreak" => "short-break.png",
        "longBreak" => "long-break.png",
        _ => "work.png",
    };

    if let Some(icon_path) = resolve_path(&app, icon_file, "icons") {
        match Image::from_path(&icon_path) {
            Ok(icon) => {
                let _ = tray.set_icon(Some(icon));
            }
            Err(_) => {
                if let Some(icon) = app.default_window_icon() {
                    let _ = tray.set_icon(Some(icon.clone()));
                }
            }
        }
    } else if let Some(icon) = app.default_window_icon() {
        let _ = tray.set_icon(Some(icon.clone()));
    }

    Ok(())
}

// -- Veritabanı Komutları --

#[tauri::command]
fn save_session(
    db: State<'_, Database>,
    state: String,
    elapsed: f64,
) -> Result<(), String> {
    db.save_session(&state, elapsed).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_daily_stats(db: State<'_, Database>, date: String) -> Result<DayStat, String> {
    db.get_daily_stats(&date).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_weekly_stats(
    db: State<'_, Database>,
    week_start: String,
) -> Result<Vec<DayStat>, String> {
    db.get_weekly_stats(&week_start).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_monthly_stats(
    db: State<'_, Database>,
    year: i32,
    month: u32,
) -> Result<Vec<DayStat>, String> {
    db.get_monthly_stats(year, month)
        .map_err(|e| e.to_string())
}

// -- Idle Detection --

#[tauri::command]
fn set_idle_detection(idle: State<'_, IdleDetector>, enabled: bool) -> Result<(), String> {
    idle.set_enabled(enabled);
    Ok(())
}

// -- D-Bus Durum Güncelleme --

#[tauri::command]
fn update_timer_status(
    shared_state: State<'_, Arc<SharedTimerState>>,
    mode: String,
    time_left: u32,
    is_active: bool,
    sessions_completed: u32,
) -> Result<(), String> {
    shared_state.update(mode, time_left, is_active, sessions_completed);
    Ok(())
}

// -- Tray Yapılandırması --

fn build_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let toggle = MenuItem::with_id(app, "toggle", "Göster/Gizle", true, None::<&str>)?;
    let start_stop =
        MenuItem::with_id(app, "start_stop", "Başlat/Durdur", true, None::<&str>)?;
    let pause_resume =
        MenuItem::with_id(app, "pause_resume", "Duraklat/Devam", true, None::<&str>)?;
    let skip = MenuItem::with_id(app, "skip", "Atla", true, None::<&str>)?;
    let reset = MenuItem::with_id(app, "reset", "Sıfırla", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;

    let tray_menu = Menu::with_items(
        app,
        &[&toggle, &start_stop, &pause_resume, &skip, &reset, &quit],
    )?;

    let _tray = TrayIconBuilder::with_id("main_tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .tooltip("pomodoro")
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray: &TrayIcon, event: TrayIconEvent| {
            if let TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
            "toggle" => {
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "start_stop" => {
                let _ = app.emit("tray-start-stop", ());
            }
            "pause_resume" => {
                let _ = app.emit("tray-pause-resume", ());
            }
            "skip" => {
                let _ = app.emit("tray-skip", ());
            }
            "reset" => {
                let _ = app.emit("reset-timer", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

// -- Uygulama Giriş Noktası --

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Audio player başlat (rodio)
            let player =
                AudioPlayer::new().expect("Failed to initialize audio player");
            app.manage(player);

            // Veritabanı başlat
            let app_data_dir = app.path().app_data_dir()?;
            let database =
                Database::new(app_data_dir).expect("Failed to initialize database");
            app.manage(database);

            // D-Bus paylaşılan durum ve servisi
            let shared_state = Arc::new(SharedTimerState::new());
            app.manage(shared_state.clone());

            let dbus_handle = app.handle().clone();
            let dbus_state = shared_state.clone();
            tauri::async_runtime::spawn(async move {
                let _conn = match dbus::start_dbus_service(dbus_handle, dbus_state).await {
                    Ok(conn) => conn,
                    Err(e) => {
                        eprintln!("D-Bus service failed to start: {}", e);
                        return;
                    }
                };
                // D-Bus bağlantısı uygulama ömrü boyunca canlı kalmalı
                std::future::pending::<()>().await;
            });

            // Idle detection başlat
            let idle_detector = IdleDetector::new();
            idle_detector.start(app.handle().clone());
            app.manage(idle_detector);

            // Tray oluştur
            build_tray(app)?;



            // Global kısayol: Ctrl+Alt+P → timer toggle
            app.global_shortcut().on_shortcut(
                "ctrl+alt+p",
                |app_handle: &AppHandle, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = app_handle.emit("tray-start-stop", ());
                    }
                },
            )?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            set_always_on_top,
            update_tray_icon,
            set_fullscreen,
            play_sound,
            play_sound_loop,
            stop_sound,
            save_session,
            get_daily_stats,
            get_weekly_stats,
            get_monthly_stats,
            update_timer_status,
            set_idle_detection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
