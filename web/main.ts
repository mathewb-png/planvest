import { MENU_BRIDGES, SLEEVES, buildPlan, type SleeveId } from "../src/k401Plan.ts";
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
const sleeveBox = document.querySelector("#k-sleeves");
const bridgeBody = document.querySelector("#bridge-body");
const form = document.querySelector("#k401-form");

const quotes = market.quotes as Quote[];
const candleMap = ((market as { candles?: Record<string, Candle[]> }).candles ?? {}) as Record<
  string,
  Candle[]
>;

const liveYearReturnPct: Partial<Record<string, number | null>> = Object.fromEntries(
  quotes.map((quote) => [quote.symbol, quote.yearReturnPct]),
);

let selected = firstChartable();
let kind: FilterKind = "all";
let sleeve: SleeveId = "sp500";

function firstChartable(): string {
  const preferred = ["SPY", "VTI", "AAPL", "SPX"];
  return preferred.find((symbol) => (candleMap[symbol] ?? []).length > 0) ?? quotes[0]?.symbol ?? "SPY";
}

function signedPct(n: number | null): string {
  if (n === null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function toneClass(n: number | null): string {
  if (n === null || n === 0) return "";
  return n > 0 ? "up" : "down";
}

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function numberInput(id: string, fallback: number): number {
  const el = document.querySelector<HTMLInputElement>(id);
  const value = el ? Number(el.value) : fallback;
  return Number.isFinite(value) ? value : fallback;
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
  for (const quote of quotes.filter((item) => item.kind === "index" || item.symbol === "TNX")) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const value = document.createElement("p");
    const delta = document.createElement("span");
    title.textContent = quote.name;
    value.textContent = formatPrice(quote);
    if (quote.kind !== "yield") {
      delta.textContent = signedPct(quote.changePct);
      delta.className = toneClass(quote.changePct);
      value.append(delta);
    }
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
    boardCount.textContent = `${rows.length} ${rows.length === 1 ? "name" : "names"} on the board. Click a row for candles.`;
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
  renderBridge();
}

function renderSleeves(): void {
  if (!sleeveBox) return;
  sleeveBox.replaceChildren();
  for (const item of SLEEVES) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "sleeve";
    input.value = item.id;
    input.checked = item.id === sleeve;
    input.addEventListener("change", () => {
      sleeve = item.id;
      selectSymbol(item.boardSymbol);
      renderSleeves();
      renderPlan();
    });
    label.append(input, document.createTextNode(item.label));
    sleeveBox.append(label);
  }
}

function renderBridge(): void {
  if (!bridgeBody) return;
  bridgeBody.replaceChildren();
  for (const bridge of MENU_BRIDGES) {
    const quote = quotes.find((item) => item.symbol === bridge.symbol);
    const row = document.createElement("tr");
    row.tabIndex = 0;
    if (selected === bridge.symbol) row.classList.add("selected");
    const menu = document.createElement("td");
    const ticker = document.createElement("td");
    const year = document.createElement("td");
    menu.textContent = bridge.menuName;
    ticker.textContent = bridge.symbol;
    year.textContent = signedPct(quote?.yearReturnPct ?? null);
    year.className = toneClass(quote?.yearReturnPct ?? null);
    row.append(menu, ticker, year);
    const open = () => {
      sleeve = bridge.sleeve;
      renderSleeves();
      selectSymbol(bridge.symbol);
      renderPlan();
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    bridgeBody.append(row);
  }
}

function setBreakdown(rows: Array<[string, string]>): void {
  const box = document.querySelector("#k-breakdown");
  if (!box) return;
  box.replaceChildren();
  for (const [label, value] of rows) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrap.append(dt, dd);
    box.append(wrap);
  }
}

function renderPlan(): void {
  const plan = buildPlan({
    age: numberInput("#k-age", 35),
    currentBalance: numberInput("#k-balance", 0),
    annualEmployee: numberInput("#k-employee", 0),
    salary: numberInput("#k-salary", 0),
    matchRatePct: numberInput("#k-match-rate", 50),
    matchOnSalaryPct: numberInput("#k-match-cap", 6),
    years: numberInput("#k-years", 30),
    sleeve,
    liveYearReturnPct,
  });

  const ending = document.querySelector("#k-ending");
  const sub = document.querySelector("#k-ending-sub");
  const lastYear = document.querySelector("#k-last-year");
  const warnings = document.querySelector("#k-warnings");
  const panel = document.querySelector("#k401-result");

  if (ending) ending.textContent = money(plan.longRun.endingBalance);
  if (sub) {
    sub.textContent =
      plan.years === 0
        ? "Set years above zero to illustrate compounding."
        : `If this sleeve compounds at ${plan.longRunPct.toFixed(1)}% a year for ${plan.years} years — long-run history, not a prediction. ${plan.sleeve.note}`;
  }

  setBreakdown([
    ["2026 employee room", `${money(plan.employee.capped)} of ${money(plan.employee.limit)}`],
    ["Employer match this year", money(plan.employerThisYear)],
    ["You deposit over the years", money(plan.longRun.totalEmployee)],
    ["Employer deposits over the years", money(plan.longRun.totalEmployer)],
    ["Illustrated market growth", money(plan.longRun.illustratedGrowth)],
    ["Monthly from you", money(plan.employee.capped / 12)],
  ]);

  const errors: string[] = [];
  const hints: string[] = [];
  if (plan.employee.overLimit) {
    errors.push(
      `The IRS 2026 employee limit at age ${plan.age} is ${money(plan.employee.limit)}. Extra above that is not counted.`,
    );
  }
  if (plan.additionsOver) {
    errors.push("Employee plus employer (excluding catch-up) is over the $72,000 annual-additions limit.");
  }
  if (plan.matchLeftOnTable > 0) {
    hints.push(
      `Contribute at least ${money(plan.fullMatchAt)} this year to collect the full match. ${money(plan.matchLeftOnTable)} of match is still on the table.`,
    );
  }
  if (warnings instanceof HTMLElement) {
    warnings.replaceChildren();
    const notes = [...errors, ...hints];
    warnings.hidden = notes.length === 0;
    warnings.classList.toggle("hints", errors.length === 0 && hints.length > 0);
    for (const note of notes) {
      const li = document.createElement("li");
      li.textContent = note;
      warnings.append(li);
    }
  }
  panel?.classList.toggle("ineligible", errors.length > 0);

  if (lastYear) {
    if (plan.lastYearPath && plan.lastYearPct !== null) {
      lastYear.textContent = `If every year looked like ${plan.lastYearLabel} (${signedPct(plan.lastYearPct)}), the same deposits would illustrate ${money(plan.lastYearPath.endingBalance)}. One year is not a plan.`;
    } else {
      lastYear.textContent = "Last-year live return for this sleeve is not on the board yet.";
    }
  }
}

function renderSleevesAndPlan(): void {
  renderSleeves();
  renderPlan();
}

renderStamp();
renderTape();
renderKindTabs();
filterInput?.addEventListener("input", renderTable);
form?.addEventListener("input", renderPlan);
renderTable();
renderSleevesAndPlan();
renderBridge();
selectSymbol(selected);
