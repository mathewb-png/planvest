# Gaps that keep Planvest from being a legitimate HSA / 401(k) market product

**Bottom line:** there is no public API you can call to "connect an existing HSA or employer 401(k) to the market." Legitimate investing happens only on rails that already have a qualified custodian (HSA) or a recordkeeper plus plan-sponsor authority (401(k)). The code in `src/gates.ts` refuses every other path.

Severity: **blocker** = cannot ship investing; **high** = cannot ship that account type; **medium** = can ship a narrower product if handled.

| ID | Severity | Domain | Gap | What "legit" looks like |
| --- | --- | --- | --- | --- |
| G01 | blocker | HSA | No IRS-qualified HSA trustee/custodian. A brokerage account is not an HSA. | Bank, insurer, or IRS-approved nonbank trustee. Pub. 969. |
| G02 | blocker | Licensing | No RIA and no broker-dealer / introducing-broker agreement. Recommending or placing trades is regulated. | Form ADV + CRS, or FINRA BD / IB to DriveWealth (or similar). |
| G03 | blocker | Market APIs | Alpaca, IBKR, Tradier, Polygon, IEX, and SnapTrade *retail* trading do not custody HSA trusts or ERISA plan assets. | Do not wire those APIs to HSA/401(k) balances. |
| G04 | blocker | 401(k) | Employer 401(k) assets are plan assets. There is no public consumer trade-execution API. | Advice the user executes, a 3(21)/3(38) appointment inside the plan, or become a recordkeeper. |
| G05 | blocker | 401(k) | Credential-sharing "held-away" trading (Pontera pattern) is being blocked by Fidelity and flagged by WA/MO regulators. | Never store NetBenefits/Empower passwords. OAuth/FDX read-only only. |
| G06 | blocker | 401(k) | Fidelity WorkplaceXchange and Empower DC APIs are sponsor/payroll/balance tools, not participant trading APIs. | Signed recordkeeper + plan-sponsor relationship. Fidelity WI Balances is inquiry, not orders. |
| G07 | high | HSA | DriveWealth `HSA_SELF` / `HSA_ADVISORY` / `HSA_RIA_MANAGED` exist but are contract-gated. Public retirement docs cover IRA 1099-R, not HSA 5498-SA. | Signed DW partner agreement plus a trustee that actually files HSA tax forms. |
| G08 | high | HSA | First Dollar, Alegeus, Devenir are B2B administrator platforms. | Be (or contract as) a health plan, bank, or TPA. Not a retail "link my HSA" app. |
| G09 | high | HSA | Existing HSAs cannot be traded in place via a third-party market API. | Trustee-to-trustee transfer into Planvest's trustee, or stay read-only. |
| G10 | high | HSA | Brokerage KYC does not prove HDHP eligibility. | Eligibility workflow: HDHP, no disqualifying coverage, not on Medicare, not a dependent. |
| G11 | high | HSA | Contribution limits and employer funding are not enforced by generic trade APIs. DriveWealth IRA limit checks do not equal HSA limits. | 2026: $4,400 / $8,750 + $1,000 catch-up. Subtract employer contributions. |
| G12 | high | 401(k) | Held-away 401(k) management is a contested, non-API channel. | Treat as out of scope. |
| G13 | high | Advice | A "tool" that outputs fund picks is usually an investment adviser. Education vs advice is a facts-and-circumstances line. | Either stay generic education or register. |
| G14 | high | 401(k) | Paid 401(k) advice can be an ERISA fiduciary under the five-part test (restored 2026). PTE 2020-02 is the compensation exemption. | Counsel on fiduciary status before charging. |
| G15 | high | Custody | Discretionary trading without a qualified custodian breaks Advisers Act custody rule 206(4)-2. | DW/Schwab/Apex as qualified custodian; never hold client securities ourselves. |
| G16 | high | Tax | 5498-SA and 1099-SA are trustee-filed. Impersonating the filer is a fail. | Partner trustee files; we display copies. |
| G17 | high | Money | ACH, payroll, and HSA transfers can trigger money-transmitter rules if done outside a bank/BD. | Funding only through trustee or BD APIs. |
| G18 | high | AML | CIP, AML program, beneficial ownership, SARs. DriveWealth may rely on a US partner's CIP under contract; it will not rely on an unregulated app. | Written AML; designated officer. |
| G19 | high | Security | Screen scraping is not a legitimate API. Fidelity already moved workplace access to standardized APIs and is cutting credential sharing. | OAuth/FDX only. |
| G20 | medium | Data | Plaid Investments and SnapTrade workplace links *are* legitimate read-only APIs for HSA and 401(k) holdings. | Use for dashboards. Never upgrade a read token to trading. |
| G21 | medium | 401(k) | Brokerage windows (BrokerageLink) are real but sponsor-optional and still inside the plan. | Detect window availability; do not assume it. |
| G22 | medium | Advice | Model portfolios can look like an unregistered investment company unless Rule 3a-4 is followed. | Individualized questionnaires and ongoing suitability (SEC IM-2017-02). |
| G23 | medium | Robo | Algorithm testing, change control, CCO, annual 206(4)-7 review. SEC has already dinged electronic advisers here. | Policies before any model goes live. |
| G24 | medium | Privacy | HSA debit/claims data can be PHI. | Minimize; BAA if needed. |
| G25 | medium | Tax | CA / NJ / AL HSA state tax differences. | State-aware disclosures. |
| G26 | medium | 401(k) | Loans, vesting, match, QDIA, 404(c). A sidecar trader can blow up participant protections. | Never trade 401(k)s we do not administer. |
| G27 | medium | 401(k) | In-service rollovers are usually blocked while employed. | Do not pitch "move your 401(k) to us so we can trade it" as the default. |
| G28 | medium | Security | SOC 2, DOL cybersecurity, encryption, vendor DD. | Required before PII. |
| G29 | medium | Insurance | E&O, cyber, ERISA bond. | Bind before managing assets. |
| G30 | medium | UX | Suitability questionnaire, Form CRS, conflicts, fee disclosure. | Required for advice. |
| G31 | medium | Ops | Beneficiaries, death, divorce/QDRO. | Trustee/recordkeeper owned. |
| G32 | medium | Prohibited tx | HSA/401(k) self-dealing and prohibited transactions. | No investing in user's own business, collectibles, etc. |
| G33 | medium | HSA | Medical cash buffer vs invested sleeve. | Trustee policy, not a market-API setting. |
| G34 | medium | HSA | DriveWealth does not validate MAGI/HDHP; partner is on the hook (same pattern as their IRA MAGI disclaimer). | Eligibility engine in Planvest + trustee hard stops. |
| G35 | medium | Data | SnapTrade Fidelity: up to 24h delay; NetBenefits often needs a Fidelity retail account. | Stale-data disclosures. |
| G36 | medium | Retail | Schwab trading via SnapTrade is BYO commercial keys — still not workplace 401(k) or HSA trustee services. | Do not confuse Schwab retail with Schwab HSBA. |
| G37 | medium | 401(k) | Solo / self-employed 401(k) is a different, tractable product with an IRA-style custodian. | Split from employer 401(k) in the UX. |
| G38 | medium | Licensing | Internet-adviser exemption vs state RIA vs SEC AUM threshold. | Entity-formation decision. |
| G39 | medium | Marketing | Saying the product is "connected to the market" while using Plaid is false advertising. | Accurate capability copy, enforced by gates. |
| G40 | medium | HSA | DriveWealth management type must match our license: `HSA_SELF` (user trades), `HSA_ADVISORY` (user-authorized), `HSA_RIA_MANAGED` (discretion). | Contract the matching type only. |

## Rail scorecard

See `npm run matrix` for the machine-readable version in `src/rails.ts`.

| Rail | Read HSA | Trade HSA | Open HSA | Read 401(k) | Trade 401(k) |
| --- | --- | --- | --- | --- | --- |
| Plaid Investments | yes (OAuth) | no | no | yes (OAuth) | no |
| SnapTrade Fidelity / Empower / Vanguard / TIAA | yes | no | no | yes | no |
| SnapTrade retail trading (Alpaca, E*TRADE, Webull…) | no | no | no | no | no |
| Alpaca / IBKR / market data | no | no | no | no | no |
| DriveWealth HSA_* | partner | partner | partner (sleeve) | no | no |
| First Dollar + DriveWealth | partner | partner | partner | no | no |
| Alegeus + Devenir (+ optional Schwab HSBA) | partner | partner | partner | no | no |
| Fidelity WorkplaceXchange | partner balances | no | no | partner balances | no |
| Empower DC APIs | no | no | no | partner balances | no |
| Pontera-style credential sharing | blocked | blocked | no | blocked | blocked |

## Closing order

1. Keep the product in **education + contribution math** (`src/hsaLimits.ts`) until counsel picks an entity.
2. Add **read-only** Plaid/SnapTrade OAuth. Do not request trading scopes.
3. Sign an **HSA trustee** and either **First Dollar** or **DriveWealth** (plus RIA or IB). That is the only honest "connected to the market" path for HSA.
4. Treat employer 401(k) as **held-away advice** or an **employer-sold plan product**. Do not build a trade button.
5. Only after ADV/BD and a qualified custodian, enable `place_trade` on the HSA sleeve — which `assertActionAllowed` already requires.
