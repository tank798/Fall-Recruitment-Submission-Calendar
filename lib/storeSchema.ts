import { z } from "zod";
import { COMPANY_CATEGORIES, STAGES } from "./types";

/**
 * 落盘数据的运行时校验。
 *
 * `lib/scheduleSchema.ts` 校验的是「用户提交的表单」，本文件校验的是
 * 「磁盘上已经存在的 data.json」。二者不能混用：前者不含 id / 时间戳等
 * 系统字段，而后者必须保证这些字段存在，否则读回来的对象会在运行时炸掉。
 *
 * 设计原则：宽进严出。缺失的可选字段补默认值，而不是直接判定整份数据无效，
 * 避免为了一条脏记录丢掉整个文件。
 */

const text = z.string().default("");

export const scheduleRecordSchema = z.object({
  id: z.string().min(1),
  company: text,
  position: text,
  date: text,
  stage: z.enum(STAGES),
  interviewRound: text.optional(),
  writtenRound: text.optional(),
  offerType: text.optional(),
  failNote: text.optional(),
  sourceLink: z.string().optional(),
  source: z.enum(["excel", "web"]).default("web"),
  createdAt: text,
  updatedAt: text,
});

export const jobRecordSchema = z.object({
  id: z.string().min(1),
  company: text,
  position: text,
  jd: text,
  category: z.enum(COMPANY_CATEGORIES),
  sourceLink: z.string().optional(),
  batch: z.string().optional(),
  pendingProgress: z.string().optional(),
});

/**
 * 外层信封故意把 schedules / jobs 收成 unknown[]：
 * 逐条校验交给调用方，这样单条脏记录只会被隔离，不会让整份数据判定失败。
 */
export const storeEnvelopeSchema = z.object({
  version: z.literal(1).default(1),
  importedAt: text,
  sourceFile: text,
  schedules: z.array(z.unknown()).default([]),
  jobs: z.array(z.unknown()).default([]),
});

export type StoreEnvelope = z.infer<typeof storeEnvelopeSchema>;
