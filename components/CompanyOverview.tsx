import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { classifyCompany } from "@/lib/companyClassifier";
import { getCompanyDisplayName } from "@/lib/companyNames";
import { COMPANY_CATEGORIES, type CompanyCategory, type Job } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { CompanyAvatar } from "./CompanyAvatar";

const CATEGORY_ACCENT: Record<CompanyCategory, string> = {
  互联网大厂: "bg-[#eaf1ff] text-[#245bdb]",
  金融公司: "bg-violet-50 text-violet-700",
  实体企业: "bg-emerald-50 text-emerald-700",
  央国企: "bg-amber-50 text-amber-700",
};

export function CompanyOverview({
  jobs,
  search,
  onSelectCompany,
}: {
  jobs: Job[];
  search: string;
  onSelectCompany: (company: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<CompanyCategory | null>(null);
  const origin = useRef<HTMLButtonElement | null>(null);
  const dialog = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const closeCategory = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    if (dialog.current && origin.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const from = dialog.current.getBoundingClientRect();
      const to = origin.current.getBoundingClientRect();
      await dialog.current.animate([
        { transform: "none", opacity: 1 },
        { transform: `translate(${to.x + to.width / 2 - from.x - from.width / 2}px, ${to.y + to.height / 2 - from.y - from.height / 2}px) scale(${to.width / from.width}, ${to.height / from.height})`, opacity: 0 },
      ], { duration: 220, easing: "ease-in-out", fill: "forwards" }).finished.catch(() => {});
    }
    setExpandedCategory(null);
    origin.current?.focus({ preventScroll: true });
    closing.current = false;
  }, []);
  useEffect(() => {
    if (!expandedCategory || !dialog.current) return;
    const panel = dialog.current;
    const from = origin.current?.getBoundingClientRect();
    const to = panel.getBoundingClientRect();
    if (from && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) panel.animate([
      { transform: `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0 },
      { transform: "none", opacity: 1 },
    ], { duration: 250, easing: "cubic-bezier(.22,1,.36,1)" });
    panel.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); void closeCategory(); }
      if (event.key === "Tab") {
        const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    panel.addEventListener("keydown", handleKey);
    return () => panel.removeEventListener("keydown", handleKey);
  }, [expandedCategory, closeCategory]);
  const directory = useMemo(() => {
    const query = normalizedSearch(search);
    const grouped = new Map<CompanyCategory, Map<string, Job[]>>(
      COMPANY_CATEGORIES.map((category) => [category, new Map()]),
    );
    jobs.forEach((job) => {
      const company = getCompanyDisplayName(job.company);
      if (
        query &&
        !normalizedSearch(company).includes(query) &&
        !normalizedSearch(job.position).includes(query)
      ) return;
      const category = classifyCompany(company);
      const companyJobs = grouped.get(category)!.get(company) || [];
      companyJobs.push(job);
      grouped.get(category)!.set(company, companyJobs);
    });

    return new Map(
      COMPANY_CATEGORIES.map((category) => [
        category,
        [...grouped.get(category)!.entries()]
          .map(([company, companyJobs]) => ({ company, jobs: companyJobs }))
          .sort((a, b) => b.jobs.length - a.jobs.length || a.company.localeCompare(b.company, "zh-CN")),
      ]),
    );
  }, [jobs, search]);

  const openCompany = (company: string) => {
    setExpandedCategory(null);
    onSelectCompany(company);
  };

  return (
    <section aria-labelledby="company-overview-title" className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-[#1f2329]" id="company-overview-title">公司总览</h2>
        <p className="mt-1 text-xs text-[#8f959e]">按类别浏览已投公司，点击卡片查看全部</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {COMPANY_CATEGORIES.map((category) => {
          const companies = directory.get(category) || [];
          return (
            <button
              className="group min-h-[190px] min-w-0 rounded-[14px] border border-[#e5e7eb] bg-[#fbfcfd] p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#cfd3da] hover:bg-white hover:shadow-[0_10px_24px_rgba(31,35,41,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
              key={category}
              onClick={(event) => { origin.current = event.currentTarget; setExpandedCategory(category); }}
              type="button"
            >
              <span className="flex items-start justify-between gap-2">
                <span>
                  <span className="block text-sm font-semibold text-[#1f2329]">{category}</span>
                  <span className="mt-1 block text-xs text-[#8f959e]">{companies.length} 家公司</span>
                </span>
                <span className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${CATEGORY_ACCENT[category]}`}>
                  {companies.reduce((sum, company) => sum + company.jobs.length, 0)} 岗
                </span>
              </span>
              <span className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {companies.slice(0, 10).map(({ company }) => (
                  <span className="truncate text-xs text-[#4e5969]" key={company}>{company}</span>
                ))}
              </span>
              {companies.length === 0 ? (
                <span className="mt-10 block text-center text-xs text-[#b0b5bd]">暂无公司</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {expandedCategory ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-8">
          <button
            aria-label="返回公司总览"
            className="absolute inset-0 bg-[#1f2329]/20 backdrop-blur-[2px]"
            onClick={() => void closeCategory()}
            type="button"
          />
          <article ref={dialog} role="dialog" aria-modal="true" aria-label={expandedCategory} className="relative z-10 flex max-h-[76vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_28px_80px_rgba(31,35,41,0.2)]">
            <header className="flex items-center justify-between border-b border-[#eceef1] px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-[#1f2329]">{expandedCategory}</h3>
                <p className="mt-1 text-xs text-[#8f959e]">{directory.get(expandedCategory)?.length || 0} 家公司</p>
              </div>
              <button
                aria-label="关闭公司类别"
                className="grid h-9 w-9 place-items-center rounded-[10px] text-[#8f959e] transition hover:bg-[#f2f3f5] hover:text-[#1f2329]"
                onClick={() => void closeCategory()}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="company-directory-scroll min-h-0 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-2.5">
                {(directory.get(expandedCategory) || []).map(({ company, jobs: companyJobs }) => (
                  <button
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-3 text-left transition hover:border-[#c9cdd4] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
                    key={company}
                    onClick={() => openCompany(company)}
                    type="button"
                  >
                    <CompanyAvatar company={company} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1f2329]">{company}</span>
                      <span className="mt-0.5 block text-[11px] text-[#8f959e]">{companyJobs.length} 个岗位</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
