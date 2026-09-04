import { useMemo } from "react";
import { STAGE_STYLES } from "@/lib/stageStyles";
import type { Schedule, Stage, StageFilterValue } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";

const SUMMARY_STAGES = ["投递", "笔试", "面试", "Offer", "未通过"] as const satisfies
  readonly Stage[];

type SummaryStage = (typeof SUMMARY_STAGES)[number];

interface StageStat {
  count: number;
  /** chip 上显示的比率文案，投递卡（全量）为 null。 */
  rate: string | null;
  /** 比率的分母，用于副行展示。 */
  denominator: number;
  denominatorLabel: string;
}

function jobKey(company: string, position: string) {
  return `${normalizedSearch(company)}::${normalizedSearch(position)}`;
}

/**
 * 按「公司 + 岗位」去重统计：同一个公司同一个岗位的一面/二面/三面只算一次面试。
 * 「投递」卡代表当前届别的全部已投岗位，其余卡片是进展子集。
 */
function buildStats(schedules: Schedule[]) {
  const stageSets = new Map<string, Set<Stage>>();
  for (const schedule of schedules) {
    const key = jobKey(schedule.company, schedule.position);
    const existing = stageSets.get(key);
    if (existing) existing.add(schedule.stage);
    else stageSets.set(key, new Set([schedule.stage]));
  }

  const countOf = (stage: Stage) => {
    let total = 0;
    for (const stages of stageSets.values()) if (stages.has(stage)) total += 1;
    return total;
  };

  // 有些历史岗位可能只留下笔试/面试记录，仍应计入已投岗位总数。
  const applied = stageSets.size;
  const counts = Object.fromEntries(SUMMARY_STAGES.map((stage) => [stage, countOf(stage)])) as Record<
    SummaryStage,
    number
  >;
  const interviewed = counts["面试"];

  return { applied, interviewed, counts, positionCount: stageSets.size };
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "—";
  const value = (numerator / denominator) * 100;
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)}%`;
}

export function StatusSummaryCards({
  schedules,
  value,
  onChange,
}: {
  schedules: Schedule[];
  value: StageFilterValue;
  onChange: (value: StageFilterValue) => void;
}) {
  const { applied, interviewed, counts, positionCount } = useMemo(
    () => buildStats(schedules),
    [schedules],
  );

  const stats: Record<SummaryStage, StageStat> = {
    投递: { count: applied, rate: null, denominator: applied, denominatorLabel: "全部岗位" },
    笔试: { count: counts["笔试"], rate: percent(counts["笔试"], applied), denominator: applied, denominatorLabel: "进笔率" },
    面试: { count: counts["面试"], rate: percent(counts["面试"], applied), denominator: applied, denominatorLabel: "进面率" },
    Offer: { count: counts["Offer"], rate: percent(counts["Offer"], interviewed), denominator: interviewed, denominatorLabel: "Offer 率" },
    // 未通过多数发生在投递后、尚未进面，用进面做分母会虚高到 88.9%，改用投递口径。
    未通过: { count: counts["未通过"], rate: percent(counts["未通过"], applied), denominator: applied, denominatorLabel: "被拒率" },
  };

  return (
    <div aria-label="日程状态统计" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group">
      {SUMMARY_STAGES.map((stage) => {
        const stat = stats[stage];
        // 投递卡代表全量岗位：筛选为「全部」时视为选中，点击不筛选、直接回到全量。
        const selected = stage === "投递" ? value === "全部" : value === stage;
        const style = STAGE_STYLES[stage];
        return (
          <button
            aria-pressed={selected}
            className={[
              "min-w-0 rounded-xl border bg-white px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25",
              selected
                ? "border-[#3370ff] bg-[#f5f8ff] shadow-[0_0_0_1px_rgba(51,112,255,0.08)]"
                : "border-[#e5e6e8] shadow-[0_1px_2px_rgba(31,35,41,0.03)] hover:border-[#c9cdd4] hover:bg-[#fafbfc]",
            ].join(" ")}
            key={stage}
            onClick={() => {
              if (stage === "投递") {
                if (value !== "全部") onChange("全部");
              } else {
                onChange(selected ? "全部" : stage);
              }
            }}
            title={
              stage === "投递"
                ? `共 ${positionCount} 个岗位`
                : `${stat.count} / ${stat.denominator} · ${stat.denominatorLabel}`
            }
            type="button"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#8f959e]">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                {stage}
              </span>
              {stat.rate ? (
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums ${style.chip}`}
                >
                  {stat.rate}
                </span>
              ) : null}
            </span>
            <span className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xl font-semibold leading-none tabular-nums text-[#1f2329]">
                {stat.count}
              </span>
              <span className="min-w-0 truncate text-[11px] leading-none text-[#8f959e]">
                {stage === "投递" ? "全部岗位" : `${stat.count} / ${stat.denominator} 岗位`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
