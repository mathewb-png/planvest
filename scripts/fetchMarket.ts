import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Candle } from "../src/sma.ts";
import { UNIVERSE, type AssetKind } from "../src/universe.ts";

export interface Quote {
  symbol: string;
  name: string;
  kind: AssetKind;
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HEADERS = {
  "User-Agent": "Planvest/0.1 (education; delayed quotes; no trading)",
  Accept: "application/json",
};

function sessionDate(timestamp: number, gmtOffset: number): string {
  return new Date((timestamp + gmtOffset) * 1000).toISOString().slice(0, 10);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function chart(yahoo: string): Promise<{
  price: number;
  previousClose: number | null;
  yearReturnPct: number | null;
  currency: string;
  candles: Candle[];
}> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?range=1y&interval=1d`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${yahoo} HTTP ${response.status}`);
  }
  const body = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: { regularMarketPrice?: number; currency?: string; gmtoffset?: number };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            close?: Array<number | null>;
          }>;
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
      open: round(open as number),
      high: round(high as number),
      low: round(low as number),
      close: round(close as number),
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
  const failures: string[] = [];

  for (const instrument of UNIVERSE) {
    try {
      const data = await chart(instrument.yahoo);
      quotes.push({
        symbol: instrument.symbol,
        name: instrument.name,
        kind: instrument.kind,
        price: data.price,
        changePct: instrument.kind === "yield" ? null : changePct(data.price, data.previousClose),
        yearReturnPct: instrument.kind === "yield" ? null : data.yearReturnPct,
        currency: data.currency,
      });
      if (instrument.kind !== "yield") {
        candles[instrument.symbol] = data.candles;
      }
    } catch (error) {
      failures.push(`${instrument.symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(80);
  }

  if (quotes.length < UNIVERSE.length / 2) {
    throw new Error(`Too many Yahoo failures:\n${failures.join("\n")}`);
  }

  const file: MarketFile = {
    fetchedAt: new Date().toISOString(),
    source: "Yahoo Finance v8 chart API. Delayed daily OHLC. Not SIP, not a broker, not a forecast.",
    disclaimer: "Public delayed quotes for reading. Planvest does not place trades.",
    quotes,
    candles,
  };

  const out = join(ROOT, "web", "market.json");
  await writeFile(out, `${JSON.stringify(file)}\n`, "utf8");
  console.log(`Wrote ${out} (${quotes.length} quotes, ${Object.keys(candles).length} candle series)`);
  if (failures.length > 0) {
    console.warn(`Skipped ${failures.length}: ${failures.join("; ")}`);
  }
}

await main();
