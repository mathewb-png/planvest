import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { illustrativeMix, splitDollars } from "./allocation.ts";

describe("illustrative mix", () => {
  it("uses a 70/30 stock/bond split at age 40", () => {
    const mix = illustrativeMix(40);
    assert.equal(mix.stockPct, 70);
    assert.equal(mix.bondPct, 30);
    assert.equal(mix.usStockPct, 49);
    assert.equal(mix.intlStockPct, 21);
  });

  it("floors stocks at 40% and ceilings at 90%", () => {
    assert.equal(illustrativeMix(90).stockPct, 40);
    assert.equal(illustrativeMix(18).stockPct, 90);
  });

  it("splits remaining contribution room across the three sleeves", () => {
    const dollars = splitDollars(1000, illustrativeMix(40));
    assert.equal(dollars.usStocks, 490);
    assert.equal(dollars.intlStocks, 210);
    assert.equal(dollars.bonds, 300);
  });
});
