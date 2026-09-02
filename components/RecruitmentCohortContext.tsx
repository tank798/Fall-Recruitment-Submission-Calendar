"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getCohortDateRange,
  getCohortOptions,
  getDefaultGraduationYear,
  type CohortDateRange,
} from "@/lib/cohort";

interface RecruitmentCohortValue {
  selectedGraduationYear: number;
  setSelectedGraduationYear: (year: number) => void;
  dateRange: CohortDateRange;
  cohortOptions: number[];
}

const RecruitmentCohortContext = createContext<RecruitmentCohortValue | null>(null);
const COHORT_STORAGE_KEY = "autumn-recruitment:selected-graduation-year";

export function RecruitmentCohortProvider({ children }: { children: ReactNode }) {
  const defaultYear = getDefaultGraduationYear();
  const [selectedGraduationYear, setSelectedGraduationYear] = useState(defaultYear);
  const [hasLoadedStoredYear, setHasLoadedStoredYear] = useState(false);
  const cohortOptions = useMemo(() => getCohortOptions(defaultYear), [defaultYear]);
  const dateRange = useMemo(
    () => getCohortDateRange(selectedGraduationYear),
    [selectedGraduationYear],
  );
  const value = useMemo(
    () => ({
      selectedGraduationYear,
      setSelectedGraduationYear,
      dateRange,
      cohortOptions,
    }),
    [cohortOptions, dateRange, selectedGraduationYear],
  );

  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(COHORT_STORAGE_KEY));
      if (cohortOptions.includes(stored)) setSelectedGraduationYear(stored);
    } catch {
      // 隐私模式或禁用存储时继续使用默认届别。
    } finally {
      setHasLoadedStoredYear(true);
    }
  }, [cohortOptions]);

  useEffect(() => {
    if (!hasLoadedStoredYear) return;
    try {
      window.localStorage.setItem(COHORT_STORAGE_KEY, String(selectedGraduationYear));
    } catch {
      // 无存储权限时不影响当前会话。
    }
  }, [hasLoadedStoredYear, selectedGraduationYear]);

  return (
    <RecruitmentCohortContext.Provider value={value}>
      {children}
    </RecruitmentCohortContext.Provider>
  );
}

export function useRecruitmentCohort() {
  const context = useContext(RecruitmentCohortContext);
  if (!context) {
    throw new Error("useRecruitmentCohort 必须在 RecruitmentCohortProvider 内使用");
  }
  return context;
}
