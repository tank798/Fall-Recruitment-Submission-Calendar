import { normalizedSearch } from "./utils";

const COMPANY_ALIASES: Record<string, string> = {
  阿里: "阿里巴巴",
  阿里集团: "阿里巴巴",
  阿里巴巴: "阿里巴巴",
  alibaba: "阿里巴巴",
  alibabagroup: "阿里巴巴",
};

/** 将常见简称归并为统一展示名；只影响视图，不改写底层原始记录。 */
export function getCompanyDisplayName(company: string) {
  const trimmed = company.trim();
  return COMPANY_ALIASES[normalizedSearch(trimmed)] || trimmed;
}

/** 生成跨日程与 JD 使用的稳定公司键，让简称也能匹配同一家公司。 */
export function getCompanyMatchKey(company: string) {
  return normalizedSearch(getCompanyDisplayName(company));
}
