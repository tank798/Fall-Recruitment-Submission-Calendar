import type { RecruitmentStore } from "./types";

/**
 * 防止选错工作簿或列名无法识别时，用空解析结果覆盖已有网页数据。
 * 真正需要导入空日程时，必须由命令行显式确认。
 */
export function assertSafeExcelImport(
  store: RecruitmentStore,
  options: { allowEmptySchedules?: boolean } = {},
) {
  if (store.schedules.length > 0 || options.allowEmptySchedules) return;

  throw new Error(
    "Excel 中没有解析出任何日程，已中止导入，data/data.json 未修改。" +
      "请检查 Sheet 和列名；如确认要导入空日程，请追加 --allow-empty。",
  );
}
