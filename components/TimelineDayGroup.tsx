import { getCompanyMatchKey } from "@/lib/companyNames";
import { formatChineseDate } from "@/lib/date";
import type { Schedule } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { TimelineItem } from "./TimelineItem";
import { getScheduleStageLabel } from "@/lib/interviewRound";

/** 用左侧跨行日期单元格包住同一天的全部单行事件。 */
export function TimelineDayGroup({
  date,
  schedules,
  batchByJobKey,
  onSelect,
  history,
}: {
  date: string;
  schedules: Schedule[];
  batchByJobKey: Map<string, string | undefined>;
  onSelect: (schedule: Schedule) => void;
  history?: Map<string, Schedule[]>;
}) {
  const fullDateLabel = formatChineseDate(date);
  const [dateLabel, ...weekdayParts] = fullDateLabel.split(/\s+/);
  const weekday = weekdayParts.join(" ");

  return (
    <section
      aria-label={fullDateLabel}
      className="timeline-date-group grid border-b border-[#e5e7eb]"
    >
      <div className="sticky left-0 z-20 min-h-[62px] border-r border-[#f0f1f2] bg-white">
        <div className="sticky top-11 flex h-[62px] items-center justify-center px-6 text-center">
          <h2 className="leading-none">
            <span className="block text-sm font-semibold tabular-nums text-[#3b3f45]">
              {dateLabel}
            </span>
            {weekday ? (
              <span className="mt-2 block text-xs font-normal text-[#9aa0a8]">{weekday}</span>
            ) : null}
          </h2>
        </div>
      </div>
      <div className="min-w-0">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="border-b border-[#f2f3f5] last:border-b-0">
          <TimelineItem
            grouped
            batch={batchByJobKey.get(
              `${getCompanyMatchKey(schedule.company)}::${normalizedSearch(schedule.position)}`,
            )}
            key={schedule.id}
            onClick={() => onSelect(schedule)}
            schedule={schedule}
          />
          {history?.get(schedule.id)?.length ? (
            <details className="px-6 pb-2 text-[11px] text-slate-400">
              <summary className="w-fit cursor-pointer hover:text-slate-600">此前 {history.get(schedule.id)!.length} 条进展</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {history.get(schedule.id)!.map((previous) => (
                  <button key={previous.id} type="button" onClick={() => onSelect(previous)} className="rounded-md border border-slate-100 px-2 py-1 text-slate-500 hover:bg-slate-50">
                    {previous.date.slice(5)} · {getScheduleStageLabel(previous)}
                  </button>
                ))}
              </div>
            </details>
          ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
