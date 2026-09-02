import { CalendarDays, Download, Plus } from "lucide-react";
import { useMemo } from "react";
import { getCompanyMatchKey } from "@/lib/companyNames";
import { sortSchedules } from "@/lib/date";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import type { Job, Schedule } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { CohortSelector } from "./CohortSelector";
import { SearchBar } from "./SearchBar";
import type { StageFilterValue } from "./StageFilter";
import { StatusSummaryCards } from "./StatusSummaryCards";
import { TimelineDayGroup } from "./TimelineDayGroup";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";

export function TimelinePage({
  schedules,
  jobs,
  search,
  stageFilter,
  onSearchChange,
  onStageFilterChange,
  onAdd,
  onSelect,
}: {
  schedules: Schedule[];
  jobs: Job[];
  search: string;
  stageFilter: StageFilterValue;
  onSearchChange: (value: string) => void;
  onStageFilterChange: (value: StageFilterValue) => void;
  onAdd: () => void;
  onSelect: (schedule: Schedule) => void;
}) {
  const { selectedGraduationYear } = useRecruitmentCohort();
  const exportHref = `/api/export?graduationYear=${selectedGraduationYear}&stage=${encodeURIComponent(stageFilter)}&search=${encodeURIComponent(search)}`;
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
        `${schedule.company} ${schedule.position} ${schedule.stage} ${getScheduleStageLabel(schedule)} ${schedule.detail}`,
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
      <section className="border-b border-[#e5e6e8] px-8 py-4">
        <StatusSummaryCards
          onChange={onStageFilterChange}
          schedules={schedules}
          value={stageFilter}
        />
      </section>

      <header className="border-b border-[#e5e6e8] px-8 py-4">
        <div className="flex items-center justify-end gap-2">
          <SearchBar onChange={onSearchChange} value={search} />
          <CohortSelector />
          <a
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#dee0e3] bg-white px-3.5 text-sm font-medium text-[#4e5969] transition hover:border-[#c9cdd4] hover:bg-[#f7f8fa] hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
            href={exportHref}
          >
            <Download className="h-4 w-4" />
            导出 Excel
          </a>
          <button
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#3370ff] px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#2865e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/30 focus-visible:ring-offset-2"
            onClick={onAdd}
            type="button"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
      </header>

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
              <span className="flex items-center justify-center px-4 text-center">公司</span>
              <span className="flex items-center justify-center px-4 text-center">岗位</span>
              <span className="flex items-center justify-center px-3 text-center">阶段</span>
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
