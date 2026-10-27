/* ------------------------------------------------------------------------
   SNS Customer Support — source data & editable constants.

   Every number the dashboard shows is derived (in calc.js) from the values
   below. Workbook values carry a `ref` (sheet!cell) so they can be audited
   against "Customer Support Operation Tracker.xlsx". Values that are NOT in
   the workbook (vendor costs, margin) are marked as management inputs or
   illustrative assumptions. `null` means "not reported" and is never
   treated as zero.
   ------------------------------------------------------------------------ */

export const SOURCE_FILE = "Customer Support Operation Tracker.xlsx";

export const PERIOD = {
  label: "July–September 2026",
  note: "Three complete calendar months. October 2026 is excluded (incomplete).",
  year: 2026,
  months: [
    { key: "jul", label: "July", short: "Jul", month: 7, col: "H" },
    { key: "aug", label: "August", short: "Aug", month: 8, col: "I" },
    { key: "sep", label: "September", short: "Sep", month: 9, col: "J" },
  ],
};

/* How CS Volume weeks map to months. "weekStart" (SNS's reporting method):
   each week counts in the month of its Monday start date, using the sheet's
   weekly Total column. "calendarDay": each Mon–Fri day counts in its own
   calendar month. */
export const ACTIVITY_METHOD = "weekStart";

/* ---- CS Volume tab --------------------------------------------------------
   Rows are labelled "Week <Mon date>" with Monday–Friday daily counts.
   Week labels carry no year; 2026 is inferred because every label falls on a
   Monday in 2026. Only weeks touching Jul 1 – Sep 30 are listed. Weekend
   activity is not recorded on the sheet. */
export const CS_VOLUME = {
  inbound: {
    title: "Call Stats - Inbound",
    weeks: [
      { week: "2026-06-29", row: 28, days: [2, 2, 1, 0, 0], total: 5 },
      { week: "2026-07-06", row: 29, days: [0, 2, 3, 2, 0], total: 7 },
      { week: "2026-07-13", row: 30, days: [1, 2, 0, 1, 0], total: 4 },
      { week: "2026-07-20", row: 31, days: [0, 0, 0, 0, 2], total: 2 },
      { week: "2026-07-27", row: 32, days: [0, 1, 1, 1, 3], total: 6 },
      { week: "2026-08-03", row: 33, days: [0, 2, 0, 1, 3], total: 6 },
      { week: "2026-08-10", row: 34, days: [0, 2, 3, 0, 0], total: 5 },
      { week: "2026-08-17", row: 35, days: [2, 2, 1, 2, 0], total: 7 },
      { week: "2026-08-24", row: 36, days: [0, 1, 1, 2, 1], total: 5 },
      { week: "2026-08-31", row: 37, days: [0, 0, 1, 0, 3], total: 4 },
      { week: "2026-09-07", row: 38, days: [0, 3, 0, 0, 5], total: 8 },
      { week: "2026-09-14", row: 39, days: [0, 0, 0, 1, 0], total: 1 },
      { week: "2026-09-21", row: 40, days: [1, 0, 0, 1, 0], total: 2 },
      { week: "2026-09-28", row: 41, days: [1, 2, 0, 1, 0], total: 4 },
    ],
  },
  outbound: {
    title: "Call Stats - Outbound (incl. VMs and callback requests/follow-up calls)",
    weeks: [
      { week: "2026-06-29", row: 120, days: [1, 0, 1, 0, 0], total: 2 },
      { week: "2026-07-06", row: 121, days: [2, 1, 3, 0, 0], total: 6 },
      { week: "2026-07-13", row: 122, days: [1, 0, 0, 0, 1], total: 2 },
      { week: "2026-07-20", row: 123, days: [0, 0, 0, 0, 1], total: 1 },
      { week: "2026-07-27", row: 124, days: [0, 0, 1, 0, 2], total: 3 },
      { week: "2026-08-03", row: 125, days: [1, 0, 1, 2, 0], total: 4 },
      { week: "2026-08-10", row: 126, days: [1, 9, 5, 3, 1], total: 19 },
      { week: "2026-08-17", row: 127, days: [0, 0, 1, 0, 0], total: 1 },
      { week: "2026-08-24", row: 128, days: [0, 0, 2, 2, 1], total: 5 },
      { week: "2026-08-31", row: 129, days: [2, 0, 1, 0, 4], total: 7 },
      { week: "2026-09-07", row: 130, days: [0, 0, 0, 0, 5], total: 5 },
      { week: "2026-09-14", row: 131, days: [0, 1, 0, 1, 1], total: 3 },
      { week: "2026-09-21", row: 132, days: [0, 1, 0, 0, 0], total: 1 },
      { week: "2026-09-28", row: 133, days: [0, 0, 1, 0, 0], total: 1 },
    ],
  },
  email: {
    title: "Email Stats",
    weeks: [
      { week: "2026-06-29", row: 74, days: [31, 21, 17, 15, 12], total: 96 },
      { week: "2026-07-06", row: 75, days: [30, 30, 18, 16, 17], total: 111 },
      { week: "2026-07-13", row: 76, days: [42, 23, 31, 30, 20], total: 146 },
      { week: "2026-07-20", row: 77, days: [30, 22, 20, 20, 19], total: 111 },
      { week: "2026-07-27", row: 78, days: [30, 19, 20, 34, 22], total: 125 },
      { week: "2026-08-03", row: 79, days: [34, 22, 17, 17, 17], total: 107 },
      { week: "2026-08-10", row: 80, days: [33, 32, 24, 20, 33], total: 142 },
      { week: "2026-08-17", row: 81, days: [36, 21, 20, 20, 15], total: 112 },
      { week: "2026-08-24", row: 82, days: [28, 26, 17, 16, 17], total: 104 },
      { week: "2026-08-31", row: 83, days: [33, 24, 13, 18, 21], total: 109 },
      { week: "2026-09-07", row: 84, days: [29, 22, 23, 34, 12], total: 120 },
      { week: "2026-09-14", row: 85, days: [38, 31, 24, 24, 19], total: 136 },
      { week: "2026-09-21", row: 86, days: [39, 23, 19, 20, 22], total: 123 },
      { week: "2026-09-28", row: 87, days: [23, 32, 27, 34, 21], total: 137 },
    ],
  },
};

/* ---- 2026 tab (SNS rows only; customer-service figures, NOT total SNS revenue) ---- */
export const FINANCIALS = {
  inboundSales: {
    label: "Inbound sales revenue",
    ref: "2026!H4:J4 (Inbound Sales › SNS)",
    values: { jul: 1465.92, aug: 460.85, sep: 923.38 },
  },
  savedSales: {
    // Confirmed by SNS: discounts/concessions given to keep a customer, not
    // recovered revenue. Whether inbound sales are already net of them is unknown.
    label: "Save-the-sale discounts",
    ref: "2026!H9:J9 (Save the sales per Brand › SNS)",
    values: { jul: 273.08, aug: 458.77, sep: 171.99 },
    // Component rows, used to check the hardcoded September total (J9 = 171.99).
    components: {
      jul: { "No Result": 49.0, "Missing order": 24.5, "Shipping Fee": 39.98, "Change of mind": 68.5, "Transit Issue": 58.06, Tax: 33.04 },
      aug: { "Adverse Effect/ Negative Effect": 166.97, "Change of mind": 291.8 },
      sep: { "Duplicate Order/Upsell": 49.0, "Shipping Fee": 19.99, "Cancelled via Self Service Look up": 103.0 },
    },
  },
  refunds: {
    label: "Refund dollars (all SNS refunds logged)",
    ref: "2026!H52:J52 (Refunds per Brand › SNS); ties to H105:J105",
    values: { jul: 1968.21, aug: 1231.73, sep: 1615.98 },
  },
  // Refund-reason rows used as product-safety workload evidence.
  safetyRefunds: {
    ref: "2026!H54:J55 (Doctor's Advise; Adverse Effect/ Negative Effect)",
    values: { jul: 186.75 + 268.89, aug: 0, sep: 232.75 },
  },
};

/* ---- ChargebackAlerts 2026 tab ---------------------------------------------
   Month = column B "Chargeback/Alert Date" (event date), not order date.
   Column C "Type" separates alerts from actual chargebacks. The log has no
   deadline, outcome or won/lost field. Rows 27–32 are the only Jul–Sep events. */
export const CHARGEBACK_LOG = [
  { row: 25, eventDate: "2026-06-15", type: "Chargeback Alert", amount: 58.99 },
  { row: 26, eventDate: "2026-06-15", type: "Chargeback Alert", amount: 49.0 },
  { row: 27, eventDate: "2026-08-03", type: "Chargeback Alert", amount: 96.8 },
  { row: 28, eventDate: "2026-08-03", type: "Chargeback Alert", amount: 86.89 },
  { row: 29, eventDate: "2026-08-07", type: "Chargeback", amount: 104.22 },
  { row: 30, eventDate: "2026-08-09", type: "Chargeback Alert", amount: 5.31 },
  { row: 31, eventDate: "2026-08-24", type: "Chargeback Alert", amount: 61.93 },
  { row: 32, eventDate: "2026-09-02", type: "Chargeback Alert", amount: 89.94 },
];

/* ---- Management inputs (NOT in the workbook; not vendor quotes) ---- */
export const COST_DEFAULTS = {
  helpGridMonthly: 1496, // current HelpGrid fee, per management; invoice not verified
  helpScoutMonthly: 162, // existing Help Scout subscription, per management
  automationLow: 50, // estimate, not a quote
  automationHigh: 150,
  // Part-time VA: illustrative planning assumption, not a verified staffing
  // requirement. 20–40 hrs × $10/hr = $200–$400/mo.
  vaHoursLow: 20,
  vaHoursHigh: 40,
  vaRate: 10, // offshore VA rate (SNS confirmed offshore staffing)
};

/* ---- Illustrative contribution margin (NOT a verified SNS margin) ----
   Real COGS, shipping, commissions, payment fees and transaction-related
   refunds are not in the workbook, so contribution is modeled as
   attributed sales × margin. */
export const MARGIN = { min: 20, max: 80, step: 1, default: 45 };
