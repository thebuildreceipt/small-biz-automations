#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { ReceiptSchema, InquirySchema, type Receipt, type Inquiry } from "./schemas.js";
import { checkReceipt, checkInquiry, formatMoney } from "./checks.js";
import { costUsd } from "./cost.js";

const [kind, file, ...flags] = process.argv.slice(2);
if (!["receipt", "inquiry"].includes(kind ?? "") || !file) {
  console.error("Usage: cli.js receipt|inquiry <file.txt> [--dry-run]");
  process.exit(1);
}
const dryRun = flags.includes("--dry-run");
const text = await readFile(file, "utf8");
const started = Date.now();

async function run<T>(schema: Parameters<typeof import("./claude.js").extract>[0], system: string): Promise<{ data: T; receipt: string }> {
  if (dryRun) {
    const data = JSON.parse(await readFile(file.replace(/\.txt$/, ".sample.json"), "utf8")) as T;
    return { data, receipt: "dry run · 0 tokens · $0.00" };
  }
  const { extract } = await import("./claude.js");
  const { data, usage, model } = await extract(schema, system, text);
  const cost = costUsd(model, usage.input_tokens, usage.output_tokens);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  return { data: data as T, receipt: `${model} · ${usage.input_tokens}/${usage.output_tokens} tokens · ${cost === null ? "price unknown" : `$${cost.toFixed(4)}`} · ${secs} s` };
}

if (kind === "receipt") {
  const { data: r, receipt } = await run<Receipt>(
    ReceiptSchema,
    "Extract the receipt into structured data. Amounts in integer cents. If something is unreadable, make your best guess; code will check the math.",
  );
  const problems = checkReceipt(r);
  console.log(`${r.vendor} · ${r.date} · ${formatMoney(r.total_cents, r.currency)}`);
  for (const i of r.line_items) console.log(`  ${i.description}: ${formatMoney(i.amount_cents, r.currency)}`);
  console.log(`  tax: ${formatMoney(r.tax_cents, r.currency)}`);
  console.log(problems.length ? `⚠️ Needs review:\n- ${problems.join("\n- ")}` : "✅ Math and date check out, ready for bookkeeping");
  console.log(`Receipt: ${receipt}`);
} else {
  const { data: i, receipt } = await run<Inquiry>(
    InquirySchema,
    "You help a small service business sort incoming customer emails and draft replies for the owner to approve.",
  );
  const { needsHuman, reasons } = checkInquiry(i);
  console.log(`[${i.category} · ${i.urgency}] ${i.summary}\n\nDraft reply (never auto-sent):\n${i.draft_reply}\n`);
  console.log(needsHuman ? `⚠️ Owner must review:\n- ${reasons.join("\n- ")}` : "✅ Safe to send after a quick read");
  console.log(`Receipt: ${receipt}`);
}
