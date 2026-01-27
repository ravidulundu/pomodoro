import { Button } from "@/components/ui/button";
import { useTimerStore } from "@/store/useTimerStore";
import { invoke } from "@tauri-apps/api/core";
import {
  Brain,
  Coffee,
  Pause,
  Pin,
  PinOff,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AboutDialog } from "./AboutDialog";
import { CircularProgress } from "./CircularProgress";
import { SettingsModal } from "./SettingsModal";

const modeLabels: Record<string, string> = {
  work: "Odaklan",
  shortBreak: "Kısa Mola",
  longBreak: "Uzun Mola",
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function SessionDots({
  sessionsCompleted,
  longBreakInterval,
}: Readonly<{ sessionsCompleted: number; longBreakInterval: number }>) {
  const remainder = sessionsCompleted % longBreakInterval;
  let filledDots = 0;
  if (remainder > 0) {
    filledDots = remainder;
  } else if (sessionsCompleted > 0) {
    filledDots = longBreakInterval;
  }

  return (
    <div className="flex space-x-1">
      {Array.from({ length: longBreakInterval }, (_, i) => (
        <div
          key={i + 1}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 <= filledDots ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-2 font-mono">
        Oturum {sessionsCompleted + 1}
      </span>
    </div>
  );
}

function useSoundEffect(
  isActive: boolean,
  mode: string,
  settings: {
    enableTicking: boolean;
    tickingSound: string;
    enableBreakSound: boolean;
  },
) {
  useEffect(() => {
    if (!isActive) {
      invoke("stop_sound").catch(() => {});
      return;
    }

    if (
      mode === "work" &&
      settings.enableTicking &&
      settings.tickingSound !== "none"
    ) {
      invoke("play_sound_loop", { name: settings.tickingSound }).catch(
        () => {},
      );
    } else if (mode !== "work" && settings.enableBreakSound) {
      invoke("play_sound_loop", { name: "birds" }).catch(() => {});
    } else {
      invoke("stop_sound").catch(() => {});
    }

    return () => {
      invoke("stop_sound").catch(() => {});
    };
  }, [
    isActive,
    mode,
    settings.enableTicking,
    settings.tickingSound,
    settings.enableBreakSound,
  ]);
}

function ModeSwitcher({
  mode,
  setMode,
}: Readonly<{
  mode: string;
  setMode: (mode: "work" | "shortBreak" | "longBreak") => void;
}>) {
  return (
    <div className="flex glass-nav p-1 rounded-2xl border border-white/5">
      <Button
        variant={mode === "work" ? "default" : "ghost"}
        size="sm"
        onClick={() => setMode("work")}
        className="rounded-xl px-6 gap-2"
      >
        <Brain className="w-4 h-4" /> Focus
      </Button>
      <Button
        variant={mode === "shortBreak" ? "default" : "ghost"}
        size="sm"
        onClick={() => setMode("shortBreak")}
        className="rounded-xl px-6 gap-2"
      >
        <Coffee className="w-4 h-4" /> Break
      </Button>
    </div>
  );
}

function TimerControls({
  isActive,
  toggle,
  reset,
  skip,
}: Readonly<{
  isActive: boolean;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
}>) {
  return (
    <div className="flex items-center space-x-6">
      <Button
        variant="outline"
        size="icon"
        className="group relative rounded-2xl w-12 h-12 glass-card premium-border overflow-hidden"
        onClick={reset}
        title="Sıfırla"
      >
        <div className="premium-glow" />
        <RotateCcw className="w-5 h-5 relative z-10 transition-transform group-hover:-rotate-45" />
      </Button>

      <Button
        size="lg"
        className="group relative w-18 h-18 rounded-[1.75rem] shadow-2xl shadow-primary/40 overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95"
        onClick={toggle}
      >
        <div className="absolute inset-0 bg-linear-to-tr from-primary to-primary/80" />
        <div className="premium-glow" />
        {isActive ? (
          <Pause className="w-7 h-7 fill-current relative z-10" />
        ) : (
          <Play className="w-7 h-7 fill-current translate-x-0.5 relative z-10" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="group relative rounded-2xl w-12 h-12 glass-card premium-border overflow-hidden"
        onClick={skip}
        title="Atla"
      >
        <div className="premium-glow" />
        <SkipForward className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </div>
  );
}

export const Timer = () => {
  const {
    timeLeft,
    isActive,
    mode,
    sessionsCompleted,
    settings,
    tick,
    toggle,
    reset,
    skip,
    extend,
    setMode,
  } = useTimerStore();

  const totalTime = settings[mode] * 60;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const isPaused = !isActive && timeLeft < totalTime && timeLeft > 0;
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const toggleAlwaysOnTop = async () => {
    const newState = !isAlwaysOnTop;
    await invoke("set_always_on_top", { alwaysOnTop: newState }).catch(
      () => {},
    );
    setIsAlwaysOnTop(newState);
  };

  useSoundEffect(isActive, mode, settings);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, tick]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg mx-auto pt-10 pb-4 px-4 space-y-4">
      {/* Üst Araç Çubuğu - Floating */}
      <div className="absolute top-0 right-1 flex items-center space-x-1 z-50 transform translate-y-1">
        <Button
          variant="ghost"
          size="icon"
          className={`w-7 h-7 rounded-full ${isAlwaysOnTop ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
          onClick={toggleAlwaysOnTop}
          title={isAlwaysOnTop ? "Üstte Tutmayı Kapat" : "Her Zaman Üstte Tut"}
        >
          {isAlwaysOnTop ? (
            <PinOff className="w-3.5 h-3.5" />
          ) : (
            <Pin className="w-3.5 h-3.5" />
          )}
        </Button>
        <SettingsModal />
        <AboutDialog />
      </div>

      <ModeSwitcher mode={mode} setMode={setMode} />

      {/* Circular Progress + Timer in a Premium Container */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <CircularProgress
          progress={progress}
          size={210}
          strokeWidth={6}
          isPaused={isPaused}
        >
          <div className="flex flex-col items-center relative">
            <div
              className={`text-4xl font-black tracking-tighter tabular-nums text-premium ${
                isPaused ? "animate-pause-blink" : ""
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mt-1 opacity-60">
              {modeLabels[mode]}
            </span>
          </div>
        </CircularProgress>
      </div>

      <SessionDots
        sessionsCompleted={sessionsCompleted}
        longBreakInterval={settings.longBreakInterval}
      />

      <TimerControls
        isActive={isActive}
        toggle={toggle}
        reset={reset}
        skip={skip}
      />

      {/* Extend butonu */}
      <div className="h-6">
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            onClick={() => extend(60)}
          >
            <Plus className="w-3 h-3 mr-1" /> 1 dk uzat
          </Button>
        )}
      </div>

      {/* Alt Etiket - Basit */}
      <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-40 pt-4">
        {mode === "work" ? "Odaklanma Seansı" : "Mola Zamanı"}
      </div>
    </div>
  );
};
