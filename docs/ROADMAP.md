# Roadmap — to the filmed demo and beyond
**The demo (the convergence artifact):** an Aura sale → 70/20/10 Agreement → three
resolutions → three payments → three signed receipts in three ledgers → visible in the
Passport. One film = GPS story + SatsPath launch + the Synonym conversation opener.

## Week 1 — working session (Majic + Rodrigo)
- Walk docs/satspath-spec-review.md; Rodrigo relabels + patches the draft.
- Co-sign docs/gps-satspath-interface-v0.md; write test-vectors V1–V3 together.
- Agree endpoint vocabulary (PayKit-style identifiers).

## Weeks 2–3 — parallel builds (the interface is the only sync point)
- **Rodrigo:** satspath-core (canonical JSON, Schnorr, profile verify) + Nostr resolver;
  router with Lightning + Silent Payments only; passes vectors.
- **GPS (this repo):** wire gps-core into the LUCA scaffold; Passport shows Agreements +
  Receipts; SatsPathResolver adapter stub compiled against the interface; everything
  keeps running on DirectResolver + MockRail (B2: GPS never blocks on SatsPath).

## Week 4 — integration
- Swap SatsPathResolver in; end-to-end on Lightning **testnet**; film the demo.

## Later (ordered)
BIP-353 publication · encrypted counterparty receipts · idempotent settlement retries
(at-least-once with dedupe by agreement_id+row — currently fail-fast, see settlement.js)
· attestation-driven role binding (v1) · rule-based split proposals (v1.5) ·
batch RouteRequest API (Rodrigo-side optimization) · PayKit adapter · Ark plugin ·
automated fair attribution (research track — never claimed early).

## Open questions (decide together, log answers here)
1. Where does payment *execution* live — SatsPath router or wallet-side with SatsPath
   quoting only? (Interface supports both; pick one for the demo.)
2. Recipient notification of receipts: push over Nostr DM vs. pull.
3. Refund/clawback semantics when a later split row fails after earlier rows paid
   (v0 fail-fast makes this rare but not impossible under at-least-once retries).
