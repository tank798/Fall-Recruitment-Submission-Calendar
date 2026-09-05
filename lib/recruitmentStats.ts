import { getCompanyMatchKey } from "./companyNames";
import type { Schedule, Stage } from "./types";
import { normalizedSearch } from "./utils";

export function getJobKey(company: string, position: string) {
  return `${getCompanyMatchKey(company)}::${normalizedSearch(position)}`;
}

/** 同一公司同一岗位在同一环节只计一次。 */
export function getRecruitmentStats(schedules: Schedule[]) {
  const stagesByJob = new Map<string, Set<Stage>>();
  for (const schedule of schedules) {
    const key = getJobKey(schedule.company, schedule.position);
    const stages = stagesByJob.get(key) || new Set<Stage>();
    stages.add(schedule.stage);
    stagesByJob.set(key, stages);
  }

  const count = (stage: Stage) => {
    let total = 0;
    for (const stages of stagesByJob.values()) if (stages.has(stage)) total += 1;
    return total;
  };

  return {
    totalJobs: stagesByJob.size,
    counts: {
      投递: stagesByJob.size,
      笔试: count("笔试"),
      面试: count("面试"),
      Offer: count("Offer"),
      未通过: count("未通过"),
    } satisfies Record<Stage, number>,
  };
}

export function formatPercent(numerator: number, denominator: number) {
  if (!denominator) return "0.0%";
  const value = (numerator / denominator) * 100;
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(1)}%`;
}
