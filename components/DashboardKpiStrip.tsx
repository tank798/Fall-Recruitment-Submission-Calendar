import { useMemo, useState } from "react";
import { formatPercent, getRecruitmentStats } from "@/lib/recruitmentStats";
import type { Schedule, Stage } from "@/lib/types";

const KPI_STAGES: Stage[] = ["投递", "笔试", "面试", "Offer", "未通过"];

const KPI_COLORS: Record<Stage, { text: string; line: string }> = {
  投递: { text: "text-[#3370ff]", line: "bg-[#3370ff]" },
  笔试: { text: "text-cyan-600", line: "bg-cyan-400" },
  面试: { text: "text-violet-600", line: "bg-violet-400" },
  Offer: { text: "text-amber-600", line: "bg-amber-400" },
  未通过: { text: "text-slate-500", line: "bg-slate-400" },
};
const SURFACES: Record<Stage, string> = {
  投递: "border-slate-200/70 bg-white hover:border-blue-200",
  笔试: "border-slate-200/70 bg-white hover:border-cyan-200",
  面试: "border-slate-200/70 bg-white hover:border-violet-200",
  Offer: "border-slate-200/70 bg-white hover:border-amber-200",
  未通过: "border-slate-200/70 bg-white hover:border-slate-300",
};

export function DashboardKpiStrip({ schedules }: { schedules: Schedule[] }) {
  const [flippedStages, setFlippedStages] = useState<Stage[]>([]);
  const { counts, totalJobs } = useMemo(() => getRecruitmentStats(schedules), [schedules]);
  const interviewCount = counts["面试"];

  return (
    <section aria-label="核心进展">
      <div className="grid grid-cols-5 gap-3.5">
        {KPI_STAGES.map((stage) => {
          const denominator = stage === "Offer" ? interviewCount : totalJobs;
          const rate = stage === "投递" ? (totalJobs ? "100.0%" : "0.0%") : formatPercent(counts[stage], denominator);
          const colors = KPI_COLORS[stage];
          const flipped = flippedStages.includes(stage);
          const fraction = `${counts[stage]}/${denominator}`;
          const formula = `${counts[stage]} ÷ ${denominator} × 100%`;
          return (
            <div
              className={`relative min-h-[104px] min-w-0 cursor-default rounded-[18px] border px-4 py-3.5 shadow-[0_2px_5px_rgba(31,35,41,0.025)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(31,35,41,0.065)] ${SURFACES[stage]}`}
              key={stage}
            >
              <p className={`text-xs font-semibold ${colors.text}`}>{stage}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <strong className="text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[#1f2329]">
                  {counts[stage]}
                </strong>
                <button
                  type="button"
                  className="kpi-percentage"
                  aria-pressed={flipped}
                  aria-label={flipped ? `返回${stage}占比；${fraction}；${formula}；点击返回百分比` : `查看${stage}占比计算公式，当前${rate}`}
                  onClick={() => setFlippedStages((current) => current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage])}
                >
                  <span className={`kpi-percentage-inner ${flipped ? "is-flipped" : ""}`}>
                    <span aria-hidden="true" className="kpi-percentage-front">{rate}</span>
                    <span aria-hidden="true" className="kpi-percentage-back">
                      <span>{fraction}</span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
