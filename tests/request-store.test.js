import assert from "node:assert/strict";
import test from "node:test";

import {
  RequestValidationError,
  STORAGE_KEY,
  appendRequest,
  createRequest,
  loadRequests,
  saveRequests,
} from "../src/request-store.js";

const validInput = {
  requester: "  Jordan Lee  ",
  department: "Operations",
  equipment: "  Laptop  ",
  neededBy: "2026-09-15",
  reason: "  Replace a failed field computer.  ",
};

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test("createRequest trims input and adds system fields", () => {
  const request = createRequest(validInput, {
    id: "request-1",
    now: new Date("2026-08-17T12:00:00.000Z"),
  });

  assert.deepEqual(request, {
    id: "request-1",
    requester: "Jordan Lee",
    department: "Operations",
    equipment: "Laptop",
    priority: "Normal",
    neededBy: "2026-09-15",
    reason: "Replace a failed field computer.",
    createdAt: "2026-08-17T12:00:00.000Z",
  });
});

test("createRequest reports missing required fields", () => {
  assert.throws(
    () => createRequest({ ...validInput, requester: "", equipment: " " }),
    (error) => {
      assert.ok(error instanceof RequestValidationError);
      assert.deepEqual(Object.keys(error.errors), ["requester", "equipment"]);
      return true;
    },
  );
});

test("appendRequest returns a new list with the newest request first", () => {
  const original = [{ id: "old" }];
  const result = appendRequest(original, { id: "new" });

  assert.deepEqual(result.map((request) => request.id), ["new", "old"]);
  assert.deepEqual(original.map((request) => request.id), ["old"]);
});

test("saveRequests and loadRequests round-trip valid records", () => {
  const storage = new MemoryStorage();
  const request = createRequest(validInput, {
    id: "request-2",
    now: new Date("2026-08-17T12:00:00.000Z"),
  });

  saveRequests([request], storage);

  assert.deepEqual(loadRequests(storage), [request]);
});

test("loadRequests safely handles damaged stored data", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "not-json");

  assert.deepEqual(loadRequests(storage), []);
});

test("selected priorities survive creation and storage", () => {
  const storage = new MemoryStorage();
  const requests = ["Low", "Normal", "High"].map((priority) =>
    createRequest({ ...validInput, priority }),
  );

  assert.deepEqual(requests.map((request) => request.priority), ["Low", "Normal", "High"]);
  saveRequests(requests, storage);
  assert.deepEqual(loadRequests(storage), requests);
});

test("createRequest rejects priorities outside the allowed choices", () => {
  for (const priority of ["Urgent", "", null, 1]) {
    assert.throws(
      () => createRequest({ ...validInput, priority }),
      (error) => {
        assert.ok(error instanceof RequestValidationError);
        assert.deepEqual(Object.keys(error.errors), ["priority"]);
        return true;
      },
    );
  }
});

test("older requests load as Normal and remain intact when saving new requests", () => {
  const storage = new MemoryStorage();
  const legacyRequest = createRequest(validInput, { id: "legacy-request" });
  delete legacyRequest.priority;
  storage.setItem(STORAGE_KEY, JSON.stringify([legacyRequest]));

  const loaded = loadRequests(storage);
  assert.deepEqual(loaded, [{ ...legacyRequest, priority: "Normal" }]);

  const urgentRequest = createRequest({ ...validInput, priority: "High" }, { id: "new-request" });
  saveRequests(appendRequest(loaded, urgentRequest), storage);
  assert.deepEqual(loadRequests(storage), [urgentRequest, { ...legacyRequest, priority: "Normal" }]);
});
