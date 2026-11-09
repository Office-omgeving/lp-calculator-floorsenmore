import assert from "node:assert/strict";
import test from "node:test";
import { broadRange } from "../app/lib/broad-range.mjs";

test("ruime vork omvat altijd de gedetailleerde vork en is afgerond op €500", () => {
  for (const [low, high] of [[7600, 11600], [2500, 2500], [1700, 2500], [9200, 9200], [42500, 45000]]) {
    const r = broadRange(low, high);
    assert.ok(r.low <= low && r.high >= high, `${low}-${high} -> ${r.low}-${r.high}`);
    assert.ok(r.high - r.low > high - low, "ruimer dan de echte vork");
    assert.equal(r.low % 500, 0);
    assert.equal(r.high % 500, 0);
  }
  assert.deepEqual(broadRange(7600, 11600), { low: 6000, high: 14000 });
});
