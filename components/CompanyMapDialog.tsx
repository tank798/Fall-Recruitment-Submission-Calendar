import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCompanyDisplayName } from "@/lib/companyNames";
import type { Job } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";

const collator = new Intl.Collator("zh-CN-u-co-pinyin");
const letters = "ABCDEFGHJKLMNOPQRSTWXYZ";
const boundaries = "阿八嚓搭蛾发噶哈击喀垃妈拿哦啪期然撒塌挖昔压匝";
function initial(name: string) {
  const char = Array.from(name.trim())[0] || "";
  if (/^[a-z]$/i.test(char)) return char.toUpperCase();
  if (!/\p{Script=Han}/u.test(char)) return "#";
  for (let i = boundaries.length - 1; i >= 0; i--) if (collator.compare(char, boundaries[i]) >= 0) return letters[i];
  return "A";
}

export function CompanyMapDialog({ title, jobs, origin, onClose, onSelectCompany }: {
  title: string; jobs: Job[]; origin: HTMLButtonElement | null; onClose: () => void; onSelectCompany: (company: string) => void;
}) {
  const [search, setSearch] = useState("");
  const panel = useRef<HTMLElement>(null);
  const closing = useRef(false);
  const callbacks = useRef({ onClose });
  callbacks.current = { onClose };
  const transform = () => {
    if (!origin || !panel.current) return "scale(.96)";
    const a = origin.getBoundingClientRect(), b = panel.current.getBoundingClientRect();
    return `translate(${a.x+a.width/2-b.x-b.width/2}px,${a.y+a.height/2-b.y-b.height/2}px) scale(${a.width/b.width},${a.height/b.height})`;
  };
  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    if (panel.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) await panel.current.animate([{transform:"none",opacity:1},{transform:transform(),opacity:0}],{duration:220,easing:"ease-in-out",fill:"forwards"}).finished.catch(() => {});
    callbacks.current.onClose();
    origin?.focus({preventScroll:true});
  };
  const closeAction = useRef(close);
  closeAction.current = close;
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) element.animate([{transform:transform(),opacity:0},{transform:"none",opacity:1}],{duration:250,easing:"cubic-bezier(.22,1,.36,1)"});
    element.querySelector("input")?.focus({preventScroll:true});
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); void closeAction.current(); }
      if (event.key === "Tab") {
        const controls = [...element.querySelectorAll<HTMLElement>("input,button")];
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
      }
    };
    element.addEventListener("keydown",keydown);
    return () => element.removeEventListener("keydown",keydown);
    // This dialog mounts once per selected tile; the origin stays fixed.
  }, []);
  const groups = useMemo(() => {
    const names = new Map<string,number>();
    const query = normalizedSearch(search);
    jobs.forEach(job => {
      const name = getCompanyDisplayName(job.company);
      if (query && !normalizedSearch(`${name} ${job.position}`).includes(query)) return;
      names.set(name,(names.get(name)||0)+1);
    });
    const groups = new Map<string,Array<[string,number]>>();
    [...names].sort(([a],[b])=>collator.compare(a,b)).forEach(entry => {
      const letter = initial(entry[0]);
      groups.set(letter,[...(groups.get(letter)||[]),entry]);
    });
    return [...groups].sort(([a],[b])=>a.localeCompare(b));
  },[jobs,search]);
  return <div className="fixed inset-0 z-[60] grid place-items-center p-8">
    <button aria-label="关闭公司浏览" className="absolute inset-0 bg-slate-950/20 backdrop-blur-[3px]" onClick={()=>void close()} />
    <article ref={panel} role="dialog" aria-modal="true" aria-label={`${title}公司浏览`} className="relative flex max-h-[78vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_24px_80px_rgba(31,35,41,0.18)]">
      <header className="flex items-center gap-5 border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="relative ml-auto w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input aria-label="搜索公司或岗位" placeholder="搜索公司 / 岗位" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" value={search} onChange={event=>setSearch(event.target.value)} />
          {search ? <button aria-label="清除公司搜索" className="absolute right-2 top-2 p-1 text-slate-400" onClick={()=>setSearch("")}><X className="h-4 w-4" /></button> : null}
        </div>
        <button aria-label="关闭公司类别" className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100" onClick={()=>void close()}><X className="h-4 w-4" /></button>
      </header>
      <div className="company-directory-scroll min-h-[200px] overflow-y-auto px-6 pb-6">
        {groups.length ? groups.map(([letter,companies])=><section key={letter} className="pt-5">
          <h3 className="mb-3 flex items-center gap-3 text-xs font-semibold text-slate-400"><span>{letter}</span><span className="h-px flex-1 bg-slate-100" /></h3>
          <div className="grid grid-cols-3 gap-2">{companies.map(([name,count])=><button key={name} onClick={()=>{onClose();onSelectCompany(name);}} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 text-left text-sm transition hover:border-blue-100 hover:bg-blue-50/50"><span className="truncate font-medium">{name}</span><span className="shrink-0 text-xs text-slate-400">{count}</span></button>)}</div>
        </section>) : <p className="py-16 text-center text-sm text-slate-400">暂无数据</p>}
      </div>
    </article>
  </div>;
}
