import { getCompanyMatchKey } from "@/lib/companyNames";
import { formatChineseDate } from "@/lib/date";
import type { Schedule } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { TimelineItem } from "./TimelineItem";

/** 用左侧跨行日期单元格包住同一天的全部单行事件。 */
export function TimelineDayGroup({
  date,
  schedules,
  batchByJobKey,
  onSelect,
}: {
  date: string;
  schedules: Schedule[];
  batchByJobKey: Map<string, string | undefined>;
  onSelect: (schedule: Schedule) => void;
}) {
  const fullDateLabel = formatChineseDate(date);
  const [dateLabel, ...weekdayParts] = fullDateLabel.split(/\s+/);
  const weekday = weekdayParts.join(" ");

  return (
    <section
      aria-labelledby={`date-${date}`}
      className="timeline-date-group grid border-b border-[#e5e7eb]"
    >
      <div className="sticky left-0 z-20 min-h-[62px] border-r border-[#f0f1f2] bg-white">
        <div className="sticky top-11 flex h-[62px] items-center justify-center px-6 text-center">
          <h2 className="leading-none" id={`date-${date}`}>
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
          <TimelineItem
            batch={batchByJobKey.get(
              `${getCompanyMatchKey(schedule.company)}::${normalizedSearch(schedule.position)}`,
            )}
            key={schedule.id}
            onClick={() => onSelect(schedule)}
            schedule={schedule}
          />
        ))}
      </div>
    </section>
  );
}
