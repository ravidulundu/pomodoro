// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;
use pomodoro_lib::cli::{Cli, handle_cli};

fn main() {
    let cli = Cli::parse();

    if let Some(command) = &cli.command {
        // CLI komutu varsa D-Bus üzerinden çalışan uygulamaya gönder
        let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");
        match rt.block_on(handle_cli(command)) {
            Ok(true) => {}
            Ok(false) => {
                eprintln!("Pomodoro uygulaması çalışmıyor. Önce uygulamayı başlatın.");
                std::process::exit(1);
            }
            Err(e) => {
                eprintln!("D-Bus hatası: {}", e);
                std::process::exit(1);
            }
        }
    } else {
        // Argüman yoksa uygulamayı normal başlat
        pomodoro_lib::run();
    }
}
