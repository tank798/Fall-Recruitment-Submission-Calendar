import { useMemo, useState } from "react";
import {
  clampDateToRange,
  getTodayInChina,
  isDateInRange,
  listDatesInRange,
} from "@/lib/cohort";
import { sortSchedulesByStagePriority } from "@/lib/date";
import type { Schedule } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { HorizontalDateBoard } from "./HorizontalDateBoard";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";
import { SearchBar } from "./SearchBar";
import {
  TimeAxisStageFilter,
  type TimeAxisStageFilterValue,
} from "./TimeAxisStageFilter";

export function TimeAxisPage({
  schedules,
  onSelect,
}: {
  schedules: Schedule[];
  onSelect: (schedule: Schedule) => void;
}) {
  const { dateRange } = useRecruitmentCohort();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<TimeAxisStageFilterValue>("全部");
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
        !normalizedSearch(`${schedule.company} ${schedule.position}`).includes(query)
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
      className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-white"
      id="time-axis-panel"
      role="tabpanel"
    >
      <header className="sticky top-0 z-30 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#e5e6e8] bg-white px-8 py-4">
        <span aria-hidden="true" />
        <TimeAxisStageFilter onChange={setStageFilter} value={stageFilter} />
        <div className="flex justify-end">
          <SearchBar
            ariaLabel="搜索时间轴中的公司或岗位"
            onChange={setSearch}
            placeholder="搜索公司 / 岗位"
            value={search}
          />
        </div>
      </header>

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
