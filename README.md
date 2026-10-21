# Planvest

A compliance-first toolkit for HSA and 401(k) investing. The product is **not** wired to a generic market API. Existing HSA and employer 401(k) dollars already have a legal custodian; trades have to go through that custodian, or the money has to move to a new qualified one.

This repository exists so Planvest cannot accidentally "connect to the market" on the wrong rails.

## The finding

There is **no legitimate public API** that takes a user's current HSA or workplace 401(k) and places stock/ETF orders at an exchange.

| What people try | What actually happens |
| --- | --- |
| Alpaca, IBKR, Tradier, Polygon | Real market APIs for the **wrong account type**. They do not hold HSA trusts or ERISA plan assets. |
| Plaid / SnapTrade Fidelity | Legitimate **read-only** OAuth. Fidelity, Empower, Schwab, TIAA, Vanguard workplace links do not trade. |
| DriveWealth `HSA_*` account types | Legitimate **new** HSA investing sleeve — contract-gated, and still needs an IRS-qualified trustee for the cash HSA and Forms 5498-SA / 1099-SA. |
| First Dollar, Alegeus, Devenir | Legitimate **B2B** HSA administrator stacks, not a retail "link my Fidelity HSA" API. |
| Fidelity WorkplaceXchange / Empower DC | Sponsor and payroll APIs. Balances yes, participant trading no. |
| Store NetBenefits passwords (Pontera pattern) | Not an API. Fidelity is blocking it. WA/MO regulators have called credential sharing unethical. |

Full gap table: [docs/API_GAPS.md](docs/API_GAPS.md). Architecture: [docs/PRODUCT_ARCHITECTURE.md](docs/PRODUCT_ARCHITECTURE.md). Licenses: [docs/COMPLIANCE.md](docs/COMPLIANCE.md). **Not legal advice:** [docs/LEGAL_DISCLAIMER.md](docs/LEGAL_DISCLAIMER.md).

## What ships today

- A rail catalog (`src/rails.ts`) of real vendors and what they can actually do per account type.
- A hard gate (`src/gates.ts`) that throws before any vendor call unless the matching trustee / RIA / BD / partner flags are on.
- 2026 IRS HSA contribution math (`src/hsaLimits.ts`): $4,400 / $8,750 + $1,000 catch-up.

```ts
import { assertActionAllowed } from "./src/index.ts";

// Always throws: Alpaca is not an HSA custodian.
assertActionAllowed("alpaca", "hsa", "place_trade");

// Allowed: read-only OAuth.
assertActionAllowed("plaid_investments", "401k", "read_holdings");
```

## Run

Requires Node 22+.

```bash
npm test
npm run matrix
```

## GitHub

Private repo. Do not commit `.env`. Partner keys go in only after a signed custody agreement.
