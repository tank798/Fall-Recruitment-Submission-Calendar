import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";

export function CohortSelector() {
  const { cohortOptions, selectedGraduationYear, setSelectedGraduationYear } = useRecruitmentCohort();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    items.current[cohortOptions.indexOf(selectedGraduationYear)]?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, cohortOptions, selectedGraduationYear]);

  return (
    <div className="relative shrink-0" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={trigger} type="button"
        aria-label={`选择秋招届别，当前 ${selectedGraduationYear}届`}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
        }}
        className="flex h-9 items-center gap-2 rounded-[10px] border border-white/80 bg-white px-3 text-sm font-medium text-[#30343b] shadow-[0_1px_4px_rgba(31,35,41,0.06)] outline-none transition hover:border-[#d7dae0] focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
      >
        {selectedGraduationYear}届
        <ChevronDown className={`h-3.5 w-3.5 text-[#8f959e] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label="秋招届别" className="absolute right-0 top-full z-50 mt-2 min-w-[132px] rounded-xl border border-[#e5e7eb] bg-white p-1.5 text-sm text-[#272b32] shadow-[0_12px_32px_rgba(31,35,41,0.12)]" onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
          const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === "ArrowDown" ? (index + 1) % cohortOptions.length : event.key === "ArrowUp" ? (index - 1 + cohortOptions.length) % cohortOptions.length : event.key === "Home" ? 0 : event.key === "End" ? cohortOptions.length - 1 : -1;
          if (next >= 0) { event.preventDefault(); items.current[next]?.focus(); }
        }}>
          {cohortOptions.map((year, index) => (
            <button key={year} ref={(element) => { items.current[index] = element; }} role="menuitemradio" aria-checked={year === selectedGraduationYear} tabIndex={year === selectedGraduationYear ? 0 : -1} type="button"
              className={`flex h-9 w-full items-center justify-between gap-4 rounded-lg px-3 text-left outline-none hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] ${year === selectedGraduationYear ? "bg-[#f7f8fa] font-semibold" : "font-normal"}`}
              onClick={() => { setSelectedGraduationYear(year); setOpen(false); trigger.current?.focus(); }}>
              {year}届{year === selectedGraduationYear ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
