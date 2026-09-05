import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { listDatesInRange } from "@/lib/cohort";
import type { Schedule, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

type ChartMode = "heatmap" | "bars";

// 每个日期使用固定的横向槽位，避免日期少时被拉伸、日期多时被压缩。
// 热力图色块仍保持小方块，日期轴超出可视区域后由右侧主体负责横向滚动。
const FLOW_CELL_WIDTH = 26;
const FLOW_LABEL_SLOT = 40;

const STAGE_HEX: Record<Stage, string> = {
  投递: "#3370ff",
  笔试: "#06b6d4",
  面试: "#8b5cf6",
  Offer: "#f59e0b",
  未通过: "#94a3b8",
};

function formatShortDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

function formatFullDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

export function DailyFlowChart({ schedules }: { schedules: Schedule[] }) {
  const [mode, setMode] = useState<ChartMode>("heatmap");
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<{ date: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const data = useMemo(() => {
    const valid = schedules.filter((schedule) => /^\d{4}-\d{2}-\d{2}$/.test(schedule.date));
    if (!valid.length) return { dates: [] as string[], counts: new Map<string, Record<Stage, number>>() };
    const orderedDates = valid.map((schedule) => schedule.date).sort();
    const dates = listDatesInRange({ startDate: orderedDates[0], endDate: orderedDates.at(-1)! });
    const counts = new Map<string, Record<Stage, number>>();
    dates.forEach((date) => counts.set(date, { 投递: 0, 笔试: 0, 面试: 0, Offer: 0, 未通过: 0 }));
    valid.forEach((schedule) => {
      const day = counts.get(schedule.date);
      if (day) day[schedule.stage] += 1;
    });
    return { dates, counts };
  }, [schedules]);

  const labelStep = Math.max(1, Math.ceil(data.dates.length / Math.max(1, Math.floor((width - 74) / FLOW_LABEL_SLOT))));

  return (
    <section aria-labelledby="daily-flow-title" className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#1f2329]" id="daily-flow-title">投递节奏</h2>
        </div>
        <SlidingSegmentedControl
          ariaLabel="流程分布图表类型"
          className="w-[150px]"
          compact
          getLabel={(value) => (value === "heatmap" ? "热力图" : "柱状图")}
          onChange={setMode}
          options={["heatmap", "bars"] as const}
          value={mode}
        />
      </div>

      <div className="mt-5 min-h-[230px]" ref={container}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-flow-date]");
          setHover(cell?.dataset.flowDate ? { date: cell.dataset.flowDate, x: event.clientX, y: event.clientY } : null);
        }}>
        {!data.dates.length ? (
          <div className="grid h-[220px] place-items-center text-sm text-[#8f959e]">暂无数据</div>
        ) : (
          <div className="chart-crossfade" key={mode}>
            {mode === "heatmap" ? (
              <Heatmap counts={data.counts} dates={data.dates} labelStep={labelStep} />
            ) : (
              <StackedBars counts={data.counts} dates={data.dates} labelStep={labelStep} />
            )}
          </div>
        )}
      </div>
      {hover && data.counts.has(hover.date) ? createPortal(
        <div className="pointer-events-none fixed z-[80]" style={{ left: Math.max(8, Math.min(hover.x + 14, window.innerWidth - 190)), top: Math.max(8, Math.min(hover.y + 14, window.innerHeight - 220)) }}>
          <FlowTooltip date={hover.date} counts={data.counts.get(hover.date)!} />
        </div>, document.body,
      ) : null}
    </section>
  );
}

function FlowTooltip({ date, counts }: { date: string; counts: Record<Stage, number> }) {
  const total = STAGES.reduce((sum, stage) => sum + counts[stage], 0);
  return (
    <div className="chart-crossfade w-[176px] rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-[0_12px_32px_rgba(31,35,41,0.13)]">
      <p className="text-xs font-semibold text-[#1f2329]">{formatFullDate(date)}</p>
      <div className="mt-2 space-y-1">
        {STAGES.map((stage) => (
          <div className="flex items-center justify-between text-[11px]" key={stage}>
            <span style={{ color: STAGE_HEX[stage] }}>{stage}</span>
            <span className="tabular-nums text-[#4e5969]">{counts[stage]}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-[#eef0f2] pt-2 text-[11px] font-semibold text-[#1f2329]">
        <span>总计</span><span className="tabular-nums">{total}</span>
      </div>
    </div>
  );
}

function Heatmap({
  dates,
  counts,
  labelStep,
}: {
  dates: string[];
  counts: Map<string, Record<Stage, number>>;
  labelStep: number;
}) {
  const maxima = Object.fromEntries(
    STAGES.map((stage) => [stage, Math.max(1, ...dates.map((date) => counts.get(date)![stage]))]),
  ) as Record<Stage, number>;
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = `repeat(${dates.length}, ${FLOW_CELL_WIDTH}px)`;
  const plotWidth = dates.length * FLOW_CELL_WIDTH;

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    // 初次进入或日期范围扩展时，将最新日期保持在可视区域右侧。
    const frame = window.requestAnimationFrame(() => {
      scrollElement.scrollLeft = scrollElement.scrollWidth;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dates.length]);

  return (
    <div className="flex min-w-0">
      <div className="w-[74px] shrink-0 pt-14">
        {STAGES.map((stage) => (
          <div className="flex h-6 items-center text-xs font-medium" key={stage} style={{ color: STAGE_HEX[stage] }}>{stage}</div>
        ))}
      </div>
      <div className="chart-scroll min-w-0 flex-1 overflow-x-auto overflow-y-visible pb-2 pt-7" ref={scrollRef}>
        <div style={{ width: plotWidth, minWidth: plotWidth }}>
          <div className="grid" style={{ gridTemplateColumns: columns }}>
            {dates.map((date, index) => (
              <span className="flex h-6 w-[26px] items-start justify-center whitespace-nowrap text-[10px] tabular-nums text-[#9aa0a8]" key={date}>
                {index % labelStep === 0 ? formatShortDate(date) : ""}
              </span>
            ))}
          </div>
          {STAGES.map((stage) => (
            <div className="grid h-6 items-center" key={stage} style={{ gridTemplateColumns: columns }}>
              {dates.map((date) => {
                const day = counts.get(date)!;
                const value = day[stage];
                const alpha = value ? 0.2 + (value / maxima[stage]) * 0.72 : 0.055;
                return (
                  <div data-flow-date={date} aria-label={`${date} ${stage} ${value}条`} className="flex h-6 w-[26px] items-center justify-center border-r border-white" key={date}>
                    <span className="h-[18px] w-[18px] rounded-[4px]" style={{ backgroundColor: value ? `${STAGE_HEX[stage]}${Math.round(alpha * 255).toString(16).padStart(2, "0")}` : "#f1f3f5" }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackedBars({
  dates,
  counts,
  labelStep,
}: {
  dates: string[];
  counts: Map<string, Record<Stage, number>>;
  labelStep: number;
}) {
  const totals = dates.map((date) => STAGES.reduce((sum, stage) => sum + counts.get(date)![stage], 0));
  const maxTotal = Math.max(1, ...totals);
  const scrollRef = useRef<HTMLDivElement>(null);
  const plotWidth = dates.length * FLOW_CELL_WIDTH;

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    const frame = window.requestAnimationFrame(() => {
      scrollElement.scrollLeft = scrollElement.scrollWidth;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dates.length]);

  return (
    <div className="chart-scroll relative min-w-0 overflow-x-auto pb-7 pt-7" ref={scrollRef}>
      <span className="absolute left-0 top-0 text-[10px] text-[#9aa0a8]">{maxTotal} 条</span>
      <div className="flex h-[190px] items-end border-b border-[#e5e7eb]" style={{ width: plotWidth, minWidth: plotWidth }}>
        {dates.map((date, index) => {
          const day = counts.get(date)!;
          return (
            <div data-flow-date={date} className="group relative flex h-full w-[26px] shrink-0 flex-col justify-end border-r border-white" key={date}>
              <div className="mx-auto flex w-[18px] flex-col justify-end overflow-hidden rounded-t-[4px]" style={{ height: `${(totals[index] / maxTotal) * 154}px` }}>
                {[...STAGES].reverse().map((stage) => day[stage] ? (
                  <span key={stage} style={{ backgroundColor: STAGE_HEX[stage], height: `${(day[stage] / Math.max(1, totals[index])) * 100}%` }} />
                ) : null)}
              </div>
              <span className="absolute left-0 top-[calc(100%+7px)] flex w-[26px] justify-center whitespace-nowrap text-[10px] tabular-nums text-[#9aa0a8]">
                {index % labelStep === 0 ? formatShortDate(date) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
