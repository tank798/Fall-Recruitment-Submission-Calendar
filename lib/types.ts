export const STAGES = ["投递", "测评", "笔试", "面试", "Offer", "未通过"] as const;

export type Stage = (typeof STAGES)[number];

export const RECRUITMENT_BATCHES = ["提前批", "秋招", "春招", "暑期实习", "日常实习"] as const;

export type RecruitmentBatch = (typeof RECRUITMENT_BATCHES)[number];

export const COMPANY_CATEGORIES = ["金融公司", "互联网大厂", "实业公司"] as const;

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export interface Schedule {
  id: string;
  company: string;
  position: string;
  date: string;
  time: string;
  stage: Stage;
  interviewRound?: string;
  writtenRound?: string;
  offerType?: string;
  detail: string;
  location: string;
  notes: string;
  sourceLink?: string;
  source: "excel" | "web";
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  company: string;
  position: string;
  jd: string;
  category: CompanyCategory;
  sourceLink?: string;
  batch?: string;
  /** Excel 中只有进展描述、暂时没有日期时，先挂在岗位上避免导入丢失。 */
  pendingProgress?: string;
}

export interface RecruitmentStore {
  version: 1;
  importedAt: string;
  sourceFile: string;
  schedules: Schedule[];
  jobs: Job[];
}

type ScheduleFields = Pick<
  Schedule,
  | "company"
  | "position"
  | "date"
  | "time"
  | "stage"
  | "detail"
  | "location"
  | "notes"
  | "sourceLink"
>;

export type ScheduleInput = ScheduleFields & {
  /** 面试轮次中“面”前面的内容，例如 AI、一、二、终。 */
  interviewRound?: string;
  /** 笔试轮次中“笔”前面的内容，例如一、二、三。 */
  writtenRound?: string;
  /** Offer 的完整文案，例如“实习 Offer”或“正式 Offer”。 */
  offerType?: string;
  /** 与“公司 + 岗位”对应的岗位信息一并保存，不重复写入日程记录。 */
  batch?: RecruitmentBatch;
  jd?: string;
};
