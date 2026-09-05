import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { getCompanyMatchKey } from "@/lib/companyNames";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import type { Job, Schedule, StageFilterValue } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { StageFilterPills } from "./StageFilterPills";
import { TimelineDayGroup } from "./TimelineDayGroup";

type SortKey = "date" | "company" | "position" | "batch" | "stage";
type SortDirection = "asc" | "desc";

const HEADERS: Array<{ key: SortKey; label: string }> = [
  { key: "date", label: "日期" },
  { key: "company", label: "公司" },
  { key: "position", label: "岗位" },
  { key: "batch", label: "批次" },
  { key: "stage", label: "环节" },
];

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
  const [sortRules, setSortRules] = useState<Array<{ key: SortKey; direction: SortDirection }>>([
    { key: "date", direction: "desc" },
  ]);
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

  const visibleSchedules = useMemo(() => {
    const query = normalizedSearch(search);
    const getBatch = (schedule: Schedule) =>
      batchByJobKey.get(`${getCompanyMatchKey(schedule.company)}::${normalizedSearch(schedule.position)}`) || "";
    const filtered = schedules.filter((schedule) => {
      if (stageFilter !== "全部" && schedule.stage !== stageFilter) return false;
      if (!query) return true;
      return normalizedSearch(
        `${schedule.company} ${schedule.position} ${schedule.stage} ${getScheduleStageLabel(schedule)} ${getBatch(schedule)}`,
      ).includes(query);
    });

    return [...filtered].sort((left, right) => {
      // 按追加顺序逐级比较；后续列只重排前级条件相同的记录。
      for (const { key, direction } of sortRules) {
        const leftValue = key === "batch" ? getBatch(left) : key === "stage" ? getScheduleStageLabel(left) : left[key];
        const rightValue = key === "batch" ? getBatch(right) : key === "stage" ? getScheduleStageLabel(right) : right[key];
        const comparison = leftValue.localeCompare(rightValue, "zh-CN", { numeric: true });
        if (comparison !== 0) return direction === "asc" ? comparison : -comparison;
      }
      return right.date.localeCompare(left.date) || left.company.localeCompare(right.company, "zh-CN");
    });
  }, [batchByJobKey, schedules, search, sortRules, stageFilter]);

  const changeSort = (nextKey: SortKey) => {
    setSortRules((current) => {
      const rule = current.find(({ key }) => key === nextKey);
      if (!rule) return [...current, { key: nextKey, direction: "asc" }];
      // 日期始终作为第一级；其他列依次切换升序、降序、取消。
      if (nextKey !== "date" && rule.direction === "desc") return current.filter(({ key }) => key !== nextKey);
      return current.map((item) => item.key === nextKey ? { ...item, direction: item.direction === "asc" ? "desc" : "asc" } : item);
    });
  };
  const dateGroups: Array<{date: string; schedules: Schedule[]}> = [];
  for (const schedule of visibleSchedules) {
    const previous = dateGroups.at(-1);
    if (previous?.date === schedule.date) previous.schedules.push(schedule);
    else dateGroups.push({date:schedule.date,schedules:[schedule]});
  }

  return (
    <main aria-labelledby="list-tab" className="flex min-w-0 flex-1 flex-col bg-white" id="list-panel" role="tabpanel">
      <section className="flex min-h-[56px] shrink-0 items-center justify-center border-b border-[#e5e6e8] bg-white px-6 lg:px-8">
        <StageFilterPills onChange={onStageFilterChange} value={stageFilter} />
      </section>
      <div className="timeline-table-scroll min-h-0 flex-1 overflow-auto bg-white">
        <div className="timeline-table">
          <div aria-label="列表字段" className="timeline-table-header sticky top-0 z-30 grid h-11 border-b border-[#e5e7eb] bg-white/95 text-xs font-medium text-[#8f959e] backdrop-blur-md">
            {HEADERS.map((header) => {
              const priority = sortRules.findIndex(({ key }) => key === header.key);
              const rule = sortRules[priority];
              const active = Boolean(rule);
              const Icon = !active ? ChevronsUpDown : rule.direction === "asc" ? ArrowUp : ArrowDown;
              const action = !rule ? "追加升序排序" : header.key !== "date" && rule.direction === "desc" ? "取消排序" : rule.direction === "asc" ? "切换降序排序" : "切换升序排序";
              return (
                <button
                  aria-label={`${header.label}：${active ? `第${priority + 1}级${rule.direction === "asc" ? "升序" : "降序"}，` : ""}${action}`}
                  title={`${header.label}：${action}。日期优先，其他列按点击顺序追加；再次点击可切换方向或取消。`}
                  className="group flex items-center justify-center gap-1.5 px-3 text-center transition hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3370ff]/20"
                  key={header.key}
                  onClick={() => changeSort(header.key)}
                  type="button"
                >
                  <span className="relative">{header.label}
                    <span aria-hidden="true" className={`absolute left-full top-1/2 ml-1.5 flex -translate-y-1/2 items-center gap-0.5 ${active ? "text-[#3370ff]" : "text-[#c3c7ce] group-hover:text-[#8f959e]"}`}>
                      <Icon className="h-3 w-3" />
                      {active && sortRules.length > 1 ? <span className="text-[9px] tabular-nums">{priority + 1}</span> : null}
                    </span>
                  </span>
                </button>
              );
            })}
            <span aria-hidden="true" />
          </div>
          {visibleSchedules.length ? dateGroups.map((group, index) => (
            <TimelineDayGroup date={group.date} schedules={group.schedules} batchByJobKey={batchByJobKey} key={`${group.date}-${index}`} onSelect={onSelect} />
          )) : (
            <div className="grid min-h-[360px] place-items-center text-sm text-[#8f959e]">暂无数据</div>
          )}
        </div>
      </div>
    </main>
  );
}
