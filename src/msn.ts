import type { Candle } from "./sma.ts";

export const MSN_API_KEY = "0QfOX3Vn51YCzitbLaRkTTBadtWpgTN8NZLW0C1SEM";
export const MSN_ASSETS = "https://assets.msn.com/service";
export const MSN_SUGGEST =
  "https://services.bingapis.com/contentservices-finance.csautosuggest/api/v1/Query";

export interface EarningsCall {
  symbol: string;
  name: string;
  date: string;
  period: string;
  timeslot: string | null;
  epsForecast: number | null;
  epsActual: number | null;
  epsSurprisePct: number | null;
  revenueForecast: number | null;
  revenueActual: number | null;
  status: "upcoming" | "reported";
}

export interface EarningsSummary {
  next: EarningsCall | null;
  last: EarningsCall | null;
}

export interface RawEarningsPeriod {
  EpsActual?: number;
  EpsForecast?: number;
  EpsSurprisePercent?: number;
  RevenueActual?: number;
  RevenueForecast?: number;
  EarningReleaseDate?: string;
  CalendarPeriodType?: string;
  CiqFiscalPeriodType?: string;
}

export interface RawEarnings {
  DisplayName?: string;
  Symbol?: string;
  ExpectedReportDate?: string;
  Timeslot?: number | string;
  LastActual?: RawEarningsPeriod;
  LastActualFiscalPeriod?: string;
  Forecast?: { quarterly?: Record<string, RawEarningsPeriod> };
}

export function flattenMsn(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.flat(3).filter((item): item is Record<string, unknown> => {
      return Boolean(item) && typeof item === "object" && !Array.isArray(item);
    });
  }
  if (data && typeof data === "object") return [data as Record<string, unknown>];
  return [];
}

export function timeslotLabel(code: unknown): string | null {
  if (code === 10 || code === "10") return "Before open";
  if (code === 40 || code === "40") return "After close";
  return null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function periodLabel(period: RawEarningsPeriod | undefined, fallback: string): string {
  return period?.CalendarPeriodType ?? period?.CiqFiscalPeriodType ?? fallback;
}

export function candlesFromSeries(series: {
  openPrices?: Array<number | null>;
  prices?: Array<number | null>;
  pricesHigh?: Array<number | null>;
  pricesLow?: Array<number | null>;
  timeStamps?: string[];
}): Candle[] {
  const times = series.timeStamps ?? [];
  const candles: Candle[] = [];
  times.forEach((stamp, index) => {
    const open = series.openPrices?.[index];
    const high = series.pricesHigh?.[index];
    const low = series.pricesLow?.[index];
    const close = series.prices?.[index];
    if ([open, high, low, close].some((value) => typeof value !== "number")) return;
    candles.push({
      time: stamp.slice(0, 10),
      open: Math.round((open as number) * 100) / 100,
      high: Math.round((high as number) * 100) / 100,
      low: Math.round((low as number) * 100) / 100,
      close: Math.round((close as number) * 100) / 100,
    });
  });
  return candles;
}

export function summarizeEarnings(
  symbol: string,
  name: string,
  raw: RawEarnings,
  now = new Date(),
): EarningsSummary {
  const lastPeriod = raw.LastActual;
  const last: EarningsCall | null =
    lastPeriod?.EarningReleaseDate
      ? {
          symbol,
          name,
          date: lastPeriod.EarningReleaseDate,
          period: periodLabel(lastPeriod, raw.LastActualFiscalPeriod ?? "Last"),
          timeslot: timeslotLabel(raw.Timeslot),
          epsForecast: num(lastPeriod.EpsForecast),
          epsActual: num(lastPeriod.EpsActual),
          epsSurprisePct: num(lastPeriod.EpsSurprisePercent),
          revenueForecast: num(lastPeriod.RevenueForecast),
          revenueActual: num(lastPeriod.RevenueActual),
          status: "reported",
        }
      : null;

  const upcoming = Object.values(raw.Forecast?.quarterly ?? {})
    .filter((period) => period.EarningReleaseDate && new Date(period.EarningReleaseDate) >= now)
    .sort(
      (left, right) =>
        Date.parse(left.EarningReleaseDate ?? "") - Date.parse(right.EarningReleaseDate ?? ""),
    )[0];

  const nextDate = upcoming?.EarningReleaseDate ?? raw.ExpectedReportDate ?? null;
  const next: EarningsCall | null =
    nextDate && new Date(nextDate) >= now
      ? {
          symbol,
          name,
          date: nextDate,
          period: periodLabel(upcoming, "Next"),
          timeslot: timeslotLabel(raw.Timeslot),
          epsForecast: num(upcoming?.EpsForecast),
          epsActual: null,
          epsSurprisePct: null,
          revenueForecast: num(upcoming?.RevenueForecast),
          revenueActual: null,
          status: "upcoming",
        }
      : null;

  return { next, last };
}
