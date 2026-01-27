import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { useTimerStore } from "@/store/useTimerStore";
import { Coffee, Wind, X } from "lucide-react";
import { useEffect } from "react";

export const StrictBreakOverlay = () => {
  const { timeLeft, mode, settings, isActive, toggle } = useTimerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive && mode !== "work") {
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, mode, toggle]);

  if (!settings.enableStrictBreak || mode === "work" || !isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-3xl animate-in fade-in duration-700">
      <div className="text-center space-y-8 animate-in zoom-in duration-1000">
        <div className="flex justify-center">
          <div className="p-6 bg-primary/10 rounded-full ring-8 ring-primary/5">
            {mode === "shortBreak" ? (
              <Coffee className="w-16 h-16 text-primary" />
            ) : (
              <Wind className="w-16 h-16 text-primary" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter sm:text-7xl tabular-nums">
            {formatTime(timeLeft)}
          </h1>
          <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">
            {mode === "shortBreak" ? "Short Break" : "Long Break"}
          </p>
        </div>

        <div className="max-w-md px-6">
          <p className="text-lg text-muted-foreground italic">
            "Deep breaths as you let go of each thought, as you let go of any
            tension in your body, as you let go of any city noises or any other
            sounds around you."
          </p>
        </div>

        <div className="pt-8 flex flex-col items-center gap-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => toggle()}
            className="rounded-full px-8 gap-2 bg-background/50 hover:bg-background border-primary/20 hover:border-primary/50 transition-all font-bold tracking-tight"
          >
            <X className="w-4 h-4" />
            Skip Break (Esc)
          </Button>

          <div className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] font-bold">
            Strict Mode Active
          </div>
        </div>
      </div>
    </div>
  );
};
