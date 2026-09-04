import type { Schedule } from "@/lib/types";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import { cn } from "@/lib/utils";
import { STAGE_STYLES } from "@/lib/stageStyles";
import { CompanyAvatar } from "./CompanyAvatar";

export function TimeAxisEventCard({
  schedule,
  onSelect,
}: {
  schedule: Schedule;
  onSelect: (schedule: Schedule) => void;
}) {
  const stageLabel = getScheduleStageLabel(schedule);
  const ariaLabel = [schedule.company, stageLabel].filter(Boolean).join(" ");

  return (
    <button
      aria-label={ariaLabel}
      className="time-axis-card group flex w-full shrink-0 flex-col justify-between rounded-[10px] border border-[#e5e6e8] bg-white p-3 text-left shadow-[0_1px_2px_rgba(31,35,41,0.03)] transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-[#c9cdd4] hover:shadow-[0_5px_14px_rgba(31,35,41,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
      onClick={() => onSelect(schedule)}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <CompanyAvatar company={schedule.company} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1f2329]">
          {schedule.company}
        </span>
      </span>
      <span className="mt-2 flex min-w-0 items-center gap-1.5">
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STAGE_STYLES[schedule.stage].dot)}
        />
        <span className="truncate text-xs font-medium text-[#646a73]">{stageLabel}</span>
      </span>
    </button>
  );
}
