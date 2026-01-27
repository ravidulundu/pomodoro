import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

export const TitleBar = () => {
  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  };
  const handleClose = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="h-10 w-full flex items-center justify-between px-3 bg-transparent select-none fixed top-0 left-0 z-50 cursor-default border-b border-white/5"
    >
      {/* Window Controls - Left (Consistent with user's screenshot) */}
      <div className="flex items-center space-x-2 z-50">
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors group"
          title="Kapat"
        >
          <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 flex items-center justify-center transition-colors group"
          title="Tam Ekran"
        >
          <Square className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100" />
        </button>
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 flex items-center justify-center transition-colors group"
          title="Küçült"
        >
          <Minus className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100" />
        </button>
      </div>

      {/* Centered Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
        <img
          src="/icons/32x32/kde-pomodoro.png"
          alt="Logo"
          className="w-4 h-4 opacity-70"
        />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-premium">
          Pomodoro
        </span>
      </div>

      {/* Right Spacer to maintain balance (if needed) */}
      <div className="w-16 h-full pointer-events-none"></div>
    </div>
  );
};
