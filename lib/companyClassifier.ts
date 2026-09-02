import type { CompanyCategory } from "./types";

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
] as const;

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function classifyCompany(companyName: string): CompanyCategory {
  const company = normalized(companyName);

  if (
    INTERNET_COMPANIES.some((candidate) => {
      const name = normalized(candidate);
      return company === name || company.includes(name);
    })
  ) {
    return "互联网大厂";
  }

  if (
    FINANCIAL_KEYWORDS.some((keyword) =>
      company.includes(normalized(keyword)),
    )
  ) {
    return "金融公司";
  }

  return "实业公司";
}
