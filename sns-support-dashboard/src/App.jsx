import { useMemo, useState } from "react";
import { PERIOD, SOURCE_FILE, FINANCIALS, CS_VOLUME, COST_DEFAULTS, MARGIN } from "./data.js";
import { buildModel, savings } from "./calc.js";

/* ---------- formatting ---------- */
const NA = "Not available";
const usd = (v, cents = false) =>
  v == null || Number.isNaN(v)
    ? NA
    : v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: cents ? 2 : 0,
        maximumFractionDigits: cents ? 2 : 0,
      });
// Costs are stored negative and shown as −$1,234.00.
const signed = (v) => (v == null ? NA : v < 0 ? `−${usd(-v, true)}` : usd(v, true));
const signedWhole = (v) => (v == null ? NA : v < 0 ? `−${usd(-v)}` : usd(v));
const money = (v) => usd(v, true);
const int = (v) => (v == null ? NA : v.toLocaleString("en-US"));
const compactK = (v) => (v == null ? NA : `$${(v / 1000).toFixed(1)}K`);

const parseNum = (s) => {
  if (s === "" || s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const defaultCostInputs = () => Object.fromEntries(Object.entries(COST_DEFAULTS).map(([k, v]) => [k, String(v)]));

/* ---------- tone helpers ---------- */
const TONE = {
  ink: () => "text-ink",
  soft: () => "text-ink-soft",
  neg: () => "text-neg",
  caution: () => "text-caution",
  contrib: () => "text-contrib",
  signed: (v) => (v == null ? "text-ink" : v < 0 ? "text-neg" : "text-contrib"),
};

/* ---------- building blocks ---------- */
function Card({ className = "", children }) {
  return <div className={`min-w-0 rounded-2xl border border-navy-line bg-navy-panel ${className}`}>{children}</div>;
}

function Eyebrow({ children, className = "" }) {
  return <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-dim ${className}`}>{children}</p>;
}

function Kpi({ label, value, sub, tone = "text-ink", border = "" }) {
  return (
    <Card className={`p-5 ${border}`}>
      <Eyebrow>{label}</Eyebrow>
      <p className={`tnum mt-2 text-3xl font-semibold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-1.5 text-xs leading-snug text-muted">{sub}</p>
    </Card>
  );
}

function MoneyInput({ id, label, value, onChange, hint, suffix = "/mo", prefix = "$" }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs text-muted">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-navy-line bg-navy px-2.5 focus-within:border-contrib">
        {prefix && <span className="text-sm text-muted-dim">{prefix}</span>}
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tnum w-full bg-transparent px-1.5 py-1.5 text-sm text-ink outline-none"
        />
        <span className="text-xs text-muted-dim">{suffix}</span>
      </div>
      {hint && <span className="mt-0.5 block text-[10px] text-caution">{hint}</span>}
    </label>
  );
}

/* Small line icons for the operating model (bot, person, shield). */
const ICONS = {
  bot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4v4M9 13v1M15 13v1" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};
function Icon({ name }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

/* ======================================================================= */

/* Label | Jul | Aug | Sep | 3-Month Total. Missing values show "Not available". */
function MonthTable({ caption, groups, keys }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-navy-line text-left text-[11px] uppercase tracking-wider text-muted-dim">
            <th className="py-2 pr-3 font-medium">Measure</th>
            {PERIOD.months.map((m) => (
              <th key={m.key} className="px-3 py-2 text-right font-medium">{m.label}</th>
            ))}
            <th className="py-2 pl-3 text-right font-semibold text-ink-soft">3-Month Total</th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.title}>
            <tr>
              <th colSpan={5} className="pb-1 pt-5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{g.title}</th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.label} className="border-b border-navy-line/60 align-top">
                <td className="py-2.5 pr-3">
                  <div className={r.strong ? "font-semibold text-ink" : "text-ink-soft"}>{r.label}</div>
                  {r.note && <div className={`mt-0.5 text-[11px] leading-snug ${r.noteTone ?? "text-muted-dim"}`}>{r.note}</div>}
                </td>
                {[...keys, "total"].map((k) => {
                  const v = r.row[k];
                  const text = r.fmt(v);
                  return (
                    <td key={k} className={`px-3 py-2.5 text-right ${k === "total" ? "bg-navy-raised/60 font-semibold" : ""}`}>
                      {text === NA ? (
                        <span className="whitespace-nowrap text-xs italic text-caution">{NA}</span>
                      ) : (
                        <span className={`tnum whitespace-nowrap ${(r.tone ?? TONE.ink)(v)} ${r.strong ? "font-semibold" : ""}`}>{text}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

const STATUS = {
  "Verified Covered": { cls: "border-save/40 bg-save-bg text-save", icon: "✓" },
  "Needs Verification": { cls: "border-caution/40 bg-caution-bg text-caution", icon: "?" },
  Unassigned: { cls: "border-neg/40 bg-neg-bg text-neg", icon: "!" },
};
function StatusBadge({ status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <span aria-hidden="true" className="font-bold">{s.icon}</span>
      {status}
    </span>
  );
}

function Stat({ label, value, sub, tone = "text-ink" }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-dim">{label}</p>
      <p className={`tnum mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] leading-snug text-muted">{sub}</p>}
    </div>
  );
}

/* ======================================================================= */

export default function App() {
  const [costInputs, setCostInputs] = useState(defaultCostInputs);
  const [marginPct, setMarginPct] = useState(MARGIN.default);

  const costs = useMemo(() => Object.fromEntries(Object.entries(costInputs).map(([k, v]) => [k, parseNum(v)])), [costInputs]);
  const { rows: R, keys, breakEvenMargin } = useMemo(
    () => buildModel({ helpGridMonthly: costs.helpGridMonthly, marginPct }),
    [costs.helpGridMonthly, marginPct]
  );
  const sav = useMemo(() => savings(costs), [costs]);
  const setCost = (k) => (v) => setCostInputs((s) => ({ ...s, [k]: v }));
  const isDefault = Object.entries(COST_DEFAULTS).every(([k, v]) => costInputs[k] === String(v)) && marginPct === MARGIN.default;
  const avgMonthlySales = R.sales.total == null ? null : R.sales.total / keys.length;

  /* Status is about the proposed replacement model. A planned owner (Rose)
     moves a duty to Needs Verification; nothing is Verified Covered until
     cutover proves it. */
  const duties = [
    {
      name: "Email responses",
      evidence: `${int(R.emails.total)} emails logged Jul–Sep. Unique tickets and handling time not measured.`,
      plan: "Rose in Help Scout, with automation; ticket audit due Nov 5",
      status: "Needs Verification",
    },
    {
      name: "Phone & callback handling",
      evidence: `${int(R.inboundCalls.total)} inbound and ${int(R.outboundCalls.total)} outbound calls (incl. voicemails, callbacks).`,
      plan: "Rose; keep the number, voicemail-to-ticket with tested callbacks",
      status: "Needs Verification",
    },
    {
      name: "Refund administration",
      evidence: `${money(R.refunds.total)} in SNS refunds processed Jul–Sep.`,
      plan: "Rose, trained on BuyGoods Nov 6–20; refund limits not yet defined",
      status: "Needs Verification",
    },
    {
      name: "Chargeback deadlines",
      evidence: `${int(R.alerts.total)} alerts and ${int(R.chargebacks.total)} chargeback logged. The log tracks no deadlines or outcomes.`,
      plan: "Escalation coverage; no owner named",
      status: "Unassigned",
    },
    {
      name: "Fulfillment escalation",
      evidence: "Listed as a CS task (Fulfillment, On Hold, Returns, Shipping Issues/Delays) with no counts recorded.",
      plan: "Rose, trained on shipping and returns; volume unknown",
      status: "Needs Verification",
    },
    {
      name: "Product safety issues",
      evidence: `${money(R.safetyRefunds.total)} refunded for “Adverse Effect” or “Doctor’s Advise”.`,
      plan: "Escalation coverage; no specialist or protocol named",
      status: "Unassigned",
    },
  ];
  const count = (s) => duties.filter((d) => d.status === s).length;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      {/* ================= HEADER ================= */}
      <header className="flex flex-col gap-4 border-b border-navy-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>Science Natural Supplements · Prepared for Cody Bramlett</Eyebrow>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            SNS Customer Support <span className="text-muted-dim">|</span> Cost Reduction Review
          </h1>
          <p className="mt-2 text-sm text-muted">
            {PERIOD.label} · three complete months · source: {SOURCE_FILE}
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border border-save/40 bg-save-bg px-3 py-1 text-xs font-medium text-save">
          Recommendation: Controlled transition
        </span>
      </header>

      {/* ================= DECISION REQUESTED ================= */}
      <section aria-label="Decision requested" className="mt-6 grid gap-5 rounded-2xl border border-save/40 bg-navy-raised p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <Eyebrow className="text-save">Decision Requested</Eyebrow>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-ink sm:text-lg">
            Approve evaluation of transitioning SNS customer support from HelpGrid to Help Scout automation and part-time offshore VA
            coverage (Rose), with human escalation for refunds, chargebacks, fulfillment, and product safety issues.
          </p>
          <p className="mt-2 text-xs text-caution">Final cancellation subject to workload verification, operational handoff, and contract review.</p>
          <p className="mt-1 text-xs text-muted">Target handoff to Rose: December 1, 2026, subject to readiness and valid HelpGrid notice.</p>
        </div>
        <div className="border-t border-navy-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted">Estimated annual savings</p>
          <p className="tnum mt-1 whitespace-nowrap text-4xl font-semibold tracking-tight text-save">
            {sav ? `${usd(sav.annualLow)}–${usd(sav.annualHigh)}` : NA}
          </p>
          <p className="mt-1 text-[11px] text-muted-dim">Estimate from the editable budget below</p>
        </div>
      </section>

      {/* ================= KPIs ================= */}
      <section aria-label="Key figures" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="HelpGrid fees, Jul–Sep" value={signedWhole(R.fee.total)} tone="text-neg" sub={`${usd(costs.helpGridMonthly)} a month × 3`} />
        <Kpi label="HelpGrid-attributed sales" value={usd(R.sales.total)} sub="Inbound sales, Jul–Sep (reported)" />
        <Kpi
          label="Modeled contribution after fees"
          value={signedWhole(R.afterFee.total)}
          tone={R.afterFee.total != null && R.afterFee.total < 0 ? "text-neg" : "text-contrib"}
          sub={`At an assumed ${marginPct}% margin. Not verified ROI.`}
        />
        <Kpi
          label="Potential annual savings"
          value={sav ? `${compactK(sav.annualLow)}–${compactK(sav.annualHigh)}` : NA}
          tone="text-save"
          border="border-save/40"
          sub="Lean model below. Estimates, not quotes."
        />
      </section>

      {/* ================= PANEL A: FINANCIAL ================= */}
      <Card className="mt-6 border-t-4 border-t-contrib p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow className="text-contrib">Panel A · Financial justification</Eyebrow>
            <h2 className="mt-1 text-xl font-semibold text-ink">Do HelpGrid's attributed sales cover its fee?</h2>
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="margin" className="flex items-baseline justify-between text-xs text-muted">
              <span>Contribution margin (assumed)</span>
              <span className="tnum text-lg font-semibold text-contrib">{marginPct}%</span>
            </label>
            <input
              id="margin"
              type="range"
              min={MARGIN.min}
              max={MARGIN.max}
              step={MARGIN.step}
              value={marginPct}
              onChange={(e) => setMarginPct(Number(e.target.value))}
              className="mt-1 w-full"
            />
            <p className="text-[10px] leading-snug text-caution">
              Illustrative, not SNS's verified margin. Stands in for COGS, shipping, commissions, payment fees and transaction refunds.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <MonthTable
            caption="HelpGrid-attributed sales, discounts, fees and modeled contribution"
            keys={keys}
            groups={[
              {
                title: "Reported (2026 tab)",
                rows: [
                  { label: "HelpGrid-attributed inbound sales", row: R.sales, fmt: signed, tone: TONE.ink },
                  {
                    label: "Save-the-sale discounts (shown separately)",
                    row: R.discounts,
                    fmt: signed,
                    tone: TONE.caution,
                    note: "Concessions to keep customers. Not deducted: unknown whether inbound sales are already net of them.",
                  },
                  { label: "HelpGrid fee", row: R.fee, fmt: signed, tone: TONE.neg, note: "Management input; confirm against invoice" },
                ],
              },
              {
                title: `Modeled at ${marginPct}% margin (estimate, not verified ROI)`,
                rows: [
                  { label: "Modeled contribution from attributed sales", row: R.contribution, fmt: signed, tone: TONE.contrib, note: "Attributed sales × margin" },
                  { label: "Modeled contribution after HelpGrid fee", row: R.afterFee, fmt: signed, tone: TONE.signed, strong: true, note: "Contribution − HelpGrid fee" },
                  { label: "Break-even attributable revenue", row: R.breakEven, fmt: money, tone: TONE.ink, note: `HelpGrid fee ÷ ${marginPct}% margin` },
                ],
              },
              {
                title: "Unit cost (diagnostic)",
                rows: [
                  {
                    label: "Cost per recorded interaction",
                    row: R.costPerInteraction,
                    fmt: money,
                    tone: TONE.ink,
                    note: "HelpGrid fees ÷ (inbound calls + outbound calls + emails). Interactions vary in effort.",
                  },
                  {
                    label: "HelpGrid fees per inbound call",
                    row: R.feePerInboundCall,
                    fmt: money,
                    tone: TONE.ink,
                    note: "Diagnostic allocation only, not the actual cost of a call. The fee also covers email and other work.",
                  },
                ],
              },
            ]}
          />
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-navy-line bg-navy p-4 sm:grid-cols-3">
          <Stat label="Break-even sales per month" value={usd(R.breakEven.jul)} sub={`${usd(costs.helpGridMonthly)} ÷ ${marginPct}%`} />
          <Stat label="Actual attributed sales per month" value={usd(avgMonthlySales)} sub="3-month average" />
          <Stat
            label="Margin needed to break even"
            value={breakEvenMargin == null ? NA : `${Math.round(breakEvenMargin * 100)}%`}
            tone={breakEvenMargin != null && breakEvenMargin > 1 ? "text-neg" : "text-ink"}
            sub={breakEvenMargin != null && breakEvenMargin > 1 ? "Over 100%: no margin lets these sales cover the fee." : "On every attributed sale"}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          This is modeled contribution, not verified ROI. Attributed sales may not be incremental, since some customers would
          have ordered anyway. Company-wide refunds are not deducted here; they appear in Panel B as workload.
        </p>
      </Card>

      {/* ================= PANEL B: OPERATIONAL ================= */}
      <Card className="mt-6 border-t-4 border-t-caution p-5 sm:p-6">
        <Eyebrow className="text-caution">Panel B · Operational necessity</Eyebrow>
        <h2 className="mt-1 text-xl font-semibold text-ink">What work has to continue, whoever does it?</h2>

        <div className="mt-4">
          <MonthTable
            caption="Support workload by month"
            keys={keys}
            groups={[
              {
                title: "Recorded interactions (CS Volume, by reporting week)",
                rows: [
                  { label: "Inbound phone calls", row: R.inboundCalls, fmt: int },
                  { label: "Outbound phone calls", row: R.outboundCalls, fmt: int, note: "Incl. voicemails, callbacks, follow-ups" },
                  { label: "Emails", row: R.emails, fmt: int, note: "Messages, not unique tickets" },
                  { label: "Total recorded interactions", row: R.interactions, fmt: int, strong: true },
                ],
              },
              {
                title: "Workload indicators",
                rows: [
                  { label: "Refund dollars processed (all SNS)", row: R.refunds, fmt: money, tone: TONE.soft, note: "Workload metric. Not tied to HelpGrid sales and not deducted anywhere." },
                  { label: "Chargeback alerts (count)", row: R.alerts, fmt: int, note: "By alert date. July: none logged." },
                  { label: "Actual chargebacks (count)", row: R.chargebacks, fmt: int, note: "Dispute outcome not recorded" },
                ],
              },
            ]}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="text-sm font-semibold text-ink">Ongoing responsibilities in the proposed model</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {Object.keys(STATUS).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <StatusBadge status={s} /> {count(s)}
              </span>
            ))}
          </div>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {duties.map((d) => (
            <li key={d.name} className="flex flex-col gap-1.5 rounded-xl border border-navy-line bg-navy p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-ink">{d.name}</p>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-xs leading-snug text-muted">{d.evidence}</p>
              <p className="text-[11px] leading-snug text-muted-dim">Plan: <span className="text-ink-soft">{d.plan}</span></p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-dim">Nothing is marked Verified Covered until someone confirms who handles it and how.</p>
      </Card>

      {/* ================= OPERATING MODEL + BUDGET ================= */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Recommended operating model</h2>
          <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            {[
              ["bot", "Help Scout", "Automated answers, order status, routing"],
              ["person", "Rose (offshore VA)", "Callbacks, refunds, everyday exceptions"],
              ["shield", "Escalations", "Chargebacks, safety issues, large refunds"],
            ].map(([icon, title, desc], i, a) => (
              <li key={title} className="flex flex-1 items-center gap-2">
                <div className="flex h-full flex-1 flex-col items-center gap-1.5 rounded-xl bg-navy-raised px-3 py-4 text-center text-ink">
                  <Icon name={icon} />
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-[11px] leading-snug text-muted">{desc}</p>
                </div>
                {i < a.length - 1 && <span aria-hidden="true" className="hidden text-muted sm:inline">→</span>}
              </li>
            ))}
          </ol>

          <div className="mt-5 flex items-end justify-between gap-3 border-t border-navy-line pt-5">
            <div>
              <Eyebrow className="text-muted">Potential annual savings</Eyebrow>
              <p className="tnum mt-1 text-4xl font-semibold tracking-tight text-save">
                {sav ? `${compactK(sav.annualLow)}–${compactK(sav.annualHigh)}` : NA}
              </p>
            </div>
            <span className="rounded-full bg-navy-raised px-3 py-1 text-xs font-semibold text-ink-soft">Estimated</span>
          </div>

          <div className="mt-5 rounded-xl border border-caution/30 bg-caution-bg/40 p-4 text-sm leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Final recommendation:</span> approve an investigation and controlled
            transition from HelpGrid to Help Scout automation, Rose as part-time offshore VA, and escalation coverage, targeting
            December 1. Proceed only after verifying unique tickets, handling time, resolution outcomes, HelpGrid's obligations
            and its termination conditions. Rose's November 5 ticket audit supplies the workload data; Kim (CS Manager) reviews it.
          </div>
          <p className="mt-auto pt-4 text-[11px] leading-relaxed text-muted-dim">
            *Savings come from the editable monthly budget. They are estimates, not vendor quotes, and exclude transition costs.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <Eyebrow>Monthly budget</Eyebrow>
          <h2 className="mt-1 text-lg font-semibold text-ink">Current vs. lean replacement model</h2>
          <p className="mt-1 text-sm text-muted">Edit any assumption and every figure on the page recalculates.</p>
          {!isDefault && (
            <button
              type="button"
              onClick={() => { setCostInputs(defaultCostInputs()); setMarginPct(MARGIN.default); }}
              className="mt-3 rounded-lg border border-navy-line px-3 py-1.5 text-xs text-muted hover:text-ink"
            >
              Reset assumptions
            </button>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-navy-line bg-navy p-4">
              <Eyebrow>Current</Eyebrow>
              <div className="mt-3 grid gap-3">
                <MoneyInput id="hg" label="HelpGrid (full service)" value={costInputs.helpGridMonthly} onChange={setCost("helpGridMonthly")} hint="Management input; confirm against invoice" />
                <MoneyInput id="hs" label="Help Scout (existing)" value={costInputs.helpScoutMonthly} onChange={setCost("helpScoutMonthly")} />
              </div>
              <p className="mt-auto flex items-baseline justify-between border-t border-navy-line pt-3 text-sm text-muted">
                Total <span className="tnum text-xl font-semibold text-ink">{usd(sav?.current)}</span>
              </p>
            </div>
            <div className="flex flex-col rounded-xl border border-navy-line bg-navy p-4">
              <Eyebrow>Proposed (low – high)</Eyebrow>
              <div className="mt-3 grid gap-3">
                <MoneyInput id="hsp" label="Help Scout after cutover (2 seats)" value={costInputs.helpScoutProposed} onChange={setCost("helpScoutProposed")} hint="Per 90-Day plan; verify plan and add-ons" />
                <div className="grid grid-cols-2 gap-2">
                  <MoneyInput id="al" label="Automation low" value={costInputs.automationLow} onChange={setCost("automationLow")} suffix="" />
                  <MoneyInput id="ah" label="Automation high" value={costInputs.automationHigh} onChange={setCost("automationHigh")} suffix="" />
                  <MoneyInput id="vhl" label="Rose hrs/mo low" value={costInputs.vaHoursLow} onChange={setCost("vaHoursLow")} prefix="" suffix="hrs" />
                  <MoneyInput id="vhh" label="Rose hrs/mo high" value={costInputs.vaHoursHigh} onChange={setCost("vaHoursHigh")} prefix="" suffix="hrs" />
                </div>
                <div className="grid grid-cols-2 items-end gap-2">
                  <MoneyInput id="vr" label="Offshore rate" value={costInputs.vaRate} onChange={setCost("vaRate")} suffix="/hr" />
                  <p className="pb-2 text-right text-xs text-muted">
                    Rose cost/mo <span className="tnum block whitespace-nowrap text-sm text-ink">{sav ? `${usd(sav.vaLow)}–${usd(sav.vaHigh)}` : NA}</span>
                  </p>
                </div>
              </div>
              <p className="mt-4 flex items-baseline justify-between border-t border-navy-line pt-3 text-sm text-muted">
                Total <span className="tnum text-xl font-semibold text-ink">{sav ? `${usd(sav.proposedLow)}–${usd(sav.proposedHigh)}` : NA}</span>
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 rounded-xl border border-save/30 bg-save-bg/40 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-save/80">Monthly savings</p>
              <p className="tnum text-2xl font-semibold text-save">{sav ? `${usd(sav.monthlyLow)}–${usd(sav.monthlyHigh)}` : NA}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-save/80">Annual savings</p>
              <p className="tnum text-2xl font-semibold text-save">{sav ? `${usd(sav.annualLow)}–${usd(sav.annualHigh)}` : NA}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-dim">
            Savings = (HelpGrid + current Help Scout) − (Help Scout after cutover + automation + Rose hours × rate). The low case uses the high proposed cost.
          </p>
          <p className="mt-2 rounded-lg border border-caution/30 bg-caution-bg/40 px-3 py-2 text-[11px] leading-relaxed text-caution">
            VA cost assumes that automation resolves a substantial portion of routine inquiries. Actual staffing costs must be
            validated against unique ticket volume, handling time, and escalation requirements.
          </p>
        </Card>
      </section>

      {/* ================= METHODOLOGY ================= */}
      <details className="mt-6 rounded-2xl border border-navy-line bg-navy-panel px-5 py-4">
        <summary className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="chev text-muted transition-transform">›</span> Methodology, sources & assumptions
        </summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted">
          <li>Inbound sales: {FINANCIALS.inboundSales.ref}. Reported as attributed to support; not proven incremental.</li>
          <li>Save-the-sale discounts: {FINANCIALS.savedSales.ref}. Concessions, not recovered revenue. Kept separate because it is unknown whether inbound sales are already net of them.</li>
          <li>Refunds: {FINANCIALS.refunds.ref}. Company-wide SNS refunds, so they are shown only as workload and never deducted from HelpGrid-attributed sales.</li>
          <li>Product-safety refunds: {FINANCIALS.safetyRefunds.ref}.</li>
          <li>Calls and emails: CS Volume tab, “{CS_VOLUME.inbound.title}”, “{CS_VOLUME.outbound.title}” and “{CS_VOLUME.email.title}”, weekly Total column. Each week counts in the month of its Monday start date, matching SNS's weekly reporting: July = weeks of Jul 6–27 (Jul 6–31), August = weeks of Aug 3–31 (Aug 3–Sep 4), September = weeks of Sep 7–28 (Sep 7–Oct 2). Activity months therefore differ slightly from the calendar months used for sales and refunds. Weekends are not recorded.</li>
          <li>Chargebacks: ChargebackAlerts 2026 tab, rows 27–32. Month comes from column B “Chargeback/Alert Date”; column C “Type” separates alerts from actual chargebacks. No deadline or outcome field exists.</li>
          <li>Modeled contribution = attributed sales × assumed margin ({MARGIN.min}–{MARGIN.max}%, default {MARGIN.default}%). Break-even = HelpGrid fee ÷ margin. Three-month unit costs divide total fees by total interactions or total inbound calls, not an average of monthly ratios.</li>
          <li>HelpGrid {usd(COST_DEFAULTS.helpGridMonthly)}/mo and current Help Scout {usd(COST_DEFAULTS.helpScoutMonthly)}/mo are management inputs, not in the workbook. Help Scout after cutover ({usd(COST_DEFAULTS.helpScoutProposed)}/mo, 2 seats) and the Dec 1 handoff to Rose come from the SNS 90-Day Restructuring plan in this repo. Automation ({usd(COST_DEFAULTS.automationLow)}–{usd(COST_DEFAULTS.automationHigh)}) and Rose as offshore VA ({COST_DEFAULTS.vaHoursLow}–{COST_DEFAULTS.vaHoursHigh} hrs/mo at an offshore rate of {usd(COST_DEFAULTS.vaRate)}/hr) are illustrative planning assumptions, not quotes or a verified staffing requirement.</li>
          <li>Not verified: unique tickets, handling time, resolution outcomes, actual COGS and variable costs, incremental sales, HelpGrid's obligations and termination conditions, transition costs.</li>
        </ul>
      </details>
    </div>
  );
}
