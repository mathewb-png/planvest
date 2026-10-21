import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectBalance } from "./k401Growth.ts";
import { buildPlan } from "./k401Plan.ts";

describe("401(k) growth illustration", () => {
  it("returns deposits unchanged when the rate is zero", () => {
    const result = projectBalance({
      currentBalance: 1_000,
      annualEmployee: 1_200,
      annualEmployer: 0,
      years: 10,
      annualReturnPct: 0,
    });
    assert.equal(result.endingBalance, 13_000);
    assert.equal(result.totalEmployee, 12_000);
    assert.equal(result.illustratedGrowth, 0);
  });

  it("compounds a current balance with no new deposits", () => {
    const result = projectBalance({
      currentBalance: 100,
      annualEmployee: 0,
      annualEmployer: 0,
      years: 1,
      annualReturnPct: 10,
    });
    assert.equal(result.endingBalance, 110);
  });

  it("builds a plan that caps deferrals and applies the match", () => {
    const plan = buildPlan({
      age: 40,
      currentBalance: 25_000,
      annualEmployee: 8_000,
      salary: 80_000,
      matchRatePct: 50,
      matchOnSalaryPct: 6,
      years: 25,
      sleeve: "sp500",
      liveYearReturnPct: { SPY: 15.8, VTI: 15.3, BND: 4.2 },
    });
    assert.equal(plan.employee.capped, 8_000);
    assert.equal(plan.employerThisYear, 2_400);
    assert.equal(plan.matchLeftOnTable, 0);
    assert.equal(plan.longRunPct, 10);
    assert.equal(plan.lastYearPct, 15.8);
    assert.ok(plan.longRun.endingBalance > 25_000 + 8_000 * 25 + 2_400 * 25);
  });

  it("flags match left on the table below the cap", () => {
    const plan = buildPlan({
      age: 35,
      currentBalance: 0,
      annualEmployee: 1_000,
      salary: 80_000,
      matchRatePct: 50,
      matchOnSalaryPct: 6,
      years: 1,
      sleeve: "conservative",
      liveYearReturnPct: { BND: 3.1 },
    });
    assert.equal(plan.employerThisYear, 500);
    assert.equal(plan.fullMatchAt, 4_800);
    assert.equal(plan.matchLeftOnTable, 1_900);
  });
});
