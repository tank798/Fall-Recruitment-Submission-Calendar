import type { CompanyCategory } from "./types";
import { getCompanyDisplayName } from "./companyNames";

export const FINANCIAL_KEYWORDS = [
  "基金",
  "证券",
  "投资",
  "资本",
  "银行",
  "保险",
  "资管",
  "资产管理",
  "信托",
  "期货",
  "金融",
  "财富",
  "理财",
  "控股金融",
  "私募",
  "公募",
  "创投",
  "VC",
  "PE",
  "投行",
  "券商",
] as const;

export const INTERNET_COMPANIES = [
  "腾讯",
  "字节跳动",
  "阿里巴巴",
  "阿里",
  "蚂蚁集团",
  "蚂蚁",
  "京东",
  "美团",
  "百度",
  "网易",
  "快手",
  "小红书",
  "拼多多",
  "滴滴",
  "携程",
  "哔哩哔哩",
  "B站",
  "知乎",
  "新浪",
  "微博",
  "搜狐",
  "360",
  "小米",
  "华为",
  "荣耀",
  "OPPO",
  "vivo",
  "联想",
  "贝壳",
  "得物",
  "去哪儿",
  "同程",
  "58同城",
  "Boss直聘",
  "BOSS",
  "货拉拉",
  "满帮",
  "Keep",
  "Soul",
  "小鹏汽车",
  "蔚来",
  "理想汽车",
  "Tencent",
  "ByteDance",
  "Alibaba",
  "Ant Group",
  "JD",
  "Meituan",
  "Baidu",
  "NetEase",
  "Kuaishou",
  "Pinduoduo",
  "Didi",
  "Xiaomi",
  "Huawei",
  "Trip.com",
  "Shopee",
  "Sea",
  "水滴公司",
  "度小满",
  "迅雷", "金山云", "哈啰", "转转",
] as const;

export const FINANCIAL_COMPANIES = [
  "中金公司",
  "中信证券",
  "华泰证券",
  "申万宏源",
  "国泰海通",
  "招商证券",
  "广发证券",
  "易方达基金",
  "嘉实基金",
  "嘉实资本",
  "高盛",
  "摩根士丹利",
  "摩根大通",
  "招商银行",
  "平安银行",
  "中国平安", "中证信用", "中信建投",
] as const;

export const STATE_OWNED_COMPANIES = [
  "国家电网",
  "中国移动",
  "中国联通",
  "中国电信",
  "中国石油",
  "中国石化",
  "中国建筑",
  "招商局集团",
  "中信集团",
  "中国船舶",
  "中国中车",
  "中国邮政",
  "中国东方", "中国中铁", "中国铁建", "中国交建", "中国中化", "中国电建", "中国能建", "中粮集团", "华润集团", "国家能源", "国家电投", "中国华能", "中国大唐", "中国华电", "中国广核", "中国核工业", "中国航天", "中国航空工业", "中国电子科技", "中国旅游集团",
] as const;

function normalized(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, "");
}

/** 英文简称必须完整匹配，避免 Shoppe 命中 PE、research 命中 Sea。 */
function matches(company: string, candidate: string) {
  const name = normalized(candidate);
  return /[\u3400-\u9fff]/.test(name) ? company.includes(name) : company === name || company === `${name}集团` || company === `${name}中国`;
}

export function classifyCompany(companyName: string): CompanyCategory {
  const company = normalized(getCompanyDisplayName(companyName));

  if (
    STATE_OWNED_COMPANIES.some((candidate) => {
      const name = normalized(candidate);
      return matches(company, name);
    })
  ) {
    return "央国企";
  }

  if (
    INTERNET_COMPANIES.some((candidate) => {
      const name = normalized(candidate);
      return matches(company, name);
    })
  ) {
    return "互联网大厂";
  }

  if (
    FINANCIAL_COMPANIES.some((candidate) => {
      const name = normalized(candidate);
      return matches(company, name);
    }) ||
    FINANCIAL_KEYWORDS.some((keyword) =>
      matches(company, keyword),
    )
  ) {
    return "金融公司";
  }

  return "实体企业";
}
