import type { Rail } from "./types.ts";

/**
 * Legitimate rails for HSA / 401(k) work. A "yes" means the vendor documents
 * that capability on that account type. It is not permission for Planvest to
 * turn the capability on without the matching licenses in LicenseState.
 */
export const RAILS: readonly Rail[] = [
  {
    id: "plaid_investments",
    name: "Plaid Investments",
    vendor: "Plaid",
    accessModel: "oauth_fdx_readonly",
    publicApi: "Read-only balances, holdings, and investment transactions via OAuth/FDX.",
    holdings: { hsa: "yes", "401k": "yes", ira: "yes", taxable: "yes" },
    trades: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["none_if_education_only"],
    notes:
      "Legitimate for a dashboard. Connecting an HSA or 401(k) here does not give market access. Recommendations on top of this data can still be investment advice.",
  },
  {
    id: "snaptrade_workplace",
    name: "SnapTrade workplace brokers",
    vendor: "SnapTrade",
    accessModel: "oauth_fdx_readonly",
    publicApi: "Read-only OAuth to Fidelity, Empower, Schwab, TIAA, Vanguard, Transamerica after SnapTrade production approval.",
    holdings: { hsa: "yes", "401k": "yes", ira: "yes", taxable: "yes" },
    trades: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["none_if_education_only"],
    notes:
      "Fidelity integration is read-only, data can lag 24h, and NetBenefits often requires a Fidelity retail login. This is not a 401(k) or HSA trading API.",
  },
  {
    id: "snaptrade_retail_trade",
    name: "SnapTrade retail trading brokers",
    vendor: "SnapTrade",
    accessModel: "introducing_broker",
    publicApi: "Trade where the underlying broker allows it (E*TRADE, Webull, Alpaca BYO keys, Schwab trading BYO keys, etc.).",
    holdings: { hsa: "no", "401k": "no", ira: "yes", taxable: "yes" },
    trades: { hsa: "no", "401k": "no", ira: "partner_only", taxable: "partner_only" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["broker_dealer", "ria"],
    notes:
      "Retail brokers do not custody employer 401(k) or most HSAs. Wiring Planvest 'to the market' through these APIs cannot legally trade the user's workplace accounts.",
  },
  {
    id: "alpaca",
    name: "Alpaca",
    vendor: "Alpaca",
    accessModel: "direct_market",
    publicApi: "Brokerage API for taxable and some IRA accounts. Not an HSA trustee or 401(k) recordkeeper.",
    holdings: { hsa: "no", "401k": "no", ira: "partner_only", taxable: "yes" },
    trades: { hsa: "no", "401k": "no", ira: "partner_only", taxable: "yes" },
    openAccount: { hsa: "no", "401k": "no", ira: "partner_only", taxable: "yes" },
    licenses: ["broker_dealer"],
    notes: "A legitimate market API for the wrong account type. Using it for HSA/401(k) would be a false custody path.",
  },
  {
    id: "schwab_retail",
    name: "Charles Schwab retail / HSBA",
    vendor: "Charles Schwab",
    accessModel: "partner_b2b",
    publicApi: "Retail trading API is BYO keys via SnapTrade or Schwab Trader API. Schwab Health Savings Brokerage Account is offered through HSA administrators such as Lively, not as a public HSA-open API.",
    holdings: { hsa: "partner_only", "401k": "no", ira: "yes", taxable: "yes" },
    trades: { hsa: "partner_only", "401k": "no", ira: "partner_only", taxable: "partner_only" },
    openAccount: { hsa: "partner_only", "401k": "no", ira: "partner_only", taxable: "partner_only" },
    licenses: ["hsa_trustee", "broker_dealer"],
    notes:
      "HSBA is a real HSA investment rail, but the user already has to hold an HSA at a partner administrator. Planvest cannot open a Schwab HSA brokerage window without that administrator contract.",
  },
  {
    id: "interactive_brokers",
    name: "Interactive Brokers",
    vendor: "Interactive Brokers",
    accessModel: "direct_market",
    publicApi: "Client Portal / TWS API for IBKR-held accounts. SnapTrade IBKR link is read-only.",
    holdings: { hsa: "no", "401k": "no", ira: "yes", taxable: "yes" },
    trades: { hsa: "no", "401k": "no", ira: "yes", taxable: "yes" },
    openAccount: { hsa: "no", "401k": "no", ira: "yes", taxable: "yes" },
    licenses: ["broker_dealer"],
    notes: "Same gap as Alpaca: a real market connection that does not hold HSA trusts or ERISA plan assets.",
  },
  {
    id: "drivewealth_hsa",
    name: "DriveWealth HSA investing",
    vendor: "DriveWealth",
    accessModel: "introducing_broker",
    publicApi: "Partner back-office API. Account types HSA_SELF (29), HSA_ADVISORY (30), HSA_RIA_MANAGED (31) exist. Production access is contract-gated.",
    holdings: { hsa: "partner_only", "401k": "no", ira: "partner_only", taxable: "partner_only" },
    trades: { hsa: "partner_only", "401k": "no", ira: "partner_only", taxable: "partner_only" },
    openAccount: { hsa: "partner_only", "401k": "no", ira: "partner_only", taxable: "partner_only" },
    licenses: ["broker_dealer", "ria", "hsa_trustee"],
    notes:
      "Closest legitimate 'market' API for NEW HSA investments. DriveWealth is the broker for the invested sleeve. An IRS-qualified HSA trustee still has to hold the cash HSA, run eligibility, and file 5498-SA / 1099-SA. Public retirement docs currently spell out IRA contribution codes, not HSA distribution semantics.",
  },
  {
    id: "first_dollar",
    name: "First Dollar Health Wallet",
    vendor: "First Dollar",
    accessModel: "partner_b2b",
    publicApi: "GraphQL/REST for benefit providers: enroll HSA, KYC, cards, and finalizeDriveWealthRegistration for the investing sleeve.",
    holdings: { hsa: "partner_only", "401k": "no", ira: "no", taxable: "no" },
    trades: { hsa: "partner_only", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "partner_only", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["hsa_trustee", "broker_dealer"],
    notes:
      "A complete embedded HSA stack (trustee operations + DriveWealth investing). This is B2B for health plans, banks, and TPAs — not a way to take over a user's existing Fidelity or HealthEquity HSA.",
  },
  {
    id: "alegeus_devenir",
    name: "Alegeus WealthCare + Devenir",
    vendor: "Alegeus / Devenir",
    accessModel: "partner_b2b",
    publicApi: "Employer/TPA participant APIs including HSA investment details. Devenir runs managed HSA fund lineups and optional Schwab HSBA. SSO and daily money-movement files, not a retail trade API.",
    holdings: { hsa: "partner_only", "401k": "no", ira: "no", taxable: "no" },
    trades: { hsa: "partner_only", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "partner_only", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["hsa_trustee", "ria"],
    notes:
      "The incumbent employer-HSA investing pattern. Planvest would need to be (or partner as) the HSA administrator, not a sidecar app.",
  },
  {
    id: "fidelity_workplacexchange",
    name: "Fidelity WorkplaceXchange",
    vendor: "Fidelity",
    accessModel: "recordkeeper_sponsor",
    publicApi: "Plan-sponsor / payroll APIs: balances, participants, elections/loans. Delegated HSA balance inquiry exists. No public participant trading API for 401(k) or HSA investments.",
    holdings: { hsa: "partner_only", "401k": "partner_only", ira: "no", taxable: "no" },
    trades: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["plan_sponsor_appointment"],
    notes:
      "Largest US 401(k) recordkeeper. APIs serve employers and payroll vendors. Fidelity is actively blocking credential-sharing fintechs that try to trade workplace accounts without plan-sponsor oversight.",
  },
  {
    id: "empower_dc_apis",
    name: "Empower DC APIs",
    vendor: "Empower",
    accessModel: "recordkeeper_sponsor",
    publicApi: "Sponsor/advisor APIs for census, balances, deferrals, loans, eligibility, FDX data sharing. Not a consumer trade-execution API.",
    holdings: { hsa: "no", "401k": "partner_only", ira: "no", taxable: "no" },
    trades: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["plan_sponsor_appointment", "erisa_fiduciary"],
    notes: "Legitimate data plane for plan sponsors. Trading still happens inside Empower's participant experience or a brokerage window the sponsor turned on.",
  },
  {
    id: "pontera_heldaway",
    name: "Held-away 401(k) tools (Pontera model)",
    vendor: "Pontera and similar",
    accessModel: "credential_sharing",
    publicApi: "Advisor platforms that collect participant logins to view and rebalance 401(k)s at the recordkeeper.",
    holdings: { hsa: "no", "401k": "illegal_or_blocked", ira: "no", taxable: "no" },
    trades: { hsa: "no", "401k": "illegal_or_blocked", ira: "no", taxable: "no" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["ria", "erisa_fiduciary"],
    notes:
      "This is the only widely used 'trade my existing 401(k)' pattern, and it is not a legitimate public API. Fidelity has blocked it. Washington and Missouri securities regulators have called credential sharing dishonest/unethical. Planvest must not implement this.",
  },
  {
    id: "generic_market_data",
    name: "Market data / order-entry APIs",
    vendor: "Polygon, Alpaca data, IEX, etc.",
    accessModel: "direct_market",
    publicApi: "Quotes, bars, and sometimes paper orders. No customer account, no tax wrapper, no ERISA custody.",
    holdings: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    trades: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    openAccount: { hsa: "no", "401k": "no", ira: "no", taxable: "no" },
    licenses: ["none_if_education_only"],
    notes: "Useful for education and paper portfolios. Connecting this to live HSA/401(k) dollars would be a fake market hookup.",
  },
];

export function railById(id: Rail["id"]): Rail {
  const found = RAILS.find((rail) => rail.id === id);
  if (!found) {
    throw new Error(`Unknown rail: ${id}`);
  }
  return found;
}
