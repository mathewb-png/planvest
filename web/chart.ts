import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { smaLine, type Candle } from "../src/sma.ts";

const UP = "#1e4a38";
const DOWN = "#8c3b1e";
const INK = "#5c564c";
const LINE = "#d7d0c3";
const PAPER = "#fcfaf4";

let chart: IChartApi | null = null;
let candles: ISeriesApi<"Candlestick"> | null = null;
let average: ISeriesApi<"Line"> | null = null;

export function mountCandleChart(container: HTMLElement, series: Candle[]): void {
  if (!chart) {
    chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: PAPER },
        textColor: INK,
        fontFamily: "IBM Plex Sans, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: LINE },
        horzLines: { color: LINE },
      },
      rightPriceScale: { borderColor: LINE },
      timeScale: { borderColor: LINE },
      height: 380,
    });
    candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
    });
    average = chart.addSeries(LineSeries, {
      color: INK,
      lineWidth: 1,
      title: "50-day average",
    });
  }

  candles?.setData(series.map((bar) => ({ ...bar, time: bar.time })));
  average?.setData(smaLine(series, 50));
  chart.timeScale().fitContent();
}
