# DC Control Tower — Interview Demo Script

## 10-minute walkthrough

Rule #0: **no live typing**. Every surface loads from a preset via URL. Open the tab in Chrome (print-CSS fidelity) and step through in order.

| Time | Surface | What to say | Preset URL |
|---|---|---|---|
| 0:00 – 1:00 | **Home** | *"This is the DC Control Tower. One product, four modules, each tied to a question an AI Head at DAMAC Digital owns."* Walk the KPI strip. Point at the map. | `/` |
| 1:00 – 3:00 | **M1 · Site Intelligence** | *"The board asks: where do we put the next 500 MW in Southeast Asia? M1 runs a multi-agent debate across power, sovereignty, finance, and climate. Watch the reasoning stream."* Click **Export IC Memo** at the end. | `/m1-site-intelligence?preset=m1-sea-500mw` |
| 3:00 – 5:30 | **M2 · Capacity Matcher** | *"A frontier lab sends us a 40 MW B200 RFP. Five minutes to a proposal, not three weeks."* Show the RFP text → extracted fields → facility fit ranking → proposal brief. Emphasize the DAMAC vs Equinix vs Digital Realty comparator. | `/m2-capacity-matcher?preset=m2-anthropic-b200-40mw` |
| 5:30 – 7:30 | **M3 · Ops Control Tower** | *"Zone B at Riyadh just latency-spiked. The Control Tower runs a three-agent RCA debate and forecasts risk for the next 6 hours."* Hit the NL query: *"What's at risk in the next 6 hours?"* | `/m3-ops-tower?preset=m3-zoneb-latency-0417` |
| 7:30 – 9:00 | **M4 · Sovereignty Grid** | *"A Saudi fintech wants to run inference on DAMAC Riyadh — but their customers are in the EU. Where can the model and data actually live?"* Walk the decision tree; export the compliance brief with `cite_id`s. | `/m4-sovereignty?preset=m4-ksa-fintech-eu-data` |
| 9:00 – 10:00 | **Home (again)** | *"Notice KPIs ticked — open incidents decreased, compliance flag cleared. Everything in this product is a URL. Every decision is reproducible. Every citation is grounded."* | `/` |

## 3-minute elevator (if shortened)

Home → M1 preset → M2 preset → close on home.

## Failure-mode playbook

| Failure | Fix |
|---|---|
| Anthropic API 500 mid-demo | In the top bar, flip `MOCK_AGENTS=true` → page reload → canned SSE streams come from cache |
| FastAPI cold-started | The keep-alive cron should prevent this; if it happens, the proxy falls back to a "warming up" banner then retries |
| Print-to-PDF renders wrong | Export dialog offers markdown-only fallback; user can paste into any markdown-to-PDF tool |
| Live network is flaky | Turn on airplane mode, set `MOCK_AGENTS=true`, demo works fully offline |

## Rehearsal checklist (run the night before)

- [ ] `npm run build` and `next start` serve cleanly
- [ ] `uvicorn main:app` on FastAPI returns healthy
- [ ] All 4 presets render end-to-end with `MOCK_AGENTS=false`
- [ ] All 4 presets render end-to-end with `MOCK_AGENTS=true`
- [ ] Every export button produces a valid markdown file
- [ ] Chrome renders print preview with no visual artefacts
- [ ] Deployment URLs (Vercel + Railway) are green
