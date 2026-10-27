/* Pure, formula-driven calculations. Every figure is derived from data.js
   plus the editable inputs; no results are hardcoded here. */
import { PERIOD, CS_VOLUME, FINANCIALS, CHARGEBACK_LOG, ACTIVITY_METHOD } from "./data.js";

const KEYS = PERIOD.months.map((m) => m.key);
const MONTH_KEY = Object.fromEntries(PERIOD.months.map((m) => [m.month, m.key]));

// Any null input makes the result "not available" rather than zero.
const sumOrNull = (vals) => (vals.some((v) => v == null) ? null : vals.reduce((a, b) => a + b, 0));
const neg = (v) => (v == null ? null : -v);
const div = (a, b) => (a == null || b == null || b === 0 ? null : a / b);

const monthOf = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  return d.getUTCFullYear() === PERIOD.year ? MONTH_KEY[d.getUTCMonth() + 1] : undefined;
};

/* CS Volume groups by week-start but records Mon–Fri daily counts, so each
   day is assigned to its own calendar month (straddling weeks split exactly). */
function activityByCalendarDay(stream) {
  const out = Object.fromEntries(KEYS.map((k) => [k, 0]));
  for (const w of CS_VOLUME[stream].weeks) {
    w.days.forEach((v, i) => {
      const d = new Date(w.week + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      const key = monthOf(d.toISOString().slice(0, 10));
      if (key) out[key] += v;
    });
  }
  return out;
}

/* SNS reporting method: whole week (sheet Total, column G) goes to the month
   of its Monday start date. */
function activityByWeekStart(stream) {
  const out = Object.fromEntries(KEYS.map((k) => [k, 0]));
  for (const w of CS_VOLUME[stream].weeks) {
    const key = monthOf(w.week);
    if (key) out[key] += w.total;
  }
  return out;
}

const activity = (stream) => (ACTIVITY_METHOD === "weekStart" ? activityByWeekStart(stream) : activityByCalendarDay(stream));

function countEvents(type) {
  const out = Object.fromEntries(KEYS.map((k) => [k, 0]));
  for (const e of CHARGEBACK_LOG) {
    const key = monthOf(e.eventDate);
    if (key && e.type === type) out[key] += 1;
  }
  return out;
}

// {jul, aug, sep, total}; total sums the months unless a total formula is given.
const row = (fn, totalFn) => {
  const r = Object.fromEntries(KEYS.map((k) => [k, fn(k)]));
  r.total = totalFn ? totalFn(r) : sumOrNull(KEYS.map((k) => r[k]));
  return r;
};

export function buildModel({ helpGridMonthly, marginPct }) {
  const F = FINANCIALS;
  const m = marginPct == null ? null : marginPct / 100;
  const inbound = activity("inbound");
  const outbound = activity("outbound");
  const email = activity("email");
  const alerts = countEvents("Chargeback Alert");
  const chargebacks = countEvents("Chargeback");

  const R = {
    inboundCalls: row((k) => inbound[k]),
    outboundCalls: row((k) => outbound[k]),
    emails: row((k) => email[k]),
    sales: row((k) => F.inboundSales.values[k]),
    discounts: row((k) => neg(F.savedSales.values[k])), // shown, never deducted
    refunds: row((k) => F.refunds.values[k]), // workload metric only
    safetyRefunds: row((k) => F.safetyRefunds.values[k]),
    alerts: row((k) => alerts[k]),
    chargebacks: row((k) => chargebacks[k]),
    fee: row(() => neg(helpGridMonthly)),
  };
  R.interactions = row((k) => R.inboundCalls[k] + R.outboundCalls[k] + R.emails[k]);

  // Modeled contribution = attributed sales × assumed margin.
  R.contribution = row((k) => (m == null ? null : R.sales[k] * m));
  R.afterFee = row((k) => sumOrNull([R.contribution[k], R.fee[k]]));

  // Fee as a positive number for ratios; totals divide TOTAL by TOTAL.
  const fee = (k) => neg(R.fee[k]);
  R.costPerInteraction = row((k) => div(fee(k), R.interactions[k]), () => div(fee("total"), R.interactions.total));
  R.feePerInboundCall = row((k) => div(fee(k), R.inboundCalls[k]), () => div(fee("total"), R.inboundCalls.total));
  R.breakEven = row((k) => div(fee(k), m), () => div(fee("total"), m));

  // Margin at which attributed sales would exactly cover HelpGrid.
  const breakEvenMargin = div(fee("total"), R.sales.total);

  return { keys: KEYS, rows: R, breakEvenMargin };
}

export function savings(c) {
  if (Object.values(c).some((v) => v == null)) return null;
  const current = c.helpGridMonthly + c.helpScoutMonthly;
  const vaLow = c.vaHoursLow * c.vaRate;
  const vaHigh = c.vaHoursHigh * c.vaRate;
  const proposedLow = c.helpScoutProposed + c.automationLow + vaLow;
  const proposedHigh = c.helpScoutProposed + c.automationHigh + vaHigh;
  return {
    current,
    vaLow,
    vaHigh,
    proposedLow,
    proposedHigh,
    monthlyLow: current - proposedHigh,
    monthlyHigh: current - proposedLow,
    annualLow: (current - proposedHigh) * 12,
    annualHigh: (current - proposedLow) * 12,
  };
}
