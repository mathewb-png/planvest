import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Candle } from "../src/sma.ts";

interface Instrument {
  symbol: string;
  yahoo: string;
  name: string;
  role: string;
  kind: "index" | "etf" | "yield";
  candles: boolean;
}

export interface Quote {
  symbol: string;
  name: string;
  role: string;
  kind: Instrument["kind"];
  price: number;
  changePct: number | null;
  yearReturnPct: number | null;
  currency: string;
}

export interface MarketFile {
  fetchedAt: string;
  source: string;
  disclaimer: string;
  quotes: Quote[];
  candles: Record<string, Candle[]>;
}

const INSTRUMENTS: Instrument[] = [
  { symbol: "SPX", yahoo: "^GSPC", name: "S&P 500", role: "US large-cap stocks", kind: "index", candles: true },
  { symbol: "NDX", yahoo: "^IXIC", name: "Nasdaq Composite", role: "US growth-heavy stocks", kind: "index", candles: false },
  { symbol: "TNX", yahoo: "^TNX", name: "10-year Treasury", role: "US interest rates", kind: "yield", candles: false },
  { symbol: "VTI", yahoo: "VTI", name: "Vanguard Total Stock Market", role: "US stocks sleeve", kind: "etf", candles: true },
  { symbol: "VXUS", yahoo: "VXUS", name: "Vanguard Total International", role: "International stocks sleeve", kind: "etf", candles: true },
  { symbol: "BND", yahoo: "BND", name: "Vanguard Total Bond Market", role: "US bonds sleeve", kind: "etf", candles: true },
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function sessionDate(timestamp: number, gmtOffset: number): string {
  const shifted = new Date((timestamp + gmtOffset) * 1000);
  return shifted.toISOString().slice(0, 10);
}

async function chart(yahoo: string): Promise<{
  price: number;
  previousClose: number | null;
  yearReturnPct: number | null;
  currency: string;
  candles: Candle[];
}> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?range=1y&interval=1d`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Planvest/0.1 (education; delayed quotes; no trading)",
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${yahoo} HTTP ${response.status}`);
  }
  const body = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          currency?: string;
          gmtoffset?: number;
        };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            close?: Array<number | null>;
          }>;
          adjclose?: Array<{ adjclose?: Array<number | null> }>;
        };
      }>;
    };
  };
  const result = body.chart?.result?.[0];
  const price = result?.meta?.regularMarketPrice;
  if (typeof price !== "number") {
    throw new Error(`${yahoo} missing regularMarketPrice`);
  }
  const offset = result?.meta?.gmtoffset ?? 0;
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const candles: Candle[] = [];
  timestamps.forEach((stamp, index) => {
    const open = quote?.open?.[index];
    const high = quote?.high?.[index];
    const low = quote?.low?.[index];
    const close = quote?.close?.[index];
    if ([open, high, low, close].some((value) => typeof value !== "number")) return;
    candles.push({
      time: sessionDate(stamp, offset),
      open: open as number,
      high: high as number,
      low: low as number,
      close: close as number,
    });
  });
  const closes = candles.map((candle) => candle.close);
  const first = closes[0];
  const previousClose = closes.length >= 2 ? closes[closes.length - 2] : null;
  const last = closes[closes.length - 1];
  const yearReturnPct =
    typeof first === "number" && first !== 0 && typeof last === "number"
      ? ((last - first) / first) * 100
      : null;
  return {
    price,
    previousClose,
    yearReturnPct,
    currency: result?.meta?.currency ?? "USD",
    candles,
  };
}

function changePct(price: number, previousClose: number | null): number | null {
  if (previousClose === null || previousClose === 0) return null;
  return ((price - previousClose) / previousClose) * 100;
}

async function main(): Promise<void> {
  const quotes: Quote[] = [];
  const candles: Record<string, Candle[]> = {};
  for (const instrument of INSTRUMENTS) {
    const data = await chart(instrument.yahoo);
    quotes.push({
      symbol: instrument.symbol,
      name: instrument.name,
      role: instrument.role,
      kind: instrument.kind,
      price: data.price,
      changePct: changePct(data.price, data.previousClose),
      yearReturnPct: instrument.kind === "yield" ? null : data.yearReturnPct,
      currency: data.currency,
    });
    if (instrument.candles) {
      candles[instrument.symbol] = data.candles;
    }
  }

  const file: MarketFile = {
    fetchedAt: new Date().toISOString(),
    source: "Yahoo Finance v8 chart API, delayed daily OHLC. Not a brokerage feed, not SIP-complete, and not a forecast.",
    disclaimer:
      "Quotes and candles are history. Planvest does not predict the next bar and cannot trade an HSA or 401(k).",
    quotes,
    candles,
  };

  const out = join(ROOT, "web", "market.json");
  await writeFile(out, `${JSON.stringify(file)}\n`, "utf8");
  console.log(`Wrote ${out} (${quotes.length} quotes, ${Object.keys(candles).length} candle series)`);
}

await main();
