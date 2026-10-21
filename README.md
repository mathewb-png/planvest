# Planvest

A delayed US stock board. Quotes and 1-year daily candles in one place. Not a brokerage, not a forecast, and not an HSA or 401(k) product.

## Live

- Site: https://mathewb-png.github.io/planvest/
- Local: `npm run market && npm run dev`

The page is a reading board: indexes, liquid stocks, and ETFs. Click a row for candles. GitHub Actions refreshes Yahoo data on weekdays.

## The API

**Yahoo Finance v8 chart** is the live feed. No key, delayed daily OHLC, works from GitHub Actions.

| Job | API | Why this one |
| --- | --- | --- |
| Delayed quotes + 1-year candles | **Yahoo Finance v8** (`/v8/finance/chart`) | The feed that actually works here without a secret |
| Licensed real-time ticks | Polygon / Massive | Paid, exchange-licensed. Keys cannot sit in a public GitHub Pages site |
| Indicators on a paid key | Twelve Data | Fine for RSI/MACD. Its `tsf` forecast is just a regression, not an edge |
| Clean history / backtests | Tiingo | Adjusted daily series |

Yahoo’s v7 batch quote endpoint returns Unauthorized. Each symbol is fetched from v8. There is no honest “best prediction” API — sign accuracy on the next bar sits around 50%.

## What this is not

- Not SIP real-time (Yahoo is delayed)
- Not an order ticket
- Not an HSA or 401(k) connector. Those accounts still need their own trustee or recordkeeper. See [docs/API_GAPS.md](docs/API_GAPS.md) if you need that path later.

## Run

Requires Node 22+.

```bash
npm test
npm run market
npm run dev
```

## GitHub

Do not commit `.env`. Paid market-data keys never go in the public frontend.
