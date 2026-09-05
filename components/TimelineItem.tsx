import { ChevronRight } from "lucide-react";
import { formatChineseDate } from "@/lib/date";
import type { Schedule } from "@/lib/types";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import { CompanyAvatar } from "./CompanyAvatar";
import { RecruitmentBatchBadge } from "./RecruitmentBatchBadge";
import { StageBadge } from "./StageBadge";

export function TimelineItem({
  schedule,
  batch,
  onClick,
  grouped = false,
}: {
  schedule: Schedule;
  batch?: string;
  onClick: () => void;
  grouped?: boolean;
}) {
  const [dateLabel, weekday = ""] = formatChineseDate(schedule.date).split(/\s+/);
  return (
    <button
      aria-label={`查看 ${schedule.company} ${schedule.position} ${schedule.stage} 详情`}
      className={`timeline-event-row ${grouped ? "timeline-event-row-grouped" : ""} group w-full border-b border-[#f2f3f5] bg-white text-left transition-colors last:border-b-0 hover:bg-[#fafbfc] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3370ff]/25`}
      onClick={onClick}
      type="button"
    >
      {!grouped ? <span className="timeline-event-cell justify-center border-r border-[#f2f3f5] text-center">
        <span>
          <span className="block text-xs font-semibold tabular-nums text-[#3b3f45]">{dateLabel}</span>
          <span className="mt-1 block text-[11px] text-[#9aa0a8]">{weekday}</span>
        </span>
      </span> : null}
      <span className="timeline-event-cell justify-center">
        <span className="grid w-[140px] min-w-0 translate-x-5 grid-cols-[28px_minmax(0,1fr)] items-center gap-2.5">
          <CompanyAvatar company={schedule.company} size="sm" />
          <span className="min-w-0 truncate text-left text-sm font-semibold text-[#1f2329]">
            {schedule.company}
          </span>
        </span>
      </span>
      <span
        className="timeline-event-cell justify-center text-center text-sm text-[#4e5969]"
        title={schedule.position}
      >
        <span className="truncate">{schedule.position}</span>
      </span>
      <span className="timeline-event-cell justify-center">
        <RecruitmentBatchBadge batch={batch} />
      </span>
      <span className="timeline-event-cell justify-center">
        <StageBadge label={getScheduleStageLabel(schedule)} stage={schedule.stage} />
      </span>
      <span className="timeline-event-cell justify-center px-0">
        <ChevronRight className="h-4 w-4 text-[#c9cdd4] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8f959e]" />
      </span>
    </button>
  );
}
