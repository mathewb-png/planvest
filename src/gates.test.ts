import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertActionAllowed, EMPTY_LICENSES } from "./gates.ts";
import { ComplianceGateError, type LicenseState } from "./types.ts";

function expectGate(run: () => void, code: string, gapId: string): void {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof ComplianceGateError, "expected ComplianceGateError");
    assert.equal(error.code, code);
    assert.equal(error.gapId, gapId);
    return;
  }
  assert.fail(`expected ${code}`);
}

describe("market APIs cannot trade HSA or 401k", () => {
  for (const rail of ["alpaca", "interactive_brokers", "snaptrade_retail_trade", "generic_market_data"] as const) {
    it(`${rail} cannot place HSA trades`, () => {
      expectGate(
        () => assertActionAllowed(rail, "hsa", "place_trade"),
        "WRONG_CUSTODY_RAIL",
        "G03",
      );
    });

    it(`${rail} cannot place 401k trades`, () => {
      expectGate(
        () => assertActionAllowed(rail, "401k", "place_trade"),
        "NO_PUBLIC_401K_TRADE_API",
        "G04",
      );
    });
  }
});

describe("read-only rails stay read-only", () => {
  it("allows Plaid HSA holdings reads", () => {
    assertActionAllowed("plaid_investments", "hsa", "read_holdings");
    assertActionAllowed("plaid_investments", "401k", "read_holdings");
  });

  it("blocks SnapTrade workplace trades", () => {
    expectGate(
      () => assertActionAllowed("snaptrade_workplace", "hsa", "place_trade"),
      "WRONG_CUSTODY_RAIL",
      "G03",
    );
  });
});

describe("credential sharing is forbidden", () => {
  it("rejects Pontera-style 401k access before any vendor call", () => {
    expectGate(
      () => assertActionAllowed("pontera_heldaway", "401k", "read_holdings"),
      "CREDENTIAL_SHARING_FORBIDDEN",
      "G05",
    );
    expectGate(
      () => assertActionAllowed("pontera_heldaway", "401k", "place_trade"),
      "CREDENTIAL_SHARING_FORBIDDEN",
      "G05",
    );
  });
});

describe("DriveWealth HSA path still needs trustee + contract + registration", () => {
  it("blocks trades with empty licenses", () => {
    expectGate(
      () => assertActionAllowed("drivewealth_hsa", "hsa", "place_trade"),
      "HSA_TRUSTEE_REQUIRED",
      "G01",
    );
  });

  it("blocks until the DriveWealth contract exists", () => {
    const licenses: LicenseState = { ...EMPTY_LICENSES, hsaTrusteePartner: true };
    expectGate(
      () => assertActionAllowed("drivewealth_hsa", "hsa", "place_trade", licenses),
      "DRIVEWEALTH_CONTRACT_REQUIRED",
      "G07",
    );
  });

  it("blocks until RIA or BD is registered", () => {
    const licenses: LicenseState = {
      ...EMPTY_LICENSES,
      hsaTrusteePartner: true,
      driveWealthContract: true,
    };
    expectGate(
      () => assertActionAllowed("drivewealth_hsa", "hsa", "place_trade", licenses),
      "RIA_OR_BD_REQUIRED",
      "G02",
    );
  });

  it("allows HSA trades only when trustee, contract, and registration exist", () => {
    const licenses: LicenseState = {
      ...EMPTY_LICENSES,
      hsaTrusteePartner: true,
      driveWealthContract: true,
      riaRegistered: true,
    };
    assertActionAllowed("drivewealth_hsa", "hsa", "place_trade", licenses);
  });
});

describe("tax forms and money movement stay with the trustee", () => {
  it("refuses to file 5498-SA", () => {
    expectGate(
      () => assertActionAllowed("first_dollar", "hsa", "file_tax_forms"),
      "TRUSTEE_FILES_TAX_FORMS",
      "G16",
    );
  });

  it("refuses ACH until a money-movement program exists", () => {
    expectGate(
      () => assertActionAllowed("drivewealth_hsa", "hsa", "move_money"),
      "MONEY_MOVEMENT_NOT_ENABLED",
      "G17",
    );
  });
});
