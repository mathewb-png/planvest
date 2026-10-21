# Compliance map

This is an engineering checklist. It is not a substitute for counsel.

## Entity and registration

| Question | If the answer is yes | Gap |
| --- | --- | --- |
| Do we tell a user what to buy, sell, or hold in an HSA or 401(k)? | SEC or state RIA (Advisers Act). Form ADV Parts 1 and 2, Form CRS, CCO, Rule 206(4)-7 policies. SEC IM Guidance 2017-02 for robo-advisers. | G02, G13, G23 |
| Do we place the trade, even if the user clicked confirm? | Broker-dealer or introducing broker to a FINRA member (DriveWealth, Schwab, Apex, etc.). CIP, AML, SARs. | G02, G18 |
| Do we have discretion to trade without a ticket each time? | RIA + qualified custodian. Advisers Act custody rule 206(4)-2. DriveWealth type `HSA_RIA_MANAGED`. | G15 |
| Do we get paid for 401(k) advice? | ERISA five-part fiduciary test (restored in 2026 after vacatur of the 2024 Retirement Security Rule). PTE 2020-02 if compensation would otherwise be prohibited. | G14 |
| Do we pick or replace 401(k) funds with authority? | ERISA 3(38) investment manager, appointed in writing by a named fiduciary. Must be an RIA, bank, or insurer. | G06 |
| Do we hold HSA cash or receive HSA contributions? | IRS-qualified trustee/custodian: a bank, an insurer, or an IRS-approved nonbank trustee (Pub. 969; Treas. procedures for nonbank trustees). | G01 |
| Do we move money outside a bank or BD? | Possible state money-transmitter licensing. | G17 |
| Do we store medical claims or card swipes? | HIPAA / business associate analysis. | G24 |

Internet-only advisers sometimes use Advisers Act Rule 203A-2(e). That is a registration path, not a shortcut around fiduciary duty.

## HSA operating rules the API will not save us from

- 2026 contribution limits: $4,400 self / $8,750 family, plus $1,000 catch-up at age 55 (Rev. Proc. 2025-19).
- HDHP 2026: minimum deductible $1,700 / $3,400; OOP max $8,500 / $17,000.
- Eligible individual tests, last-month rule, Medicare, dependent status: Form 8889.
- Trustee files **5498-SA** (contributions + FMV) and **1099-SA** (distributions). The app does not.
- Non-qualified distributions: income tax plus additional tax. Investing does not change that.
- Cash vs invested sleeve: many custodians keep a cash threshold so medical spend still works. That is a custodian policy, not an IRS statute.
- California, New Jersey, and Alabama do not fully follow federal HSA tax treatment. State tax logic is a product requirement if we onboard residents there.
- Trustee-to-trustee transfer is how an existing HSA moves. There is no "connect this Fidelity HSA to Alpaca" step.

DriveWealth's public retirement docs enforce IRA contribution limits and 1099-R withholding. HSA contribution and distribution codes are a **separate tax rail** that must be in the partner contract, not assumed from the IRA endpoints.

## 401(k) operating rules the API will not save us from

- Assets are plan assets. The employer/named fiduciary and recordkeeper control the menu, QDIA, loans, vesting, and match.
- Fidelity WorkplaceXchange and Empower DC APIs are for sponsors, payroll, and balance inquiry. They are not a consumer trade API.
- Brokerage windows (Fidelity BrokerageLink and peers) exist only when the sponsor turns them on, and trades still settle inside the plan.
- In-service rollovers are usually unavailable while employed.
- Credential sharing to trade held-away 401(k)s is being blocked by Fidelity (2024–2026) and scrutinized by WA and MO securities regulators.
- DOL cybersecurity guidance for plan service providers applies if we ever touch plan data as an ERISA service provider.

## Security and vendor bar

- OAuth / FDX only. No password vaults for NetBenefits, Empower, or HSA portals.
- SOC 2 Type II before holding PII.
- Encryption in transit and at rest; least-privilege tokens; no reuse of user brokerage credentials.
- Vendor due diligence on any trustee, BD, or TPA.
- E&O, cyber, and (if ERISA) fidelity bond.

## Sources (accessed October 2026)

- IRS Publication 969 (2025 edition, includes 2026 HSA/HDHP figures)
- IRS Rev. Proc. 2025-19
- IRS instructions for Forms 8889, 1099-SA, 5498-SA
- SEC IM Guidance 2017-02 (robo-advisers); OCIE electronic-advice risk alert
- DOL notice restoring the ERISA five-part test after vacatur of the 2024 Retirement Security Rule (March 2026)
- PTE 2020-02 original text (2024 amendments vacated)
- Fidelity WorkplaceXchange API catalog; Fidelity public statements on credential-sharing blocks
- SnapTrade broker access guide (Fidelity/Empower/Schwab/TIAA/Vanguard = read only)
- DriveWealth account-management enums (`HSA_SELF`, `HSA_ADVISORY`, `HSA_RIA_MANAGED`)
- First Dollar `finalizeDriveWealthRegistration`
- Plaid Investments account-type list (includes HSA and 401(k), read-only)
