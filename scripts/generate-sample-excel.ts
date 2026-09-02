/**
 * 生成一份样例「秋招进度.xlsx」，用于在没有真实数据时演示和自测。
 *
 *   pnpm sample:excel              # 输出到 样例秋招进度.xlsx
 *   pnpm sample:excel 我的表.xlsx   # 自定义输出路径
 *
 * 表结构与 lib/excelParser.ts 的解析规则保持一致：
 *   - 「总览」表：公司 / 批次 / 岗位 / 投递日期 / 进度 / 链接
 *     其中「进度」是多行文本，每行形如 `9/5 19:00 笔试（SQL+统计）`，
 *     日期可省略年份，会回退到投递日期所在年份；环节由文字自动推断。
 *   - 「JD」表：公司 / 岗位 / JD
 */

import path from "node:path";
import * as XLSX from "xlsx";

interface SampleRow {
  company: string;
  batch: string;
  position: string;
  applicationDate: string;
  progress: string[];
  link: string;
  jd: string;
}

const rows: SampleRow[] = [
  {
    company: "腾讯",
    batch: "2027届秋招正式批",
    position: "数据分析（增长）",
    applicationDate: "2026-08-20",
    progress: [
      "8/28 19:00 在线测评（行测+性格）",
      "9/5 19:00 笔试（SQL+统计）",
      "9/12 14:00 一面 技术面",
      "9/20 15:00 二面 业务面",
    ],
    link: "https://join.qq.com/campus.html",
    jd: "负责增长方向的数据分析，搭建指标体系与实验评估框架。\n要求：熟练 SQL、统计基础扎实、有 A/B 实验经验。",
  },
  {
    company: "字节跳动",
    batch: "2027届秋招提前批",
    position: "数据分析师",
    applicationDate: "2026-08-22",
    progress: [
      "9/3 19:30 笔试（牛客平台，三道编程）",
      "9/11 10:00 一面",
      "9/18 16:00 二面 交叉面",
    ],
    link: "https://jobs.bytedance.com/campus",
    jd: "支持业务线的数据需求，产出分析报告并推动策略落地。\n要求：Python / SQL 熟练，具备商业 sense。",
  },
  {
    company: "中信证券",
    batch: "2027届校园招聘",
    position: "量化研究",
    applicationDate: "2026-08-25",
    progress: ["9/10 15:00 专业面（需带纸质简历）", "9/24 10:00 终面 HR面"],
    link: "https://job.citics.com",
    jd: "参与量化策略研究与因子挖掘，覆盖股票与衍生品市场。\n要求：数理背景，熟悉 Python，了解常见因子模型。",
  },
  {
    company: "阿里巴巴",
    batch: "2027届秋招",
    position: "商业分析",
    applicationDate: "2026-08-26",
    progress: ["9/1 20:00 云雀测评", "9/14 19:00 笔试", "9/22 14:00 一面"],
    link: "https://talent.alibaba.com",
    jd: "面向电商业务的商业分析，负责经营诊断与增长机会挖掘。",
  },
  {
    company: "招商银行",
    batch: "Fintech管培生",
    position: "数据科技",
    applicationDate: "2026-08-27",
    progress: ["9/8 10:00 线上机考", "9/17 09:30 半结构化面试"],
    link: "https://campus.cmbchina.com",
    jd: "银行零售数据平台建设与用户分层模型开发。",
  },
  {
    company: "美的集团",
    batch: "2027届星光计划",
    position: "数据运营",
    applicationDate: "2026-08-30",
    progress: ["9/9 14:00 群面", "待安排 复试（时间未定）"],
    link: "https://campus.midea.com",
    jd: "负责渠道与库存数据的日常运营分析，支撑供应链决策。",
  },
  {
    company: "小红书",
    batch: "2027届秋招",
    position: "数据分析",
    applicationDate: "2026-09-02",
    progress: ["9/15 11:00 二面 交叉面", "9/26 15:00 终面"],
    link: "https://job.xiaohongshu.com",
    jd: "社区与电商方向的数据分析，关注真实用户体验指标。\n要求：对内容社区有理解，具备因果推断基础。",
  },
  {
    company: "国家电网",
    batch: "第一批统一招聘",
    position: "数据管理",
    applicationDate: "2026-09-03",
    progress: ["9/19 09:00 统一笔试"],
    link: "https://zhaopin.sgcc.com.cn",
    jd: "电网运行数据的治理与统计分析工作。",
  },
];

function main() {
  const output = process.argv[2] || "样例秋招进度.xlsx";

  const overviewSheet = XLSX.utils.aoa_to_sheet([
    ["公司", "批次", "岗位", "投递日期", "进度", "链接"],
    ...rows.map((row) => [
      row.company,
      row.batch,
      row.position,
      row.applicationDate,
      row.progress.join("\n"),
      row.link,
    ]),
  ]);
  overviewSheet["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 46 },
    { wch: 34 },
  ];

  const jdSheet = XLSX.utils.aoa_to_sheet([
    ["公司", "岗位", "JD"],
    ...rows.map((row) => [row.company, row.position, row.jd]),
  ]);
  jdSheet["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 70 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "总览");
  XLSX.utils.book_append_sheet(workbook, jdSheet, "JD");
  XLSX.writeFile(workbook, output);

  const scheduleCount = rows.reduce((total, row) => total + 1 + row.progress.length, 0);
  console.log(`已生成 ${path.resolve(output)}`);
  console.log(`包含 ${rows.length} 个岗位、约 ${scheduleCount} 条日程（含未标注日期的进展）`);
  console.log(`\n用它启动应用：RECRUITMENT_EXCEL_PATH=${output} pnpm dev`);
}

main();
