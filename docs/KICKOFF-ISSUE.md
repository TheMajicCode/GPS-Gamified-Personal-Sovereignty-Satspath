# Issue #1 — Kickoff: interface co-sign + vectors (week 1)
**Assignees:** @majic @rodrigo

Welcome! This repo is GPS — the value-attribution layer. Your SatsPath is the
resolver/router underneath. The layering follows docs/ARCHITECTURE.md (your diagram).

**This week:**
- [ ] Rodrigo: read docs/satspath-spec-review.md — accept/contest each of the 9 items
- [ ] Both: finalize docs/gps-satspath-interface-v0.md and co-sign (PR with both approvals)
- [ ] Both: author test-vectors V1–V3 in /test-vectors (valid profile, tampered profile,
      expired profile + one RouteRequest→rail expectation)
- [ ] Rodrigo: repo link for satspath-core once scaffolded
- [ ] Majic: wire gps-core into the LUCA scaffold Passport view
- [ ] Both: pick the demo date (end of week 4) and the open-question answers (ROADMAP §Open)

**Ground rules (from LUCA doctrine):** claims match test results; explicit errors, no
silent fallbacks; the interface doc is the only coupling; either side must keep working
without the other (DirectResolver proves it on the GPS side).
