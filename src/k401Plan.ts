import { illustrativeMix } from "./allocation.ts";
import { projectBalance, type Projection } from "./k401Growth.ts";
import {
  capEmployeeDeferral,
  employerMatch,
  fullMatchContribution,
  K401_LIMITS_2026,
} from "./k401Limits.ts";

export type SleeveId =
  | "sp500"
  | "total"
  | "nasdaq"
  | "small"
  | "balanced"
  | "conservative"
  | "target";

export interface Sleeve {
  id: SleeveId;
  label: string;
  longRunPct: number;
  boardSymbol: string;
  menuName: string;
  note: string;
}

export const SLEEVES: Sleeve[] = [
  {
    id: "sp500",
    label: "S&P 500",
    longRunPct: 10,
    boardSymbol: "SPY",
    menuName: "S&P 500 index fund",
    note: "What most 401(k) “US large cap” or “S&P 500” options track. Same public market as SPX and SPY on the board.",
  },
  {
    id: "total",
    label: "Total US market",
    longRunPct: 10,
    boardSymbol: "VTI",
    menuName: "Total US stock market",
    note: "Whole US market, including mid and small companies. Same idea as VTI.",
  },
  {
    id: "nasdaq",
    label: "Nasdaq-100",
    longRunPct: 12,
    boardSymbol: "QQQ",
    menuName: "Large growth / Nasdaq",
    note: "Tech-heavy. Bigger swings than the S&P 500. Same market as NDX and QQQ.",
  },
  {
    id: "small",
    label: "US small companies",
    longRunPct: 9,
    boardSymbol: "IWM",
    menuName: "Small-cap / Russell 2000",
    note: "More uneven years. Same market as RUT and IWM.",
  },
  {
    id: "balanced",
    label: "60 / 40 mix",
    longRunPct: 7,
    boardSymbol: "SPY",
    menuName: "Balanced / target-risk",
    note: "Sixty percent US stocks, forty percent bonds. Typical balanced or later-stage target-date path.",
  },
  {
    id: "conservative",
    label: "Bonds",
    longRunPct: 4,
    boardSymbol: "BND",
    menuName: "US aggregate bonds",
    note: "Closer to bond funds than to stocks. Same market as BND. The 10-year yield on the tape is the rate backdrop.",
  },
  {
    id: "target",
    label: "Age-based mix",
    longRunPct: 8,
    boardSymbol: "VTI",
    menuName: "Target-date style",
    note: "A generic 110-minus-age stock share. Illustration only — your plan’s target-date glide path will differ.",
  },
];

export const MENU_BRIDGES: Array<{ menuName: string; symbol: string; sleeve: SleeveId }> = [
  { menuName: "S&P 500 index fund", symbol: "SPY", sleeve: "sp500" },
  { menuName: "Total US stock market", symbol: "VTI", sleeve: "total" },
  { menuName: "Large growth / Nasdaq", symbol: "QQQ", sleeve: "nasdaq" },
  { menuName: "Small-cap / Russell 2000", symbol: "IWM", sleeve: "small" },
  { menuName: "US aggregate bonds", symbol: "BND", sleeve: "conservative" },
];

export interface PlanInput {
  age: number;
  currentBalance: number;
  annualEmployee: number;
  salary: number;
  matchRatePct: number;
  matchOnSalaryPct: number;
  years: number;
  sleeve: SleeveId;
  liveYearReturnPct: Partial<Record<string, number | null>>;
}

export interface PlanResult {
  age: number;
  years: number;
  sleeve: Sleeve;
  stockPct: number;
  bondPct: number;
  longRunPct: number;
  lastYearPct: number | null;
  lastYearLabel: string;
  employee: ReturnType<typeof capEmployeeDeferral>;
  employerThisYear: number;
  fullMatchAt: number;
  matchLeftOnTable: number;
  additions: number;
  additionsOver: boolean;
  longRun: Projection;
  lastYearPath: Projection | null;
}

export function sleeveById(id: SleeveId): Sleeve {
  return SLEEVES.find((item) => item.id === id) ?? SLEEVES[0];
}

function live(map: PlanInput["liveYearReturnPct"], symbol: string): number | null {
  const value = map[symbol];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function blend(parts: Array<{ weight: number; value: number | null }>): number | null {
  let weight = 0;
  let sum = 0;
  for (const part of parts) {
    if (part.value === null) return null;
    weight += part.weight;
    sum += part.weight * part.value;
  }
  return weight === 0 ? null : sum / weight;
}

export function sleeveRates(
  sleeve: SleeveId,
  age: number,
  liveYearReturnPct: PlanInput["liveYearReturnPct"],
): { longRunPct: number; lastYearPct: number | null; lastYearLabel: string; stockPct: number; bondPct: number } {
  const mix = illustrativeMix(age);
  if (sleeve === "target") {
    const longRunPct = (mix.stockPct / 100) * 10 + (mix.bondPct / 100) * 4;
    const lastYearPct = blend([
      { weight: mix.stockPct, value: live(liveYearReturnPct, "VTI") },
      { weight: mix.bondPct, value: live(liveYearReturnPct, "BND") },
    ]);
    return {
      longRunPct,
      lastYearPct,
      lastYearLabel: `${mix.stockPct.toFixed(0)}/${mix.bondPct.toFixed(0)} VTI + BND, last 12 months`,
      stockPct: mix.stockPct,
      bondPct: mix.bondPct,
    };
  }
  if (sleeve === "balanced") {
    const lastYearPct = blend([
      { weight: 60, value: live(liveYearReturnPct, "SPY") },
      { weight: 40, value: live(liveYearReturnPct, "BND") },
    ]);
    return {
      longRunPct: 7,
      lastYearPct,
      lastYearLabel: "60/40 SPY + BND, last 12 months",
      stockPct: 60,
      bondPct: 40,
    };
  }

  const meta = sleeveById(sleeve);
  const lastYearPct = live(liveYearReturnPct, meta.boardSymbol);
  const stockPct = sleeve === "conservative" ? 0 : 100;
  return {
    longRunPct: meta.longRunPct,
    lastYearPct,
    lastYearLabel: `${meta.boardSymbol} last 12 months`,
    stockPct,
    bondPct: 100 - stockPct,
  };
}

export function buildPlan(input: PlanInput): PlanResult {
  const age = Number.isFinite(input.age) ? Math.min(100, Math.max(18, Math.round(input.age))) : 35;
  const years = Number.isFinite(input.years) ? Math.min(50, Math.max(0, Math.round(input.years))) : 0;
  const employee = capEmployeeDeferral(input.annualEmployee, age);
  const employerThisYear = employerMatch(
    input.salary,
    employee.capped,
    input.matchRatePct,
    input.matchOnSalaryPct,
  );
  const fullMatchAt = fullMatchContribution(input.salary, input.matchOnSalaryPct);
  const matchIfFull = employerMatch(input.salary, fullMatchAt, input.matchRatePct, input.matchOnSalaryPct);
  const matchLeftOnTable = Math.max(0, matchIfFull - employerThisYear);
  const catchUp = Math.max(0, employee.capped - K401_LIMITS_2026.electiveDeferral);
  const additions = employee.capped - catchUp + employerThisYear;
  const rates = sleeveRates(input.sleeve, age, input.liveYearReturnPct);
  const sleeve = sleeveById(input.sleeve);
  const shared = {
    currentBalance: Math.max(0, input.currentBalance),
    annualEmployee: employee.capped,
    annualEmployer: employerThisYear,
    years,
  };
  const longRun = projectBalance({ ...shared, annualReturnPct: rates.longRunPct });
  const lastYearPath =
    rates.lastYearPct === null
      ? null
      : projectBalance({ ...shared, annualReturnPct: rates.lastYearPct });

  return {
    age,
    years,
    sleeve,
    stockPct: rates.stockPct,
    bondPct: rates.bondPct,
    longRunPct: rates.longRunPct,
    lastYearPct: rates.lastYearPct,
    lastYearLabel: rates.lastYearLabel,
    employee,
    employerThisYear,
    fullMatchAt,
    matchLeftOnTable,
    additions,
    additionsOver: additions > K401_LIMITS_2026.annualAdditions,
    longRun,
    lastYearPath,
  };
}
