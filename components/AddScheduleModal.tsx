import { LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  clampDateToRange,
  formatCohortLabel,
  getTodayInChina,
  isDateInRange,
} from "@/lib/cohort";
import { DEFAULT_RECRUITMENT_BATCH, normalizeRecruitmentBatch } from "@/lib/recruitmentBatch";
import { inferInterviewRound, normalizeInterviewRound } from "@/lib/interviewRound";
import { getOfferTypePrefix, inferOfferType, normalizeOfferType } from "@/lib/offerType";
import { inferWrittenRound, normalizeWrittenRound } from "@/lib/writtenRound";
import type { Job, RecruitmentBatch, Schedule, ScheduleInput, Stage } from "@/lib/types";
import { RECRUITMENT_BATCHES, STAGES } from "@/lib/types";
import { cn, normalizedSearch } from "@/lib/utils";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

const EMPTY_FORM: ScheduleInput = {
  company: "",
  position: "",
  date: "",
  time: "",
  stage: "投递",
  interviewRound: "",
  writtenRound: "",
  offerType: "",
  detail: "",
  location: "",
  notes: "",
  sourceLink: "",
  batch: DEFAULT_RECRUITMENT_BATCH,
  jd: "",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-slate-700">{children}</span>;
}

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

export function AddScheduleModal({
  open,
  schedule,
  mode = "add",
  jobs,
  onClose,
  onSave,
}: {
  open: boolean;
  schedule?: Schedule | null;
  mode?: "add" | "edit" | "copy";
  jobs: Job[];
  onClose: () => void;
  onSave: (input: ScheduleInput, id?: string) => Promise<void>;
}) {
  const { dateRange, selectedGraduationYear } = useRecruitmentCohort();
  const [form, setForm] = useState<ScheduleInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const matchingJob = schedule
      ? jobs.find(
          (job) =>
            normalizedSearch(job.company) === normalizedSearch(schedule.company) &&
            normalizedSearch(job.position) === normalizedSearch(schedule.position),
        )
      : undefined;
    setForm(
      schedule
        ? {
            company: schedule.company,
            position: schedule.position,
            date:
              mode === "copy"
                ? clampDateToRange(getTodayInChina(), dateRange)
                : schedule.date,
            time: schedule.time,
            stage: schedule.stage,
            interviewRound:
              normalizeInterviewRound(schedule.interviewRound) || inferInterviewRound(schedule.detail),
            writtenRound:
              normalizeWrittenRound(schedule.writtenRound) || inferWrittenRound(schedule.detail),
            offerType: normalizeOfferType(schedule.offerType) || inferOfferType(schedule.detail),
            detail: schedule.detail,
            location: schedule.location,
            notes: schedule.notes,
            sourceLink: schedule.sourceLink || matchingJob?.sourceLink || "",
            batch: normalizeRecruitmentBatch(matchingJob?.batch),
            jd: matchingJob?.jd || "",
          }
        : { ...EMPTY_FORM, date: clampDateToRange(getTodayInChina(), dateRange) },
    );
    setError("");
  }, [dateRange, jobs, mode, open, schedule]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, saving]);

  const companies = useMemo(
    () => [...new Set(jobs.map((job) => job.company))].sort((a, b) => a.localeCompare(b, "zh-CN")),
    [jobs],
  );
  const positions = useMemo(() => {
    const company = normalizedSearch(form.company);
    const related = company
      ? jobs.filter((job) => normalizedSearch(job.company) === company)
      : jobs;
    return [...new Set(related.map((job) => job.position))].sort((a, b) =>
      a.localeCompare(b, "zh-CN"),
    );
  }, [form.company, jobs]);

  if (!open) return null;

  const update = <Key extends keyof ScheduleInput>(key: Key, value: ScheduleInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updatePosition = (position: string) => {
    setForm((current) => {
      const matchingJob = jobs.find(
        (job) =>
          normalizedSearch(job.company) === normalizedSearch(current.company) &&
          normalizedSearch(job.position) === normalizedSearch(position),
      );
      return {
        ...current,
        position,
        sourceLink: current.sourceLink || matchingJob?.sourceLink || "",
        batch: matchingJob ? normalizeRecruitmentBatch(matchingJob.batch) : current.batch,
        jd: matchingJob?.jd ?? current.jd,
      };
    });
  };

  const updateStage = (stage: Stage) => {
    setForm((current) => {
      const stageChanged = current.stage !== stage;
      return {
        ...current,
        stage,
        interviewRound: stage === "面试" && !stageChanged ? current.interviewRound : "",
        writtenRound: stage === "笔试" && !stageChanged ? current.writtenRound : "",
        offerType: stage === "Offer" && !stageChanged ? current.offerType : "",
        // 时间、事项、地点和备注是旧数据字段：复制时先完整保留，
        // 只在用户明确切换环节时清空，避免把“完成投递”带到新的面试记录。
        time: stageChanged ? "" : current.time,
        detail: stageChanged ? "" : current.detail,
        location: stageChanged ? "" : current.location,
        notes: stageChanged ? "" : current.notes,
      };
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isDateInRange(form.date, dateRange)) {
      setError(
        `${formatCohortLabel(selectedGraduationYear)}的日期范围是 ${dateRange.startDate} 至 ${dateRange.endDate}`,
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(form, mode === "edit" ? schedule?.id : undefined);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      aria-labelledby="schedule-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !saving) onClose();
      }}
      role="dialog"
    >
      <form
        className="max-h-[calc(100vh-2rem)] w-full max-w-[620px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
        onSubmit={submit}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-950" id="schedule-modal-title">
              {mode === "edit" ? "修改" : mode === "copy" ? "复制日程" : "添加"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">保存后会写入本地数据</p>
          </div>
          <button
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <label>
            <FieldLabel>公司 *</FieldLabel>
            <input
              autoFocus
              className={inputClass}
              list="company-suggestions"
              onChange={(event) => update("company", event.target.value)}
              placeholder="例如：腾讯"
              required
              value={form.company}
            />
            <datalist id="company-suggestions">
              {companies.map((company) => (
                <option key={company} value={company} />
              ))}
            </datalist>
          </label>

          <label>
            <FieldLabel>岗位 *</FieldLabel>
            <input
              className={inputClass}
              list="position-suggestions"
              onChange={(event) => updatePosition(event.target.value)}
              placeholder="例如：产品经理"
              required
              value={form.position}
            />
            <datalist id="position-suggestions">
              {positions.map((position) => (
                <option key={position} value={position} />
              ))}
            </datalist>
          </label>

          <label>
            <FieldLabel>日期 *</FieldLabel>
            <input
              className={inputClass}
              max={dateRange.endDate}
              min={dateRange.startDate}
              onChange={(event) => update("date", event.target.value)}
              required
              type="date"
              value={form.date}
            />
            <span className="mt-1.5 block text-[11px] text-slate-400">
              {formatCohortLabel(selectedGraduationYear)} · {dateRange.startDate} 至 {dateRange.endDate}
            </span>
          </label>

          <label>
            <FieldLabel>招聘批次 *</FieldLabel>
            <select
              className={inputClass}
              onChange={(event) => update("batch", event.target.value as RecruitmentBatch)}
              required
              value={form.batch || DEFAULT_RECRUITMENT_BATCH}
            >
              {RECRUITMENT_BATCHES.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <FieldLabel>环节 *</FieldLabel>
            <SlidingSegmentedControl
              ariaLabel="选择环节"
              className="w-full"
              onChange={updateStage}
              options={STAGES}
              value={form.stage}
            />
          </div>

          {form.stage === "面试" || form.stage === "笔试" || form.stage === "Offer" ? (
            <div className="grid grid-cols-5 sm:col-span-2">
              <label
                aria-label={
                  form.stage === "面试"
                    ? "面试轮次"
                    : form.stage === "笔试"
                      ? "笔试轮次"
                      : "Offer 类型"
                }
                className="w-[176px] max-w-none justify-self-center"
                style={{ gridColumnStart: STAGES.indexOf(form.stage) + 1 }}
              >
                <span className="flex w-full">
                  <input
                    className="h-9 min-w-0 flex-1 rounded-l-lg border border-r-0 border-slate-200 bg-white px-2 text-center text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    maxLength={form.stage === "Offer" ? 18 : 12}
                    onChange={(event) => {
                      if (form.stage === "Offer") {
                        update("offerType", normalizeOfferType(event.target.value));
                        return;
                      }
                      update(
                        form.stage === "面试" ? "interviewRound" : "writtenRound",
                        event.target.value,
                      );
                    }}
                    placeholder={
                      form.stage === "面试"
                        ? "AI / 一 / 终"
                        : form.stage === "笔试"
                          ? "一 / 二 / 三"
                          : "实习 / 正式"
                    }
                    value={
                      form.stage === "面试"
                        ? form.interviewRound || ""
                        : form.stage === "笔试"
                          ? form.writtenRound || ""
                          : getOfferTypePrefix(form.offerType)
                    }
                  />
                  <span
                    className={cn(
                      "grid h-9 shrink-0 place-items-center rounded-r-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600",
                      form.stage === "Offer" ? "w-[52px]" : "w-9",
                    )}
                  >
                    {form.stage === "面试" ? "面" : form.stage === "笔试" ? "笔" : "Offer"}
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          <label className="sm:col-span-2">
            <FieldLabel>链接</FieldLabel>
            <input
              className={inputClass}
              onChange={(event) => update("sourceLink", event.target.value)}
              placeholder="https://…"
              type="url"
              value={form.sourceLink || ""}
            />
          </label>

          <label className="sm:col-span-2">
            <FieldLabel>JD 详情</FieldLabel>
            <textarea
              className={cn(inputClass, "min-h-32 resize-y py-2.5 leading-6")}
              onChange={(event) => update("jd", event.target.value)}
              placeholder="填写岗位职责、任职要求等 JD 信息"
              value={form.jd || ""}
            />
          </label>

          {error ? (
            <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <button
            className="h-9 rounded-lg px-3.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="inline-flex h-9 min-w-20 items-center justify-center gap-2 rounded-lg bg-[#3370ff] px-4 text-sm font-medium text-white hover:bg-[#2865e8] disabled:cursor-wait disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {saving ? "保存中" : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
