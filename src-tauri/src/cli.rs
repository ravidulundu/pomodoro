use clap::{Parser, Subcommand};
use zbus::Connection;

#[derive(Parser)]
#[command(name = "pomodoro", about = "pomodoro - CachyOS")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Timer'ı başlat/duraklat (toggle)
    Toggle,
    /// Timer'ı başlat
    Start,
    /// Timer'ı durdur
    Stop,
    /// Mevcut oturumu atla
    Skip,
    /// Timer'ı sıfırla
    Reset,
    /// Timer'a süre ekle (varsayılan 60 saniye)
    Extend {
        #[arg(default_value = "60")]
        seconds: u32,
    },
    /// Timer durumunu göster
    Status,
}

/// D-Bus üzerinden çalışan uygulamaya komut gönder.
/// Başarılı olursa true döner (uygulama çalışıyordu), false döner (bağlantı yok).
pub async fn handle_cli(command: &Commands) -> Result<bool, Box<dyn std::error::Error>> {
    let conn = match Connection::session().await {
        Ok(c) => c,
        Err(_) => return Ok(false),
    };

    let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
        .destination("com.osmandulundu.pomodoro")?
        .path("/com/osmandulundu/pomodoro")?
        .interface("com.osmandulundu.pomodoro")?
        .build()
        .await?;

    match command {
        Commands::Toggle => {
            proxy.call_noreply("Toggle", &()).await?;
            println!("Timer toggled.");
        }
        Commands::Start => {
            proxy.call_noreply("Start", &()).await?;
            println!("Timer started.");
        }
        Commands::Stop => {
            proxy.call_noreply("Stop", &()).await?;
            println!("Timer stopped.");
        }
        Commands::Skip => {
            proxy.call_noreply("Skip", &()).await?;
            println!("Session skipped.");
        }
        Commands::Reset => {
            proxy.call_noreply("Reset", &()).await?;
            println!("Timer reset.");
        }
        Commands::Extend { seconds } => {
            proxy.call_noreply("Extend", &(*seconds,)).await?;
            println!("Timer extended by {} seconds.", seconds);
        }
        Commands::Status => {
            let state: String = proxy.get_property("State").await?;
            let time_left: u32 = proxy.get_property("TimeLeft").await?;
            let is_active: bool = proxy.get_property("IsActive").await?;
            let sessions: u32 = proxy.get_property("SessionsCompleted").await?;

            let mins = time_left / 60;
            let secs = time_left % 60;
            let status = if is_active { "Çalışıyor" } else { "Duraklatıldı" };
            let mode_tr = match state.as_str() {
                "work" => "Odaklan",
                "shortBreak" => "Kısa Mola",
                "longBreak" => "Uzun Mola",
                _ => &state,
            };

            println!("Mod: {} | {} | {:02}:{:02} | Oturum: {}", mode_tr, status, mins, secs, sessions);
        }
    }

    Ok(true)
}
