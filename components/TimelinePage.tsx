import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { getCompanyMatchKey } from "@/lib/companyNames";
import { sortSchedules } from "@/lib/date";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import type { Job, Schedule } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import type { StageFilterValue } from "@/lib/types";
import { StatusSummaryCards } from "./StatusSummaryCards";
import { TimelineDayGroup } from "./TimelineDayGroup";

export function TimelinePage({
  schedules,
  jobs,
  search,
  stageFilter,
  onStageFilterChange,
  onSelect,
}: {
  schedules: Schedule[];
  jobs: Job[];
  search: string;
  stageFilter: StageFilterValue;
  onStageFilterChange: (value: StageFilterValue) => void;
  onSelect: (schedule: Schedule) => void;
}) {
  const batchByJobKey = useMemo(
    () =>
      new Map(
        jobs.map((job) => [
          `${getCompanyMatchKey(job.company)}::${normalizedSearch(job.position)}`,
          job.batch,
        ]),
      ),
    [jobs],
  );
  const groups = useMemo(() => {
    const query = normalizedSearch(search);
    const filtered = sortSchedules(schedules).filter((schedule) => {
      if (stageFilter !== "全部" && schedule.stage !== stageFilter) return false;
      if (!query) return true;
      return normalizedSearch(
        `${schedule.company} ${schedule.position} ${schedule.stage} ${getScheduleStageLabel(schedule)}`,
      ).includes(query);
    });

    return filtered.reduce<Array<{ date: string; schedules: Schedule[] }>>((result, schedule) => {
      const current = result[result.length - 1];
      if (current?.date === schedule.date) current.schedules.push(schedule);
      else result.push({ date: schedule.date, schedules: [schedule] });
      return result;
    }, []);
  }, [schedules, search, stageFilter]);

  return (
    <main
      aria-labelledby="timeline-tab"
      className="flex min-w-0 flex-1 flex-col bg-white"
      id="timeline-panel"
      role="tabpanel"
    >
      <section className="border-b border-[#e5e6e8] px-4 py-3 sm:px-8">
        <StatusSummaryCards
          onChange={onStageFilterChange}
          schedules={schedules}
          value={stageFilter}
        />
      </section>

      <div className="timeline-table-scroll min-h-0 flex-1 overflow-auto bg-white">
        {groups.length > 0 ? (
          <div className="timeline-table">
            <div
              aria-label="时间表字段"
              className="timeline-table-header sticky top-0 z-30 grid h-11 border-b border-[#e5e7eb] bg-white text-xs font-medium text-[#8f959e]"
            >
              <span className="sticky left-0 z-10 flex items-center justify-center border-r border-[#f0f1f2] bg-white px-4 text-center">
                日期
              </span>
              {/* 与内容行共用同一套「头像 + 名称」定宽居中结构，保证表头与公司名称起始线对齐 */}
              <span className="flex items-center justify-center px-4">
                <span className="grid w-[176px] min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-2.5">
                  <span aria-hidden="true" className="w-7" />
                  <span className="min-w-0 text-left">公司</span>
                </span>
              </span>
              <span className="flex items-center justify-center px-4 text-center">岗位</span>
              <span className="flex items-center justify-center px-4 text-center">批次</span>
              <span className="flex items-center justify-center px-4 text-center">环节</span>
              <span aria-hidden="true" />
            </div>
            {groups.map((group) => (
              <TimelineDayGroup
                batchByJobKey={batchByJobKey}
                date={group.date}
                key={group.date}
                onSelect={onSelect}
                schedules={group.schedules}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[360px] place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
                <CalendarDays className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-800">没有匹配的日程</p>
              <p className="mt-1 text-xs text-slate-500">换一个关键词或环节试试</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
