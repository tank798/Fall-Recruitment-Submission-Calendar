import { ChevronRight, Download, FileSpreadsheet, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getTodayInChina } from "@/lib/cohort";
import { POSTER_TITLES, renderPoster, type PosterKind } from "@/lib/poster";
import type { Schedule } from "@/lib/types";

const POSTER_GROUPS: Array<{ label: string; items: PosterKind[] }> = [
  { label: "概览", items: ["today", "overview"] },
  { label: "按环节", items: ["application", "written", "interview", "offer", "rejected"] },
];

export function ExportMenu({ excelHref, schedules }: { excelHref: string; schedules: Schedule[] }) {
  const [open, setOpen] = useState(false);
  const [posterOptions, setPosterOptions] = useState(false);
  const [kind, setKind] = useState<PosterKind | null>(null);
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!area.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <>
    <div className="relative" ref={area}>
      <button type="button" aria-expanded={open} onClick={() => { setOpen(!open); setPosterOptions(false); }} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/80 bg-white/70 px-3.5 text-[14px] font-medium leading-5 text-[#4e5969] shadow-sm hover:bg-white">
        <Download className="h-4 w-4" />导出
      </button>
      {open ? <div className="absolute right-0 top-full z-50 mt-2 w-[232px] rounded-[14px] border border-slate-200/90 bg-white p-1.5 text-[14px] leading-5 shadow-[0_16px_40px_rgba(31,35,41,0.14)]">
        <a href={excelHref} onClick={() => setOpen(false)} className="flex h-10 items-center gap-2.5 rounded-[10px] px-3 font-medium text-[#303846] hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-400" />导出为 Excel</a>
        <button type="button" aria-expanded={posterOptions} onClick={() => setPosterOptions(!posterOptions)} className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left font-medium text-[#303846] hover:bg-slate-50"><ImageIcon className="h-4 w-4 shrink-0 text-slate-400" /><span className="flex-1">导出为海报</span><ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${posterOptions ? "rotate-90" : ""}`} /></button>
        {posterOptions ? <div className="mt-1 border-t border-slate-100 px-1 pt-2">
          {POSTER_GROUPS.map((group) => <div className="mb-2 last:mb-0" key={group.label}>
            <p className="px-2 py-1 text-[11px] font-medium tracking-[0.08em] text-slate-400">{group.label}</p>
            <div className="grid grid-cols-2 gap-1">
              {group.items.map((value) => <button type="button" key={value} onClick={() => { setKind(value); setOpen(false); }} className="rounded-lg px-2 py-1.5 text-left text-[13px] font-medium leading-5 text-slate-600 hover:bg-blue-50 hover:text-blue-600">{POSTER_TITLES[value]}</button>)}
            </div>
          </div>)}
        </div> : null}
      </div> : null}
    </div>
    {kind ? <PosterPreview kind={kind} schedules={schedules} onClose={() => setKind(null)} /> : null}
  </>;
}

function PosterPreview({ kind, schedules, onClose }: { kind: PosterKind; schedules: Schedule[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [showNames, setShowNames] = useState(false);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => {
    let active = true;
    setImage("");
    setError("");
    renderPoster(schedules, kind, showNames)
      .then((result) => { if (active) setImage(result); })
      .catch(() => { if (active) setError("海报生成失败，请关闭后重试。"); });
    return () => { active = false; };
  }, [schedules, kind, showNames]);

  return createPortal(<dialog ref={dialog} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="poster-title" className="m-auto w-[650px] max-w-[95vw] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/30">
    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 id="poster-title" className="text-[15px] font-semibold">{POSTER_TITLES[kind]} · 海报预览</h2><button type="button" aria-label="关闭海报预览" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
    <div className="flex max-h-[67vh] min-h-60 justify-center overflow-auto bg-[#e9e7e2] p-6">
      {image ? <img src={image} alt={`${POSTER_TITLES[kind]}海报`} className="h-auto w-[340px] self-start shadow-[0_18px_45px_rgba(35,39,47,0.18)]" /> : <p className="self-center text-sm text-slate-500" role="status">{error || "正在生成海报…"}</p>}
    </div>
    <footer className="flex items-center justify-between px-5 py-4"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showNames} onChange={(event) => setShowNames(event.target.checked)} />显示公司与岗位（最近 7 条）</label>{image ? <a download={`${POSTER_TITLES[kind]}-${getTodayInChina()}.png`} href={image} className="rounded-lg bg-[#3370ff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">下载 PNG</a> : <button disabled className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-400">下载 PNG</button>}</footer>
  </dialog>, document.body);
}
