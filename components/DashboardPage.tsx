import type { Job, Schedule } from "@/lib/types";
import { CompanyTreemap } from "./CompanyTreemap";
import { DailyFlowChart } from "./DailyFlowChart";
import { DashboardKpiStrip } from "./DashboardKpiStrip";

export function DashboardPage({
  schedules,
  jobs,
  search,
  onSelectCompany,
}: {
  schedules: Schedule[];
  jobs: Job[];
  search: string;
  onSelectCompany: (company: string) => void;
}) {
  return (
    <main
      aria-labelledby="dashboard-tab"
      className="min-w-0 flex-1 overflow-y-auto bg-[#f7f8fa]"
      id="dashboard-panel"
      role="tabpanel"
    >
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-6 py-6 lg:px-8">
        <DashboardKpiStrip schedules={schedules} />
        <CompanyTreemap jobs={jobs} schedules={schedules} search={search} onSelectCompany={onSelectCompany} />
        <DailyFlowChart schedules={schedules} />
      </div>
    </main>
  );
}
