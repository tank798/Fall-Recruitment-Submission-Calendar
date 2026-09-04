import { CalendarClock } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

/** 刻度尺里每一天占用的像素宽度。 */
const DAY_UNIT = 4;

interface MonthSegment {
  key: string;
  /** 完整标签，含年份，用于 title 提示。 */
  fullLabel: string;
  /** 刻度上显示的短标签。 */
  shortLabel: string;
  days: number;
  firstDate: string;
}

/**
 * 时间轴顶部的月份刻度尺：
 * - 按天数比例渲染月份段，与横向看板滚动位置实时同步（同步缩略图）；
 * - 点击月份直达该月第一天；「回到今天」回到当前日期列。
 */
export function TimeAxisMonthRuler({
  boardRef,
  dates,
  today,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  dates: string[];
  today: string;
}) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  const months = useMemo<MonthSegment[]>(() => {
    const segments: MonthSegment[] = [];
    dates.forEach((date) => {
      const year = Number(date.slice(0, 4));
      const month = Number(date.slice(5, 7));
      const key = date.slice(0, 7);
      const last = segments[segments.length - 1];
      if (last && last.key === key) {
        last.days += 1;
        return;
      }
      segments.push({
        key,
        fullLabel: `${year} 年 ${month} 月`,
        shortLabel: month === 1 ? `${year}·1月` : `${month}月`,
        days: 1,
        firstDate: date,
      });
    });
    return segments;
  }, [dates]);

  useEffect(() => {
    const board = boardRef.current;
    const ruler = rulerRef.current;
    if (!board || !ruler || dates.length === 0) return;

    const totalDays = dates.length;
    const sync = () => {
      // 看板与刻度尺都按「每天等宽」布局，按「可视中心对齐」映射：
      // 看板中心对准的那一天，始终对齐刻度尺中心，拖动时两者同步平移。
      const columnWidth = board.scrollWidth / totalDays || 1;
      const centerIndex = (board.scrollLeft + board.clientWidth / 2) / columnWidth;
      ruler.scrollLeft = centerIndex * DAY_UNIT - ruler.clientWidth / 2;

      const clamped = Math.min(Math.max(Math.floor(centerIndex), 0), totalDays - 1);
      const centerDate = dates[clamped];
      setActiveMonthKey(centerDate ? centerDate.slice(0, 7) : null);
    };

    board.addEventListener("scroll", sync, { passive: true });
    sync();
    return () => board.removeEventListener("scroll", sync);
  }, [boardRef, dates]);

  const scrollToColumn = (date: string, center = false) => {
    const board = boardRef.current;
    if (!board) return;
    const column = board.querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (!column) return;
    const offset = center
      ? column.offsetLeft - (board.clientWidth - column.offsetWidth) / 2
      : column.offsetLeft - 8;
    board.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  };

  const todayIndex = dates.indexOf(today);
  const contentWidth = dates.length * DAY_UNIT;

  return (
    <div
      aria-label="月份导航"
      className="flex h-9 shrink-0 items-stretch gap-3 border-b border-[#e5e6e8] bg-[#fafbfc] px-4 sm:px-8"
    >
      <button
        className="my-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#dee0e3] bg-white px-2.5 text-xs font-medium text-[#4e5969] transition hover:border-[#85a8ff] hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25"
        onClick={() => scrollToColumn(today, true)}
        type="button"
      >
        <CalendarClock className="h-3.5 w-3.5" />
        回到今天
      </button>
      <div className="relative min-w-0 flex-1 overflow-x-hidden" ref={rulerRef}>
        <div className="relative flex h-full items-stretch" style={{ width: contentWidth }}>
          {months.map((month) => {
            const width = month.days * DAY_UNIT;
            const active = activeMonthKey === month.key;
            return (
              <button
                aria-label={`跳转到 ${month.fullLabel}`}
                className={cn(
                  "flex items-center justify-center border-r border-[#e5e6e8] text-[11px] font-medium tabular-nums transition-colors",
                  active
                    ? "bg-[#e1eaff] text-[#245bdb]"
                    : "text-[#8f959e] hover:bg-[#eff0f1] hover:text-[#4e5969]",
                )}
                key={month.key}
                onClick={() => scrollToColumn(month.firstDate)}
                style={{ flex: `0 0 ${width}px` }}
                title={month.fullLabel}
                type="button"
              >
                {width >= 30 ? month.shortLabel : null}
              </button>
            );
          })}
          {todayIndex >= 0 ? (
            <span
              aria-label="今天"
              className="absolute top-0 h-full w-[5px] rounded bg-[#3370ff]/60"
              style={{ left: todayIndex * DAY_UNIT - 2 }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
