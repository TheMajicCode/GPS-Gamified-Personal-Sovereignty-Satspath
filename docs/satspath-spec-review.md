# SatsPath v1.0 Draft — Review & Fix-List (handoff to Rodrigo)
**Overall: strong instincts, right trust model. Nine fixes before implementation.**

**Keep exactly as-is:** zero custody · "registries are untrusted; signature or nothing" ·
canonical JSON + domain separation (`SatsPathProfileV1`) · Nostr replaceable events +
DNSSEC/BIP-353 fallback · BIP-352 Silent Payments mandated on L1 · local-node-first fee
hierarchy with +10% margin · explicit failure when no rail is safe · key-rotation chains ·
the Claim Engine's Self-Custody Axiom.

**Fixes:**
1. **Relabel.** "v1.0 Production Specification" → *spec-draft v0.x* until a reference
   implementation passes published test vectors. Overclaiming costs credibility exactly
   where this needs to win.
2. **Email alias hashing is brute-forceable** (emails are low-entropy/enumerable).
   Replace bare SHA-256 with HMAC(intent-scoped secret, email) or salted hash. Specify
   the full claim-intent lifecycle: expiry, cancellation, unclaimed cleanup, rate limits
   (anti-spam/phishing mechanics, not just the threat-table mention).
3. **Ark → plugin, not v1 rail.** ASPs are semi-trusted and young; ship
   Lightning + on-chain(SP) first behind a rail-plugin architecture. Re-verify Ark
   ecosystem maturity at implementation time.
4. **Routing constants → RoutePolicy.** "≤100k sats ⇒ Lightning" and "2.0% L1 ceiling"
   are good defaults, not spec law. Make them caller-configurable.
5. **Add the SettlementProof shape** (preimage | txid | ark-proof) — see
   gps-satspath-interface-v0.md §2. GPS needs evidence for receipts.
6. **Endpoint vocabulary:** flatten the lightning object into per-endpoint identifiers
   (`btc-lightning-bolt12`, `btc-lightning-lud16`, `btc-bitcoin-p2tr`, PayKit-style).
   Cleaner, and keeps a future PayKit adapter + Synonym alignment nearly free.
7. **Supersession is client-side law:** relays don't guarantee replaceable-event
   ordering; clients MUST verify updated_at/nonce monotonicity. State it in the spec.
8. **Fee-oracle privacy:** public mempool queries leak interest — prefer local node,
   else Tor + cache.
9. **Identity stays secp256k1-only — good.** DID bridging (Ed25519 did:key/did:pubky)
   lives on the GPS side via identity_link; optional `also_known_as` later.
