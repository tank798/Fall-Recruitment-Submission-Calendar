"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isDateInRange } from "@/lib/cohort";
import { getCompanyDisplayName, getCompanyMatchKey } from "@/lib/companyNames";
import type { RecruitmentStore, Schedule, ScheduleInput } from "@/lib/types";
import { normalizedSearch } from "@/lib/utils";
import { AddScheduleModal } from "./AddScheduleModal";
import { CompanyDetailDrawer } from "./CompanyDetailDrawer";
import { DashboardPage } from "./DashboardPage";
import {
  RecruitmentCohortProvider,
  useRecruitmentCohort,
} from "./RecruitmentCohortContext";
import { ScheduleDetailDrawer } from "./ScheduleDetailDrawer";
import type { StageFilterValue } from "@/lib/types";
import { TimelinePage } from "./TimelinePage";
import { TopNavigation, type AppView } from "./TopNavigation";
import { WeeklyCalendarPage } from "./WeeklyCalendarPage";

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "请求失败，请重试";
  } catch {
    return "请求失败，请重试";
  }
}

export function RecruitmentApp({ initialStore }: { initialStore: RecruitmentStore }) {
  return (
    <RecruitmentCohortProvider>
      <RecruitmentAppContent initialStore={initialStore} />
    </RecruitmentCohortProvider>
  );
}

function RecruitmentAppContent({ initialStore }: { initialStore: RecruitmentStore }) {
  const { dateRange, selectedGraduationYear } = useRecruitmentCohort();
  const [view, setView] = useState<AppView>("dashboard");
  const [schedules, setSchedules] = useState(initialStore.schedules);
  const [jobs, setJobs] = useState(initialStore.jobs);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilterValue>("全部");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "copy">("add");
  const [notice, setNotice] = useState("");

  const selectedSchedule = schedules.find((schedule) => schedule.id === selectedScheduleId);
  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const exportStage = view === "dashboard" ? "全部" : stageFilter;
  const exportHref = `/api/export?graduationYear=${selectedGraduationYear}&stage=${encodeURIComponent(exportStage)}&search=${encodeURIComponent(search)}`;
  const cohortSchedules = useMemo(
    () => schedules.filter((schedule) => isDateInRange(schedule.date, dateRange)),
    [dateRange, schedules],
  );
  const cohortJobs = useMemo(() => {
    const activeJobKeys = new Set(
      cohortSchedules.map(
        (schedule) =>
          `${getCompanyMatchKey(schedule.company)}::${normalizedSearch(schedule.position)}`,
      ),
    );
    return jobs.filter((job) =>
      activeJobKeys.has(`${getCompanyMatchKey(job.company)}::${normalizedSearch(job.position)}`),
    );
  }, [cohortSchedules, jobs]);
  const matchedJob = useMemo(() => {
    if (!selectedSchedule) return undefined;
    const company = getCompanyMatchKey(selectedSchedule.company);
    const position = normalizedSearch(selectedSchedule.position);
    return jobs.find(
      (job) =>
        getCompanyMatchKey(job.company) === company && normalizedSearch(job.position) === position,
    );
  }, [jobs, selectedSchedule]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setSelectedScheduleId(null);
    setSelectedJobId(null);
    setSelectedCompany(null);
  }, [selectedGraduationYear]);

  const changeView = (nextView: AppView) => {
    setView(nextView);
    setSelectedScheduleId(null);
    setSelectedJobId(null);
    setSelectedCompany(null);
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const refreshStore = async () => {
    const response = await fetch("/api/schedules", { cache: "no-store" });
    if (!response.ok) return;
    const latest = (await response.json()) as {
      schedules: Schedule[];
      jobs: typeof jobs;
    };
    setSchedules(latest.schedules);
    setJobs(latest.jobs);
  };

  const saveSchedule = async (input: ScheduleInput, id?: string, mode?: "add" | "edit" | "copy") => {
    const expectedUpdatedAt = id
      ? schedules.find((schedule) => schedule.id === id)?.updatedAt
      : undefined;
    const response = await fetch(id ? `/api/schedules/${encodeURIComponent(id)}` : "/api/schedules", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, expectedUpdatedAt }),
    });
    if (!response.ok) {
      const message = await readApiError(response);
      if (response.status === 409) await refreshStore();
      throw new Error(message);
    }

    const { schedule, job, jobs: latestJobs } = (await response.json()) as {
      schedule: Schedule;
      job?: (typeof jobs)[number];
      jobs?: typeof jobs;
    };
    setSchedules((current) =>
      id
        ? current.map((item) => (item.id === schedule.id ? schedule : item))
        : [...current, schedule],
    );
    if (latestJobs) {
      setJobs(latestJobs);
    } else if (job) {
      setJobs((current) => {
        const exists = current.some((item) => item.id === job.id);
        return exists ? current.map((item) => (item.id === job.id ? job : item)) : [...current, job];
      });
    }
    // 只有「修改」时才自动打开抽屉：新增日程直接让 toast 提示即可，
    // 避免用户连续添加多条时被来回跳转打断；复制同理，让用户继续在弹窗里操作。
    if (mode === "edit") {
      setSelectedScheduleId(schedule.id);
    }
    setNotice(id ? "修改成功" : "添加成功");
  };

  const removeSelectedSchedule = async () => {
    if (!selectedSchedule) return;
    const params = new URLSearchParams({ expectedUpdatedAt: selectedSchedule.updatedAt });
    const response = await fetch(
      `/api/schedules/${encodeURIComponent(selectedSchedule.id)}?${params.toString()}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const message = await readApiError(response);
      if (response.status === 409) await refreshStore();
      throw new Error(message);
    }
    const { jobs: latestJobs } = (await response.json()) as { jobs?: typeof jobs };
    setSchedules((current) => current.filter((item) => item.id !== selectedSchedule.id));
    if (latestJobs) setJobs(latestJobs);
    setSelectedScheduleId(null);
    setNotice("日程已删除");
  };

  return (
    <div className="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-[#f7f8fa] text-[#1f2329]">
      <TopNavigation
        exportHref={exportHref}
        onAdd={openAddModal}
        onChange={changeView}
        onSearchChange={setSearch}
        search={search}
        view={view}
      />
      <div className="flex min-h-0 min-w-0 flex-1">
        {view === "dashboard" ? (
          <DashboardPage
            jobs={cohortJobs}
            onSelectCompany={(company) => {
              setSelectedCompany(company);
              setSelectedJobId(null);
            }}
            schedules={cohortSchedules}
            search={search}
          />
        ) : null}
        {view === "list" ? (
          <TimelinePage
            jobs={jobs}
            onSelect={(schedule) => setSelectedScheduleId(schedule.id)}
            onStageFilterChange={setStageFilter}
            schedules={cohortSchedules}
            search={search}
            stageFilter={stageFilter}
          />
        ) : null}
        {view === "calendar" ? (
          <WeeklyCalendarPage
            onSelect={(schedule) => setSelectedScheduleId(schedule.id)}
            onStageFilterChange={setStageFilter}
            schedules={cohortSchedules}
            search={search}
            stageFilter={stageFilter}
          />
        ) : null}
        {(view === "list" || view === "calendar") && selectedSchedule ? (
          <ScheduleDetailDrawer
            job={matchedJob}
            onClose={() => setSelectedScheduleId(null)}
            onDelete={removeSelectedSchedule}
            onCopy={() => {
              setEditingSchedule(selectedSchedule);
              setModalMode("copy");
              setModalOpen(true);
            }}
            onEdit={() => {
              setEditingSchedule(selectedSchedule);
              setModalMode("edit");
              setModalOpen(true);
            }}
            schedule={selectedSchedule}
          />
        ) : null}
        {view === "dashboard" && selectedCompany ? (
          <CompanyDetailDrawer
            company={selectedCompany}
            job={selectedJob}
            jobs={cohortJobs.filter(
              (job) => getCompanyDisplayName(job.company) === selectedCompany,
            )}
            onBack={() => setSelectedJobId(null)}
            onClose={() => {
              setSelectedCompany(null);
              setSelectedJobId(null);
            }}
            onSelectJob={(job) => {
              setSelectedJobId(job.id);
              setSelectedCompany(getCompanyDisplayName(job.company));
            }}
          />
        ) : null}
      </div>

      <AddScheduleModal
        jobs={jobs}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSave={saveSchedule}
        open={modalOpen}
        schedule={editingSchedule}
      />

      {notice ? (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#1f2329] px-3.5 py-2 text-xs font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {notice}
        </div>
      ) : null}
    </div>
  );
}
