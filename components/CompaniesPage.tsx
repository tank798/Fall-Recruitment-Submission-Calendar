import { BriefcaseBusiness, ChevronRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getCompanyDisplayName } from "@/lib/companyNames";
import type { Job } from "@/lib/types";
import { cn, normalizedSearch } from "@/lib/utils";
import { CompanyAvatar } from "./CompanyAvatar";

export function CompaniesPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (job: Job) => void }) {
  const [query, setQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const companies = useMemo(() => {
    const grouped = new Map<string, Job[]>();
    jobs.forEach((job) => {
      const company = getCompanyDisplayName(job.company);
      const collection = grouped.get(company) || [];
      collection.push(job);
      grouped.set(company, collection);
    });

    const searchTerm = normalizedSearch(query);
    return [...grouped.entries()]
      .map(([company, companyJobs]) => ({
        company,
        jobs: companyJobs.sort((a, b) => a.position.localeCompare(b.position, "zh-CN")),
      }))
      .filter(
        ({ company, jobs: companyJobs }) =>
          !searchTerm ||
          normalizedSearch(company).includes(searchTerm) ||
          companyJobs.some((job) => normalizedSearch(job.position).includes(searchTerm)),
      )
      .sort((a, b) => a.company.localeCompare(b.company, "zh-CN"));
  }, [jobs, query]);

  const activeCompany = companies.find(({ company }) => company === selectedCompany);
  const searchTerm = normalizedSearch(query);
  const visibleJobs = activeCompany
    ? searchTerm && !normalizedSearch(activeCompany.company).includes(searchTerm)
      ? activeCompany.jobs.filter((job) => normalizedSearch(job.position).includes(searchTerm))
      : activeCompany.jobs
    : [];

  return (
    <main
      aria-labelledby="companies-tab"
      className="flex min-w-0 flex-1 flex-col bg-white"
      id="companies-panel"
      role="tabpanel"
    >
      <header className="flex items-center justify-end border-b border-[#e5e6e8] px-8 py-4">
        <div className="relative w-[288px] shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f959e]" />
          <input
            aria-label="搜索公司或岗位"
            className="h-9 w-full rounded-lg border border-[#dee0e3] bg-[#f7f8fa] pl-9 pr-9 text-sm text-[#1f2329] outline-none transition placeholder:text-[#a8abb2] hover:bg-white focus:border-[#85a8ff] focus:bg-white focus:ring-2 focus:ring-[#3370ff]/10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索公司 / 岗位"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="清空搜索"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[#8f959e] hover:bg-[#eff0f1] hover:text-[#1f2329]"
              onClick={() => setQuery("")}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fa] px-8 pb-9 pt-6">
        {companies.length ? (
          <div className="mx-auto max-w-[1320px]">
            <div className="grid grid-cols-6 gap-3">
              {companies.map(({ company, jobs: companyJobs }) => {
                const isActive = activeCompany?.company === company;
                return (
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "group flex aspect-[3/1] min-h-[64px] min-w-0 items-center gap-2.5 rounded-[10px] border bg-white px-3 text-left shadow-[0_1px_2px_rgba(31,35,41,0.03)] transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:border-[#c9cdd4] hover:shadow-[0_4px_12px_rgba(31,35,41,0.07)]",
                      isActive
                        ? "border-[#85a8ff] bg-[#f5f8ff] shadow-[0_0_0_1px_rgba(51,112,255,0.07)]"
                        : "border-[#dee0e3]",
                    )}
                    key={company}
                    onClick={() =>
                      setSelectedCompany((current) => (current === company ? null : company))
                    }
                    type="button"
                  >
                    <CompanyAvatar company={company} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1f2329]">
                        {company}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#8f959e]">
                        {companyJobs.length} 个岗位
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {activeCompany ? (
              <section className="mt-5 overflow-hidden rounded-xl border border-[#dee0e3] bg-white shadow-[0_1px_2px_rgba(31,35,41,0.02)]">
                <div className="flex items-center gap-3 border-b border-[#eff0f1] px-5 py-3.5">
                  <CompanyAvatar company={activeCompany.company} />
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-[#1f2329]">
                      {activeCompany.company}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#8f959e]">{visibleJobs.length} 个岗位</p>
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  {visibleJobs.map((job, index) => (
                    <button
                      className={cn(
                        "group flex min-w-0 items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#f7f8fa]",
                        index % 2 === 0 && "border-r border-[#eff0f1]",
                        index >= 2 && "border-t border-[#eff0f1]",
                      )}
                      key={job.id}
                      onClick={() => onSelect(job)}
                      type="button"
                    >
                      <BriefcaseBusiness className="h-4 w-4 shrink-0 text-[#a8abb2] group-hover:text-[#3370ff]" />
                      <span className="min-w-0 flex-1 truncate text-sm text-[#3b3f45] group-hover:text-[#1f2329]">
                        {job.position}
                      </span>
                      {!job.jd ? (
                        <span className="shrink-0 text-[11px] text-[#a8abb2]">JD 待补充</span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#c9cdd4] group-hover:text-[#8f959e]" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="grid min-h-60 place-items-center text-sm text-[#8f959e]">
            没有找到匹配的公司或岗位
          </div>
        )}
      </div>
    </main>
  );
}
