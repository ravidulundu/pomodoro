import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
  enableTicking: boolean;
  tickingSound: "clock" | "timer" | "none";
  enableBreakSound: boolean;
  enableStrictBreak: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  pauseWhenIdle: boolean;
}

type TimerMode = "work" | "shortBreak" | "longBreak";

function getNotificationBody(previousMode: string, currentMode: string): string {
  if (previousMode !== "work") return "Mola bitti, çalışmaya devam!";
  return currentMode === "longBreak"
    ? "Harika iş! Uzun mola zamanı."
    : "İyi çalışma! Kısa mola zamanı.";
}

async function sendTimerNotification(body: string, actionTypeId?: string) {
  const { isPermissionGranted, requestPermission, sendNotification } =
    await import("@tauri-apps/plugin-notification");
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  if (granted) {
    sendNotification({ title: "Pomodoro", body, actionTypeId });
  }
}

interface TimerState {
  timeLeft: number;
  isActive: boolean;
  mode: TimerMode;
  sessionsCompleted: number;
  lastTickTimestamp: number;
  settings: TimerSettings;
  // Actions
  tick: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  extend: (seconds?: number) => void;
  setMode: (mode: TimerMode) => void;
  setCustomTime: (mode: TimerMode, minutes: number) => void;
  incrementSessions: () => void;
  updateSettings: (settings: TimerSettings) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timeLeft: 25 * 60,
      isActive: false,
      mode: "work",
      sessionsCompleted: 0,
      lastTickTimestamp: 0,
      settings: {
        work: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
        enableTicking: false,
        tickingSound: "clock",
        enableBreakSound: true,
        enableStrictBreak: false,
        autoStartBreaks: false,
        autoStartWork: false,
        pauseWhenIdle: false,
      },

      tick: () => {
        const {
          timeLeft,
          isActive,
          mode,
          sessionsCompleted,
          settings,
        } = get();
        if (isActive && timeLeft > 1) {
          set({ timeLeft: timeLeft - 1, lastTickTimestamp: Date.now() });
        } else if (isActive && timeLeft === 1) {
          // Timer bitti
          invoke("stop_sound").catch(() => {});

          if (mode === "work") {
            // Work bitti → break'e geç
            const newSessions = sessionsCompleted + 1;
            const nextMode =
              newSessions % settings.longBreakInterval === 0
                ? "longBreak"
                : "shortBreak";

            set({
              timeLeft: settings[nextMode] * 60,
              isActive: settings.autoStartBreaks,
              mode: nextMode,
              sessionsCompleted: newSessions,
            });
          } else {
            // Break bitti → work'e geç
            set({
              timeLeft: settings.work * 60,
              isActive: settings.autoStartWork,
              mode: "work",
            });
          }

          // Tamamlanan oturumu veritabanına kaydet
          const elapsed = settings[mode] * 60;
          invoke("save_session", { state: mode, elapsed }).catch(() => {});

          // Bildirim gönder
          const soundName = mode === "work" ? "bell" : "loud-bell";
          invoke("play_sound", { name: soundName }).catch(() => {});

          const { mode: currentMode } = get();
          const body = getNotificationBody(mode, currentMode);
          const actionType = mode === "work" ? "work-done" : "break-done";
          sendTimerNotification(body, actionType).catch(() => {});
        }
      },

      incrementSessions: () => {
        const { sessionsCompleted, settings } = get();
        const newSessions = sessionsCompleted + 1;
        const nextMode =
          newSessions % settings.longBreakInterval === 0
            ? "longBreak"
            : "shortBreak";

        set({
          sessionsCompleted: newSessions,
          mode: nextMode,
          timeLeft: settings[nextMode] * 60,
        });
      },

      toggle: () =>
        set((state) => {
          const nextActive = !state.isActive;
          if (!nextActive) {
            invoke("stop_sound").catch(() => {});
          }
          return { isActive: nextActive };
        }),

      reset: () => {
        const { mode, settings } = get();
        invoke("stop_sound").catch(() => {});
        set({
          timeLeft: settings[mode] * 60,
          isActive: false,
        });
      },

      skip: () => {
        const { mode, sessionsCompleted, settings } = get();
        invoke("stop_sound").catch(() => {});

        if (mode === "work") {
          // Work → sonraki break
          const nextMode =
            (sessionsCompleted + 1) % settings.longBreakInterval === 0
              ? "longBreak"
              : "shortBreak";
          set({
            sessionsCompleted: sessionsCompleted + 1,
            mode: nextMode,
            timeLeft: settings[nextMode] * 60,
            isActive: false,
          });
        } else {
          // Break → work
          set({
            mode: "work",
            timeLeft: settings.work * 60,
            isActive: false,
          });
        }
      },

      extend: (seconds = 60) => {
        set((state) => ({
          timeLeft: state.timeLeft + seconds,
        }));
      },

      setMode: (mode) => {
        const { settings } = get();
        invoke("stop_sound").catch(() => {});
        set({
          mode,
          timeLeft: settings[mode] * 60,
          isActive: false,
        });
      },

      setCustomTime: (mode, minutes) => {
        set((state) => ({
          settings: { ...state.settings, [mode]: minutes },
          timeLeft: state.mode === mode ? minutes * 60 : state.timeLeft,
        }));
      },

      updateSettings: (newSettings) => {
        set({ settings: newSettings });
        const { mode } = get();
        set({ timeLeft: newSettings[mode] * 60, isActive: false });
      },
    }),
    {
      name: "pomodoro-storage",
      partialize: (state) => ({
        timeLeft: state.timeLeft,
        isActive: state.isActive,
        mode: state.mode,
        sessionsCompleted: state.sessionsCompleted,
        lastTickTimestamp: state.lastTickTimestamp,
        settings: state.settings,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error || !state) return;

          // Timer aktifken uygulama kapatılmışsa, geçen süreyi hesapla
          if (state.isActive && state.lastTickTimestamp > 0) {
            const elapsedMs = Date.now() - state.lastTickTimestamp;
            const elapsedSecs = Math.floor(elapsedMs / 1000);
            const newTimeLeft = state.timeLeft - elapsedSecs;

            if (newTimeLeft > 0) {
              // Timer hâlâ sürüyor, kalan süreyi güncelle
              useTimerStore.setState({
                timeLeft: newTimeLeft,
                lastTickTimestamp: Date.now(),
              });
            } else {
              // Timer süresi dolmuş, sonraki moda geç
              const { mode, settings, sessionsCompleted } = state;
              if (mode === "work") {
                const newSessions = sessionsCompleted + 1;
                const nextMode =
                  newSessions % settings.longBreakInterval === 0
                    ? "longBreak"
                    : "shortBreak";
                useTimerStore.setState({
                  timeLeft: settings[nextMode] * 60,
                  isActive: false,
                  mode: nextMode,
                  sessionsCompleted: newSessions,
                });
              } else {
                useTimerStore.setState({
                  timeLeft: settings.work * 60,
                  isActive: false,
                  mode: "work",
                });
              }

              // Tamamlanan oturumu kaydet
              const elapsed = settings[mode] * 60;
              invoke("save_session", { state: mode, elapsed }).catch(() => {});
            }
          }
        };
      },
    },
  ),
);
