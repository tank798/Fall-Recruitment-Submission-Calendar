import type { Stage, StageFilterValue } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTER_STYLE: Record<Stage, { idle: string; active: string }> = {
  投递: {
    idle: "border-[#cfdbfb] bg-white text-[#4265b3] hover:bg-[#f4f7ff]",
    active: "border-[#8eafff] bg-[#eaf1ff] text-[#245bdb] shadow-[0_2px_7px_rgba(51,112,255,0.13)]",
  },
  笔试: {
    idle: "border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50/60",
    active: "border-cyan-300 bg-cyan-50 text-cyan-800 shadow-[0_2px_7px_rgba(6,182,212,0.12)]",
  },
  面试: {
    idle: "border-violet-200 bg-white text-violet-700 hover:bg-violet-50/60",
    active: "border-violet-300 bg-violet-50 text-violet-800 shadow-[0_2px_7px_rgba(139,92,246,0.12)]",
  },
  Offer: {
    idle: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50/60",
    active: "border-amber-300 bg-amber-50 text-amber-800 shadow-[0_2px_7px_rgba(245,158,11,0.12)]",
  },
  未通过: {
    idle: "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
    active: "border-slate-300 bg-slate-100 text-slate-700 shadow-[0_2px_7px_rgba(100,116,139,0.1)]",
  },
};

export function StageFilterPills({
  value,
  onChange,
}: {
  value: StageFilterValue;
  onChange: (value: StageFilterValue) => void;
}) {
  return (
    <div aria-label="按状态筛选" className="flex flex-wrap items-center gap-2" role="group">
      {STAGES.map((stage) => {
        const selected = stage === "投递" ? value === "全部" : value === stage;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "h-8 min-w-[64px] rounded-[10px] border px-3.5 text-xs font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25",
              selected ? FILTER_STYLE[stage].active : FILTER_STYLE[stage].idle,
            )}
            key={stage}
            onClick={() => onChange(stage === "投递" || selected ? "全部" : stage)}
            type="button"
          >
            {stage}
          </button>
        );
      })}
    </div>
  );
}
