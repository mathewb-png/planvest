/** Generic target-date style mix. Not a recommendation and not personalized advice. */
export interface IllustrativeMix {
  stockPct: number;
  usStockPct: number;
  intlStockPct: number;
  bondPct: number;
}

export function illustrativeMix(age: number): IllustrativeMix {
  const clampedAge = Number.isFinite(age) ? Math.min(100, Math.max(18, age)) : 40;
  const stockPct = Math.min(90, Math.max(40, 110 - clampedAge));
  const usStockPct = stockPct * 0.7;
  const intlStockPct = stockPct * 0.3;
  const bondPct = 100 - stockPct;
  return { stockPct, usStockPct, intlStockPct, bondPct };
}

export function splitDollars(
  amount: number,
  mix: IllustrativeMix,
): { usStocks: number; intlStocks: number; bonds: number } {
  const safe = Math.max(0, amount);
  return {
    usStocks: (safe * mix.usStockPct) / 100,
    intlStocks: (safe * mix.intlStockPct) / 100,
    bonds: (safe * mix.bondPct) / 100,
  };
}
