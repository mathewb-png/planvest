import { railById } from "./rails.ts";
import {
  ComplianceGateError,
  type AccountKind,
  type Action,
  type LicenseState,
  type RailId,
} from "./types.ts";

export const EMPTY_LICENSES: LicenseState = {
  riaRegistered: false,
  brokerDealerRegistered: false,
  hsaTrusteePartner: false,
  driveWealthContract: false,
  firstDollarOrTpaContract: false,
  recordkeeperAppointment: false,
  erisaFiduciaryAppointment: false,
};

/**
 * Single chokepoint for any future API client. If this throws, the product
 * must not call a vendor. The gap IDs map to docs/API_GAPS.md.
 */
export function assertActionAllowed(
  railId: RailId,
  account: AccountKind,
  action: Action,
  licenses: LicenseState = EMPTY_LICENSES,
): void {
  const rail = railById(railId);

  if (rail.accessModel === "credential_sharing") {
    throw new ComplianceGateError(
      "CREDENTIAL_SHARING_FORBIDDEN",
      "G05",
      `${rail.name} uses credential sharing. Fidelity is blocking this pattern and state regulators have flagged it. Planvest will not implement it.`,
    );
  }

  if (action === "read_holdings") {
    const cap = rail.holdings[account];
    if (cap === "no" || cap === "illegal_or_blocked") {
      throw new ComplianceGateError(
        "READ_NOT_SUPPORTED",
        "G20",
        `${rail.name} does not provide legitimate holdings access for ${account}.`,
      );
    }
    if (cap === "partner_only" && !hasPartnerFor(railId, licenses)) {
      throw new ComplianceGateError(
        "PARTNER_CONTRACT_REQUIRED",
        "G08",
        `${rail.name} holdings for ${account} require a signed partner/sponsor contract.`,
      );
    }
    return;
  }

  if (action === "place_trade") {
    if (account === "401k") {
      throw new ComplianceGateError(
        "NO_PUBLIC_401K_TRADE_API",
        "G04",
        "Employer 401(k) assets are ERISA plan assets. There is no legitimate public consumer API to send those trades to the market. Use advice-only, a recordkeeper appointment, or a self-employed plan you actually custody.",
      );
    }

    if (account === "hsa" && railId !== "drivewealth_hsa" && railId !== "first_dollar" && railId !== "alegeus_devenir" && railId !== "schwab_retail") {
      throw new ComplianceGateError(
        "WRONG_CUSTODY_RAIL",
        "G03",
        `${rail.name} is not an HSA investing rail. Alpaca, IBKR, SnapTrade retail, and market-data APIs cannot trade an HSA.`,
      );
    }

    const cap = rail.trades[account];
    if (cap !== "yes" && cap !== "partner_only") {
      throw new ComplianceGateError(
        "TRADE_NOT_SUPPORTED",
        "G03",
        `${rail.name} cannot place ${account} trades.`,
      );
    }

    if (account === "hsa") {
      if (!licenses.hsaTrusteePartner) {
        throw new ComplianceGateError(
          "HSA_TRUSTEE_REQUIRED",
          "G01",
          "HSA dollars must sit with an IRS-qualified trustee or custodian (bank, insurer, or IRS-approved nonbank trustee). A brokerage API alone is not enough.",
        );
      }
      if (railId === "drivewealth_hsa" && !licenses.driveWealthContract) {
        throw new ComplianceGateError(
          "DRIVEWEALTH_CONTRACT_REQUIRED",
          "G07",
          "DriveWealth HSA account types exist but are contract-gated. Do not call production until an introducing-broker or RIA agreement is signed.",
        );
      }
      if ((railId === "first_dollar" || railId === "alegeus_devenir") && !licenses.firstDollarOrTpaContract) {
        throw new ComplianceGateError(
          "TPA_CONTRACT_REQUIRED",
          "G08",
          "First Dollar / Alegeus / Devenir are B2B administrator platforms, not retail connect APIs.",
        );
      }
      if (rail.accessModel === "ria_discretionary" || railId === "drivewealth_hsa") {
        if (!licenses.riaRegistered && !licenses.brokerDealerRegistered) {
          throw new ComplianceGateError(
            "RIA_OR_BD_REQUIRED",
            "G02",
            "Placing HSA trades is brokerage or advisory activity. Register as an RIA and/or introducing broker, or stay read-only.",
          );
        }
      }
    }
    return;
  }

  if (action === "open_new_account") {
    if (account === "401k") {
      throw new ComplianceGateError(
        "CANNOT_OPEN_EMPLOYER_401K",
        "G04",
        "A consumer app cannot open an employer 401(k). That is a plan-sponsor + recordkeeper product. Self-employed / solo 401(k) requires a separate qualified custodian partnership.",
      );
    }
    if (account === "hsa") {
      if (!licenses.hsaTrusteePartner) {
        throw new ComplianceGateError(
          "HSA_TRUSTEE_REQUIRED",
          "G01",
          "Opening an HSA requires a qualified trustee. DriveWealth HSA_* types are the investing sleeve, not the statutory HSA trust by themselves.",
        );
      }
      const cap = rail.openAccount.hsa;
      if (cap !== "yes" && cap !== "partner_only") {
        throw new ComplianceGateError(
          "CANNOT_OPEN_HSA_ON_RAIL",
          "G09",
          `${rail.name} cannot open an HSA. Existing HSAs must move by trustee-to-trustee transfer, not by linking a trading API.`,
        );
      }
      if (!hasPartnerFor(railId, licenses)) {
        throw new ComplianceGateError(
          "PARTNER_CONTRACT_REQUIRED",
          "G08",
          `Opening HSA accounts on ${rail.name} requires a signed partner agreement.`,
        );
      }
      return;
    }
  }

  if (action === "move_money") {
    throw new ComplianceGateError(
      "MONEY_MOVEMENT_NOT_ENABLED",
      "G17",
      "ACH, payroll contribution, HSA transfers, and 401(k) in-service movements are not enabled until a bank/BD partner and money-movement procedures exist. Operating this yourself can trigger money-transmitter licensing.",
    );
  }

  if (action === "file_tax_forms") {
    throw new ComplianceGateError(
      "TRUSTEE_FILES_TAX_FORMS",
      "G16",
      "Forms 5498-SA and 1099-SA are filed by the HSA trustee/custodian. Planvest must not impersonate that filer.",
    );
  }
}

function hasPartnerFor(railId: RailId, licenses: LicenseState): boolean {
  switch (railId) {
    case "drivewealth_hsa":
      return licenses.driveWealthContract && licenses.hsaTrusteePartner;
    case "first_dollar":
    case "alegeus_devenir":
      return licenses.firstDollarOrTpaContract && licenses.hsaTrusteePartner;
    case "schwab_retail":
      return licenses.hsaTrusteePartner;
    case "fidelity_workplacexchange":
    case "empower_dc_apis":
      return licenses.recordkeeperAppointment;
    default:
      return true;
  }
}

export function describeBlockedReason(error: unknown): string {
  if (error instanceof ComplianceGateError) {
    return `${error.code} (${error.gapId}): ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
