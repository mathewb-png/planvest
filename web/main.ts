import { illustrativeMix, splitDollars } from "../src/allocation.ts";
import { HSA_LIMITS_2026, remainingHsaRoom, type Coverage } from "../src/hsaLimits.ts";
import market from "./market.json";

interface Quote {
  symbol: string;
  name: string;
  role: string;
  kind: "index" | "etf" | "yield";
  price: number;
  changePct: number | null;
  yearReturnPct: number | null;
}

const form = document.querySelector<HTMLFormElement>("#hsa-form");
const kicker = document.querySelector("#result-kicker");
const valueEl = document.querySelector("#result-value");
const subEl = document.querySelector("#result-sub");
const reasonsEl = document.querySelector("#reasons");
const resultPanel = document.querySelector(".result");
const mixBox = document.querySelector("#mix");
const mixSub = document.querySelector("#mix-sub");
const mixLines = document.querySelector("#mix-lines");
const tape = document.querySelector("#index-tape");
const quoteBody = document.querySelector("#quote-body");
const stamp = document.querySelector("#market-stamp");

function money(n: number, digits = 0): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function signedPct(n: number | null): string {
  if (n === null) return "—";
  const prefix = n > 0 ? "+" : "";
  return `${prefix}${n.toFixed(2)}%`;
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

function readForm(): {
  coverage: Coverage;
  ageAtYearEnd: number;
  hasQualifyingHdhp: boolean;
  enrolledInMedicare: boolean;
  isSomeoneElseDependent: boolean;
  employerContributions: number;
  otherHsaContributions: number;
} {
  const data = new FormData(form ?? undefined);
  const coverage = data.get("coverage") === "family" ? "family" : "self";
  return {
    coverage,
    ageAtYearEnd: Number(data.get("age") || 0),
    hasQualifyingHdhp: Boolean(data.get("hdhp")),
    enrolledInMedicare: Boolean(data.get("medicare")),
    isSomeoneElseDependent: Boolean(data.get("dependent")),
    employerContributions: Number(data.get("employer") || 0),
    otherHsaContributions: Number(data.get("other") || 0),
  };
}

function renderMix(age: number, remaining: number, eligible: boolean): void {
  if (!mixBox || !mixSub || !mixLines) return;
  if (!eligible || remaining <= 0) {
    mixBox.hidden = true;
    return;
  }

  const mix = illustrativeMix(age);
  const dollars = splitDollars(remaining, mix);
  mixBox.hidden = false;
  mixSub.textContent = `Age ${age}: ${mix.stockPct.toFixed(0)}% stocks / ${mix.bondPct.toFixed(0)}% bonds. Illustration only — execute at your HSA or 401(k) provider.`;
  mixLines.replaceChildren();
  const rows: Array<[string, number, number]> = [
    ["US stocks (VTI stand-in)", mix.usStockPct, dollars.usStocks],
    ["International stocks (VXUS stand-in)", mix.intlStockPct, dollars.intlStocks],
    ["US bonds (BND stand-in)", mix.bondPct, dollars.bonds],
  ];
  for (const [label, pct, amount] of rows) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = `${label} · ${pct.toFixed(0)}%`;
    dd.textContent = money(amount);
    wrap.append(dt, dd);
    mixLines.append(wrap);
  }
}

function renderCalculator(): void {
  if (!form || !kicker || !valueEl || !subEl || !reasonsEl || !resultPanel) return;

  const input = readForm();
  const result = remainingHsaRoom({ taxYear: 2026, ...input });
  const base =
    input.coverage === "family" ? HSA_LIMITS_2026.contributionFamily : HSA_LIMITS_2026.contributionSelf;
  const catchUp = input.ageAtYearEnd >= 55 ? HSA_LIMITS_2026.catchUpAge55 : 0;

  valueEl.textContent = money(result.maxEmployeeContribution);
  resultPanel.classList.toggle("ineligible", !result.eligible);

  if (!result.eligible) {
    kicker.textContent = "Not eligible to contribute";
    subEl.textContent = "Contribution room is $0 until the eligibility issues below are resolved.";
  } else {
    kicker.textContent = "Remaining employee room";
    subEl.textContent = `Statutory ceiling ${money(base + catchUp)} · ${input.coverage === "family" ? "family" : "self-only"} · ${
      catchUp ? "includes $1,000 catch-up" : "age under 55"
    }`;
  }

  reasonsEl.replaceChildren();
  if (result.reasons.length > 0) {
    reasonsEl.hidden = false;
    for (const reason of result.reasons) {
      const item = document.createElement("li");
      item.textContent = reason;
      reasonsEl.append(item);
    }
  } else {
    reasonsEl.hidden = true;
  }

  renderMix(input.ageAtYearEnd, result.maxEmployeeContribution, result.eligible);
}

function renderMarket(): void {
  const quotes = market.quotes as Quote[];
  if (stamp) {
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

  if (tape) {
    tape.replaceChildren();
    for (const quote of quotes.filter((item) => item.kind !== "etf")) {
      const card = document.createElement("article");
      const title = document.createElement("h3");
      const value = document.createElement("p");
      const delta = document.createElement("span");
      title.textContent = quote.name;
      value.textContent = formatPrice(quote);
      delta.textContent = quote.kind === "yield" ? "yield" : signedPct(quote.changePct);
      delta.className = quote.kind === "yield" ? "" : toneClass(quote.changePct);
      value.append(delta);
      card.append(title, value);
      tape.append(card);
    }
  }

  if (quoteBody) {
    quoteBody.replaceChildren();
    for (const quote of quotes.filter((item) => item.kind === "etf")) {
      const row = document.createElement("tr");
      const day = signedPct(quote.changePct);
      const year = signedPct(quote.yearReturnPct);
      row.innerHTML = "";
      const cells = [quote.role, `${quote.symbol} · ${quote.name}`, formatPrice(quote), day, year];
      const classes = ["", "", "", toneClass(quote.changePct), toneClass(quote.yearReturnPct)];
      cells.forEach((text, index) => {
        const td = document.createElement("td");
        td.textContent = text;
        if (classes[index]) td.className = classes[index];
        row.append(td);
      });
      quoteBody.append(row);
    }
  }
}

form?.addEventListener("input", renderCalculator);
form?.addEventListener("change", renderCalculator);
renderMarket();
renderCalculator();
