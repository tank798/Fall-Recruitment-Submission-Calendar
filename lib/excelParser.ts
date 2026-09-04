import { createHash } from "node:crypto";
import path from "node:path";
import * as XLSX from "xlsx";
import { classifyCompany } from "./companyClassifier";
import { getCompanyMatchKey } from "./companyNames";
import { inferInterviewRound, normalizeFailNote, normalizeInterviewRound } from "./interviewRound";
import { inferOfferType, normalizeOfferType } from "./offerType";
import { inferWrittenRound, normalizeWrittenRound } from "./writtenRound";
import { STAGES, type Job, type RecruitmentStore, type Schedule, type Stage } from "./types";

type Cell = string | number | boolean | Date | null | undefined;

/** 旧版源表的列名。导出的规范表使用 CANONICAL_ALIASES，避免“环节”被当成“进度”。 */
const LEGACY_OVERVIEW_ALIASES = {
  company: ["公司", "企业", "公司名称"],
  batch: ["批次", "招聘批次"],
  position: ["岗位", "职位", "岗位名称", "职位名称"],
  applicationDate: ["投递日期", "申请日期"],
  progress: ["进度", "投递进展", "流程"],
  link: ["链接", "申请链接", "投递链接"],
} as const;

const CANONICAL_ALIASES = {
  company: ["公司", "企业", "公司名称"],
  position: ["岗位", "职位", "岗位名称", "职位名称"],
  date: ["日期", "日程日期"],
  stage: ["环节", "阶段"],
  interviewRound: ["面试轮次", "面试阶段"],
  writtenRound: ["笔试轮次", "笔试阶段"],
  offerType: ["Offer类型", "Offer阶段", "录用类型"],
  failNote: ["未通过说明", "未通过备注", "拒绝原因", "挂因"],
  detail: ["具体事项", "事项", "详情"],
  sourceLink: ["来源链接", "链接", "申请链接", "投递链接"],
  source: ["记录来源", "来源"],
  id: ["记录ID", "日程ID", "ID"],
  createdAt: ["创建时间"],
  updatedAt: ["更新时间"],
} as const;

const JD_ALIASES = {
  company: ["公司", "企业", "公司名称"],
  position: ["岗位", "职位", "岗位名称", "职位名称"],
  jd: ["JD", "岗位JD", "职位描述", "岗位描述"],
  category: ["公司类别", "类别"],
  batch: ["招聘批次", "批次"],
  sourceLink: ["来源链接", "链接", "申请链接", "投递链接"],
  pendingProgress: ["待补日期进展", "未标注日期的进展"],
} as const;

function clean(value: Cell) {
  if (value === null || value === undefined) return "";
  return String(value).replaceAll("\r\n", "\n").trim();
}

function normalizeKey(value: string) {
  return value.replaceAll(/\s+/g, "").toLocaleLowerCase();
}

function jobKey(company: string, position: string) {
  return `${getCompanyMatchKey(company)}::${normalizeKey(position)}`;
}

function findColumn(headers: Cell[], aliases: readonly string[]) {
  const normalized = headers.map((header) => normalizeKey(clean(header)));
  return (
    aliases
      .map(normalizeKey)
      .map((alias) => normalized.indexOf(alias))
      .find((index) => index >= 0) ?? -1
  );
}

function hashId(prefix: string, ...values: string[]) {
  const hash = createHash("sha1")
    .update(values.join("\u241f"))
    .digest("hex")
    .slice(0, 16);
  return `${prefix}_${hash}`;
}

function dateToIso(year: number, month: number, day: number) {
  const candidate = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return "";
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function parseExcelDate(value: Cell) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return dateToIso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return dateToIso(parsed.y, parsed.m, parsed.d);
  }

  const text = clean(value);
  const matched = text.match(/^([0-9]{4})[/\.\-年]([0-9]{1,2})[/\.\-月]([0-9]{1,2})日?$/);
  if (matched) return dateToIso(Number(matched[1]), Number(matched[2]), Number(matched[3]));

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return dateToIso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return "";
}

function inferStage(detail: string): Stage {
  const text = detail.toLocaleLowerCase();
  if (/(未通过|不通过|淘汰|拒绝|感谢信)/i.test(text)) return "未通过";
  if (/offer/i.test(text)) return "Offer";
  // 测评已并入笔试：测评类关键词统一归为笔试，个性化文案单独兜底为“测评”。
  if (/(笔试|机试|机考|上机|编程题|在线考试|专业笔试|测评|测试|assessment)/i.test(text)) {
    return "笔试";
  }
  if (
    /(面试|群面|终面|专业面|综合面|部门面|交叉面|复试|初试|无领导|hr\s*面|主管面|业务面|ai\s*面|面谈|\d+v\d+|[一二三四五六七八九十0-9]+面)/i.test(
      text,
    )
  ) {
    return "面试";
  }
  return "投递";
}

/** 测评类文本归入笔试后，用“测评”作为默认个性化文案。 */
function inferAssessmentLabel(detail: string) {
  return /(测评|测试|assessment)/i.test(detail) ? "测评" : "";
}

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

interface ParsedProgress {
  date: string;
  detail: string;
  stage: Stage;
}

/**
 * 进度行可能省略年份。若它早于投递日期，按跨年秋招记录推断为下一年，
 * 例如 2026-09-03 投递后的“1/15 终面”应为 2027-01-15。
 */
function parseProgressLine(
  line: string,
  fallbackYear: number,
  applicationDate = "",
): ParsedProgress | null {
  const text = line.trim();
  if (!text) return null;

  const match = text.match(/^(?:(\d{4})[/\.\-])?(\d{1,2})[/\.\-](\d{1,2})\s*(.*)$/);
  if (!match) return null;

  const hasExplicitYear = Boolean(match[1]);
  let year = Number(match[1] || fallbackYear);
  let date = dateToIso(year, Number(match[2]), Number(match[3]));
  if (!date) return null;

  if (!hasExplicitYear && applicationDate && date < applicationDate) {
    year += 1;
    date = dateToIso(year, Number(match[2]), Number(match[3]));
    if (!date) return null;
  }

  const detail = match[4].trim() || "进度更新";
  return { date, detail, stage: inferStage(detail) };
}

function workbookRows(workbook: XLSX.WorkBook, preferredName: string, fallbackIndex: number) {
  const name = workbook.SheetNames.includes(preferredName)
    ? preferredName
    : workbook.SheetNames[fallbackIndex];
  const sheet = name ? workbook.Sheets[name] : undefined;
  if (!sheet) return { name: preferredName, rows: [] as Cell[][] };
  return {
    name,
    rows: XLSX.utils.sheet_to_json<Cell[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
      // 保留空行，避免公式行的物理行号在两张表之间发生漂移。
      blankrows: true,
    }),
  };
}

type FormulaCell = { v?: Cell; f?: string };

function readCellValue(workbook: XLSX.WorkBook, sheetName: string, rowIndex: number, columnIndex: number) {
  if (columnIndex < 0) return "";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return "";
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  return clean((sheet[address] as FormulaCell | undefined)?.v);
}

function resolveFormulaReference(formula: string) {
  const matched = formula.match(
    /(?:'([^']+)'|([A-Za-z0-9_\u4e00-\u9fff .-]+))!\$?([A-Z]{1,3})\$?(\d+)/,
  );
  if (!matched) return null;
  return { sheetName: matched[1] || matched[2], address: `${matched[3]}${matched[4]}` };
}

/** 解析 JD 表中“=总览!A2”这类公式，只信任公式明确指向的单元格，不再按压缩后的行号兜底。 */
function readIdentityCell(
  workbook: XLSX.WorkBook,
  sheetName: string,
  rowIndex: number,
  columnIndex: number,
  fallbackSheetName: string,
  seen = new Set<string>(),
): string {
  if (columnIndex < 0) return "";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return "";
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  const key = `${sheetName}!${address}`;
  if (seen.has(key)) return "";
  seen.add(key);

  const cell = sheet[address] as FormulaCell | undefined;
  const direct = clean(cell?.v);
  if (direct && direct !== "0") return direct;

  const reference = cell?.f ? resolveFormulaReference(cell.f) : null;
  if (reference) {
    const referencedSheet = workbook.Sheets[reference.sheetName]
      ? reference.sheetName
      : fallbackSheetName;
    const referencedCell = workbook.Sheets[referencedSheet]?.[reference.address] as
      | FormulaCell
      | undefined;
    const referencedValue = clean(referencedCell?.v);
    if (referencedValue && referencedValue !== "0") return referencedValue;
  }

  return direct === "0" ? "" : direct;
}

function appendText(left: string | undefined, right: string | undefined) {
  return [left, right].map((value) => value?.trim()).filter(Boolean).join("\n") || undefined;
}

function upsertJob(
  jobsByKey: Map<string, Job>,
  input: {
    company: string;
    position: string;
    jd?: string;
    sourceLink?: string;
    batch?: string;
    pendingProgress?: string;
  },
) {
  const key = jobKey(input.company, input.position);
  const existing = jobsByKey.get(key);
  jobsByKey.set(key, {
    id: existing?.id || hashId("job", input.company, input.position),
    company: existing?.company || input.company,
    position: existing?.position || input.position,
    jd: input.jd || existing?.jd || "",
    category: classifyCompany(input.company),
    sourceLink: input.sourceLink || existing?.sourceLink,
    batch: input.batch || existing?.batch,
    pendingProgress: appendText(existing?.pendingProgress, input.pendingProgress),
  });
}

function parseCanonicalSchedules(
  overview: { name: string; rows: Cell[][] },
  columns: Record<keyof typeof CANONICAL_ALIASES, number>,
  importedAt: string,
  jobsByKey: Map<string, Job>,
) {
  const schedules: Schedule[] = [];
  overview.rows.slice(1).forEach((row, rowOffset) => {
    const rowNumber = rowOffset + 2;
    const company = clean(row[columns.company]);
    const position = clean(row[columns.position]);
    if (!company || !position || company === "0" || position === "0") return;

    const date = parseExcelDate(row[columns.date]);
    const detail = clean(row[columns.detail]) || "进度更新";
    const rawStage = clean(row[columns.stage]);
    const stage = isStage(rawStage) ? rawStage : inferStage(`${rawStage} ${detail}`);
    const source = clean(row[columns.source]).toLocaleLowerCase() === "web" ? "web" : "excel";
    const schedule: Schedule = {
      id:
        clean(row[columns.id]) ||
        hashId("excel", overview.name, String(rowNumber), date, stage, detail),
      company,
      position,
      date,
      stage,
      interviewRound:
        stage === "面试"
          ? normalizeInterviewRound(clean(row[columns.interviewRound])) || inferInterviewRound(detail)
          : "",
      writtenRound:
        stage === "笔试"
          ? normalizeWrittenRound(clean(row[columns.writtenRound])) ||
            inferWrittenRound(detail) ||
            inferAssessmentLabel(`${rawStage} ${detail}`)
          : "",
      offerType:
        stage === "Offer"
          ? normalizeOfferType(clean(row[columns.offerType])) || inferOfferType(detail)
          : "",
      failNote: stage === "未通过" ? normalizeFailNote(clean(row[columns.failNote])) : "",
      sourceLink: clean(row[columns.sourceLink]) || undefined,
      source,
      createdAt: clean(row[columns.createdAt]) || importedAt,
      updatedAt: clean(row[columns.updatedAt]) || importedAt,
    };
    schedules.push(schedule);
    upsertJob(jobsByKey, {
      company,
      position,
      sourceLink: schedule.sourceLink,
    });
  });
  return schedules;
}

export function parseSourceWorkbook(sourceFile: string): RecruitmentStore {
  const workbook = XLSX.readFile(sourceFile, { cellDates: false, cellFormula: true });
  const overview = workbookRows(workbook, "总览", 0);
  const jdSheet = workbookRows(workbook, "JD", 1);
  const overviewHeaders = overview.rows[0] || [];
  const jdHeaders = jdSheet.rows[0] || [];
  const importedAt = new Date().toISOString();
  const jobsByKey = new Map<string, Job>();

  const canonicalColumns = {
    company: findColumn(overviewHeaders, CANONICAL_ALIASES.company),
    position: findColumn(overviewHeaders, CANONICAL_ALIASES.position),
    date: findColumn(overviewHeaders, CANONICAL_ALIASES.date),
    stage: findColumn(overviewHeaders, CANONICAL_ALIASES.stage),
    interviewRound: findColumn(overviewHeaders, CANONICAL_ALIASES.interviewRound),
    writtenRound: findColumn(overviewHeaders, CANONICAL_ALIASES.writtenRound),
    offerType: findColumn(overviewHeaders, CANONICAL_ALIASES.offerType),
    failNote: findColumn(overviewHeaders, CANONICAL_ALIASES.failNote),
    detail: findColumn(overviewHeaders, CANONICAL_ALIASES.detail),
    sourceLink: findColumn(overviewHeaders, CANONICAL_ALIASES.sourceLink),
    source: findColumn(overviewHeaders, CANONICAL_ALIASES.source),
    id: findColumn(overviewHeaders, CANONICAL_ALIASES.id),
    createdAt: findColumn(overviewHeaders, CANONICAL_ALIASES.createdAt),
    updatedAt: findColumn(overviewHeaders, CANONICAL_ALIASES.updatedAt),
  };
  // 「具体事项」列已废弃，存在与否不再影响规范表判定。
  const isCanonical =
    canonicalColumns.company >= 0 &&
    canonicalColumns.position >= 0 &&
    canonicalColumns.date >= 0 &&
    canonicalColumns.stage >= 0;

  let schedules: Schedule[];
  if (isCanonical) {
    schedules = parseCanonicalSchedules(overview, canonicalColumns, importedAt, jobsByKey);
  } else {
    const overviewColumns = {
      company: findColumn(overviewHeaders, LEGACY_OVERVIEW_ALIASES.company),
      batch: findColumn(overviewHeaders, LEGACY_OVERVIEW_ALIASES.batch),
      position: findColumn(overviewHeaders, LEGACY_OVERVIEW_ALIASES.position),
      applicationDate: findColumn(overviewHeaders, LEGACY_OVERVIEW_ALIASES.applicationDate),
      progress: findColumn(overviewHeaders, LEGACY_OVERVIEW_ALIASES.progress),
      link: findColumn(overviewHeaders, LEGACY_OVERVIEW_ALIASES.link),
    };
    schedules = [];

    overview.rows.slice(1).forEach((row, rowOffset) => {
      const rowNumber = rowOffset + 2;
      const company = clean(row[overviewColumns.company]);
      const position = clean(row[overviewColumns.position]);
      if (!company || !position || company === "0" || position === "0") return;

      const batch = clean(row[overviewColumns.batch]);
      const sourceLink = clean(row[overviewColumns.link]);
      const applicationDate = parseExcelDate(row[overviewColumns.applicationDate]);
      const progressText = clean(row[overviewColumns.progress]);
      const fallbackYear = Number(applicationDate.slice(0, 4)) || new Date().getFullYear();
      const undatedProgress: string[] = [];
      let applicationSchedule: Schedule | undefined;

      if (applicationDate) {
        applicationSchedule = {
          id: hashId("excel", overview.name, String(rowNumber), "投递", applicationDate),
          company,
          position,
          date: applicationDate,
          stage: "投递",
          sourceLink: sourceLink || undefined,
          source: "excel",
          createdAt: importedAt,
          updatedAt: importedAt,
        };
        schedules.push(applicationSchedule);
      }

      progressText.split(/\r?\n/).forEach((line, lineIndex) => {
        const parsed = parseProgressLine(line, fallbackYear, applicationDate);
        if (!parsed) {
          if (line.trim()) undatedProgress.push(line.trim());
          return;
        }

        schedules.push({
          id: hashId(
            "excel",
            overview.name,
            String(rowNumber),
            "进度",
            String(lineIndex),
            parsed.date,
            parsed.detail,
          ),
          company,
          position,
          date: parsed.date,
          stage: parsed.stage,
          interviewRound: parsed.stage === "面试" ? inferInterviewRound(parsed.detail) : "",
          writtenRound:
            parsed.stage === "笔试"
              ? inferWrittenRound(parsed.detail) || inferAssessmentLabel(parsed.detail)
              : "",
          offerType: parsed.stage === "Offer" ? inferOfferType(parsed.detail) : "",
          failNote:
            parsed.stage === "未通过"
              ? normalizeFailNote(parsed.detail === "进度更新" ? "" : parsed.detail)
              : "",
          sourceLink: sourceLink || undefined,
          source: "excel",
          createdAt: importedAt,
          updatedAt: importedAt,
        });
      });

      // 未标注日期的进展不再塞进日程备注，统一挂在岗位的 pendingProgress 上。
      const pendingProgress = undatedProgress.join("；");

      upsertJob(jobsByKey, {
        company,
        position,
        sourceLink,
        batch,
        pendingProgress: pendingProgress || undefined,
      });
    });
  }

  const jdColumns = {
    company: findColumn(jdHeaders, JD_ALIASES.company),
    position: findColumn(jdHeaders, JD_ALIASES.position),
    jd: findColumn(jdHeaders, JD_ALIASES.jd),
    category: findColumn(jdHeaders, JD_ALIASES.category),
    batch: findColumn(jdHeaders, JD_ALIASES.batch),
    sourceLink: findColumn(jdHeaders, JD_ALIASES.sourceLink),
    pendingProgress: findColumn(jdHeaders, JD_ALIASES.pendingProgress),
  };

  jdSheet.rows.slice(1).forEach((row, rowOffset) => {
    const physicalRowIndex = rowOffset + 1;
    const formulaCompany = clean(row[jdColumns.company]);
    const formulaPosition = clean(row[jdColumns.position]);
    const company =
      formulaCompany && formulaCompany !== "0"
        ? formulaCompany
        : readIdentityCell(
            workbook,
            jdSheet.name,
            physicalRowIndex,
            jdColumns.company,
            overview.name,
          );
    const position =
      formulaPosition && formulaPosition !== "0"
        ? formulaPosition
        : readIdentityCell(
            workbook,
            jdSheet.name,
            physicalRowIndex,
            jdColumns.position,
            overview.name,
          );
    const jd =
      clean(row[jdColumns.jd]) ||
      readCellValue(workbook, jdSheet.name, physicalRowIndex, jdColumns.jd);
    const pendingProgress = clean(row[jdColumns.pendingProgress]);
    if (!company || !position || company === "0" || position === "0") return;

    const existing = jobsByKey.get(jobKey(company, position));
    upsertJob(jobsByKey, {
      company,
      position,
      jd,
      sourceLink: clean(row[jdColumns.sourceLink]) || existing?.sourceLink,
      batch: clean(row[jdColumns.batch]) || existing?.batch,
      pendingProgress,
    });
  });

  return {
    version: 1,
    importedAt,
    sourceFile: path.basename(sourceFile),
    schedules,
    jobs: [...jobsByKey.values()],
  };
}
