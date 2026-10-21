import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { remainingHsaRoom } from "./hsaLimits.ts";

describe("2026 HSA contribution room", () => {
  it("returns the family limit minus employer money", () => {
    const result = remainingHsaRoom({
      taxYear: 2026,
      coverage: "family",
      ageAtYearEnd: 40,
      hasQualifyingHdhp: true,
      enrolledInMedicare: false,
      isSomeoneElseDependent: false,
      employerContributions: 2000,
      otherHsaContributions: 0,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.maxEmployeeContribution, 6750);
  });

  it("adds the age-55 catch-up", () => {
    const result = remainingHsaRoom({
      taxYear: 2026,
      coverage: "self",
      ageAtYearEnd: 55,
      hasQualifyingHdhp: true,
      enrolledInMedicare: false,
      isSomeoneElseDependent: false,
      employerContributions: 0,
      otherHsaContributions: 0,
    });
    assert.equal(result.maxEmployeeContribution, 5400);
  });

  it("blocks contributions without an HDHP", () => {
    const result = remainingHsaRoom({
      taxYear: 2026,
      coverage: "self",
      ageAtYearEnd: 30,
      hasQualifyingHdhp: false,
      enrolledInMedicare: false,
      isSomeoneElseDependent: false,
      employerContributions: 0,
      otherHsaContributions: 0,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.maxEmployeeContribution, 0);
  });
});
