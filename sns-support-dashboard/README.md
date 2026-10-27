# SNS Customer Support | Cost Reduction Review

A single-page executive decision dashboard for Science Natural Supplements (SNS).
It asks whether to keep or replace the $1,496/month full-service HelpGrid support
contract. Prepared for Cody Bramlett. The period is **July–September 2026** (three
complete calendar months; October is excluded).

## View it

Open **`dist/index.html`** in any browser. It is fully self-contained: React,
Recharts and the compiled CSS are inlined. It has no server, backend or network calls.

## Rebuild

```bash
cd sns-support-dashboard
npm install
npm run build        # -> dist/index.html
```

## Files

| File | Purpose |
|---|---|
| `src/data.js` | **All source values and editable constants.** Workbook values carry `sheet!cell` refs. HelpGrid/Help Scout costs, automation/VA estimates and the 45% illustrative margin live here. `null` = not reported. |
| `src/calc.js` | Pure formulas: calendar-month allocation, totals, contribution, break-even, unit costs, savings. |
| `src/App.jsx` | The page. |
| `build.js` | esbuild + Tailwind → one inlined HTML file. |

This project is independent of the SNS 90-Day Restructuring dashboard at the repo
root (`index.html`). It has its own `package.json` and changes nothing outside this
folder.

## Published view

https://claude.ai/artifact/NMJRULfpDm88JDzXu7Qn7W is published from
`dist/artifact.html`. After `npm run build`, republish that file to the same link
rather than creating a new artifact.

## Method notes

- **Calendar months:** CS Volume groups by week-start but records Mon–Fri daily
  counts. Each day is assigned to its own month, so weeks that straddle month ends
  are split exactly. Weekends are not recorded.
- **Chargebacks:** months come from the *Chargeback/Alert Date* (event date), and
  alerts (`Type = Chargeback Alert`) are kept separate from filed chargebacks.
  Dispute outcomes are not recorded.
- **Attributed sales:** inbound + saved is shown only as an *unverified upper
  bound*. The workbook files "Save the sales" under TOTAL LOSSES, so confirm
  what it measures before treating it as revenue.
- **Refunds** are an indicator only and are never deducted from sales.
- **Contribution** = revenue × adjustable margin (20–80%). This is a model, not
  ROI and not verified incremental profit. COGS, shipping and fees are not in the
  workbook and show as "Not available".
- **3-month unit costs** = total fees ÷ total activity (not an average of
  monthly ratios).
