/** IRS Notice 2025-67 amounts for calendar year 2026. */
export const K401_LIMITS_2026 = {
  electiveDeferral: 24_500,
  catchUpAge50: 8_000,
  catchUpAge60to63: 11_250,
  annualAdditions: 72_000,
  compensation: 360_000,
  source: "IRS Notice 2025-67",
} as const;

export function catchUpLimit(ageAtYearEnd: number): number {
  if (!Number.isFinite(ageAtYearEnd)) return 0;
  if (ageAtYearEnd >= 60 && ageAtYearEnd <= 63) return K401_LIMITS_2026.catchUpAge60to63;
  if (ageAtYearEnd >= 50) return K401_LIMITS_2026.catchUpAge50;
  return 0;
}

export function employeeDeferralLimit(ageAtYearEnd: number): number {
  return K401_LIMITS_2026.electiveDeferral + catchUpLimit(ageAtYearEnd);
}

/** Employer match: `matchRatePct` of the first `matchOnSalaryPct` of salary. */
export function employerMatch(
  salary: number,
  employeeDeferral: number,
  matchRatePct: number,
  matchOnSalaryPct: number,
): number {
  const pay = Math.max(0, salary);
  const deferral = Math.max(0, employeeDeferral);
  const rate = Math.max(0, matchRatePct) / 100;
  const cap = pay * (Math.max(0, matchOnSalaryPct) / 100);
  return Math.min(deferral, cap) * rate;
}

export function fullMatchContribution(salary: number, matchOnSalaryPct: number): number {
  return Math.max(0, salary) * (Math.max(0, matchOnSalaryPct) / 100);
}

export function capEmployeeDeferral(annualEmployee: number, ageAtYearEnd: number): {
  limit: number;
  requested: number;
  capped: number;
  overLimit: boolean;
} {
  const limit = employeeDeferralLimit(ageAtYearEnd);
  const requested = Math.max(0, annualEmployee);
  const capped = Math.min(requested, limit);
  return { limit, requested, capped, overLimit: requested > limit };
}
