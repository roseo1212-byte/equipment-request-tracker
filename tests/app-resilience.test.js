import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as store from "../src/request-store.js";

const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
class Element {
  constructor() { this.listeners = {}; this.children = []; this.elements = Object.assign([], { start: new ElementControl(), end: new ElementControl() }); this.classList = { toggle() {} }; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute() {}
  querySelectorAll() { return []; }
  querySelector() { return new Element(); }
  replaceChildren(...children) { this.children = children; }
  append(child) { this.children.push(child); }
  focus() {}
  reset() { this.wasReset = true; }
}
class ElementControl { setAttribute() {} }
function harness({ records = [], failSave = false } = {}) {
  const elements = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const storage = { value: JSON.stringify(records), getItem() { return this.value; }, setItem(key, value) {
    if (failSave) throw new Error("Storage unavailable");
    this.value = value;
  }};
  const context = vm.createContext({
    ...store, loadRequests: () => store.loadRequests(storage), saveRequests: list => store.saveRequests(list, storage),
    document: { querySelector: element, createElement: () => new Element() },
    window: { addEventListener() {} }, setInterval() {}, console: { error() {} },
    FormData: class { constructor(form) { this.form = form; } entries() {
      return Object.entries(this.form === element("#request-form") ? input : {});
    }},
  });
  vm.runInContext(source.replace(/^import\s*\{[\s\S]*?\}\s*from\s*"\.\/request-store.js";/, ""), context);
  return { context, storage, element };
}
const input = { requester: "Test", department: "Operations", equipment: "Laptop",
  neededBy: "2026-12-01", reason: "Test", priority: "Normal" };

test("failed submission does not enter the list; retry saves exactly one request", () => {
  const h = harness({ failSave: true });
  const submit = h.element("#request-form").listeners.submit;
  submit({ preventDefault() {} });
  assert.equal(vm.runInContext("requests.length", h.context), 0);
  assert.equal(h.element("#request-form").wasReset, undefined);
  assert.match(h.element("#form-message").textContent, /could not be saved/);
  h.storage.setItem = function(key, value) { this.value = value; };
  submit({ preventDefault() {} });
  assert.equal(vm.runInContext("requests.length", h.context), 1);
  assert.equal(JSON.parse(h.storage.value).length, 1);
  assert.equal(h.element("#request-form").wasReset, true);
});

test("damaged saved dates do not stop active or history rows rendering or rewrite storage", () => {
  const active = { ...store.createRequest(input), neededBy: "bad-date", createdAt: "bad-time" };
  const history = { ...store.createRequest(input), id: "history", status: "fulfilled", createdAt: "bad-time", resolvedAt: "bad-time" };
  const h = harness({ records: [active, history] });
  const row = h.element("#request-table-body").children[0];
  assert.equal(row.children[4].textContent, "Invalid date");
  assert.equal(row.children[6].textContent, "Date not recorded");
  const historyRow = h.element("#history-table-body").children[0];
  assert.equal(historyRow.children[8].textContent, "Date not recorded");
  assert.deepEqual(JSON.parse(h.storage.value), [active, history]);
});
