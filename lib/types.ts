export const STAGES = ["投递", "笔试", "面试", "Offer", "未通过"] as const;

export type Stage = (typeof STAGES)[number];

/** 环节筛选值：全部 + 五个环节（含 Offer）。 */
export type StageFilterValue = "全部" | Stage;

export const STAGE_FILTER_OPTIONS: readonly StageFilterValue[] = ["全部", ...STAGES];

export const RECRUITMENT_BATCHES = ["提前批", "秋招", "春招", "暑期实习", "日常实习"] as const;

export type RecruitmentBatch = (typeof RECRUITMENT_BATCHES)[number];

export const COMPANY_CATEGORIES = ["互联网大厂", "金融公司", "实体企业", "央国企"] as const;

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export interface Schedule {
  id: string;
  company: string;
  position: string;
  date: string;
  stage: Stage;
  interviewRound?: string;
  writtenRound?: string;
  offerType?: string;
  failNote?: string;
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
  "company" | "position" | "date" | "stage" | "sourceLink"
>;

export type ScheduleInput = ScheduleFields & {
  /** 面试的完整个性化文案，例如“一面”“AI 面”“终面”。 */
  interviewRound?: string;
  /** 笔试的完整个性化文案，例如“一笔”“测评”“二笔”。 */
  writtenRound?: string;
  /** Offer 的完整文案，例如“实习 Offer”或“正式 Offer”。 */
  offerType?: string;
  /** 未通过的个性化说明，例如“简历挂”“一面挂”，留空则显示“未通过”。 */
  failNote?: string;
  /** 与“公司 + 岗位”对应的岗位信息一并保存，不重复写入日程记录。 */
  batch?: RecruitmentBatch;
  jd?: string;
};
