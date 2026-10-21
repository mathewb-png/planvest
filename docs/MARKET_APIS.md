# Market data APIs

Planvest is a delayed stock board. The live feed is Yahoo Finance. HSA and 401(k) rails are not part of this page.

## The API we use

**Yahoo Finance v8 chart** — `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1y&interval=1d`

- No API key
- Delayed last price + 1-year daily OHLC
- Works from Node and GitHub Actions
- v7 batch quotes return Unauthorized, so we walk the universe one symbol at a time

That is the legitimate public feed that can sit on GitHub Pages. Paid keys (Polygon, Twelve Data, Tiingo) cannot.

## When you would pay for another API

| Job | Best fit | Why not here |
| --- | --- | --- |
| Licensed real-time US stocks | **Polygon / Massive** | Needs a secret. Public Pages would leak it |
| Indicators | **Twelve Data** | Same key problem. Built-in `tsf` is linear regression, not a forecast edge |
| Clean adjusted history | **Tiingo** | Better for research, still needs a key |

## Prediction APIs

There is no public API with a proven best prediction rate on the next candlestick.

- A 2026 Columbia CFE walk-forward XGBoost study on public data got **49.5% sign accuracy** and **negative R²**.
- Twelve Data `tsf` extrapolates the last trend. It is not an oracle.

The 50-day average on the chart is history, not a forecast.

## Refresh

GitHub Actions runs `npm run market` on weekday cron and deploys `web/market.json`. Refresh is delayed, not tick-by-tick.
