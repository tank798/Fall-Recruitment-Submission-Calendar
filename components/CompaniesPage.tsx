import { useMemo } from "react";
import { getCompanyDisplayName, getCompanyMatchKey } from "@/lib/companyNames";
import type { Job, Schedule, StageFilterValue } from "@/lib/types";
import { cn, normalizedSearch } from "@/lib/utils";
import { CompanyAvatar } from "./CompanyAvatar";
import { StatusSummaryCards } from "./StatusSummaryCards";

export function CompaniesPage({
  jobs,
  schedules,
  search,
  stageFilter,
  selectedCompany,
  onSelectCompany,
  onStageFilterChange,
}: {
  jobs: Job[];
  schedules: Schedule[];
  search: string;
  stageFilter: StageFilterValue;
  selectedCompany: string | null;
  onSelectCompany: (company: string | null) => void;
  onStageFilterChange: (value: StageFilterValue) => void;
}) {
  const companies = useMemo(() => {
    const visibleJobKeys = new Set(
      schedules
        .filter((schedule) => stageFilter === "全部" || schedule.stage === stageFilter)
        .map(
          (schedule) =>
            `${getCompanyMatchKey(schedule.company)}::${normalizedSearch(schedule.position)}`,
        ),
    );
    const grouped = new Map<string, Job[]>();
    jobs.forEach((job) => {
      const key = `${getCompanyMatchKey(job.company)}::${normalizedSearch(job.position)}`;
      if (!visibleJobKeys.has(key)) return;
      const company = getCompanyDisplayName(job.company);
      const collection = grouped.get(company) || [];
      collection.push(job);
      grouped.set(company, collection);
    });

    const searchTerm = normalizedSearch(search);
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
      // 按投递岗位数从高到低排序；数量相同时按公司名排序，保证顺序稳定。
      .sort(
        (a, b) =>
          b.jobs.length - a.jobs.length ||
          a.company.localeCompare(b.company, "zh-CN"),
      );
  }, [jobs, schedules, search, stageFilter]);

  return (
    <main
      aria-labelledby="companies-tab"
      className="flex min-w-0 flex-1 flex-col bg-white"
      id="companies-panel"
      role="tabpanel"
    >
      <section className="shrink-0 border-b border-[#e5e6e8] px-4 py-3 sm:px-8">
        <StatusSummaryCards
          onChange={onStageFilterChange}
          schedules={schedules}
          value={stageFilter}
        />
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fa] px-6 pb-9 pt-6 sm:px-8">
        {companies.length ? (
          <div className="mx-auto max-w-[1320px]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {companies.map(({ company, jobs: companyJobs }) => {
                const isActive = selectedCompany === company;
                return (
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "group flex min-h-[64px] min-w-0 items-center gap-2.5 rounded-[10px] border bg-white px-3 text-left shadow-[0_1px_2px_rgba(31,35,41,0.03)] transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-px hover:border-[#c9cdd4] hover:shadow-[0_4px_12px_rgba(31,35,41,0.07)]",
                      isActive
                        ? "border-[#85a8ff] bg-[#f5f8ff] shadow-[0_0_0_1px_rgba(51,112,255,0.07)]"
                        : "border-[#dee0e3]",
                    )}
                    key={company}
                    onClick={() => onSelectCompany(isActive ? null : company)}
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
