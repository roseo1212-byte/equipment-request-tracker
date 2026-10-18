export const STORAGE_KEY = "mis4173-equipment-requests";
const PRIORITIES = ["Low", "Normal", "High"];

export class RequestValidationError extends Error {
  constructor(errors) {
    super("The equipment request is incomplete.");
    this.name = "RequestValidationError";
    this.errors = errors;
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRequest(input = {}) {
  const errors = {};

  if (!clean(input.requester)) errors.requester = "Enter the requester name.";
  if (!clean(input.department)) errors.department = "Select a department.";
  if (!clean(input.equipment)) errors.equipment = "Enter the equipment needed.";
  if (!isValidDate(clean(input.neededBy))) errors.neededBy = "Enter a valid needed-by date.";
  if (!clean(input.reason)) errors.reason = "Enter a business reason.";
  if (input.priority !== undefined && !PRIORITIES.includes(input.priority)) {
    errors.priority = "Select Low, Normal, or High priority.";
  }

  return errors;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createRequest(input, options = {}) {
  const errors = validateRequest(input);
  if (Object.keys(errors).length > 0) {
    throw new RequestValidationError(errors);
  }

  const now = options.now ?? new Date();

  return {
    id: options.id ?? createId(),
    requester: clean(input.requester),
    department: clean(input.department),
    equipment: clean(input.equipment),
    priority: input.priority ?? "Normal",
    neededBy: clean(input.neededBy),
    reason: clean(input.reason),
    createdAt: now.toISOString(),
  };
}

export function appendRequest(requests, request) {
  return [request, ...requests];
}

export function localDate(now = new Date()) {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")].join("-");
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function requestStatus(request) {
  return request.status ?? "active";
}

export function isOverdue(request, today = localDate()) {
  return requestStatus(request) === "active" && request.neededBy < today;
}

export function validateFilters(filters = {}) {
  if (filters.start && filters.end && filters.start > filters.end) {
    return "Start date must be on or before end date.";
  }
  return "";
}

export function selectRequests(requests, filters = {}, today = localDate()) {
  if (validateFilters(filters)) return [];
  const query = clean(filters.search).toLowerCase();
  const ranks = { High: 0, Normal: 1, Low: 2 };
  return requests.filter((request) =>
    requestStatus(request) === "active" &&
    (!filters.priority || request.priority === filters.priority) &&
    (!filters.overdue || isOverdue(request, today) === (filters.overdue === "overdue")) &&
    (!filters.start || request.neededBy >= filters.start) &&
    (!filters.end || request.neededBy <= filters.end) &&
    (!query || [request.requester, request.equipment].some((value) =>
      value.toLowerCase().includes(query)))
  ).sort((a, b) =>
    a.neededBy.localeCompare(b.neededBy) ||
    (ranks[a.priority ?? "Normal"] - ranks[b.priority ?? "Normal"]) ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

export function resolveRequest(requests, id, status, now = new Date()) {
  if (!["fulfilled", "canceled"].includes(status)) throw new Error("Invalid status.");
  return requests.map((request) =>
    request.id === id && requestStatus(request) === "active"
      ? { ...request, status, resolvedAt: now.toISOString() } : request);
}

export function loadRequests(storage = globalThis.localStorage) {
  if (!storage) return [];

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isRequestRecord).map((request) => ({
          ...request,
          priority: PRIORITIES.includes(request.priority) ? request.priority : "Normal",
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveRequests(requests, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function isRequestRecord(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.requester === "string" &&
    typeof value.department === "string" &&
    typeof value.equipment === "string" &&
    typeof value.neededBy === "string" &&
    typeof value.reason === "string" &&
    typeof value.createdAt === "string"
  );
}
