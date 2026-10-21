export interface ProjectionInput {
  currentBalance: number;
  annualEmployee: number;
  annualEmployer: number;
  years: number;
  annualReturnPct: number;
}

export interface Projection {
  endingBalance: number;
  totalEmployee: number;
  totalEmployer: number;
  totalDeposited: number;
  illustratedGrowth: number;
}

function finiteNonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Monthly deposits, annual compounding rate converted to an equivalent monthly rate.
 * Ordinary annuity (end of month). Illustration only — not a forecast.
 */
export function projectBalance(input: ProjectionInput): Projection {
  const years = Number.isFinite(input.years) ? Math.min(60, Math.max(0, Math.round(input.years))) : 0;
  const current = finiteNonNeg(input.currentBalance);
  const employee = finiteNonNeg(input.annualEmployee);
  const employer = finiteNonNeg(input.annualEmployer);
  const r = Number.isFinite(input.annualReturnPct) ? input.annualReturnPct / 100 : 0;

  const totalEmployee = employee * years;
  const totalEmployer = employer * years;
  const totalDeposited = totalEmployee + totalEmployer;

  if (years === 0) {
    return {
      endingBalance: current,
      totalEmployee: 0,
      totalEmployer: 0,
      totalDeposited: 0,
      illustratedGrowth: 0,
    };
  }

  const fvCurrent = current * (1 + r) ** years;
  const monthly = (employee + employer) / 12;
  const months = years * 12;
  const i = (1 + r) ** (1 / 12) - 1;
  const fvDeposits = i === 0 ? monthly * months : monthly * (((1 + i) ** months - 1) / i);
  const endingBalance = Math.round((fvCurrent + fvDeposits) * 100) / 100;

  return {
    endingBalance,
    totalEmployee,
    totalEmployer,
    totalDeposited,
    illustratedGrowth: Math.round((endingBalance - current - totalDeposited) * 100) / 100,
  };
}
