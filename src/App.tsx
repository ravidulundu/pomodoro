import { StatsView } from "@/components/StatsView";
import { StrictBreakOverlay } from "@/components/StrictBreakOverlay";
import { Timer } from "@/components/Timer";
import { Button } from "@/components/ui/button";
import { useTimerStore } from "@/store/useTimerStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { BarChart3, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import "./index.css";

type Tab = "timer" | "stats";

function App() {
  const { mode, settings, isActive, timeLeft, sessionsCompleted } =
    useTimerStore();
  const [activeTab, setActiveTab] = useState<Tab>("timer");

  // Strict Break Fullscreen
  useEffect(() => {
    const fullscreen =
      settings.enableStrictBreak && mode !== "work" && isActive;
    invoke("set_fullscreen", { fullscreen }).catch(() => {});
  }, [mode, settings.enableStrictBreak, isActive]);

  // Tray icon'u moda göre güncelle
  useEffect(() => {
    invoke("update_tray_icon", { mode }).catch(() => {});
  }, [mode]);

  // D-Bus shared state'i güncelle
  useEffect(() => {
    invoke("update_timer_status", {
      mode,
      timeLeft,
      isActive,
      sessionsCompleted,
    }).catch(() => {});
  }, [mode, timeLeft, isActive, sessionsCompleted]);

  // Idle detection ayarını Rust'a senkronize et
  useEffect(() => {
    invoke("set_idle_detection", { enabled: settings.pauseWhenIdle }).catch(
      () => {},
    );
  }, [settings.pauseWhenIdle]);

  // Event listener'ları
  useEffect(() => {
    const store = useTimerStore.getState;
    const eventUnlisteners = [
      // Tray event'leri
      listen("reset-timer", () => store().reset()),
      listen("tray-start-stop", () => store().toggle()),
      listen("tray-pause-resume", () => store().toggle()),
      listen("tray-skip", () => store().skip()),
      // D-Bus event'leri
      listen("dbus-toggle", () => store().toggle()),
      listen("dbus-start", () => {
        if (!store().isActive) store().toggle();
      }),
      listen("dbus-stop", () => {
        if (store().isActive) store().toggle();
      }),
      listen("dbus-skip", () => store().skip()),
      listen("dbus-reset", () => store().reset()),
      listen<number>("dbus-extend", (event) => store().extend(event.payload)),
      // Idle detection event'leri
      listen("idle-pause", () => {
        if (store().isActive) store().toggle();
      }),
      listen("idle-resume", () => {
        if (!store().isActive) store().toggle();
      }),
    ];

    return () => {
      for (const p of eventUnlisteners) {
        p.then((unlisten) => unlisten());
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-white overflow-hidden select-none cursor-default">
      <StrictBreakOverlay />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          {activeTab === "timer" ? (
            <div className="min-h-full flex flex-col items-center justify-center animate-fade-in-up">
              <Timer />
            </div>
          ) : (
            <div className="p-4 animate-fade-in-up">
              <StatsView />
            </div>
          )}
        </div>

        {/* Global Navigation - Premium Floating */}
        <div className="flex justify-center p-6 mt-auto relative z-40">
          <div className="flex items-center p-1.5 glass-nav rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group">
            <Button
              variant={activeTab === "timer" ? "default" : "ghost"}
              size="sm"
              className={`relative rounded-xl gap-2 px-6 h-10 transition-all duration-500 ${
                activeTab === "timer"
                  ? "shadow-lg shadow-primary/30 scale-105"
                  : "hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("timer")}
            >
              <Clock
                className={`w-4 h-4 ${activeTab === "timer" ? "animate-pulse" : ""}`}
              />
              <span className="text-xs font-bold tracking-tight">
                Zamanlayıcı
              </span>
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "ghost"}
              size="sm"
              className={`relative rounded-xl gap-2 px-6 h-10 transition-all duration-500 ${
                activeTab === "stats"
                  ? "shadow-lg shadow-primary/30 scale-105"
                  : "hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("stats")}
            >
              <BarChart3
                className={`w-4 h-4 ${activeTab === "stats" ? "animate-bounce" : ""}`}
              />
              <span className="text-xs font-bold tracking-tight">
                İstatistik
              </span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
