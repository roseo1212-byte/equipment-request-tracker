import assert from "node:assert/strict";
import test from "node:test";
import {
  createRequest, localDate, isOverdue, selectRequests, validateFilters,
  resolveRequest, loadRequests, saveRequests, STORAGE_KEY, requestStatus,
} from "../src/request-store.js";

const today = "2026-10-17";
function request(id, overrides = {}) {
  return createRequest({
    requester: "Jordan Lee", department: "Operations", equipment: "Laptop",
    reason: "Equipment unavailable; replacement needed",
    neededBy: today, priority: "Normal", ...overrides,
  }, { id, now: new Date(overrides.createdAt ?? "2026-10-01T12:00:00Z") });
}
const ids = (records) => records.map(record => record.id);

test("AC 1-3: date, priority, submission time, then stable ties; source is unchanged", () => {
  const records = [
    request("low", { priority: "Low" }),
    request("new-high", { priority: "High", createdAt: "2026-10-02T12:00:00Z" }),
    request("normal"), request("old-high", { priority: "High" }),
    request("tied-high", { priority: "High" }),
    request("earliest", { priority: "Low", neededBy: "2026-10-16" }),
  ];
  const before = structuredClone(records);
  assert.deepEqual(ids(selectRequests(records)), ["earliest", "old-high", "tied-high", "new-high", "normal", "low"]);
  assert.deepEqual(records, before);
});

test("AC 5-6: overdue uses local calendar date, excludes today and resolved requests", () => {
  assert.equal(localDate(new Date(2026, 9, 17, 23, 59)), today);
  const records = [request("past", { neededBy: "2026-10-16", priority: "High" }),
    request("today"), request("future", { neededBy: "2026-10-18", priority: "Low" })];
  assert.equal(isOverdue(records[0], today), true);
  assert.equal(isOverdue(records[1], today), false);
  assert.equal(isOverdue(records[2], today), false);
  assert.equal(isOverdue({ ...records[0], status: "fulfilled" }, today), false);
  assert.deepEqual(ids(selectRequests(records, { overdue: "overdue" }, today)), ["past"]);
  assert.deepEqual(ids(selectRequests(records, { overdue: "not-overdue" }, today)), ["today", "future"]);
  for (const priority of ["High", "Normal", "Low"]) {
    assert.equal(selectRequests(records, { priority }, today)[0].priority, priority);
  }
});

test("AC 7: inclusive and open date ranges; reversed range rejected", () => {
  const records = ["2026-10-16", today, "2026-10-18"].map(date => request(date, { neededBy: date }));
  assert.deepEqual(ids(selectRequests(records, { start: today, end: "2026-10-18" })), [today, "2026-10-18"]);
  assert.equal(selectRequests(records, { start: today }).length, 2);
  assert.equal(selectRequests(records, { end: today }).length, 2);
  assert.match(validateFilters({ start: "2026-10-18", end: today }), /Start date/);
  assert.deepEqual(selectRequests(records, { start: "2026-10-18", end: today }), []);
});

test("AC 8-10: trimmed case-insensitive search, AND combinations and reset", () => {
  const records = [request("match", { priority: "High", neededBy: "2026-10-16" }),
    request("wrong-priority", { neededBy: "2026-10-16" }),
    request("wrong-date", { priority: "High" }),
    request("wrong-search", { requester: "Alex", equipment: "Projector", priority: "High", neededBy: "2026-10-16" })];
  assert.equal(selectRequests(records, { search: "  JoRdAn " }).length, 3);
  assert.equal(selectRequests(records, { search: "  LAP " }).length, 3);
  const before = structuredClone(records);
  assert.deepEqual(ids(selectRequests(records, { search: "lap", priority: "High", overdue: "overdue", start: "2026-10-16", end: today }, today)), ["match"]);
  assert.equal(selectRequests(records, { search: "nothing" }).length, 0);
  assert.equal(selectRequests(records, {}).length, 4);
  assert.deepEqual(records, before);
});

test("AC 11-13, 15-16: resolution preserves originals and storage, legacy remains active", () => {
  const legacy = request("legacy");
  delete legacy.priority;
  const values = new Map([[STORAGE_KEY, JSON.stringify([legacy, request("cancel"), request("unavailable")])]]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const loaded = loadRequests(storage);
  assert.equal(loaded[0].priority, "Normal");
  assert.equal(requestStatus(loaded[0]), "active");
  const fulfilled = resolveRequest(loaded, "legacy", "fulfilled");
  const resolved = resolveRequest(fulfilled, "cancel", "canceled");
  assert.deepEqual(resolved[0], { ...loaded[0], status: "fulfilled" });
  assert.deepEqual(resolved[1], { ...loaded[1], status: "canceled" });
  assert.deepEqual(ids(selectRequests(resolved)), ["unavailable"]);
  saveRequests(resolved, storage);
  assert.deepEqual(loadRequests(storage), resolved);
  assert.deepEqual(loaded[0], { ...legacy, priority: "Normal" });
  assert.throws(() => resolveRequest(loaded, "legacy", "deleted"));
});

test("AC 14: missing fields and invalid calendar dates rejected; duplicates allowed", () => {
  for (const date of ["", "2026-02-30", "garbage", "2026-13-01"]) {
    assert.throws(() => request("invalid", { neededBy: date }));
  }
  for (const field of ["requester", "department", "equipment", "reason"]) {
    assert.throws(() => request("invalid", { [field]: " " }));
  }
  assert.equal(selectRequests([request("one"), request("two")]).length, 2);
});
