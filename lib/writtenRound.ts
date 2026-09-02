/** 表单中只保存“笔”前面的部分，例如一、二、三。 */
export function normalizeWrittenRound(value?: string) {
  return (value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/(?:笔试|笔)$/u, "")
    .slice(0, 12);
}

/** 兼容旧数据：从历史“具体事项”中识别常见笔试轮次。 */
export function inferWrittenRound(detail?: string) {
  const compact = (detail || "").replace(/\s+/g, "");
  const match = compact.match(/(?:第)?([一二三四五六七八九十\d]+)(?:次)?笔(?:试)?/u);
  return normalizeWrittenRound(match?.[1]);
}
