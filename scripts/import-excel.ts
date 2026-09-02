import path from "node:path";
import { parseSourceWorkbook } from "../lib/excelParser";
import { replaceStore } from "../lib/dataStore";
import { assertSafeExcelImport } from "../lib/importValidation";

async function main() {
  const sourceFile =
    process.env.RECRUITMENT_EXCEL_PATH || path.join(process.cwd(), "秋招进度.xlsx");
  const store = parseSourceWorkbook(sourceFile);
  assertSafeExcelImport(store, {
    allowEmptySchedules: process.argv.includes("--allow-empty"),
  });
  await replaceStore(store);

  console.log(
    `已导入 ${store.schedules.length} 条日程、${store.jobs.length} 个岗位（来源：${store.sourceFile}）`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
