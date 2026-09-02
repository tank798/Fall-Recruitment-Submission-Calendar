import { ChevronDown } from "lucide-react";
import { formatCohortLabel } from "@/lib/cohort";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";

export function CohortSelector() {
  const { cohortOptions, selectedGraduationYear, setSelectedGraduationYear } =
    useRecruitmentCohort();

  return (
    <label className="relative block shrink-0">
      <span className="sr-only">选择秋招届别</span>
      <select
        aria-label="选择秋招届别"
        className="h-9 appearance-none rounded-lg border border-[#dee0e3] bg-white pl-3 pr-8 text-sm font-medium text-[#4e5969] outline-none transition hover:border-[#c9cdd4] hover:bg-[#f7f8fa] focus:border-[#85a8ff] focus:ring-2 focus:ring-[#3370ff]/10"
        onChange={(event) => setSelectedGraduationYear(Number(event.target.value))}
        value={selectedGraduationYear}
      >
        {cohortOptions.map((year) => (
          <option key={year} value={year}>
            {formatCohortLabel(year)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8f959e]" />
    </label>
  );
}
