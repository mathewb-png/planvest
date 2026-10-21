import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MSN_API_KEY,
  MSN_ASSETS,
  MSN_SUGGEST,
  candlesFromSeries,
  flattenMsn,
  summarizeEarnings,
  type EarningsSummary,
} from "../src/msn.ts";
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
  earnings: Record<string, EarningsSummary>;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HEADERS = {
  "User-Agent": "Planvest/0.1 (education; delayed quotes; no trading)",
  Accept: "application/json",
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: string, attempts = 3): Promise<unknown> {
  let last = "request failed";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: HEADERS });
    if (response.ok) return response.json();
    last = `HTTP ${response.status}`;
    if (response.status !== 503 && response.status !== 429) break;
    await sleep(250 * (attempt + 1));
  }
  throw new Error(last);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function resolveId(query: string): Promise<string | null> {
  const url = `${MSN_SUGGEST}?query=${encodeURIComponent(query)}&market=en-us&count=1`;
  const body = (await getJson(url)) as { data?: { stocks?: string[] } };
  const raw = body.data?.stocks?.[0];
  if (!raw) return null;
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as { SecId?: string; RT00S?: string }) : raw;
  return parsed.SecId ?? null;
}

function yearReturn(candles: Candle[]): number | null {
  const first = candles[0]?.close;
  const last = candles[candles.length - 1]?.close;
  if (typeof first !== "number" || first === 0 || typeof last !== "number") return null;
  return ((last - first) / first) * 100;
}

async function main(): Promise<void> {
  const ids = new Map<string, string>();
  const failures: string[] = [];

  for (const instrument of UNIVERSE) {
    try {
      const id = await resolveId(instrument.symbol);
      if (!id) throw new Error("no MSN SecId");
      ids.set(instrument.symbol, id);
    } catch (error) {
      failures.push(`${instrument.symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(60);
  }

  const resolved = UNIVERSE.filter((item) => ids.has(item.symbol));
  const quotes: Quote[] = [];
  const candles: Record<string, Candle[]> = {};
  const earnings: Record<string, EarningsSummary> = {};
  const idToSymbol = new Map([...ids.entries()].map(([symbol, id]) => [id, symbol]));

  for (const group of chunk(resolved, 20)) {
    const idList = group.map((item) => ids.get(item.symbol)).join(",");
    try {
      const rows = flattenMsn(
        await getJson(`${MSN_ASSETS}/Finance/Quotes?apikey=${MSN_API_KEY}&ids=${idList}&wrapodata=false`),
      );
      for (const row of rows) {
        const id = String(row.instrumentId ?? row.id ?? "");
        const symbol = idToSymbol.get(id);
        const instrument = resolved.find((item) => item.symbol === symbol);
        const price = row.price;
        if (!instrument || typeof price !== "number") continue;
        quotes.push({
          symbol: instrument.symbol,
          name: instrument.name,
          kind: instrument.kind,
          price,
          changePct: instrument.kind === "yield" ? null : typeof row.priceChangePercent === "number" ? row.priceChangePercent : null,
          yearReturnPct: null,
          currency: typeof row.currency === "string" ? row.currency : "USD",
        });
      }
    } catch (error) {
      failures.push(`quotes ${idList}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(80);
  }

  for (const group of chunk(resolved.filter((item) => item.kind !== "yield"), 12)) {
    const idList = group.map((item) => ids.get(item.symbol)).join(",");
    try {
      const rows = flattenMsn(
        await getJson(
          `${MSN_ASSETS}/Finance/Charts?apikey=${MSN_API_KEY}&ids=${idList}&type=1Y&wrapodata=false`,
        ),
      );
      for (const row of rows) {
        const id = String(row.instrumentId ?? "");
        const symbol = idToSymbol.get(id);
        if (!symbol || !row.series || typeof row.series !== "object") continue;
        const series = candlesFromSeries(row.series as Parameters<typeof candlesFromSeries>[0]);
        if (series.length === 0) continue;
        candles[symbol] = series;
        const quote = quotes.find((item) => item.symbol === symbol);
        if (quote) quote.yearReturnPct = yearReturn(series);
      }
    } catch (error) {
      failures.push(`charts ${idList}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(80);
  }

  for (const group of chunk(resolved.filter((item) => item.kind === "stock"), 12)) {
    const idList = group.map((item) => ids.get(item.symbol)).join(",");
    try {
      const rows = flattenMsn(
        await getJson(`${MSN_ASSETS}/Finance/Events/Earnings?apikey=${MSN_API_KEY}&ids=${idList}&wrapodata=false`),
      );
      for (const row of rows) {
        const symbol = idToSymbol.get(String(row.InstrumentId ?? row.instrumentId ?? "")) ?? String(row.Symbol ?? "");
        const instrument = resolved.find((item) => item.symbol === symbol);
        if (!instrument) continue;
        earnings[instrument.symbol] = summarizeEarnings(
          instrument.symbol,
          instrument.name,
          row as Parameters<typeof summarizeEarnings>[2],
        );
      }
    } catch (error) {
      failures.push(`earnings ${idList}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(80);
  }

  if (quotes.length < UNIVERSE.length / 2) {
    throw new Error(`Too many MSN failures:\n${failures.join("\n")}`);
  }

  const file: MarketFile = {
    fetchedAt: new Date().toISOString(),
    source: "MSN Finance Quotes, Charts (1Y), and Events/Earnings. Public MSN Money client key. Delayed. Not a broker.",
    disclaimer: "Public delayed quotes and earnings-call dates for reading. Planvest does not place trades.",
    quotes,
    candles,
    earnings,
  };

  const out = join(ROOT, "web", "market.json");
  await writeFile(out, `${JSON.stringify(file)}\n`, "utf8");
  console.log(
    `Wrote ${out} (${quotes.length} quotes, ${Object.keys(candles).length} candle series, ${Object.keys(earnings).length} earnings)`,
  );
  if (failures.length > 0) {
    console.warn(`Skipped ${failures.length}: ${failures.join("; ")}`);
  }
}

await main();
