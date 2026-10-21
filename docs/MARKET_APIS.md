# Market data APIs vs “prediction” APIs

There is no public API with a proven best prediction rate on the next candlestick. Treat any vendor claiming otherwise as marketing.

## What the evidence says

- A 2026 Columbia CFE walk-forward XGBoost study on public data got **49.5% sign accuracy** and **negative R²**. Predicting zero beat the model on RMSE. Always-up beat it on direction (51.5%).
- Hobby models sometimes publish 55–61% directional accuracy on one ticker, before costs, with no out-of-sample lockbox. That is not a 401(k) decision tool.
- Twelve Data’s `tsf` (time series forecast) is a **linear regression through recent closes**. It extrapolates the last trend. It is not an oracle.

For retirement money, a coin-flip on the next daily bar is the honest baseline.

## Best APIs for what Planvest actually needs

| Job | Best fit | Why |
| --- | --- | --- |
| Delayed daily OHLC candles for public ETFs | **Yahoo Finance v8 chart** (what we use) | No key, already works in GitHub Actions, good enough for education |
| Licensed real-time US stocks/ETFs | **Polygon / Massive** | Proper OHLCV, trades, WebSocket |
| Indicators on a paid key | **Twelve Data** | RSI/MACD/etc. Built-in `tsf` is not a prediction edge |
| Clean long history / backtests | **Tiingo** | Adjusted daily series |
| 401(k) *account* holdings | **Plaid Investments** (read-only) | Not candles, and not trading |
| 401(k) *trades* | None public | Recordkeeper / plan menu only |

Planvest ships Yahoo delayed daily candles for VTI, VXUS, BND, and the S&P 500. A 50-day average is drawn as **history**, not a forecast.

## How this maps to a 401(k)

Most plans do not let you trade candlesticks. You pick funds from a menu that already map to US stocks, international stocks, and bonds. The chart is there so you can see volatility and one-year path — not so you can time the next bar at Fidelity or Empower.
