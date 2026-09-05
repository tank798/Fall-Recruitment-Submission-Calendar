import { useMemo, useRef, useState } from "react";
import { classifyCompany } from "@/lib/companyClassifier";
import { getCompanyDisplayName } from "@/lib/companyNames";
import { getJobKey } from "@/lib/recruitmentStats";
import { COMPANY_CATEGORIES, STAGES, type Job, type Schedule } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { CompanyMapDialog } from "./CompanyMapDialog";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

const COLORS = ["bg-[#eff5ff] border-[#dce6f8]", "bg-[#f4f0fc] border-[#e7dff5]", "bg-[#edf8f4] border-[#daeee5]", "bg-[#fff7ea] border-[#f3e7d1]", "bg-[#eef2f7] border-[#dfe5ee]"];
interface Group { name: string; jobs: Job[]; color: string }
interface Tile { group: Group; x: number; y: number; w: number; h: number }
// 按真实岗位权重递归划分，零数量分组不占虚构面积。
function partition(groups: Group[], x = 0, y = 0, w = 100, h = 100): Tile[] {
  if (!groups.length) return [];
  if (groups.length === 1) return [{ group: groups[0], x, y, w, h }];
  const total = groups.reduce((n, g) => n + g.jobs.length, 0);
  let split = 1, sum = groups[0].jobs.length;
  while (split < groups.length - 1 && Math.abs(sum + groups[split].jobs.length - total / 2) < Math.abs(sum - total / 2)) sum += groups[split++].jobs.length;
  // 小分组保留至少 52px 的可点击高度，避免标题被内边距撑出容器。
  const horizontalSplit = w * 1.7 < h;
  const minimumRatio = Math.min(0.45, 13 / h);
  const ratio = horizontalSplit ? Math.max(minimumRatio, Math.min(1 - minimumRatio, sum / total)) : sum / total;
  return w * 1.7 >= h ? [
    ...partition(groups.slice(0, split), x, y, w * ratio, h),
    ...partition(groups.slice(split), x + w * ratio, y, w * (1 - ratio), h),
  ] : [
    ...partition(groups.slice(0, split), x, y, w, h * ratio),
    ...partition(groups.slice(split), x, y + h * ratio, w, h * (1 - ratio)),
  ];
}
export function CompanyTreemap({ jobs, schedules, search, onSelectCompany }: {
  jobs: Job[]; schedules: Schedule[]; search: string; onSelectCompany: (company: string) => void;
}) {
  const [mode, setMode] = useState<"type" | "stage">("type");
  const [selected, setSelected] = useState<Group | null>(null);
  const origin = useRef<HTMLButtonElement | null>(null);
  const groups = useMemo(() => {
    const query = normalizedSearch(search);
    const matching = jobs.filter(j => !query || normalizedSearch(`${j.company} ${j.position}`).includes(query));
    return (mode === "type" ? COMPANY_CATEGORIES : STAGES).map((name, i) => {
      const keys = new Set(schedules.filter(s => s.stage === name).map(s => getJobKey(s.company, s.position)));
      return { name, color: COLORS[i], jobs: matching.filter(j => mode === "type" ? classifyCompany(j.company) === name : name === "投递" || keys.has(getJobKey(j.company, j.position))) };
    });
  }, [jobs, schedules, search, mode]);
  const tiles = partition(groups.filter(g => g.jobs.length).sort((a, b) => b.jobs.length - a.jobs.length));
  return <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5" aria-label="公司版图">
    <header className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-[#1f2329]">公司版图</h2>
      <SlidingSegmentedControl ariaLabel="公司版图分组" options={["type", "stage"] as const} value={mode} onChange={setMode} getLabel={v => v === "type" ? "按类型" : "按环节"} compact className="w-[170px]" />
    </header>
    <div className="chart-crossfade relative h-[400px]" key={mode}>
      {tiles.length ? tiles.map(({group, x, y, w, h}) => <div className="absolute p-1" key={group.name} style={{left:`${x}%`, top:`${y}%`, width:`${w}%`, height:`${h}%`}}>
        <button onClick={event => { origin.current = event.currentTarget; setSelected(group); }} className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-[16px] border px-4 ${h < 20 ? "justify-center py-1" : "py-4"} text-left transition hover:brightness-[0.98] hover:shadow-sm ${group.color}`} aria-label={`浏览${group.name}公司`}>
          <span className="flex w-full shrink-0 items-center justify-between gap-2"><strong className="truncate text-sm font-semibold">{group.name}</strong><span className="text-xs text-slate-500">{group.jobs.length}</span></span>
          <span className={`${h < 20 ? "hidden" : "mt-3 flex"} min-h-0 flex-wrap content-start gap-1.5 overflow-hidden`}>
            {[...new Set(group.jobs.map(j => getCompanyDisplayName(j.company)))].sort((a,b) => a.localeCompare(b,"zh-CN")).map(company => <span key={company} className="max-w-full truncate rounded-md border border-white/80 bg-white/75 px-2 py-1 text-[11px] text-[#4e5969]">{company}</span>)}
          </span>
        </button>
      </div>) : <p className="grid h-full place-items-center text-sm text-slate-400">暂无数据</p>}
    </div>
    {selected ? <CompanyMapDialog title={selected.name} jobs={selected.jobs} origin={origin.current} onClose={() => setSelected(null)} onSelectCompany={onSelectCompany} /> : null}
  </section>;
}
