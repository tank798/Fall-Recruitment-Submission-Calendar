import type { Schedule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TimeAxisEventCard } from "./TimeAxisEventCard";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getDateMeta(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return {
    label: `${month}月${day}日`,
    weekday: WEEKDAYS[weekday],
    isWeekend: weekday === 0 || weekday === 6,
  };
}

export function DateColumn({
  date,
  schedules,
  today,
  onSelect,
}: {
  date: string;
  schedules: Schedule[];
  today: string;
  onSelect: (schedule: Schedule) => void;
}) {
  const { label, weekday, isWeekend } = getDateMeta(date);
  const isToday = date === today;
  const isExpanded = schedules.length > 6;

  return (
    <section
      aria-label={`${label} ${weekday}，${schedules.length} 条日程`}
      className={cn(
        "time-axis-column flex flex-col border-r border-[#eff0f1] bg-white",
        isWeekend && "bg-[#fcfcfb]",
        isToday && "bg-[#f8faff]",
      )}
      data-date={date}
    >
      <header
        className={cn(
          "flex h-[66px] shrink-0 flex-col items-center justify-center border-b border-[#eff0f1]",
          isWeekend && "bg-[#fafaf9]",
          isToday && "bg-[#f3f7ff]",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-semibold tabular-nums text-[#3b3f45]",
              isWeekend && "text-[#7a7272]",
              isToday && "text-[#245bdb]",
            )}
          >
            {label}
          </span>
          {isToday ? (
            <span className="rounded bg-[#e1eaff] px-1.5 py-0.5 text-[10px] font-semibold text-[#245bdb]">
              今
            </span>
          ) : null}
        </div>
        <span className="mt-1 text-[11px] text-[#8f959e]">{weekday}</span>
      </header>

      <div
        className={cn(
          "time-axis-events px-3 py-3",
          isExpanded ? "time-axis-events-expanded" : "time-axis-events-spacious",
        )}
      >
        {schedules.map((schedule) => (
          <TimeAxisEventCard key={schedule.id} onSelect={onSelect} schedule={schedule} />
        ))}
      </div>
    </section>
  );
}
