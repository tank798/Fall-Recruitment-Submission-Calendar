import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getProgressView } from "../lib/progressView";
import { scheduleInputSchema } from "../lib/scheduleSchema";
import { exportStoreToExcel } from "../lib/excelExport";
import { parseSourceWorkbook } from "../lib/excelParser";
import type { Schedule } from "../lib/types";
import { getPosterSummary } from "../lib/poster";

async function main() {
  const event = (id: string, company: string, position: string, date: string, stage: Schedule["stage"]): Schedule => ({id, company, position, date, stage, source: "web", createdAt: date, updatedAt: date});
  const records = [event("1", "示例甲", "产品", "2026-09-01", "投递"), event("2", "示例甲", "产品", "2026-09-02", "面试"), event("3", "示例乙", "研究", "2026-09-01", "投递"), event("4", "示例乙", "研究", "2026-09-03", "未通过"), event("5", "示例乙", "产品", "2026-09-01", "投递")];
  assert.equal(getProgressView(records, false, false).visible.length, 5);
  assert.equal(getProgressView(records, true, false).visible.length, 3);
  assert.equal(getProgressView(records, false, true).visible.length, 3);
  assert.deepEqual(getProgressView(records, true, true).visible.map((s) => s.id), ["2", "5"]);
  assert.deepEqual(getProgressView(records, true, true).history.get("2")?.map((s) => s.id), ["1"]);
  assert.equal(getProgressView([...records, event("6", "示例乙", "研究", "2026-09-04", "面试")], true, true).visible.length, 3);
  assert.equal(records[0].id, "1");
  const summary = getPosterSummary(records, "today", "2026-09-02");
  assert.equal(summary.counts.投递, 0);
  assert.equal(Object.values(summary.counts).reduce((sum, count) => sum + count, 0), summary.entries.length);
  const directory = await mkdtemp(path.join(tmpdir(), "progress-notes-"));
  process.chdir(directory);
  const store = await import("../lib/dataStore");
  const input = scheduleInputSchema.parse({company: "测试公司", position: "产品", date: "2026-09-01", stage: "面试", notes: "反馈第一行\n准备第二行"});
  const created = await store.createSchedule(input);
  assert.equal((await store.getDataStore()).schedules[0].notes, input.notes);
  const exported = path.join(directory, "roundtrip.xlsx");
  await writeFile(exported, exportStoreToExcel(await store.getDataStore()));
  assert.equal(parseSourceWorkbook(exported).schedules[0].notes, input.notes);
  await store.updateSchedule(created.id, {...input, notes: ""}, created.updatedAt);
  assert.equal((await store.getDataStore()).schedules[0].notes, "");
  console.log("PASS: 四种筛选组合、历史折叠、恢复进展、备注保存/清空及 Excel 回导；真实数据未改动。");
}
void main();
