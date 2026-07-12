# Shared test vectors (GPS ⇄ SatsPath)
Authored jointly in week 1. Both implementations must pass all vectors before
integration. Format: one JSON file per vector, `expected` field states the required
outcome. V1–V3 specified in docs/gps-satspath-interface-v0.md §5.

`gps-agreement-70-20-10.json` (below) is a GPS-side vector: the canonical Agreement
split math — any implementation of computeAmounts must reproduce `expected_amounts`
exactly for `gross_sat`.
