# Product architecture: stay on real rails

The instinct to "connect this app to a market API" is the wrong model for HSA and 401(k) money. Those dollars already have a legal home. Trades have to go through that home, or the money has to be moved to a new qualified home with the user's authorization.

```
User
  │
  ├─ Read-only view ── Plaid Investments / SnapTrade OAuth (FDX)
  │                     holdings, balances, transactions
  │                     NO orders
  │
  ├─ New HSA product ── IRS-qualified trustee (cash HSA, 5498-SA, 1099-SA)
  │                         │
  │                         └─ investing sleeve ── DriveWealth HSA_*  or  Devenir  or  Schwab HSBA
  │
  └─ 401(k) ── NOT a market API
                ├─ advice-only: user places trades at the recordkeeper
                ├─ employer channel: Planvest is appointed inside the plan
                └─ self-employed / solo 401(k): qualified custodian partnership
```

## What we will not build

- Linking Alpaca, Interactive Brokers, Tradier, or generic market-data APIs to an existing HSA or 401(k)
- Storing NetBenefits / Empower / HealthEquity passwords to place trades (the Pontera pattern). Fidelity is blocking it; state regulators have flagged it
- Filing Forms 5498-SA or 1099-SA ourselves
- Opening an "HSA brokerage account" that is not nested under a qualified trustee
- Rolling a 401(k) out of an employer plan just so we can trade it, unless the plan actually allows an in-service distribution and the advice meets PTE 2020-02 / Advisers Act duties

## Phased product (enforced in `src/gates.ts`)

| Phase | User-facing | Allowed rails | Blocked until |
| --- | --- | --- | --- |
| 0 | Eligibility + 2026 HSA contribution room | none | any account connection |
| 1 | Read-only household view | Plaid, SnapTrade workplace OAuth | any `place_trade` |
| 2 | New HSA with investing sleeve | First Dollar or trustee + DriveWealth | signed trustee + BD/RIA contracts |
| 3 | 401(k) coaching | read-only + user-executed instructions | ERISA appointment if we are paid for 401(k) advice |
| 4 | Discretionary management | DriveWealth `HSA_RIA_MANAGED` and/or a 3(38) plan appointment | RIA, custody rule, Form ADV, CCO program |

Existing employer HSAs and 401(k)s are **held-away**. The legitimate options are transfer (HSA trustee-to-trustee), advice the user executes, or a plan-level partnership. There is no third option that is both public and legal.
