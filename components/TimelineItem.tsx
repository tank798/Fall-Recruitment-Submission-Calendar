import { ChevronRight } from "lucide-react";
import type { Schedule } from "@/lib/types";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import { CompanyAvatar } from "./CompanyAvatar";
import { RecruitmentBatchBadge } from "./RecruitmentBatchBadge";
import { StageBadge } from "./StageBadge";

export function TimelineItem({
  schedule,
  batch,
  onClick,
}: {
  schedule: Schedule;
  batch?: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={`查看 ${schedule.company} ${schedule.position} ${schedule.stage} 详情`}
      className="timeline-event-row group w-full border-b border-[#f2f3f5] bg-white text-left transition-colors last:border-b-0 hover:bg-[#fafbfc] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3370ff]/25"
      onClick={onClick}
      type="button"
    >
      <span className="timeline-event-cell justify-center">
        <span className="grid w-[176px] min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-2.5">
          <CompanyAvatar company={schedule.company} size="sm" />
          <span className="min-w-0 truncate text-left text-sm font-semibold text-[#1f2329]">
            {schedule.company}
          </span>
        </span>
      </span>
      <span
        className="timeline-event-cell justify-center truncate text-center text-sm text-[#4e5969]"
        title={schedule.position}
      >
        {schedule.position}
      </span>
      <span className="timeline-event-cell justify-center px-3">
        <RecruitmentBatchBadge batch={batch} />
      </span>
      <span className="timeline-event-cell justify-center px-3">
        <StageBadge label={getScheduleStageLabel(schedule)} stage={schedule.stage} />
      </span>
      <span className="timeline-event-cell justify-center px-0">
        <ChevronRight className="h-4 w-4 text-[#c9cdd4] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8f959e]" />
      </span>
    </button>
  );
}
