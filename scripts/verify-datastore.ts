/**
 * 数据层可靠性验证脚本。
 *
 *   pnpm verify:datastore
 *
 * 会在临时目录里跑，不会碰你真实的 data/。覆盖最容易丢数据的几个场景：
 *   1. 并发写入是否丢记录（原实现必然丢）
 *   2. 增删改并发后数据是否自洽
 *   3. data.json 损坏后能否从备份自动恢复
 *   4. 单条脏记录会不会连坐整个文件
 *   5. 没有 Excel 数据源时能否正常起一份空数据
 *   6. 备份是否真的可用
 *   7. 岗位索引、链接清空和多标签页冲突是否正确处理
 */

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let failures = 0;

function check(name: string, passed: boolean, detail = "") {
  console.log(`${passed ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

function sampleInput(company: string) {
  return {
    company,
    position: "数据分析",
    date: "2026-09-10",
    time: "10:00",
    stage: "投递" as const,
    detail: "",
    location: "",
    notes: "",
    sourceLink: undefined,
    batch: "秋招" as const,
    jd: "负责业务数据分析与决策支持。",
  };
}

/** 子进程模式：在一个全新的空目录里验证「无数据源也能启动」。 */
async function runEmptyBootstrapCheck() {
  const workspace = await mkdtemp(path.join(tmpdir(), "datastore-empty-"));
  process.chdir(workspace);
  const dataStore = await import("../lib/dataStore");
  const store = await dataStore.getDataStore();
  if (!Array.isArray(store.schedules) || store.schedules.length !== 0) {
    throw new Error(`期望空数据，实际 ${JSON.stringify(store.schedules).slice(0, 120)}`);
  }
  console.log("EMPTY_BOOTSTRAP_OK");
}

async function main() {
  if (process.env.VERIFY_MODE === "empty") {
    await runEmptyBootstrapCheck();
    return;
  }

  const workspace = await mkdtemp(path.join(tmpdir(), "datastore-verify-"));
  process.chdir(workspace);

  // dataStore 在模块加载时按 process.cwd() 计算路径，因此必须先 chdir 再 import。
  const dataStore = await import("../lib/dataStore");
  const DATA_FILE = path.join(workspace, "data", "data.json");

  /* --- 场景 1：并发写入不丢记录 ----------------------------------- */
  const total = 40;
  await Promise.all(
    Array.from({ length: total }, (_, index) =>
      dataStore.createSchedule(sampleInput(`公司${index}`)),
    ),
  );

  const afterConcurrent = await dataStore.getDataStore();
  check(
    "并发写入不丢记录",
    afterConcurrent.schedules.length === total,
    `期望 ${total} 条，实际 ${afterConcurrent.schedules.length} 条`,
  );
  check(
    "网页新增同步岗位索引",
    afterConcurrent.jobs.length === total &&
      afterConcurrent.jobs.some((job) => job.company === "公司0" && job.position === "数据分析"),
    `期望 ${total} 个岗位，实际 ${afterConcurrent.jobs.length} 个`,
  );
  check(
    "招聘批次与 JD 同步到岗位",
    afterConcurrent.jobs.every(
      (job) => job.batch === "秋招" && job.jd === "负责业务数据分析与决策支持。",
    ),
  );
  check(
    "记录 id 无重复",
    new Set(afterConcurrent.schedules.map((s) => s.id)).size === afterConcurrent.schedules.length,
  );

  /* --- 场景 2：增删改并发后自洽 ----------------------------------- */
  const victim = afterConcurrent.schedules[0]!.id;
  const target = afterConcurrent.schedules[1]!.id;

  await Promise.all([
    dataStore.createSchedule(sampleInput("并发新增A")),
    dataStore.createSchedule(sampleInput("并发新增B")),
    dataStore.deleteSchedule(victim),
    dataStore.updateSchedule(target, {
      ...sampleInput("已改名"),
      stage: "面试",
      interviewRound: "二面",
      location: "线上",
      batch: "提前批",
      jd: "更新后的岗位 JD。",
    }),
  ]);

  const afterMixed = await dataStore.getDataStore();
  const expected = afterConcurrent.schedules.length + 2 - 1;
  check(
    "增删改并发后总数正确",
    afterMixed.schedules.length === expected,
    `期望 ${expected}，实际 ${afterMixed.schedules.length}`,
  );
  check("删除生效", !afterMixed.schedules.some((s) => s.id === victim));
  check("更新生效", afterMixed.schedules.find((s) => s.id === target)?.company === "已改名");
  check("面试环节保留地点", afterMixed.schedules.find((s) => s.id === target)?.location === "线上");
  check(
    "面试轮次规范保存",
    afterMixed.schedules.find((s) => s.id === target)?.interviewRound === "二",
  );
  check(
    "修改日程同步更新招聘批次与 JD",
    afterMixed.jobs.some(
      (job) => job.company === "已改名" && job.batch === "提前批" && job.jd === "更新后的岗位 JD。",
    ),
  );
  check(
    "改名后清理旧岗位索引",
    !afterMixed.jobs.some((job) => job.company === afterConcurrent.schedules[1]!.company),
  );

  /* --- 场景 3：索引清理、链接清空和并发冲突 --------------------- */
  const linked = await dataStore.createSchedule({
    ...sampleInput("链接测试公司"),
    sourceLink: "https://example.com/jobs/1",
  });
  const linkedBefore = await dataStore.getDataStore();
  const linkedVersion = linkedBefore.schedules.find((item) => item.id === linked.id)!.updatedAt;
  await dataStore.updateSchedule(
    linked.id,
    { ...sampleInput("链接测试公司"), sourceLink: "" },
    linkedVersion,
  );
  const afterClearLink = await dataStore.getDataStore();
  check(
    "清空链接同步清除日程与岗位链接",
    !afterClearLink.schedules.find((item) => item.id === linked.id)?.sourceLink &&
      !afterClearLink.jobs.find((job) => job.company === "链接测试公司")?.sourceLink,
  );

  const conflictVersion = afterClearLink.schedules.find((item) => item.id === linked.id)!.updatedAt;
  await dataStore.updateSchedule(
    linked.id,
    { ...sampleInput("先保存的标签页") },
    conflictVersion,
  );
  let conflictDetected = false;
  try {
    await dataStore.updateSchedule(
      linked.id,
      { ...sampleInput("后保存的旧标签页") },
      conflictVersion,
    );
  } catch (error) {
    conflictDetected = error instanceof dataStore.ScheduleConflictError;
  }
  const afterConflict = await dataStore.getDataStore();
  check("旧标签页覆盖被拒绝", conflictDetected);
  check(
    "冲突后保留先保存的内容",
    afterConflict.schedules.find((item) => item.id === linked.id)?.company === "先保存的标签页",
  );

  let staleDeleteBlocked = false;
  try {
    await dataStore.deleteSchedule(linked.id, conflictVersion);
  } catch (error) {
    staleDeleteBlocked = error instanceof dataStore.ScheduleConflictError;
  }
  check("旧详情页删除也会被拒绝", staleDeleteBlocked);

  const currentVersion = afterConflict.schedules.find((item) => item.id === linked.id)!.updatedAt;
  await dataStore.deleteSchedule(linked.id, currentVersion);
  const afterDeleteLinked = await dataStore.getDataStore();
  check(
    "删除最后一条日程后清理岗位索引",
    !afterDeleteLinked.jobs.some((job) => job.company === "先保存的标签页"),
  );

  /* --- 场景 4：损坏后自动回滚备份 --------------------------------- */
  const healthyCount = afterDeleteLinked.schedules.length;
  await writeFile(DATA_FILE, "{ 这不是合法 JSON ", "utf8");

  const recovered = await dataStore.getDataStore();
  check(
    "损坏后从备份恢复",
    recovered.schedules.length === healthyCount,
    `恢复到 ${recovered.schedules.length} 条（原 ${healthyCount} 条）`,
  );

  const quarantined = await readdir(path.join(workspace, "data", "quarantine")).catch(
    () => [] as string[],
  );
  check("损坏文件已隔离留证", quarantined.length > 0, `${quarantined.length} 个文件`);

  /* --- 场景 5：脏记录不连坐 --------------------------------------- */
  const beforePollute = await dataStore.getDataStore();
  await writeFile(
    DATA_FILE,
    JSON.stringify(
      {
        ...beforePollute,
        schedules: [...beforePollute.schedules, { id: "bad", stage: "不存在的环节" }],
      },
      null,
      2,
    ),
    "utf8",
  );

  const afterPollute = await dataStore.getDataStore();
  check(
    "脏记录被剔除且好记录保留",
    afterPollute.schedules.length === beforePollute.schedules.length,
    `保留 ${afterPollute.schedules.length} 条`,
  );

  /* --- 场景 6：无数据源空启动（独立进程）------------------------- */
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [path.join(__dirname, "..", "node_modules", "tsx", "dist", "cli.mjs"), __filename],
      { env: { ...process.env, VERIFY_MODE: "empty" }, timeout: 60_000 },
    );
    check("无数据源时空数据启动", stdout.includes("EMPTY_BOOTSTRAP_OK"));
  } catch (error) {
    check("无数据源时空数据启动", false, String(error).slice(0, 200));
  }

  /* --- 场景 7：备份可用 ------------------------------------------- */
  const backups = await dataStore.listBackups();
  check("已生成历史备份", backups.length > 0, `${backups.length} 份`);

  if (backups[0]) {
    const newest = await readFile(path.join(workspace, "data", "backups", backups[0]), "utf8");
    let parsable = true;
    try {
      JSON.parse(newest);
    } catch {
      parsable = false;
    }
    check("最新备份内容可解析", parsable);
  }

  console.log(`\n${failures === 0 ? "全部通过 ✅" : `${failures} 项未通过 ❌`}`);
  console.log(`测试目录：${workspace}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
