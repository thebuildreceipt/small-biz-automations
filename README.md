# small-biz-automations

AI automations a small business will actually pay for, each built the same way: **one model call to read messy input, code checks around it, and a human for anything risky.** Every run prints what it cost.

From the video **"4 AI Automations I'd Sell to Small Businesses (Built, Costed, Priced)"** by The Build Receipt.

| # | Automation | Who buys it | Repo |
|---|---|---|---|
| 1 | **Receipt → bookkeeping data**, with the math checked in code | Any business drowning in paper receipts | this repo (`receipt`) |
| 2 | **Customer email triage + draft replies** that never auto-send prices or promises | Trades, clinics, agencies | this repo (`inquiry`) |
| 3 | **GitHub issue triage** with a prompt-injection guard | Software companies, open-source maintainers | [issue-receipt](https://github.com/thebuildreceipt/issue-receipt) |
| 4 | **Video/podcast repurposing**: titles, chapters, clips, newsletter | Creators, marketing agencies | [video-receipt](https://github.com/thebuildreceipt/video-receipt) |

## Try it free

```bash
npm install
npm test     # 8 tests for the checks
npm run demo # dry runs of both automations, no API key needed
```

The demo shows the checks doing their job: the receipt math is verified, and a draft reply that quotes "$95" and "Thursday" is held for the owner instead of being sent.

## Run for real

Set `ANTHROPIC_API_KEY` (with a spend limit), then:

```bash
node dist/src/cli.js receipt path/to/receipt.txt
node dist/src/cli.js inquiry path/to/email.txt
```

## The pattern

1. **The model reads.** It's good at messy receipts and rambling emails.
2. **Code checks.** Items + tax = total? Date not in the future? Draft mentions a price, refund or date? Code is better than a model at arithmetic and "never do X".
3. **Humans approve.** Anything that fails a check goes to a person. Nothing is auto-sent.

That pattern is what makes these sellable: the client trusts it because it knows when to ask.

MIT License
