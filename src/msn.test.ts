import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { candlesFromSeries, flattenMsn, summarizeEarnings, timeslotLabel } from "./msn.ts";

describe("MSN parsers", () => {
  it("maps before-open and after-close timeslots", () => {
    assert.equal(timeslotLabel(10), "Before open");
    assert.equal(timeslotLabel(40), "After close");
    assert.equal(timeslotLabel(99), null);
  });

  it("flattens nested MSN arrays", () => {
    const rows = flattenMsn([[{ symbol: "AAPL" }], { symbol: "MSFT" }]);
    assert.deepEqual(
      rows.map((row) => row.symbol),
      ["AAPL", "MSFT"],
    );
  });

  it("builds date-only candles from a 1Y series", () => {
    const candles = candlesFromSeries({
      timeStamps: ["2026-10-21T04:00:00Z"],
      openPrices: [100.126],
      pricesHigh: [102.4],
      pricesLow: [99.1],
      prices: [101.333],
    });
    assert.deepEqual(candles, [
      { time: "2026-10-21", open: 100.13, high: 102.4, low: 99.1, close: 101.33 },
    ]);
  });

  it("picks the next upcoming call and the last reported call", () => {
    const summary = summarizeEarnings(
      "AAPL",
      "Apple",
      {
        Timeslot: 40,
        ExpectedReportDate: "2026-11-02T21:00:00Z",
        LastActualFiscalPeriod: "202606",
        LastActual: {
          EpsActual: 2.02,
          EpsForecast: 1.89,
          EpsSurprisePercent: 6.88,
          RevenueActual: 109_417_000_000,
          RevenueForecast: 108_959_817_930,
          EarningReleaseDate: "2026-07-30T20:30:00Z",
          CalendarPeriodType: "Q22026",
        },
        Forecast: {
          quarterly: {
            "202609": {
              EpsForecast: 1.98,
              RevenueForecast: 113_357_085_200,
              EarningReleaseDate: "2026-11-02T21:00:00Z",
              CalendarPeriodType: "Q32026",
            },
          },
        },
      },
      new Date("2026-10-21T00:00:00Z"),
    );
    assert.equal(summary.next?.date, "2026-11-02T21:00:00Z");
    assert.equal(summary.next?.period, "Q32026");
    assert.equal(summary.next?.timeslot, "After close");
    assert.equal(summary.last?.epsActual, 2.02);
    assert.equal(summary.last?.status, "reported");
  });
});
