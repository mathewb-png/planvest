import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  capEmployeeDeferral,
  catchUpLimit,
  employeeDeferralLimit,
  employerMatch,
  fullMatchContribution,
  K401_LIMITS_2026,
} from "./k401Limits.ts";

describe("2026 401(k) limits", () => {
  it("uses Notice 2025-67 elective deferral and catch-up amounts", () => {
    assert.equal(K401_LIMITS_2026.electiveDeferral, 24_500);
    assert.equal(employeeDeferralLimit(40), 24_500);
    assert.equal(employeeDeferralLimit(50), 32_500);
    assert.equal(employeeDeferralLimit(62), 35_750);
    assert.equal(catchUpLimit(49), 0);
    assert.equal(catchUpLimit(63), 11_250);
    assert.equal(catchUpLimit(64), 8_000);
  });

  it("caps employee deferrals at the age-based limit", () => {
    const over = capEmployeeDeferral(40_000, 40);
    assert.equal(over.capped, 24_500);
    assert.equal(over.overLimit, true);
    assert.equal(capEmployeeDeferral(10_000, 40).overLimit, false);
  });

  it("matches a percent of the first slice of salary", () => {
    assert.equal(fullMatchContribution(80_000, 6), 4_800);
    assert.equal(employerMatch(80_000, 8_000, 50, 6), 2_400);
    assert.equal(employerMatch(80_000, 2_000, 50, 6), 1_000);
    assert.equal(employerMatch(80_000, 0, 50, 6), 0);
  });
});
