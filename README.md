# Planvest

A 401(k) calculator related to a delayed US stock board. Put in what you can contribute. See IRS room, employer match, and an illustration if that money tracked the same public markets investors watch. Not a brokerage and not a forecast.

## Live

- Site: https://mathewb-png.github.io/planvest/
- Local: `npm run market && npm run dev`

## What it does

- **2026 401(k) limits** from IRS Notice 2025-67: $24,500 elective deferral, $8,000 catch-up at 50, $11,250 catch-up at ages 60–63.
- **Employer match** as “X% of the first Y% of salary.”
- **Growth illustration** using long-run market history (about 10% for US stocks) plus last-12-month live returns from the board. One year is not a plan.
- **Menu map**: a typical 401(k) S&P 500 / total market / Nasdaq / small-cap / bond option tracks SPY, VTI, QQQ, IWM, and BND.

Most plans do not buy Apple or NVIDIA directly. They buy funds that track those indexes.

## The API

**Yahoo Finance v8 chart** is the live feed. No key, delayed daily OHLC, works from GitHub Actions.

There is no honest “best prediction” API. Sign accuracy on the next bar sits around 50%. Trades still go through the employer’s recordkeeper — there is no public 401(k) trade API. See [docs/API_GAPS.md](docs/API_GAPS.md).

## Run

Requires Node 22+.

```bash
npm test
npm run market
npm run dev
```

## GitHub

Do not commit `.env`. Paid market-data keys never go in the public frontend.
