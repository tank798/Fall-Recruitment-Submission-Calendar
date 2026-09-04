import { getDataStore } from "@/lib/dataStore";
import { exportStoreToExcel } from "@/lib/excelExport";
import { getCohortDateRange, isDateInRange } from "@/lib/cohort";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import { STAGES, type Stage } from "@/lib/types";
import { getCompanyMatchKey } from "@/lib/companyNames";
import { normalizedSearch } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const store = await getDataStore();
  const params = new URL(request.url).searchParams;
  const graduationYear = Number(params.get("graduationYear"));
  const hasCohort = Number.isInteger(graduationYear) && graduationYear >= 2000 && graduationYear <= 2200;
  const dateRange = hasCohort ? getCohortDateRange(graduationYear) : null;
  const stageParam = params.get("stage") || "全部";
  const stage = STAGES.includes(stageParam as Stage) ? (stageParam as Stage) : "全部";
  const search = normalizedSearch(params.get("search") || "");
  const schedules = store.schedules.filter((schedule) => {
    if (dateRange && !isDateInRange(schedule.date, dateRange)) return false;
    if (stage !== "全部" && schedule.stage !== stage) return false;
    if (!search) return true;
    return normalizedSearch(
      `${schedule.company} ${schedule.position} ${schedule.stage} ${getScheduleStageLabel(schedule)}`,
    ).includes(search);
  });
  const jobKeys = new Set(
    schedules.map(
      (schedule) => `${getCompanyMatchKey(schedule.company)}::${normalizedSearch(schedule.position)}`,
    ),
  );
  const jobs = store.jobs.filter((job) =>
    jobKeys.has(`${getCompanyMatchKey(job.company)}::${normalizedSearch(job.position)}`),
  );
  const workbook = exportStoreToExcel({ ...store, schedules, jobs });
  const date = new Date().toISOString().slice(0, 10);
  const utf8Name = encodeURIComponent(`秋招时间表-${date}.xlsx`);

  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="autumn-recruitment-${date}.xlsx"; filename*=UTF-8''${utf8Name}`,
      "Cache-Control": "no-store",
    },
  });
}
