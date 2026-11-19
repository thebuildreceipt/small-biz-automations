import { test } from "node:test";
import assert from "node:assert/strict";
import { checkReceipt, checkInquiry, formatMoney } from "../src/checks.js";
import type { Receipt, Inquiry } from "../src/schemas.js";

const receipt: Receipt = {
  vendor: "Shop",
  date: "2026-11-14",
  currency: "USD",
  line_items: [
    { description: "a", amount_cents: 1398 },
    { description: "b", amount_cents: 1149 },
    { description: "c", amount_cents: 425 },
  ],
  tax_cents: 245,
  total_cents: 3217,
};
const today = new Date("2026-11-19T00:00:00Z");

test("a correct receipt passes", () => {
  assert.deepEqual(checkReceipt(receipt, today), []);
});

test("catches math that doesn't add up (the model misread a digit)", () => {
  const p = checkReceipt({ ...receipt, total_cents: 3271 }, today);
  assert.ok(p.some((x) => x.includes("≠ total")));
});

test("tolerates a 1-cent rounding difference", () => {
  assert.deepEqual(checkReceipt({ ...receipt, total_cents: 3218 }, today), []);
});

test("catches future dates, bad formats and bad currency", () => {
  assert.ok(checkReceipt({ ...receipt, date: "2027-01-01" }, today).some((x) => x.includes("future")));
  assert.ok(checkReceipt({ ...receipt, date: "11/14/2026" }, today).some((x) => x.includes("YYYY-MM-DD")));
  assert.ok(checkReceipt({ ...receipt, currency: "$" }, today).some((x) => x.includes("ISO")));
});

const inquiry: Inquiry = { category: "quote_request", urgency: "this_week", summary: "s", draft_reply: "Thanks! We'd be happy to take a look." };

test("a plain draft is safe to send after a read", () => {
  assert.equal(checkInquiry(inquiry).needsHuman, false);
});

test("drafts that quote prices or promise refunds go to a human", () => {
  assert.equal(checkInquiry({ ...inquiry, draft_reply: "It starts at $95." }).needsHuman, true);
  assert.equal(checkInquiry({ ...inquiry, draft_reply: "We'll refund you." }).needsHuman, true);
});

test("complaints and urgent emails always go to a human", () => {
  assert.equal(checkInquiry({ ...inquiry, category: "complaint" }).needsHuman, true);
  assert.equal(checkInquiry({ ...inquiry, urgency: "today" }).needsHuman, true);
});

test("formats cents as money", () => {
  assert.equal(formatMoney(3217, "USD"), "USD 32.17");
});
