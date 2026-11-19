/**
 * Code checks around the model. The model reads messy text well; code is better at
 * arithmetic, dates and "never do X" rules. Anything that fails a check goes to a human.
 */
import type { Receipt, Inquiry } from "./schemas.js";

export function checkReceipt(r: Receipt, today = new Date()): string[] {
  const problems: string[] = [];
  const items = r.line_items.reduce((sum, i) => sum + i.amount_cents, 0);
  if (Math.abs(items + r.tax_cents - r.total_cents) > 1)
    problems.push(`Items (${items}) + tax (${r.tax_cents}) ≠ total (${r.total_cents}) cents`);
  if (r.total_cents <= 0) problems.push("Total is zero or negative");
  const d = new Date(`${r.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(d.getTime())) problems.push(`Date "${r.date}" is not YYYY-MM-DD`);
  else if (d.getTime() > today.getTime()) problems.push(`Date ${r.date} is in the future`);
  if (!/^[A-Z]{3}$/.test(r.currency)) problems.push(`Currency "${r.currency}" is not an ISO code`);
  return problems;
}

/** Phrases a small business should never send without a human reading them first. */
const RISKY: [RegExp, string][] = [
  [/\$\s?\d|\d+\s?(usd|dollars?)/i, "quotes a price"],
  [/refund/i, "mentions a refund"],
  [/guarantee/i, "makes a guarantee"],
  [/discount|\bfree\b/i, "offers a discount or something free"],
  [/we will (fix|deliver|ship)|we can come by|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, "commits to a date or result"],
];

export function checkInquiry(i: Inquiry): { needsHuman: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (i.category === "complaint") reasons.push("Complaints always go to a human");
  if (i.urgency === "today") reasons.push("Marked urgent");
  for (const [re, label] of RISKY) if (re.test(i.draft_reply)) reasons.push(`Draft ${label}`);
  return { needsHuman: reasons.length > 0, reasons };
}

export const formatMoney = (cents: number, currency: string) => `${currency} ${(cents / 100).toFixed(2)}`;
