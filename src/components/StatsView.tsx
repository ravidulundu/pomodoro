import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface DayStat {
  date: string;
  count: number;
  total_minutes: number;
}

type ViewMode = "daily" | "weekly" | "monthly";

function formatDateTR(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatWeekRange(startStr: string): string {
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("tr-TR", opts)} – ${end.toLocaleDateString("tr-TR", opts)}`;
}

function formatMonthTR(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getDaysOfWeek(mondayStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));
}

function getDaysOfMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  return days;
}

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
};

const VIEW_MODE_SUMMARIES: Record<ViewMode, string> = {
  daily: "GÜNLÜK ÖZET",
  weekly: "HAFTALIK PLAN",
  monthly: "AYLIK DURUM",
};

function BarChart({
  data,
  labels,
  maxValue,
}: Readonly<{ data: number[]; labels: string[]; maxValue: number }>) {
  const barMax = Math.max(maxValue, 1);
  return (
    <div className="flex items-end justify-between gap-1.5 h-40 w-full px-2">
      {data.map((value, i) => (
        <div
          key={labels[i]}
          className="flex flex-col items-center flex-1 group/bar h-full justify-end"
        >
          <span className="text-[10px] font-bold text-primary opacity-0 group-hover/bar:opacity-100 transition-opacity mb-1 tabular-nums">
            {value > 0 ? value : ""}
          </span>
          <div
            className="w-full bg-linear-to-t from-primary/80 to-primary/30 rounded-t-lg transition-all duration-500 min-h-[2px] group-hover/bar:from-primary group-hover/bar:to-primary/50 group-hover/bar:shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            style={{ height: `${(value / barMax) * 85}%` }}
          />
          <span className="text-[10px] font-medium text-muted-foreground mt-2 opacity-60">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatsView() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDate, setCurrentDate] = useState(getToday());
  const [weekStart, setWeekStart] = useState(getMondayOfWeek(getToday()));
  const [monthYear, setMonthYear] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [dailyStat, setDailyStat] = useState<DayStat | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DayStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<DayStat[]>([]);

  const fetchDaily = useCallback(async () => {
    try {
      const stat = await invoke<DayStat>("get_daily_stats", {
        date: currentDate,
      });
      setDailyStat(stat);
    } catch {
      setDailyStat({ date: currentDate, count: 0, total_minutes: 0 });
    }
  }, [currentDate]);

  const fetchWeekly = useCallback(async () => {
    try {
      const stats = await invoke<DayStat[]>("get_weekly_stats", { weekStart });
      setWeeklyStats(stats);
    } catch {
      setWeeklyStats([]);
    }
  }, [weekStart]);

  const fetchMonthly = useCallback(async () => {
    try {
      const stats = await invoke<DayStat[]>("get_monthly_stats", {
        year: monthYear.year,
        month: monthYear.month,
      });
      setMonthlyStats(stats);
    } catch {
      setMonthlyStats([]);
    }
  }, [monthYear]);

  useEffect(() => {
    if (viewMode === "daily") fetchDaily();
    if (viewMode === "weekly") fetchWeekly();
    if (viewMode === "monthly") fetchMonthly();
  }, [viewMode, fetchDaily, fetchWeekly, fetchMonthly]);

  const navigate = (direction: -1 | 1) => {
    if (viewMode === "daily") {
      setCurrentDate((d) => addDays(d, direction));
    } else if (viewMode === "weekly") {
      setWeekStart((w) => addDays(w, direction * 7));
    } else {
      setMonthYear((my) => {
        let m = my.month + direction;
        let y = my.year;
        if (m < 1) {
          m = 12;
          y--;
        }
        if (m > 12) {
          m = 1;
          y++;
        }
        return { year: y, month: m };
      });
    }
  };

  // Haftalık veri hazırlama
  const weekDays = getDaysOfWeek(weekStart);
  const weekData = weekDays.map(
    (day) => weeklyStats.find((s) => s.date === day)?.count ?? 0,
  );
  const weekMax = Math.max(...weekData, 1);

  // Aylık veri hazırlama
  const monthDays = getDaysOfMonth(monthYear.year, monthYear.month);
  const monthData = monthDays.map(
    (day) => monthlyStats.find((s) => s.date === day)?.count ?? 0,
  );
  const monthMax = Math.max(...monthData, 1);
  const totalMonthPomodoros = monthData.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center p-4 space-y-4 w-full max-w-2xl mx-auto h-full overflow-hidden">
      {/* Görünüm sekmeleri */}
      <div className="flex glass-nav p-1 rounded-2xl border border-white/10 shadow-xl">
        {(["daily", "weekly", "monthly"] as const).map((m) => (
          <Button
            key={m}
            variant={viewMode === m ? "default" : "ghost"}
            size="sm"
            className={`rounded-xl text-xs px-6 h-9 transition-all duration-500 font-bold ${
              viewMode === m
                ? "shadow-lg shadow-primary/20 scale-105"
                : "hover:bg-white/5 opacity-60 hover:opacity-100"
            }`}
            onClick={() => setViewMode(m)}
          >
            {VIEW_MODE_LABELS[m]}
          </Button>
        ))}
      </div>

      {/* Navigasyon Paneli */}
      <div className="flex items-center justify-between w-full glass-card p-4 rounded-3xl premium-border shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold tracking-tight text-premium uppercase">
            {VIEW_MODE_SUMMARIES[viewMode]}
          </span>
          <span className="text-lg font-black tabular-nums">
            {viewMode === "daily" && formatDateTR(currentDate)}
            {viewMode === "weekly" && formatWeekRange(weekStart)}
            {viewMode === "monthly" &&
              formatMonthTR(monthYear.year, monthYear.month)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-white/10"
          onClick={() => navigate(1)}
        >
          <ChevronRight className="w-5 h-5 text-primary" />
        </Button>
      </div>

      {/* İstatistik İçeriği */}
      <div className="w-full flex-1 min-h-80">
        {viewMode === "daily" && dailyStat && (
          <div className="glass-card p-10 rounded-[2.5rem] premium-border flex flex-col items-center justify-center space-y-8 animate-fade-in-up h-full text-center">
            <div className="relative group">
              <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
              <div className="text-8xl font-black text-premium tabular-nums relative">
                {dailyStat.count}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                tamamlanan pomodoro
              </div>
              <div className="text-xl font-medium">
                {Math.round(dailyStat.total_minutes)}{" "}
                <span className="text-xs text-muted-foreground italic">
                  dakika odaklanma
                </span>
              </div>
            </div>
          </div>
        )}

        {viewMode === "weekly" && (
          <div className="glass-card p-6 rounded-[2.5rem] premium-border space-y-8 animate-fade-in-up h-full flex flex-col justify-center">
            <div className="h-48 flex items-end">
              <BarChart
                data={weekData}
                labels={DAY_LABELS}
                maxValue={weekMax}
              />
            </div>
            <div className="flex items-center justify-between px-4 pt-6 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  Haftalık Performans
                </span>
                <span className="text-2xl font-black text-premium">
                  {weekData.reduce((a, b) => a + b, 0)}{" "}
                  <span className="text-xs font-medium opacity-50">Pomo</span>
                </span>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        )}

        {viewMode === "monthly" && (
          <div className="glass-card p-6 rounded-[2.5rem] premium-border space-y-8 animate-fade-in-up h-full flex flex-col justify-center">
            <div className="flex items-end justify-between gap-1 h-32 w-full px-1">
              {monthData.map((value, i) => (
                <div
                  key={monthDays[i]}
                  className="flex-1 bg-linear-to-t from-primary/80 to-primary/20 hover:from-primary rounded-t-sm transition-all duration-500 min-h-[2px] hover:shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                  style={{ height: `${(value / monthMax) * 100}%` }}
                  title={`${monthDays[i]}: ${value} pomodoro`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between px-4 pt-6 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  Aylık Toplam
                </span>
                <span className="text-2xl font-black text-premium">
                  {totalMonthPomodoros}{" "}
                  <span className="text-xs font-medium opacity-50">Pomo</span>
                </span>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
