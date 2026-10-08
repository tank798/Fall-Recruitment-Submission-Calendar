import assert from "node:assert/strict";
import { compareCreationOrder } from "../lib/creationOrder";
import type { Schedule } from "../lib/types";

const record = (id: string, createdAt: string, date = "2026-10-08"): Schedule => ({
  id, createdAt, date, updatedAt: createdAt,
  company: id, position: "演示岗位", stage: "投递", source: "web",
});
const older = record("older", "2026-10-08T01:00:00Z");
const newer = record("newer", "2026-10-08T02:00:00Z");
older.updatedAt = "2026-10-08T09:00:00Z";
assert.deepEqual([older, newer].sort(compareCreationOrder).map(x => x.id), ["newer", "older"]);
assert.equal(compareCreationOrder(newer, { ...newer, createdAt: "2026-10-08T10:00:00+08:00" }), 0);
assert.equal(compareCreationOrder({ ...older, createdAt: "" }, { ...newer, createdAt: "invalid" }), 0);
assert.deepEqual([older, { ...older, id: "same-time" }].sort(compareCreationOrder).map(x => x.id), ["older", "same-time"]);
const yesterday = record("yesterday", "2026-10-08T12:00:00Z", "2026-10-07");
assert.deepEqual([yesterday, older, newer].sort((a,b) => b.date.localeCompare(a.date) || compareCreationOrder(a,b)).map(x=>x.id), ["newer", "older", "yesterday"]);
console.log("Creation-order checks passed");
