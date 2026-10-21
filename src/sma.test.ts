import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sma } from "./sma.ts";

describe("sma", () => {
  it("returns null until the window is full, then the mean", () => {
    assert.deepEqual(sma([2, 4, 6, 8], 2), [null, 3, 5, 7]);
  });
});
