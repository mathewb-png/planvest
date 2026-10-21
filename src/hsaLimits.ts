/** IRS Rev. Proc. 2025-19 amounts for calendar year 2026. */
export const HSA_LIMITS_2026 = {
  contributionSelf: 4400,
  contributionFamily: 8750,
  catchUpAge55: 1000,
  hdhpMinDeductibleSelf: 1700,
  hdhpMinDeductibleFamily: 3400,
  hdhpMaxOopSelf: 8500,
  hdhpMaxOopFamily: 17000,
} as const;

export type Coverage = "self" | "family";

export interface HsaEligibilityInput {
  taxYear: number;
  coverage: Coverage;
  ageAtYearEnd: number;
  hasQualifyingHdhp: boolean;
  enrolledInMedicare: boolean;
  isSomeoneElseDependent: boolean;
  employerContributions: number;
  otherHsaContributions: number;
}

export interface HsaContributionResult {
  eligible: boolean;
  maxEmployeeContribution: number;
  reasons: string[];
}

export function remainingHsaRoom(input: HsaEligibilityInput): HsaContributionResult {
  const reasons: string[] = [];

  if (input.taxYear !== 2026) {
    reasons.push(`Contribution tables in this repo are coded for 2026 only (got ${input.taxYear}).`);
  }
  if (!input.hasQualifyingHdhp) {
    reasons.push("Not an eligible individual: no qualifying HDHP.");
  }
  if (input.enrolledInMedicare) {
    reasons.push("Medicare enrollment blocks HSA contributions for those months.");
  }
  if (input.isSomeoneElseDependent) {
    reasons.push("A person claimed as a dependent cannot deduct HSA contributions.");
  }

  const eligible = reasons.length === 0;
  if (!eligible) {
    return { eligible: false, maxEmployeeContribution: 0, reasons };
  }

  const base =
    input.coverage === "family"
      ? HSA_LIMITS_2026.contributionFamily
      : HSA_LIMITS_2026.contributionSelf;
  const catchUp = input.ageAtYearEnd >= 55 ? HSA_LIMITS_2026.catchUpAge55 : 0;
  const statutory = base + catchUp;
  const alreadyIn = input.employerContributions + input.otherHsaContributions;
  const remaining = Math.max(0, statutory - alreadyIn);

  if (alreadyIn > statutory) {
    reasons.push("Existing contributions already exceed the annual limit.");
  }

  return { eligible: true, maxEmployeeContribution: remaining, reasons };
}
