export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function sma(values: number[], period: number): Array<number | null> {
  if (period <= 0) return values.map(() => null);
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const slice = values.slice(index + 1 - period, index + 1);
    const sum = slice.reduce((total, value) => total + value, 0);
    return sum / period;
  });
}

export function smaLine(candles: Candle[], period = 50): Array<{ time: string; value: number }> {
  const closes = candles.map((candle) => candle.close);
  const averages = sma(closes, period);
  const points: Array<{ time: string; value: number }> = [];
  averages.forEach((value, index) => {
    if (value === null) return;
    points.push({ time: candles[index].time, value });
  });
  return points;
}
