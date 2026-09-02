import type { Schedule, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { StageFilterValue } from "./StageFilter";

const SUMMARY_STAGES = ["投递", "测评", "笔试", "面试", "未通过"] as const satisfies readonly Stage[];

const DOT_STYLES: Record<(typeof SUMMARY_STAGES)[number], string> = {
  投递: "bg-emerald-500",
  测评: "bg-orange-500",
  笔试: "bg-violet-500",
  面试: "bg-blue-500",
  未通过: "bg-red-500",
};

export function StatusSummaryCards({
  schedules,
  value,
  onChange,
}: {
  schedules: Schedule[];
  value: StageFilterValue;
  onChange: (value: StageFilterValue) => void;
}) {
  const counts = Object.fromEntries(SUMMARY_STAGES.map((stage) => [stage, 0])) as Record<
    (typeof SUMMARY_STAGES)[number],
    number
  >;

  for (const schedule of schedules) {
    if (schedule.stage in counts) {
      counts[schedule.stage as keyof typeof counts] += 1;
    }
  }

  return (
    <div aria-label="日程状态统计" className="grid grid-cols-5 gap-3" role="group">
      {SUMMARY_STAGES.map((stage) => {
        const selected = value === stage;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "h-[82px] min-w-0 rounded-xl border bg-white px-4 text-left shadow-[0_1px_2px_rgba(31,35,41,0.03)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25",
              selected
                ? "border-[#3370ff] bg-[#f5f8ff] shadow-[0_0_0_1px_rgba(51,112,255,0.08)]"
                : "border-[#e5e6e8] hover:border-[#c9cdd4] hover:bg-[#fafbfc]",
            )}
            key={stage}
            onClick={() => onChange(selected ? "全部" : stage)}
            type="button"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-[#8f959e]">
              <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[stage])} />
              {stage}
            </span>
            <span className="mt-2 block text-2xl font-semibold leading-none tabular-nums text-[#1f2329]">
              {counts[stage]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
