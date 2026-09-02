/** Offer 文案直接保存完整名称，例如“实习 Offer”或“正式 Offer”。 */
export function normalizeOfferType(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ").slice(0, 24);
}

/** 兼容历史事项文本中的常见 Offer 描述。 */
export function inferOfferType(detail?: string) {
  const match = (detail || "").match(/(?:实习|正式|校招|暑期|日常)?\s*Offer/iu);
  return normalizeOfferType(match?.[0]);
}
