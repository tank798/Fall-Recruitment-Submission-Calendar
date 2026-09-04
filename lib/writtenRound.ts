/** 笔试文案完全个性化：只清理空白和限长，不再剥离任何后缀。 */
export function normalizeWrittenRound(value?: string) {
  return (value || "").trim().replace(/\s+/g, "").slice(0, 12);
}

/** 兼容旧数据：从历史“具体事项”中识别常见笔试轮次，返回完整文案（如“一笔”“二笔”）。 */
export function inferWrittenRound(detail?: string) {
  const compact = (detail || "").replace(/\s+/g, "");
  const match = compact.match(/(?:第)?([一二三四五六七八九十\d]+)(?:次)?笔(?:试)?/u);
  if (!match) return "";
  return normalizeWrittenRound(`${match[1]}笔`);
}
