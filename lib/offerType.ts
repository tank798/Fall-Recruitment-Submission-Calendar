/** Offer 文案统一保存完整名称，例如“实习 Offer”或“正式 Offer”。 */
export function normalizeOfferType(value?: string) {
  const normalized = (value || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  const prefix = normalized.replace(/\s*Offer$/iu, "").trim();
  return prefix ? `${prefix.slice(0, 18)} Offer` : "Offer";
}

/** 表单输入框只展示 Offer 前面的部分，右侧后缀由界面固定显示。 */
export function getOfferTypePrefix(value?: string) {
  return normalizeOfferType(value).replace(/\s*Offer$/iu, "").trim();
}

/** 兼容历史事项文本中的常见 Offer 描述。 */
export function inferOfferType(detail?: string) {
  const match = (detail || "").match(/(?:实习|正式|校招|暑期|日常)?\s*Offer/iu);
  return normalizeOfferType(match?.[0]);
}
