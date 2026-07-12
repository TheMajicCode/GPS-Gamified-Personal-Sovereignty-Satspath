# Contributing
Builder-to-builder. Read docs/ARCHITECTURE.md first.
- Zero runtime dependencies in gps-core stays true. Node 20+.
- Tests before code on anything touching money math, signatures, or the ledger.
  Every new authority/flow ships with its denial test (see test/gps.test.js).
- Money semantics: integer sats only; sums must equal gross exactly; human-approval
  gate is not removable.
- The interface doc (docs/gps-satspath-interface-v0.md) changes only by versioned PR
  approved by both maintainers.
- Label everything real / stub / sketch. Overclaiming is the only unforgivable bug.
