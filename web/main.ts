import type { Candle } from "../src/sma.ts";
import type { AssetKind } from "../src/universe.ts";
import { mountCandleChart } from "./chart.ts";
import market from "./market.json";

interface Quote {
  symbol: string;
  name: string;
  kind: AssetKind;
  price: number;
  changePct: number | null;
  yearReturnPct: number | null;
}

type FilterKind = "all" | "stock" | "etf" | "index";

const tape = document.querySelector("#index-tape");
const quoteBody = document.querySelector("#quote-body");
const stamp = document.querySelector("#market-stamp");
const chartFrame = document.querySelector("#candle-chart");
const chartTitle = document.querySelector("#chart-title");
const filterInput = document.querySelector<HTMLInputElement>("#stock-filter");
const kindTabs = document.querySelector("#kind-tabs");
const boardCount = document.querySelector("#board-count");

const quotes = market.quotes as Quote[];
const candleMap = ((market as { candles?: Record<string, Candle[]> }).candles ?? {}) as Record<
  string,
  Candle[]
>;

let selected = firstChartable();
let kind: FilterKind = "all";

function firstChartable(): string {
  const preferred = ["AAPL", "SPY", "NVDA", "SPX"];
  return preferred.find((symbol) => (candleMap[symbol] ?? []).length > 0) ?? quotes[0]?.symbol ?? "AAPL";
}

function signedPct(n: number | null): string {
  if (n === null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function toneClass(n: number | null): string {
  if (n === null || n === 0) return "";
  return n > 0 ? "up" : "down";
}

function formatPrice(quote: Quote): string {
  if (quote.kind === "yield") return `${quote.price.toFixed(2)}%`;
  return quote.price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function visibleQuotes(): Quote[] {
  const query = (filterInput?.value ?? "").trim().toLowerCase();
  return quotes.filter((quote) => {
    if (quote.kind === "yield") return false;
    if (kind !== "all" && quote.kind !== kind) return false;
    if (!query) return true;
    return quote.symbol.toLowerCase().includes(query) || quote.name.toLowerCase().includes(query);
  });
}

function renderStamp(): void {
  if (!stamp) return;
  const when = new Date(market.fetchedAt);
  stamp.textContent = `As of ${when.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })} · delayed`;
}

function renderTape(): void {
  if (!tape) return;
  tape.replaceChildren();
  for (const quote of quotes.filter((item) => item.kind === "index")) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const value = document.createElement("p");
    const delta = document.createElement("span");
    title.textContent = quote.name;
    value.textContent = formatPrice(quote);
    delta.textContent = signedPct(quote.changePct);
    delta.className = toneClass(quote.changePct);
    value.append(delta);
    card.append(title, value);
    tape.append(card);
  }
}

function renderKindTabs(): void {
  if (!kindTabs) return;
  kindTabs.replaceChildren();
  const tabs: Array<[FilterKind, string]> = [
    ["all", "All"],
    ["stock", "Stocks"],
    ["etf", "ETFs"],
    ["index", "Indexes"],
  ];
  for (const [id, label] of tabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", id === kind ? "true" : "false");
    button.addEventListener("click", () => {
      kind = id;
      renderKindTabs();
      renderTable();
    });
    kindTabs.append(button);
  }
}

function renderTable(): void {
  if (!quoteBody) return;
  const rows = visibleQuotes();
  quoteBody.replaceChildren();
  for (const quote of rows) {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.dataset.symbol = quote.symbol;
    if (quote.symbol === selected) row.classList.add("selected");
    const cells = [
      quote.symbol,
      quote.name,
      formatPrice(quote),
      signedPct(quote.changePct),
      signedPct(quote.yearReturnPct),
    ];
    const classes = ["", "", "", toneClass(quote.changePct), toneClass(quote.yearReturnPct)];
    cells.forEach((text, index) => {
      const td = document.createElement("td");
      td.textContent = text;
      if (classes[index]) td.className = classes[index];
      row.append(td);
    });
    row.addEventListener("click", () => selectSymbol(quote.symbol));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSymbol(quote.symbol);
      }
    });
    quoteBody.append(row);
  }
  if (boardCount) {
    boardCount.textContent = `${rows.length} names on the board. Click a row for candles.`;
  }
}

function selectSymbol(symbol: string): void {
  const series = candleMap[symbol] ?? [];
  if (series.length === 0 || !(chartFrame instanceof HTMLElement)) return;
  selected = symbol;
  const quote = quotes.find((item) => item.symbol === symbol);
  if (chartTitle) {
    chartTitle.textContent = `${symbol}${quote ? ` · ${quote.name}` : ""} · 1-year daily candles`;
  }
  mountCandleChart(chartFrame, series);
  renderTable();
}

renderStamp();
renderTape();
renderKindTabs();
filterInput?.addEventListener("input", renderTable);
renderTable();
selectSymbol(selected);
