use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;

pub struct AudioPlayer {
    _stream: OutputStream,
    stream_handle: OutputStreamHandle,
    sink: Mutex<Option<Sink>>,
}

// rodio::OutputStream, cpal::Stream içerir ve PhantomData<*mut ()> nedeniyle !Send/!Sync'tir.
// Güvenlik gerekçesi:
// - `_stream`: Sadece lifetime için tutulur, hiçbir yerde erişilmez.
// - `stream_handle`: OutputStreamHandle dahili olarak Arc tabanlıdır, thread-safe paylaşılır.
// - `sink`: Mutex<Option<Sink>> ile korunur.
unsafe impl Send for AudioPlayer {}
unsafe impl Sync for AudioPlayer {}

impl AudioPlayer {
    pub fn new() -> Result<Self, String> {
        let (stream, handle) =
            OutputStream::try_default().map_err(|e| format!("Audio init failed: {}", e))?;
        Ok(Self {
            _stream: stream,
            stream_handle: handle,
            sink: Mutex::new(None),
        })
    }

    /// Ses dosyasını oynat (one-shot, fade-in ile)
    pub fn play(&self, path: &PathBuf, fade_in_ms: u64) -> Result<(), String> {
        self.stop();

        let file =
            File::open(path).map_err(|e| format!("Failed to open sound: {}", e))?;
        let reader = BufReader::new(file);
        let source =
            Decoder::new(reader).map_err(|e| format!("Failed to decode sound: {}", e))?;

        let sink = Sink::try_new(&self.stream_handle)
            .map_err(|e| format!("Failed to create sink: {}", e))?;

        if fade_in_ms > 0 {
            sink.append(source.fade_in(Duration::from_millis(fade_in_ms)));
        } else {
            sink.append(source);
        }

        let mut guard = self.sink.lock().map_err(|_| "Lock failed")?;
        *guard = Some(sink);
        Ok(())
    }

    /// Ses dosyasını döngüde oynat (ticking sesleri için)
    pub fn play_loop(&self, path: &PathBuf, fade_in_ms: u64) -> Result<(), String> {
        self.stop();

        let file =
            File::open(path).map_err(|e| format!("Failed to open sound: {}", e))?;
        let reader = BufReader::new(file);
        let source =
            Decoder::new(reader).map_err(|e| format!("Failed to decode sound: {}", e))?;

        let sink = Sink::try_new(&self.stream_handle)
            .map_err(|e| format!("Failed to create sink: {}", e))?;

        let looped = source.repeat_infinite();
        if fade_in_ms > 0 {
            sink.append(looped.fade_in(Duration::from_millis(fade_in_ms)));
        } else {
            sink.append(looped);
        }

        let mut guard = self.sink.lock().map_err(|_| "Lock failed")?;
        *guard = Some(sink);
        Ok(())
    }

    /// Sesi durdur
    pub fn stop(&self) {
        match self.sink.lock() {
            Ok(mut guard) => {
                if let Some(sink) = guard.take() {
                    sink.stop();
                }
            }
            Err(e) => eprintln!("AudioPlayer::stop mutex poisoned: {}", e),
        }
    }

}
