export type AccountKind = "hsa" | "401k" | "ira" | "taxable";

export type Action =
  | "read_holdings"
  | "open_new_account"
  | "place_trade"
  | "move_money"
  | "file_tax_forms";

export type AccessModel =
  | "oauth_fdx_readonly"
  | "partner_b2b"
  | "introducing_broker"
  | "ria_discretionary"
  | "credential_sharing"
  | "direct_market"
  | "recordkeeper_sponsor";

export type LicenseNeed =
  | "none_if_education_only"
  | "ria"
  | "broker_dealer"
  | "erisa_fiduciary"
  | "hsa_trustee"
  | "money_transmitter"
  | "plan_sponsor_appointment";

export type RailId =
  | "plaid_investments"
  | "snaptrade_workplace"
  | "snaptrade_retail_trade"
  | "alpaca"
  | "schwab_retail"
  | "interactive_brokers"
  | "drivewealth_hsa"
  | "first_dollar"
  | "alegeus_devenir"
  | "fidelity_workplacexchange"
  | "empower_dc_apis"
  | "pontera_heldaway"
  | "generic_market_data";

export type Capability = "yes" | "no" | "partner_only" | "illegal_or_blocked";

export interface Rail {
  id: RailId;
  name: string;
  vendor: string;
  accessModel: AccessModel;
  /** What a public developer can do without a special custody contract. */
  publicApi: string;
  holdings: Record<AccountKind, Capability>;
  trades: Record<AccountKind, Capability>;
  openAccount: Record<AccountKind, Capability>;
  licenses: LicenseNeed[];
  notes: string;
}

export interface LicenseState {
  riaRegistered: boolean;
  brokerDealerRegistered: boolean;
  hsaTrusteePartner: boolean;
  driveWealthContract: boolean;
  firstDollarOrTpaContract: boolean;
  recordkeeperAppointment: boolean;
  erisaFiduciaryAppointment: boolean;
}

export class ComplianceGateError extends Error {
  readonly code: string;
  readonly gapId: string;

  constructor(code: string, gapId: string, message: string) {
    super(message);
    this.name = "ComplianceGateError";
    this.code = code;
    this.gapId = gapId;
  }
}
