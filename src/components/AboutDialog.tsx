import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Timer } from "lucide-react";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
          title="Hakkında"
        >
          <Info className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-72">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            pomodoro
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-mono text-xs">v0.1.0</p>
          <p>CachyOS / Arch Linux için geliştirilmiş Pomodoro zamanlayıcısı.</p>
          <div className="pt-2 border-t text-xs space-y-1">
            <p>Tauri v2 + React + Rust</p>
            <p>Geliştirici: Osman Dulundu</p>
          </div>
          <div className="pt-2 border-t text-xs">
            <p className="font-medium text-foreground mb-1">Kısayollar</p>
            <p>Ctrl+Alt+P — Timer başlat/duraklat</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
