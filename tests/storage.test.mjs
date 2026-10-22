import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../yijian-web/assets/storage.mjs";
test("progress and casting survive a new store and clear removes both", () => {
  const m = new Map();
  const storage = {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
  const a = createStore(() => storage);
  a.complete("lesson-one");
  a.add({ values: [7, 7, 7, 7, 7, 7], topic: "general" });
  const b = createStore(() => storage);
  assert.deepEqual(b.read().completed, ["lesson-one"]);
  assert.equal(b.read().history.length, 1);
  b.clear();
  assert.deepEqual(b.read(), { completed: [], history: [] });
});
test("unavailable and corrupt storage report failures without blocking a reading", () => {
  const a = createStore(() => {
    throw new Error("denied");
  });
  assert.equal(a.complete("one"), false);
  assert.ok(a.error);
  const b = createStore(() => ({ getItem: () => "{broken" }));
  assert.deepEqual(b.read(), { completed: [], history: [] });
  assert.ok(b.error);
});
test("a temporary storage failure can recover without reload or clearing old records", () => {
  const memory = new Map();
  let unavailable = false;
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      if (unavailable) throw new Error("quota");
      memory.set(key, value);
    },
  };
  const store = createStore(() => storage);
  unavailable = true;
  assert.equal(store.complete("first"), false);
  unavailable = false;
  assert.equal(store.complete("first"), true);
  unavailable = true;
  assert.equal(store.complete("second"), false);
  unavailable = false;
  assert.equal(store.complete("second"), true);
  assert.deepEqual(store.read().completed, ["first", "second"]);
  assert.equal(store.error, "");
});
