import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clampDateToRange, getTodayInChina, isDateInRange, listDatesInRange } from "@/lib/cohort";
import { sortSchedulesByStagePriority } from "@/lib/date";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import type { Schedule, StageFilterValue } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { CompanyAvatar } from "./CompanyAvatar";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";
import { StageBadge } from "./StageBadge";
import { StageFilterPills } from "./StageFilterPills";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function parseIso(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addDays(date: string, amount: number) {
  const value = parseIso(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return toIso(value);
}

function startOfWeek(date: string) {
  const value = parseIso(date);
  const day = value.getUTCDay();
  return addDays(date, -(day === 0 ? 6 : day - 1));
}

function formatMonthDay(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}月${day}日`;
}

function formatCellDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${String(month).padStart(2, "0")} / ${String(day).padStart(2, "0")}`;
}

export function WeeklyCalendarPage({
  schedules,
  search,
  stageFilter,
  onStageFilterChange,
  onSelect,
}: {
  schedules: Schedule[];
  search: string;
  stageFilter: StageFilterValue;
  onStageFilterChange: (value: StageFilterValue) => void;
  onSelect: (schedule: Schedule) => void;
}) {
  const { dateRange } = useRecruitmentCohort();
  const today = getTodayInChina();
  const target = clampDateToRange(today, dateRange);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(target));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(target.slice(0, 4)));
  const navigation = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const allDates = useMemo(() => listDatesInRange({startDate:startOfWeek(dateRange.startDate),endDate:addDays(startOfWeek(dateRange.endDate),6)}), [dateRange]);
  useEffect(() => {
    const element = board.current;
    if (!element) return;
    const index = allDates.indexOf(weekStart);
    element.scrollTo({left:Math.max(0,index) * element.clientWidth / 7,behavior:initialized.current && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant"});
    initialized.current = true;
    let previousWidth = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === previousWidth) return;
      previousWidth = element.clientWidth;
      element.scrollTo({left:Math.max(0,index)*element.clientWidth/7,behavior:"instant"});
    });
    observer.observe(element);
    return () => observer.disconnect();
  },[allDates,weekStart]);
  useEffect(() => {
    if (!monthPickerOpen) return;
    const outside = (event: PointerEvent) => {
      if (!navigation.current?.contains(event.target as Node)) setMonthPickerOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setMonthPickerOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [monthPickerOpen]);

  useEffect(() => {
    setWeekStart(startOfWeek(target));
    setPickerYear(Number(target.slice(0, 4)));
  }, [dateRange.endDate, dateRange.startDate, target]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const schedulesByDate = useMemo(() => {
    const query = normalizedSearch(search);
    const map = new Map<string, Schedule[]>();
    schedules.forEach((schedule) => {
      if (stageFilter !== "全部" && schedule.stage !== stageFilter) return;
      if (query && !normalizedSearch(`${schedule.company} ${schedule.position} ${getScheduleStageLabel(schedule)}`).includes(query)) return;
      const bucket = map.get(schedule.date) || [];
      bucket.push(schedule);
      map.set(schedule.date, bucket);
    });
    map.forEach((items, date) => map.set(date, sortSchedulesByStagePriority(items)));
    return map;
  }, [schedules, search, stageFilter]);

  const moveWeek = (amount: number) => { setWeekStart((current) => startOfWeek(clampDateToRange(addDays(current, amount * 7), dateRange))); setMonthPickerOpen(false); };
  const goToday = () => {
    const currentWeek = startOfWeek(target);
    setWeekStart(currentWeek);
    setMonthPickerOpen(false);
    // 即使 state 已经是本周，也要复位用户手动改变的横纵滚动位置。
    const element = board.current;
    if (element) element.scrollTo({
      left: Math.max(0, allDates.indexOf(currentWeek)) * element.clientWidth / 7,
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };
  const selectMonth = (month: number) => {
    const candidate = `${pickerYear}-${String(month).padStart(2, "0")}-01`;
    setWeekStart(startOfWeek(clampDateToRange(candidate, dateRange)));
    setMonthPickerOpen(false);
  };
  const currentMonth = Number(weekDates[3].slice(5, 7));
  const currentYear = Number(weekDates[3].slice(0, 4));

  return (
    <main aria-labelledby="calendar-tab" className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white" id="calendar-panel" role="tabpanel">
      <section className="relative z-20 grid min-h-[64px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#e5e6e8] bg-white px-5">
        <div className="justify-self-start"><div ref={navigation} className="relative flex items-center rounded-xl border border-[#dee0e3] bg-white p-1 shadow-[0_1px_3px_rgba(31,35,41,0.05)]">
              <button aria-label="上一周" className="grid h-8 w-8 place-items-center rounded-lg text-[#646a73] hover:bg-[#f2f3f5]" onClick={() => moveWeek(-1)} type="button">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-expanded={monthPickerOpen}
                className="h-8 min-w-[142px] rounded-lg px-3 text-sm font-semibold tabular-nums text-[#1f2329] hover:bg-[#f7f8fa]"
                onClick={() => {
                  setPickerYear(currentYear);
                  setMonthPickerOpen((open) => !open);
                }}
                type="button"
              >
                {formatMonthDay(weekDates[0])} - {formatMonthDay(weekDates[6])}
              </button>
              <button aria-label="下一周" className="grid h-8 w-8 place-items-center rounded-lg text-[#646a73] hover:bg-[#f2f3f5]" onClick={() => moveWeek(1)} type="button">
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-[#e5e7eb]" />
              <button className="h-8 rounded-lg px-2 text-xs font-semibold text-[#3370ff] hover:bg-[#eef4ff]" onClick={goToday} type="button">回到本周</button>

              {monthPickerOpen ? (
                <div className="month-popover-enter absolute left-9 top-[calc(100%+8px)] z-40 w-[300px] rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_16px_42px_rgba(31,35,41,0.15)]">
                  <div className="flex items-center justify-between">
                    <button aria-label="上一年" className="grid h-8 w-8 place-items-center rounded-lg text-[#646a73] hover:bg-[#f2f3f5]" onClick={() => setPickerYear((year) => year - 1)} type="button"><ChevronLeft className="h-4 w-4" /></button>
                    <strong className="text-sm tabular-nums text-[#1f2329]">{pickerYear}年</strong>
                    <button aria-label="下一年" className="grid h-8 w-8 place-items-center rounded-lg text-[#646a73] hover:bg-[#f2f3f5]" onClick={() => setPickerYear((year) => year + 1)} type="button"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                      const monthStart = `${pickerYear}-${String(month).padStart(2, "0")}-01`;
                      const monthEnd = `${pickerYear}-${String(month).padStart(2, "0")}-31`;
                      const enabled = monthEnd >= dateRange.startDate && monthStart <= dateRange.endDate;
                      const active = pickerYear === currentYear && month === currentMonth;
                      return (
                        <button
                          className={`h-9 rounded-lg text-xs font-medium transition ${active ? "bg-[#eaf1ff] text-[#245bdb]" : "text-[#4e5969] hover:bg-[#f2f3f5]"} disabled:cursor-not-allowed disabled:opacity-30`}
                          disabled={!enabled}
                          key={month}
                          onClick={() => selectMonth(month)}
                          type="button"
                        >
                          {String(month).padStart(2, "0")}月
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div></div>
        <StageFilterPills onChange={onStageFilterChange} value={stageFilter} />
        <div />
      </section>
      <div ref={board} className="min-h-0 flex-1 overflow-auto bg-white">
          <section className="flex min-h-full bg-white">
            {allDates.map((date, index) => {
              const daySchedules = schedulesByDate.get(date) || [];
              const isToday = date === today;
              const inRange = isDateInRange(date, dateRange);
              return (
                <article style={{flex:"0 0 calc(100% / 7)"}} className={`min-w-0 border-r border-[#eceef1] last:border-r-0 ${isToday ? "bg-[#f7faff]" : "bg-white"} ${inRange ? "" : "opacity-45"}`} key={date}>
                  <header className={`sticky top-0 z-10 border-b border-[#eceef1] px-3 py-3 text-center ${isToday ? "bg-[#edf3ff]" : "bg-white"}`}>
                    <p className={`text-xs font-medium ${isToday ? "text-[#3370ff]" : "text-[#8f959e]"}`}>{WEEKDAYS[index % 7]}</p>
                    <p className={`mt-1 text-sm font-semibold tabular-nums ${isToday ? "text-[#245bdb]" : "text-[#1f2329]"}`}>{formatCellDate(date)}</p>
                  </header>
                  <div className="space-y-2 p-2.5">
                    {daySchedules.map((schedule) => (
                      <button
                        aria-label={`查看 ${schedule.company} ${schedule.position} 详情`}
                        className="w-full min-w-0 rounded-[10px] border border-[#e5e7eb] bg-[#fbfcfd] p-2.5 text-left transition hover:border-[#cbd0d7] hover:bg-white hover:shadow-[0_4px_12px_rgba(31,35,41,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
                        key={schedule.id}
                        onClick={() => onSelect(schedule)}
                        type="button"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <CompanyAvatar company={schedule.company} size="sm" />
                          <span className="truncate text-xs font-semibold text-[#1f2329]">{schedule.company}</span>
                        </span>
                        <span className="mt-2 block truncate text-[11px] text-[#646a73]" title={schedule.position}>{schedule.position}</span>
                        <span className="mt-2 block"><StageBadge label={getScheduleStageLabel(schedule)} stage={schedule.stage} /></span>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
      </div>
    </main>
  );
}
