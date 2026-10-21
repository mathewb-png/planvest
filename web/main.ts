import { HSA_LIMITS_2026, remainingHsaRoom, type Coverage } from "../src/hsaLimits.ts";

const form = document.querySelector<HTMLFormElement>("#hsa-form");
const kicker = document.querySelector("#result-kicker");
const valueEl = document.querySelector("#result-value");
const subEl = document.querySelector("#result-sub");
const reasonsEl = document.querySelector("#reasons");
const resultPanel = document.querySelector(".result");

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
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

function render(): void {
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
}

form?.addEventListener("input", render);
form?.addEventListener("change", render);
render();
