import { z } from "zod";

export const ReceiptSchema = z.object({
  vendor: z.string(),
  date: z.string().describe("YYYY-MM-DD"),
  currency: z.string().describe("ISO code, e.g. USD"),
  line_items: z.array(z.object({ description: z.string(), amount_cents: z.number().int() })),
  tax_cents: z.number().int(),
  total_cents: z.number().int(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

export const InquirySchema = z.object({
  category: z.enum(["quote_request", "support", "complaint", "booking", "spam", "other"]),
  urgency: z.enum(["today", "this_week", "whenever"]),
  summary: z.string().describe("One sentence for the owner"),
  draft_reply: z.string().describe("A short, friendly draft reply. Do not quote prices, promise refunds or commit to dates."),
});
export type Inquiry = z.infer<typeof InquirySchema>;
