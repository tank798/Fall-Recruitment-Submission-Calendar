import type { Schedule } from "./types";

/** 同日、手动排序条件相同时，最新添加的记录优先；修改时间不影响位置。 */
export function compareCreationOrder(left: Schedule, right: Schedule) {
  const timestamp = (value: string) => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  // 批量导入可能拥有相同时间戳，保留输入顺序，不伪造历史添加先后。
  return timestamp(right.createdAt) - timestamp(left.createdAt);
}
