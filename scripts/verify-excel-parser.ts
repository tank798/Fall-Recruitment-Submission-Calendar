/**
 * Excel 解析与导出回归检查。
 *
 *   pnpm verify:excel
 *
 * 所有样例都写入临时目录，不会修改项目里的源 Excel 或 data/data.json。
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { exportStoreToExcel } from "../lib/excelExport";
import { parseSourceWorkbook } from "../lib/excelParser";
import { assertSafeExcelImport } from "../lib/importValidation";
import type { RecruitmentStore } from "../lib/types";

let failures = 0;

function check(name: string, passed: boolean, detail = "") {
  console.log(`${passed ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

function makeWorkbook(rows: unknown[][], jdRows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "总览");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(jdRows), "JD");
  return workbook;
}

async function main() {
  const directory = await mkdtemp(path.join("/private/tmp", "excel-parser-verify-"));
  try {
    const newline = String.fromCharCode(10);
    const legacyFile = path.join(directory, "legacy.xlsx");
    const legacyWorkbook = makeWorkbook(
      [
        ["公司", "批次", "岗位", "投递日期", "进度", "链接"],
        [
          "跨年科技",
          "秋招",
          "产品经理",
          "2026-09-03",
          ["9/19 09:00 笔试", "1/15 10:00 终面", "待安排 专业面"].join(newline),
          "https://example.com/apply",
        ],
        ["无日期公司", "秋招", "分析师", "", "待安排 综合面", ""],
      ],
      [
        ["公司", "岗位", "JD"],
        ["跨年科技", "产品经理", "JD A"],
        ["无日期公司", "分析师", "JD B"],
      ],
    );
    XLSX.writeFile(legacyWorkbook, legacyFile);

    const legacy = parseSourceWorkbook(legacyFile);
    const newYearInterview = legacy.schedules.find(
      (item) => item.stage === "面试" && item.interviewRound === "终面",
    );
    const writtenExam = legacy.schedules.find((item) => item.stage === "笔试");
    check("省略年份的跨年进度推断正确", newYearInterview?.date === "2027-01-15");
    check("笔试环节识别正确", writtenExam?.stage === "笔试");
    check(
      "无投递日期的进展没有丢失",
      legacy.jobs.find((job) => job.company === "无日期公司")?.pendingProgress === "待安排 综合面",
    );
    const stageFile = path.join(directory, "stage.xlsx");
    const stageWorkbook = makeWorkbook(
      [
        ["公司", "岗位", "投递日期", "进度"],
        ["阶段公司", "专业面岗位", "2026-09-03", "9/4 专业面"],
        ["阶段公司", "机考岗位", "2026-09-03", "9/5 线上机考"],
        ["阶段公司", "综合面岗位", "2026-09-03", "9/6 综合面"],
        ["阶段公司", "交叉面岗位", "2026-09-03", "9/7 交叉面"],
        ["阶段公司", "测评岗位", "2026-09-03", "9/8 在线测评"],
      ],
      [["公司", "岗位", "JD"]],
    );
    XLSX.writeFile(stageWorkbook, stageFile);
    const stageStore = parseSourceWorkbook(stageFile);
    check(
      "补充阶段关键词识别正确",
      stageStore.schedules.filter((item) => item.stage === "面试").length === 3 &&
        stageStore.schedules.some((item) => item.stage === "笔试"),
    );
    // 测评已并入笔试：识别为笔试，个性化文案自动写「测评」。
    const assessment = stageStore.schedules.find(
      (item) => item.position === "测评岗位" && item.stage === "笔试",
    );
    check(
      "测评并入笔试且文案为测评",
      assessment?.writtenRound === "测评" &&
        !stageStore.schedules.some((item) => (item.stage as string) === "测评"),
    );

    const formulaFile = path.join(directory, "formula.xlsx");
    const formulaWorkbook = makeWorkbook(
      [
        ["公司", "岗位", "投递日期", "进度"],
        ["第一家公司", "第一岗位", "2026-09-03", ""],
        [],
        ["第二家公司", "第二岗位", "2026-09-04", ""],
      ],
      [["公司", "岗位", "JD"], ["", "", "JD 1"], [], ["", "", "JD 2"]],
    );
    const formulaSheet = formulaWorkbook.Sheets.JD!;
    formulaSheet.A2 = { t: "s", f: "总览!A2", v: "" };
    formulaSheet.B2 = { t: "s", f: "总览!B2", v: "" };
    formulaSheet.A4 = { t: "s", f: "总览!A4", v: "" };
    formulaSheet.B4 = { t: "s", f: "总览!B4", v: "" };
    formulaSheet["!ref"] = "A1:C4";
    XLSX.writeFile(formulaWorkbook, formulaFile);
    const formulaStore = parseSourceWorkbook(formulaFile);
    check(
      "JD 公式按明确引用对齐",
      formulaStore.jobs.find((job) => job.company === "第一家公司")?.jd === "JD 1" &&
        formulaStore.jobs.find((job) => job.company === "第二家公司")?.jd === "JD 2",
    );

    const sourceStore: RecruitmentStore = {
      version: 1,
      importedAt: "2026-09-01T00:00:00.000Z",
      sourceFile: "data.json",
      schedules: [
        {
          id: "s1",
          company: "腾讯",
          position: "AI 产品经理",
          date: "2026-09-03",
          stage: "面试",
          interviewRound: "一面",
          sourceLink: "https://example.com/tencent",
          source: "web",
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "s2",
          company: "腾讯",
          position: "AI 产品经理",
          date: "2026-09-04",
          stage: "笔试",
          writtenRound: "二笔",
          source: "web",
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "s3",
          company: "腾讯",
          position: "AI 产品经理",
          date: "2026-09-05",
          stage: "未通过",
          failNote: "一面挂",
          source: "web",
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      jobs: [
        {
          id: "j1",
          company: "腾讯",
          position: "AI 产品经理",
          jd: "岗位 JD",
          category: "互联网大厂",
          sourceLink: "https://example.com/tencent",
          pendingProgress: "待补日期：HR 面",
        },
      ],
    };
    const canonicalFile = path.join(directory, "canonical.xlsx");
    await writeFile(canonicalFile, exportStoreToExcel(sourceStore));
    const roundTrip = parseSourceWorkbook(canonicalFile);
    const roundTripSchedule = roundTrip.schedules.find((item) => item.id === "s1");
    const roundTripJob = roundTrip.jobs.find((job) => job.company === "腾讯");
    check(
      "导出 Excel 可以无损回导日程",
      roundTripSchedule?.stage === "面试" &&
        roundTripSchedule.interviewRound === "一面" &&
        roundTripSchedule.sourceLink === "https://example.com/tencent",
    );
    check(
      "笔试轮次可以无损导出和回导",
      roundTrip.schedules.find((item) => item.id === "s2")?.writtenRound === "二笔",
    );
    check(
      "未通过说明可以无损导出和回导",
      roundTrip.schedules.find((item) => item.id === "s3")?.failNote === "一面挂",
    );
    check("导出 Excel 可以回导 JD 与待补进展", roundTripJob?.jd === "岗位 JD" && roundTripJob.pendingProgress === "待补日期：HR 面");

    let emptyImportBlocked = false;
    try {
      assertSafeExcelImport({
        version: 1,
        importedAt: new Date().toISOString(),
        sourceFile: "wrong.xlsx",
        schedules: [],
        jobs: [],
      });
    } catch {
      emptyImportBlocked = true;
    }
    check("空日程 Excel 导入会被安全拦截", emptyImportBlocked);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  console.log(`\n${failures === 0 ? "全部通过 ✅" : `${failures} 项未通过 ❌`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
