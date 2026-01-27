import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimerStore, type TimerSettings } from "@/store/useTimerStore";
import { Settings2 } from "lucide-react";
import { useState } from "react";

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between group cursor-pointer"
    >
      <span className="flex-1 py-1 font-medium text-sm">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border border-primary/50 bg-background text-primary focus:ring-primary accent-primary cursor-pointer shrink-0 transition-all checked:bg-primary"
      />
    </label>
  );
}

export function SettingsModal() {
  const { settings, updateSettings } = useTimerStore();
  const [tempSettings, setTempSettings] = useState<TimerSettings>(settings);

  const handleSave = () => {
    updateSettings(tempSettings);
  };

  const update = (partial: Partial<TimerSettings>) => {
    setTempSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <Dialog onOpenChange={(open) => open && setTempSettings(settings)}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          title="Ayarlar"
        >
          <Settings2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card border-white/20 p-4">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-xl font-bold text-premium">
            Ayarlar
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 max-h-87.5 overflow-y-auto pr-2 scrollbar-hide">
          {/* Süre Ayarları Grubu */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="work" className="font-medium">
                Odaklanma (dk)
              </Label>
              <Input
                id="work"
                type="number"
                value={tempSettings.work}
                onChange={(e) =>
                  update({ work: Number.parseInt(e.target.value) || 1 })
                }
                className="w-24 h-8 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="shortBreak" className="font-medium">
                Kısa Mola (dk)
              </Label>
              <Input
                id="shortBreak"
                type="number"
                value={tempSettings.shortBreak}
                onChange={(e) =>
                  update({ shortBreak: Number.parseInt(e.target.value) || 1 })
                }
                className="w-24 h-8 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-white/5 border border-white/5">
              <Label htmlFor="longBreak" className="font-medium">
                Uzun Mola (dk)
              </Label>
              <Input
                id="longBreak"
                type="number"
                value={tempSettings.longBreak}
                onChange={(e) =>
                  update({ longBreak: Number.parseInt(e.target.value) || 1 })
                }
                className="w-24 h-8 bg-background/50 border-white/10 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Ses ve Gelişmiş Ayarlar */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between p-1">
              <Label htmlFor="ticking" className="font-medium opacity-80">
                Tıkırtı Sesi
              </Label>
              <select
                id="ticking"
                className="h-9 w-32 rounded-lg border border-white/10 bg-white/5 px-3 text-sm focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                value={tempSettings.tickingSound}
                onChange={(e) =>
                  update({
                    tickingSound: e.target
                      .value as TimerSettings["tickingSound"],
                    enableTicking: e.target.value !== "none",
                  })
                }
              >
                <option value="none">Kapalı</option>
                <option value="clock">Saat</option>
                <option value="timer">Dijital</option>
              </select>
            </div>

            <ToggleRow
              id="break-sound"
              label="Molada Doğa Sesleri"
              checked={tempSettings.enableBreakSound}
              onChange={(checked) => update({ enableBreakSound: checked })}
            />
            <ToggleRow
              id="strict-break"
              label="Sıkı Mola (Tam Ekran)"
              checked={tempSettings.enableStrictBreak}
              onChange={(checked) => update({ enableStrictBreak: checked })}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <ToggleRow
              id="auto-start-breaks"
              label="Molaları Otomatik Başlat"
              checked={tempSettings.autoStartBreaks}
              onChange={(checked) => update({ autoStartBreaks: checked })}
            />
            <ToggleRow
              id="auto-start-work"
              label="Çalışmayı Otomatik Başlat"
              checked={tempSettings.autoStartWork}
              onChange={(checked) => update({ autoStartWork: checked })}
            />
          </div>
        </div>

        <DialogClose asChild>
          <button
            onClick={handleSave}
            className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold transition-all text-primary-foreground"
          >
            Kaydet
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
