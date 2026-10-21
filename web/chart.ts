import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { smaLine, type Candle } from "../src/sma.ts";

const UP = "#1e4a38";
const DOWN = "#8c3b1e";
const INK = "#5c564c";
const LINE = "#d7d0c3";
const PAPER = "#fcfaf4";

let chart: IChartApi | null = null;
let candleSeries: ISeriesApi<"Candlestick"> | null = null;
let averageSeries: ISeriesApi<"Line"> | null = null;

function asTimestamp(iso: string): UTCTimestamp {
  return Math.floor(Date.parse(`${iso}T20:00:00Z`) / 1000) as UTCTimestamp;
}

function ohlc(candle: Candle) {
  return {
    time: asTimestamp(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

export function mountCandleChart(container: HTMLElement, series: Candle[]): void {
  const width = Math.max(container.clientWidth, 320);
  if (!chart) {
    chart = createChart(container, {
      width,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: PAPER },
        textColor: INK,
        fontFamily: "IBM Plex Sans, sans-serif",
      },
      grid: {
        vertLines: { color: LINE },
        horzLines: { color: LINE },
      },
      rightPriceScale: { borderColor: LINE },
      timeScale: { borderColor: LINE, timeVisible: false },
    });
    candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
    });
    averageSeries = chart.addSeries(LineSeries, {
      color: INK,
      lineWidth: 1,
      title: "50-day average",
    });
    window.addEventListener("resize", () => {
      chart?.applyOptions({ width: Math.max(container.clientWidth, 320) });
    });
  } else {
    chart.applyOptions({ width });
  }

  const bars = series.map(ohlc);
  candleSeries?.setData(bars);
  averageSeries?.setData(
    smaLine(series, 50).map((point) => ({
      time: asTimestamp(point.time),
      value: point.value,
    })),
  );
  chart.timeScale().fitContent();
}
