import { randomUUID } from "node:crypto";
import { copyFile, mkdir, open, readdir, readFile, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { classifyCompany } from "./companyClassifier";
import { getCompanyMatchKey } from "./companyNames";
import { normalizeRecruitmentBatch } from "./recruitmentBatch";
import { normalizeFailNote, normalizeInterviewRound } from "./interviewRound";
import { normalizeOfferType } from "./offerType";
import { normalizeWrittenRound } from "./writtenRound";
import { jobRecordSchema, scheduleRecordSchema, storeEnvelopeSchema } from "./storeSchema";
import type { Job, RecruitmentStore, Schedule, ScheduleInput } from "./types";
import { normalizedSearch } from "./utils";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "data.json");
const DEMO_DATA_FILE = path.join(DATA_DIRECTORY, "demo-data.json");
const WRITE_LOCK_FILE = path.join(DATA_DIRECTORY, ".write.lock");
const BACKUP_DIRECTORY = path.join(DATA_DIRECTORY, "backups");
const QUARANTINE_DIRECTORY = path.join(DATA_DIRECTORY, "quarantine");
// 注意：这里不再保留「从 秋招进度.xlsx 自动重建」的兜底。那份快照停留在
// 2026-09-01，远旧于 data.json；一旦 data.json 损坏就自动重建，会把用户在网页上
// 新增和修改的全部数据静默覆盖掉。现在改为：备份救不回来就直接报错停启动，
// 由用户手动从 data/manual-backups/ 挑一份快照恢复。

/** 保留的历史快照数量。每次写入前对旧文件做一次快照，超出后从最旧的开始删。 */
const MAX_BACKUPS = 30;
const WRITE_LOCK_TIMEOUT_MS = 15_000;
const STALE_WRITE_LOCK_MS = 120_000;

/* ------------------------------------------------------------------ *
 * 串行锁
 *
 * 原实现只把「写」串行化了，「读—改—写」整体没有互斥：两个并发请求
 * 会各自读到同一份旧数据，各自追加自己的记录，后写的那次直接覆盖前一次，
 * 导致记录静默丢失（开两个标签页、或快速连点提交就能复现）。
 *
 * 这里把整个事务串起来，公开方法负责加锁，内部 *Unlocked 方法假定锁已持有，
 * 避免自己等自己造成死锁。
 * ------------------------------------------------------------------ */
let lockChain: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  // 前一个任务失败不应阻塞后续任务，因此成功/失败都继续往下走。
  const result = lockChain.then(task, task);
  lockChain = result.catch(() => undefined);
  return result;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * 跨进程写锁。内存队列只能保护单个 Node 进程，这个独占文件让
 * 开发服务、导入脚本或另一个服务实例也会串行执行读—改—写。
 */
async function acquireWriteLock() {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  const startedAt = Date.now();

  while (Date.now() - startedAt < WRITE_LOCK_TIMEOUT_MS) {
    // 自愈：上一次的 release() 因为文件系统原因没成功 unlink，但持有者就是本进程。
    // 这种情况下必须主动删掉锁文件，否则 EEXIST 会让本进程无限等自己——同一进程死锁。
    // 只对 PID 匹配的锁生效，跨进程互斥依然靠 EEXIST 兜底。
    if ((await readLockOwner()) === process.pid) {
      await unlink(WRITE_LOCK_FILE).catch(() => undefined);
    }

    try {
      const handle = await open(WRITE_LOCK_FILE, "wx");
      await handle.writeFile(`${process.pid} ${new Date().toISOString()}\n`, "utf8");
      return async () => {
        await handle.close().catch(() => undefined);
        await unlink(WRITE_LOCK_FILE).catch(() => undefined);
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const lockStat = await stat(WRITE_LOCK_FILE).catch(() => null);
      if (lockStat && Date.now() - lockStat.mtimeMs > STALE_WRITE_LOCK_MS) {
        await unlink(WRITE_LOCK_FILE).catch(() => undefined);
        continue;
      }
      await wait(25);
    }
  }

  throw new Error("等待本地数据写锁超时，请稍后重试");
}

function withStoreMutation<T>(task: () => Promise<T>) {
  return withLock(async () => {
    const release = await acquireWriteLock();
    try {
      return await task();
    } finally {
      await release();
    }
  });
}

/* ------------------------------------------------------------------ *
 * 文件工具
 * ------------------------------------------------------------------ */

async function exists(file: string) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取当前锁文件里的持有者 PID（写入格式为 `${pid} ${iso}\n`）。
 * 读不到内容、PID 不是数字、或锁文件不存在时返回 null。
 *
 * 这是「同进程死锁自愈」的关键：release() 偶尔因文件系统原因 unlink 失败，
 * 会留下一个持有者已是本进程的锁文件；如果不主动清理，下一次 acquireWriteLock
 * 会一直等 STALE_WRITE_LOCK_MS 之后才认为它过期，整个写链路跟着 15s 超时。
 * 先看一眼 PID 是不是自己，是就直接 unlink 重新拿锁——这条路径只在持有者
 * 是自己时生效，跨进程互斥依旧由 EEXIST 兜底。
 */
async function readLockOwner(): Promise<number | null> {
  try {
    const content = await readFile(WRITE_LOCK_FILE, "utf8");
    const match = content.match(/^(\d+)\s/);
    if (!match) return null;
    const pid = Number.parseInt(match[1], 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

/**
 * 原子写入 + fsync。
 *
 * 原实现有 writeFile → rename，能防「读到半截文件」，但没有 fsync：
 * 数据可能还停留在页缓存里，此时断电或容器被杀，文件会变成 0 字节或旧内容。
 * 这里补上两处 fsync —— 文件本身，以及父目录（让 rename 这个动作本身落盘）。
 */
async function writeFileAtomic(file: string, contents: string) {
  const directory = path.dirname(file);
  await mkdir(directory, { recursive: true });

  const temporaryFile = path.join(
    directory,
    `${path.basename(file)}.${process.pid}.${Date.now()}.${randomUUID().slice(0, 8)}.tmp`,
  );

  try {
    const handle = await open(temporaryFile, "w");
    try {
      await handle.writeFile(contents, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    await rename(temporaryFile, file);

    // 目录 fsync 在个别文件系统上不被支持，失败不影响数据正确性，忽略即可。
    try {
      const directoryHandle = await open(directory, "r");
      try {
        await directoryHandle.sync();
      } finally {
        await directoryHandle.close();
      }
    } catch {
      /* 忽略 */
    }
  } catch (error) {
    // 失败时清掉临时文件，否则 data/ 会越积越多（.gitignore 里那条 data/*.tmp 就是证据）。
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

/** 清理历史遗留的临时文件，只在进程内跑一次。 */
let temporaryFilesCleaned = false;
async function cleanStaleTemporaryFiles() {
  if (temporaryFilesCleaned) return;
  temporaryFilesCleaned = true;
  try {
    const entries = await readdir(DATA_DIRECTORY);
    await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".tmp"))
        .map((entry) => unlink(path.join(DATA_DIRECTORY, entry)).catch(() => undefined)),
    );
  } catch {
    /* 目录还不存在，忽略 */
  }
}

/* ------------------------------------------------------------------ *
 * 备份与隔离
 * ------------------------------------------------------------------ */

async function listBackupFiles() {
  try {
    const entries = await readdir(BACKUP_DIRECTORY);
    return entries
      .filter((entry) => entry.startsWith("data-") && entry.endsWith(".json"))
      .sort()
      .reverse(); // 文件名带 ISO 时间戳，字典序倒排即为「最新优先」
  } catch {
    return [];
  }
}

async function pruneBackups() {
  const files = await listBackupFiles();
  await Promise.all(
    files
      .slice(MAX_BACKUPS)
      .map((file) => unlink(path.join(BACKUP_DIRECTORY, file)).catch(() => undefined)),
  );
}

/** 覆盖 data.json 之前，先把当前版本留一份快照。这是「写坏了还能回滚」的唯一依靠。 */
async function snapshotCurrentFile() {
  if (!(await exists(DATA_FILE))) return;
  try {
    await mkdir(BACKUP_DIRECTORY, { recursive: true });
    await copyFile(DATA_FILE, path.join(BACKUP_DIRECTORY, `data-${timestampSlug()}.json`));
    await pruneBackups();
  } catch {
    // 备份失败不应阻断用户正常保存，但要留下痕迹。
    console.warn("[dataStore] 备份当前数据失败，本次写入将继续");
  }
}

/**
 * 把坏文件挪进 quarantine/ 而不是直接覆盖。
 * 原实现遇到损坏的 data.json 会直接抛错且无从恢复，坏数据也可能被后续写入抹掉；
 * 保留原始现场才有事后人工抢救的余地。
 */
async function quarantineFile(file: string, reason: string) {
  try {
    await mkdir(QUARANTINE_DIRECTORY, { recursive: true });
    const target = path.join(
      QUARANTINE_DIRECTORY,
      `${path.basename(file)}.${reason}.${timestampSlug()}`,
    );
    await copyFile(file, target);
    console.warn(`[dataStore] 数据异常（${reason}），原文件已备份到 ${target}`);
  } catch {
    console.warn("[dataStore] 隔离异常文件失败");
  }
}

/* ------------------------------------------------------------------ *
 * 解析与校验
 * ------------------------------------------------------------------ */

interface ParseOutcome {
  store: RecruitmentStore;
  rejected: unknown[];
  migrated: boolean;
}

/**
 * 兼容旧版独立的「测评」环节。迁移必须发生在 Zod 校验之前，
 * 否则旧记录会被当成脏数据隔离，而不是并入「笔试 / 测评」。
 */
function migrateLegacySchedule(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { value: raw, migrated: false };
  }
  const record = raw as Record<string, unknown>;
  if (record.stage !== "测评") return { value: raw, migrated: false };
  return {
    value: {
      ...record,
      stage: "笔试",
      writtenRound:
        typeof record.writtenRound === "string" && record.writtenRound.trim()
          ? record.writtenRound
          : "测评",
    },
    migrated: true,
  };
}

/**
 * 公司分类是可演进的展示字段，每次读取时根据最新规则重算。
 * 这也负责把历史的「实业公司」平滑迁移为「实体企业」。
 */
function migrateJobCategory(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { value: raw, migrated: false };
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.company !== "string") return { value: raw, migrated: false };
  const category = classifyCompany(record.company);
  return {
    value: { ...record, category },
    migrated: record.category !== category,
  };
}

/**
 * 逐条校验记录：合法的留下，非法的挑出来隔离。
 * 这样「一条脏记录」不会连坐整个文件，也不会被静默丢弃。
 */
function parseStoreValue(value: unknown): ParseOutcome | null {
  const envelope = storeEnvelopeSchema.safeParse(value);
  if (!envelope.success) return null;

  const rejected: unknown[] = [];
  let migrated = false;

  const schedules: Schedule[] = [];
  for (const raw of envelope.data.schedules) {
    const legacy = migrateLegacySchedule(raw);
    migrated ||= legacy.migrated;
    const parsed = scheduleRecordSchema.safeParse(legacy.value);
    if (parsed.success) schedules.push(parsed.data);
    else rejected.push(raw);
  }

  const jobs: Job[] = [];
  for (const raw of envelope.data.jobs) {
    const legacy = migrateJobCategory(raw);
    migrated ||= legacy.migrated;
    const parsed = jobRecordSchema.safeParse(legacy.value);
    if (parsed.success) jobs.push(parsed.data);
    else rejected.push(raw);
  }

  return {
    store: {
      version: 1,
      importedAt: envelope.data.importedAt,
      sourceFile: envelope.data.sourceFile,
      schedules,
      jobs,
    },
    rejected,
    migrated,
  };
}

async function readStoreFile(file: string): Promise<ParseOutcome | null> {
  try {
    const raw = await readFile(file, "utf8");
    if (!raw.trim()) return null;
    return parseStoreValue(JSON.parse(raw));
  } catch {
    return null;
  }
}

function createEmptyStore(sourceFile = ""): RecruitmentStore {
  return {
    version: 1,
    importedAt: new Date().toISOString(),
    sourceFile,
    schedules: [],
    jobs: [],
  };
}

/* ------------------------------------------------------------------ *
 * 读写主流程
 * ------------------------------------------------------------------ */

async function persistStoreUnlocked(store: RecruitmentStore) {
  const serialized = `${JSON.stringify(store, null, 2)}\n`;

  await snapshotCurrentFile();
  await writeFileAtomic(DATA_FILE, serialized);

  // 写后校验：确认落盘内容能被完整读回来。
  // 万一磁盘写坏了，此刻还能第一时间发现，而不是等下次启动才暴雷。
  const verified = await readStoreFile(DATA_FILE);
  if (!verified) {
    await quarantineFile(DATA_FILE, "write-verify-failed");
    throw new Error("数据写入后校验失败，已保留异常文件，请检查 data/quarantine/");
  }

  // 再保存一份已经通过校验的最新版本。否则主文件损坏时只能恢复到
  // 本次写入之前的快照，表现为最后一次添加、修改或删除被回滚。
  await snapshotCurrentFile();

  return store;
}

/**
 * 加载数据，按可靠性依次降级：
 *   1. data.json 正常          → 直接用
 *   2. data.json 损坏          → 隔离原文件，回滚到最近一个可用备份
 *   3. 无备份但有 Excel 源     → 重新导入
 *   4. 全新克隆且有演示数据    → 复制演示数据到本地私有 data.json
 *   5. 什么都没有              → 建一份空数据（而不是抛错让应用起不来）
 */
async function loadStoreUnlocked(): Promise<RecruitmentStore> {
  await cleanStaleTemporaryFiles();

  const current = await readStoreFile(DATA_FILE);
  if (current) {
    return finalizeStoreUnlocked(current, { persistIfChanged: true });
  }

  if (await exists(DATA_FILE)) {
    await quarantineFile(DATA_FILE, "unreadable");

    for (const backup of await listBackupFiles()) {
      const recovered = await readStoreFile(path.join(BACKUP_DIRECTORY, backup));
      if (!recovered) continue;
      console.warn(`[dataStore] data.json 无法解析，已从备份 ${backup} 恢复`);
      const store = await finalizeStoreUnlocked(recovered, { persistIfChanged: false });
      await persistStoreUnlocked(store);
      return store;
    }

    // 备份也救不回来时，绝不降级到 demo 或空库继续跑：那会让界面看起来
    // 「正常打开」，实际上用户看到的是一份全新数据，极易被误认为数据已丢失，
    // 再往里写入就会彻底覆盖真实数据。直接报错停启动，让人为介入做决定。
    console.error(
      "[dataStore] data.json 与全部备份都无法解析，已停止启动。\n" +
        "[dataStore] 请手动从 data/manual-backups/ 复制一份快照为 data/data.json 后重启。",
    );
    throw new Error(
      "本地数据文件已损坏且无可用备份。请从 data/manual-backups/ 复制一份快照为 data/data.json 后重启。",
    );
  }

  // 公开仓库只跟踪不含隐私的 demo-data.json。每个克隆首次启动时把它
  // 复制成被 .gitignore 忽略的 data.json，之后网页写入只影响本地私有副本。
  const demo = await readStoreFile(DEMO_DATA_FILE);
  if (demo) {
    const store = await finalizeStoreUnlocked(demo, { persistIfChanged: false });
    await persistStoreUnlocked(store);
    return store;
  }

  // 首次运行且没有 Excel 时，原实现会直接抛错导致整个应用打不开。
  // 空数据 + 网页端手动录入本来就是这个项目支持的用法，不该被当成致命错误。
  const store = createEmptyStore();
  await persistStoreUnlocked(store);
  return store;
}

/** Vercel 只用于查看 UI：直接读取公开演示数据，不触碰本地真实数据和写锁。 */
async function loadVercelPreviewStore() {
  const demo = await readStoreFile(DEMO_DATA_FILE);
  if (!demo) throw new Error("Vercel UI 预览数据不可用");
  return demo.store;
}

export function isVercelUiPreview() {
  return process.env.VERCEL === "1";
}

/** 收尾：隔离脏记录 + 执行字段迁移，必要时回写。 */
async function finalizeStoreUnlocked(
  outcome: ParseOutcome,
  options: { persistIfChanged: boolean },
): Promise<RecruitmentStore> {
  const store = outcome.store;
  let changed = outcome.migrated;

  if (outcome.rejected.length > 0) {
    try {
      await mkdir(QUARANTINE_DIRECTORY, { recursive: true });
      await writeFileAtomic(
        path.join(QUARANTINE_DIRECTORY, `rejected-records-${timestampSlug()}.json`),
        `${JSON.stringify(outcome.rejected, null, 2)}\n`,
      );
      console.warn(
        `[dataStore] 有 ${outcome.rejected.length} 条记录格式异常，已移入 data/quarantine/ 待人工处理`,
      );
    } catch {
      console.warn("[dataStore] 保存异常记录失败");
    }
    changed = true;
  }

  // 只自动清理完全没有内容的孤立岗位；带 JD、链接或待补进展的岗位仍保留。
  const activeJobKeys = new Set(
    store.schedules.map((schedule) => scheduleJobKey(schedule.company, schedule.position)),
  );
  const retainedJobs = store.jobs.filter(
    (job) =>
      activeJobKeys.has(scheduleJobKey(job.company, job.position)) ||
      Boolean(job.jd.trim() || job.sourceLink || job.pendingProgress?.trim()),
  );
  if (retainedJobs.length !== store.jobs.length) {
    store.jobs = retainedJobs;
    changed = true;
  }

  if (changed && options.persistIfChanged) {
    await persistStoreUnlocked(store);
  }

  return store;
}

function normalizeInput(input: ScheduleInput) {
  const { batch, jd, ...scheduleFields } = input;
  return {
    schedule: {
      ...scheduleFields,
      interviewRound:
        input.stage === "面试" ? normalizeInterviewRound(input.interviewRound) : "",
      writtenRound: input.stage === "笔试" ? normalizeWrittenRound(input.writtenRound) : "",
      offerType: input.stage === "Offer" ? normalizeOfferType(input.offerType) : "",
      failNote: input.stage === "未通过" ? normalizeFailNote(input.failNote) : "",
      sourceLink: input.sourceLink?.trim() || undefined,
    },
    job: { batch, jd },
  };
}

function scheduleJobKey(company: string, position: string) {
  return `${getCompanyMatchKey(company)}::${normalizedSearch(position)}`;
}

function removeUnusedJob(store: RecruitmentStore, company: string, position: string) {
  const key = scheduleJobKey(company, position);
  if (store.schedules.some((schedule) => scheduleJobKey(schedule.company, schedule.position) === key)) {
    return;
  }
  store.jobs = store.jobs.filter(
    (job) => scheduleJobKey(job.company, job.position) !== key || Boolean(job.pendingProgress?.trim()),
  );
}

/** 网页新增/编辑日程时同步维护岗位索引，让公司与岗位页和联想框即时可用。 */
function upsertJobForSchedule(
  store: RecruitmentStore,
  schedule: Schedule,
  jobInput: Pick<ScheduleInput, "batch" | "jd">,
  options: { overwriteSourceLink?: boolean } = {},
) {
  const key = scheduleJobKey(schedule.company, schedule.position);
  const index = store.jobs.findIndex((job) => scheduleJobKey(job.company, job.position) === key);
  if (index >= 0) {
    const current = store.jobs[index];
    store.jobs[index] = {
      ...current,
      company: current.company || schedule.company,
      position: current.position || schedule.position,
      category: classifyCompany(current.company || schedule.company),
      sourceLink: options.overwriteSourceLink
        ? schedule.sourceLink
        : schedule.sourceLink || current.sourceLink,
      batch: normalizeRecruitmentBatch(jobInput.batch || current.batch),
      jd: jobInput.jd === undefined ? current.jd : jobInput.jd.trim(),
    };
    return store.jobs[index];
  }

  const job: Job = {
    id: `job_web_${randomUUID()}`,
    company: schedule.company,
    position: schedule.position,
    jd: jobInput.jd?.trim() || "",
    category: classifyCompany(schedule.company),
    sourceLink: schedule.sourceLink,
    batch: normalizeRecruitmentBatch(jobInput.batch),
  };
  store.jobs.push(job);
  return job;
}

export function findJobForSchedule(store: RecruitmentStore, schedule: Schedule) {
  return store.jobs.find(
    (job) => scheduleJobKey(job.company, job.position) === scheduleJobKey(schedule.company, schedule.position),
  );
}

/* ------------------------------------------------------------------ *
 * 对外接口（签名与旧版保持一致，调用方无需改动）
 * ------------------------------------------------------------------ */

export async function ensureDataStore() {
  await withStoreMutation(async () => {
    await loadStoreUnlocked();
  });
}

export async function getDataStore(): Promise<RecruitmentStore> {
  if (isVercelUiPreview()) return loadVercelPreviewStore();
  return withStoreMutation(() => loadStoreUnlocked());
}

export async function replaceStore(store: RecruitmentStore) {
  return withStoreMutation(() => persistStoreUnlocked(store));
}

export async function createSchedule(input: ScheduleInput) {
  return withStoreMutation(async () => {
    const store = await loadStoreUnlocked();
    const timestamp = new Date().toISOString();
    const normalized = normalizeInput(input);
    const schedule: Schedule = {
      id: `web_${randomUUID()}`,
      ...normalized.schedule,
      source: "web",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.schedules.push(schedule);
    upsertJobForSchedule(store, schedule, normalized.job);
    await persistStoreUnlocked(store);
    return schedule;
  });
}

export class ScheduleConflictError extends Error {
  constructor() {
    super("这条日程已在其他页面被更新，请重新打开后再修改");
    this.name = "ScheduleConflictError";
  }
}

export async function updateSchedule(
  id: string,
  input: ScheduleInput,
  expectedUpdatedAt?: string,
) {
  return withStoreMutation(async () => {
    const store = await loadStoreUnlocked();
    const index = store.schedules.findIndex((schedule) => schedule.id === id);
    if (index < 0) return null;
    const previous = store.schedules[index];
    if (expectedUpdatedAt && previous.updatedAt !== expectedUpdatedAt) {
      throw new ScheduleConflictError();
    }

    const normalized = normalizeInput(input);
    const now = new Date().toISOString();
    const updatedAt = now > previous.updatedAt
      ? now
      : new Date(Date.parse(previous.updatedAt) + 1).toISOString();
    store.schedules[index] = {
      ...previous,
      ...normalized.schedule,
      updatedAt,
    };
    upsertJobForSchedule(store, store.schedules[index], normalized.job, {
      overwriteSourceLink: true,
    });
    if (
      scheduleJobKey(previous.company, previous.position) !==
      scheduleJobKey(store.schedules[index].company, store.schedules[index].position)
    ) {
      removeUnusedJob(store, previous.company, previous.position);
    }
    await persistStoreUnlocked(store);
    return store.schedules[index];
  });
}

export async function deleteSchedule(id: string, expectedUpdatedAt?: string) {
  return withStoreMutation(async () => {
    const store = await loadStoreUnlocked();
    const index = store.schedules.findIndex((schedule) => schedule.id === id);
    if (index < 0) return false;
    if (expectedUpdatedAt && store.schedules[index].updatedAt !== expectedUpdatedAt) {
      throw new ScheduleConflictError();
    }
    const [removed] = store.schedules.splice(index, 1);
    removeUnusedJob(store, removed.company, removed.position);
    await persistStoreUnlocked(store);
    return true;
  });
}

/** 供人工排查/恢复使用：列出现有备份（最新优先）。 */
export async function listBackups() {
  return listBackupFiles();
}
