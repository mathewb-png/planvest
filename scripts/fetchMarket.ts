import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface Instrument {
  symbol: string;
  yahoo: string;
  name: string;
  role: string;
  kind: "index" | "etf" | "yield";
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
}

const INSTRUMENTS: Instrument[] = [
  { symbol: "SPX", yahoo: "^GSPC", name: "S&P 500", role: "US large-cap stocks", kind: "index" },
  { symbol: "NDX", yahoo: "^IXIC", name: "Nasdaq Composite", role: "US growth-heavy stocks", kind: "index" },
  { symbol: "TNX", yahoo: "^TNX", name: "10-year Treasury", role: "US interest rates", kind: "yield" },
  { symbol: "VTI", yahoo: "VTI", name: "Vanguard Total Stock Market", role: "US stocks sleeve", kind: "etf" },
  { symbol: "VXUS", yahoo: "VXUS", name: "Vanguard Total International", role: "International stocks sleeve", kind: "etf" },
  { symbol: "BND", yahoo: "BND", name: "Vanguard Total Bond Market", role: "US bonds sleeve", kind: "etf" },
];

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function chart(yahoo: string): Promise<{
  price: number;
  previousClose: number | null;
  yearReturnPct: number | null;
  currency: string;
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
          chartPreviousClose?: number;
          currency?: string;
        };
        indicators?: { adjclose?: Array<{ adjclose?: Array<number | null> }> };
      }>;
      error?: unknown;
    };
  };
  const result = body.chart?.result?.[0];
  const price = result?.meta?.regularMarketPrice;
  if (typeof price !== "number") {
    throw new Error(`${yahoo} missing regularMarketPrice`);
  }
  const closes = (result?.indicators?.adjclose?.[0]?.adjclose ?? []).filter(
    (value): value is number => typeof value === "number",
  );
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
  };
}

function changePct(price: number, previousClose: number | null): number | null {
  if (previousClose === null || previousClose === 0) return null;
  return ((price - previousClose) / previousClose) * 100;
}

async function main(): Promise<void> {
  const quotes: Quote[] = [];
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
  }

  const file: MarketFile = {
    fetchedAt: new Date().toISOString(),
    source: "Yahoo Finance v8 chart API, delayed. Not a brokerage feed and not SIP-complete.",
    disclaimer:
      "Quotes are for education. Planvest does not recommend these securities and cannot trade an HSA or 401(k).",
    quotes,
  };

  const out = join(ROOT, "web", "market.json");
  await writeFile(out, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  console.log(`Wrote ${out} (${quotes.length} quotes)`);
}

await main();
