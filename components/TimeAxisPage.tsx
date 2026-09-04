import { useMemo } from "react";
import {
  clampDateToRange,
  getTodayInChina,
  isDateInRange,
  listDatesInRange,
} from "@/lib/cohort";
import { sortSchedulesByStagePriority } from "@/lib/date";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import type { Schedule, StageFilterValue } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { HorizontalDateBoard } from "./HorizontalDateBoard";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";
import { StatusSummaryCards } from "./StatusSummaryCards";

export function TimeAxisPage({
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
  const targetDate = clampDateToRange(today, dateRange);
  const dates = useMemo(() => listDatesInRange(dateRange), [dateRange]);

  const schedulesByDate = useMemo(() => {
    const query = normalizedSearch(search);
    const grouped = new Map<string, Schedule[]>();

    schedules.forEach((schedule) => {
      if (!isDateInRange(schedule.date, dateRange)) return;
      if (stageFilter !== "全部" && schedule.stage !== stageFilter) return;
      if (
        query &&
        !normalizedSearch(
          `${schedule.company} ${schedule.position} ${getScheduleStageLabel(schedule)}`,
        ).includes(query)
      ) {
        return;
      }

      const collection = grouped.get(schedule.date) || [];
      collection.push(schedule);
      grouped.set(schedule.date, collection);
    });

    grouped.forEach((items, date) => {
      grouped.set(date, sortSchedulesByStagePriority(items));
    });
    return grouped;
  }, [dateRange, schedules, search, stageFilter]);

  return (
    <main
      aria-labelledby="time-axis-tab"
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
      id="time-axis-panel"
      role="tabpanel"
    >
      <section className="shrink-0 border-b border-[#e5e6e8] px-4 py-3 sm:px-8">
        <StatusSummaryCards
          onChange={onStageFilterChange}
          schedules={schedules}
          value={stageFilter}
        />
      </section>

      <HorizontalDateBoard
        dates={dates}
        onSelect={onSelect}
        schedulesByDate={schedulesByDate}
        targetDate={targetDate}
        today={today}
      />
    </main>
  );
}
