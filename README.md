# GPS — Generative Payment Splits

**The value-attribution layer of the LUCA / Solaris / Aura stack.**
GPS answers: *who should get paid, how much, and why* — split policies, agreements,
attestations, settlement, receipts. It settles over Bitcoin/Lightning and resolves
recipients through [SatsPath](docs/ARCHITECTURE.md) (or a direct fallback), by design
never depending on any single resolver or rail.

> Status: **v0 scaffold — working code, passing tests, mock rail.** Not production.
> Real Lightning arrives only after the human-gated simulation phase proves splits.

```
GPS (this repo)          — split policies · agreements · settlement · receipts
  ├─ port: SettlementResolver → SatsPath adapter | DirectResolver fallback
  └─ port: PaymentRail        → mock (now) | Lightning testnet (next)
SatsPath (Rodrigo's repo)  — alias → signed profile · route discovery · rail selection
```

## Quickstart
```bash
cd packages/gps-core
node --test        # zero dependencies; Node 20+
node demo.js       # Aura sale → 70/20/10 split → 3 payments → 3 receipts
```

## What's real vs. stubbed
**Real:** Ed25519 identities (did:key), canonical signing, SplitPolicy + Agreement
(sign/verify, tamper-fail), integer-exact split math (largest-remainder), settlement
job with human-approval gate, hash-chained signed receipts, mock rail, direct resolver.
**Stubbed / next:** SatsPath resolver adapter (interface frozen in
[docs/gps-satspath-interface-v0.md](docs/gps-satspath-interface-v0.md)), Lightning rail,
attestation-driven role binding, encrypted counterparty receipts.

## Docs
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — why GPS and SatsPath are separate, layered
- [gps-satspath-interface-v0.md](docs/gps-satspath-interface-v0.md) — the one-page contract (co-author with Rodrigo)
- [satspath-spec-review.md](docs/satspath-spec-review.md) — review + fix-list for the SatsPath draft
- [ROADMAP.md](docs/ROADMAP.md) — 4-week plan to the filmed demo
- [KICKOFF-ISSUE.md](docs/KICKOFF-ISSUE.md) — paste as Issue #1 when Rodrigo joins

## License
MIT. No token, no pre-mine. The spec and receipts belong to users.
