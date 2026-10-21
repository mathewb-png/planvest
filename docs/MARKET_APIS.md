# Market data APIs

Planvest reads **MSN Finance** for delayed stock quotes, 1-year candles, and earnings-call dates. The 401(k) calculator is local math. There is no trade API.

## The API we use

MSN Money’s public client feed, fetched at build time so the GitHub Pages site never holds a private key.

| Job | Endpoint |
| --- | --- |
| Ticker → instrument id | `https://services.bingapis.com/contentservices-finance.csautosuggest/api/v1/Query` |
| Delayed quotes | `https://assets.msn.com/service/Finance/Quotes` |
| 1-year OHLC | `https://assets.msn.com/service/Finance/Charts?type=1Y` |
| Earnings calls / releases | `https://assets.msn.com/service/Finance/Events/Earnings` |

The `apikey` on those URLs is the same client key MSN Money embeds in the website. We use it from GitHub Actions, then ship `web/market.json`. That is delayed public data, not SIP, and not a transcript feed.

## What “earnings call” means here

MSN returns the company’s **earnings release date**, timeslot (before open / after close), consensus EPS and revenue, and the last reported surprise. That is the call calendar investors watch. Full audio/transcripts are a different paid product and are not on this page.

## When you would pay for another API

| Job | Best fit | Why not here |
| --- | --- | --- |
| Licensed real-time US stocks | **Polygon / Massive** | Needs a secret. Public Pages would leak it |
| Full call transcripts | **EarningsCall / similar** | Paid. Not required to relate a 401(k) to the market |
| Indicators | **Twelve Data** | Same key problem. Built-in `tsf` is not a forecast edge |

## Prediction APIs

There is no public API with a proven best prediction rate on the next candlestick. The 50-day average on the chart is history, not a forecast.

## Refresh

GitHub Actions runs `npm run market` on weekday cron and deploys `web/market.json`.
