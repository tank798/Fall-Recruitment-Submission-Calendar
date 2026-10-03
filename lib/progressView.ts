import { getJobKey } from "./recruitmentStats";
import type { Schedule } from "./types";

/** 先按完整岗位历程判断最新状态，避免环节筛选让旧投递重新出现。 */
export function getProgressView(schedules: Schedule[], latestOnly: boolean, hideRejected: boolean) {
  const groups = new Map<string, Schedule[]>();
  for (const schedule of schedules) {
    const key = getJobKey(schedule.company, schedule.position);
    const group = groups.get(key) || [];
    group.push(schedule);
    groups.set(key, group);
  }
  const visible: Schedule[] = [];
  const history = new Map<string, Schedule[]>();
  for (const group of groups.values()) {
    group.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    if (hideRejected && group[0].stage === "未通过") continue;
    if (latestOnly) {
      visible.push(group[0]);
      history.set(group[0].id, group.slice(1));
    } else visible.push(...group);
  }
  return { visible, history };
}
