import * as XLSX from "xlsx";
import type { RecruitmentStore } from "./types";

function setWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }));
}

export function exportStoreToExcel(store: RecruitmentStore) {
  const workbook = XLSX.utils.book_new();
  const scheduleRows = store.schedules
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((schedule) => ({
      公司: schedule.company,
      岗位: schedule.position,
      日期: schedule.date,
      环节: schedule.stage,
      面试轮次: schedule.interviewRound || "",
      笔试轮次: schedule.writtenRound || "",
      Offer类型: schedule.offerType || "",
      未通过说明: schedule.failNote || "",
      来源链接: schedule.sourceLink || "",
      记录来源: schedule.source,
      记录ID: schedule.id,
      创建时间: schedule.createdAt,
      更新时间: schedule.updatedAt,
    }));
  const scheduleSheet = XLSX.utils.json_to_sheet(scheduleRows, {
    header: [
      "公司",
      "岗位",
      "日期",
      "环节",
      "面试轮次",
      "笔试轮次",
      "Offer类型",
      "未通过说明",
      "来源链接",
      "记录来源",
      "记录ID",
      "创建时间",
      "更新时间",
    ],
  });
  setWidths(scheduleSheet, [18, 28, 13, 10, 12, 12, 16, 14, 45, 12, 24, 24, 24]);
  scheduleSheet["!autofilter"] = { ref: scheduleSheet["!ref"] || "A1:M1" };
  // 导出的第一张表使用与解析器一致的规范列名，能够无损回导。
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, "总览");

  const jobRows = store.jobs.map((job) => ({
    公司: job.company,
    岗位: job.position,
    JD: job.jd,
    公司类别: job.category,
    招聘批次: job.batch || "",
    来源链接: job.sourceLink || "",
    待补日期进展: job.pendingProgress || "",
  }));
  const jobSheet = XLSX.utils.json_to_sheet(jobRows, {
    header: ["公司", "岗位", "JD", "公司类别", "招聘批次", "来源链接", "待补日期进展"],
  });
  setWidths(jobSheet, [18, 28, 85, 16, 14, 45, 40]);
  jobSheet["!autofilter"] = { ref: jobSheet["!ref"] || "A1:G1" };
  XLSX.utils.book_append_sheet(workbook, jobSheet, "JD");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: true });
}
