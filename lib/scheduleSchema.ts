import { z } from "zod";
import { RECRUITMENT_BATCHES, STAGES } from "./types";
import { normalizeFailNote, normalizeInterviewRound } from "./interviewRound";
import { normalizeOfferType } from "./offerType";
import { normalizeWrittenRound } from "./writtenRound";

export const scheduleInputSchema = z
  .object({
    company: z.string().trim().min(1, "请填写公司").max(120),
    position: z.string().trim().min(1, "请填写岗位").max(180),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请选择有效日期"),
    stage: z.enum(STAGES),
    interviewRound: z.string().trim().max(12, "面试文案不能超过 12 个字符").default(""),
    writtenRound: z.string().trim().max(12, "笔试文案不能超过 12 个字符").default(""),
    offerType: z.string().trim().max(24, "Offer 文案不能超过 24 个字符").default(""),
    failNote: z.string().trim().max(12, "未通过说明不能超过 12 个字符").default(""),
    batch: z.enum(RECRUITMENT_BATCHES).default("秋招"),
    jd: z.string().trim().max(30_000, "JD 详情不能超过 30000 个字符").default(""),
    sourceLink: z
      .string()
      .trim()
      .max(2048)
      .refine((value) => !value || /^https?:\/\//i.test(value), "链接需以 http:// 或 https:// 开头")
      .default(""),
  })
  .transform((value) => ({
    ...value,
    interviewRound: value.stage === "面试" ? normalizeInterviewRound(value.interviewRound) : "",
    writtenRound: value.stage === "笔试" ? normalizeWrittenRound(value.writtenRound) : "",
    offerType: value.stage === "Offer" ? normalizeOfferType(value.offerType) : "",
    failNote: value.stage === "未通过" ? normalizeFailNote(value.failNote) : "",
  }));
