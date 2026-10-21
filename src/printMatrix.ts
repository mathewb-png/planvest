import { RAILS } from "./rails.ts";
import type { AccountKind, Capability } from "./types.ts";

const ACCOUNTS: AccountKind[] = ["hsa", "401k", "ira", "taxable"];

function cell(value: Capability): string {
  switch (value) {
    case "yes":
      return "yes";
    case "partner_only":
      return "partner";
    case "illegal_or_blocked":
      return "BLOCKED";
    default:
      return "no";
  }
}

function row(label: string, pick: (kind: AccountKind) => Capability): string {
  return [label.padEnd(34), ...ACCOUNTS.map((kind) => cell(pick(kind)).padEnd(8))].join(" ");
}

console.log("Planvest rail matrix (public/documented capability, not a license to use it)\n");
console.log(["rail".padEnd(34), ...ACCOUNTS.map((a) => a.padEnd(8))].join(" "));
console.log("-".repeat(70));

for (const rail of RAILS) {
  console.log(`\n${rail.name}  [${rail.accessModel}]`);
  console.log(row("  holdings", (k) => rail.holdings[k]));
  console.log(row("  trades", (k) => rail.trades[k]));
  console.log(row("  open account", (k) => rail.openAccount[k]));
}
