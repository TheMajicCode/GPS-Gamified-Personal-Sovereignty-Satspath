# GPS ⇄ SatsPath Interface — v0 (DRAFT, to be co-signed)
**Status:** draft for the week-1 working session. This one page is the ONLY coupling
between the two protocols. Changes require a version bump agreed by both maintainers.
**Maintainers:** Majic (GPS) · Rodrigo (SatsPath)

## 1. Calls (GPS → SatsPath)
```
resolve(alias | pubkey) -> SignedPaymentProfile | ResolveError
quote(RouteRequest)     -> RouteQuote | RouteError
pay(RouteQuote)         -> SettlementProof | PayError      # execution MAY live wallet-side;
                                                            # the proof shape is the contract
```

## 2. Shapes
```jsonc
// SignedPaymentProfile — per SatsPath spec; GPS verifies sig before use.
// GPS additionally requires client-side supersession: reject if updated_at/nonce
// is older than a previously seen profile for the same identity.

// RouteRequest
{ "recipient_profile": { /* verified profile */ },
  "amount_sat": 70001,
  "policy": { "prefer": ["lightning","onchain"], "max_l1_fee_pct": 2.0 } }

// RouteQuote
{ "rail": "lightning|onchain|ark", "endpoint_id": "btc-lightning-bolt12",
  "est_fee_sat": 12, "expires_at": 1773280000, "quote_id": "..." }

// SettlementProof  (what GPS wraps into a signed Receipt)
{ "rail": "lightning", "evidence": { "preimage": "..." },   // or { "txid": "..." }
  "amount_sat": 70001, "ts": 1773280012, "quote_id": "..." }
```

## 3. Errors (taxonomy)
`NOT_FOUND · BAD_SIGNATURE · EXPIRED_PROFILE · NO_VIABLE_RAIL · QUOTE_EXPIRED · PAYMENT_FAILED{detail}`
Every error is explicit; silent fallback is forbidden on both sides.

## 4. Identity bridging
SatsPath identities are secp256k1 (Nostr). GPS Agreements bind **DIDs** (did:key /
did:nostr / did:pubky). The mapping DID→alias/pubkey lives on the GPS side via signed
`identity_link` ledger entries. SatsPath stays clean of DID methods.

## 5. Test vectors (shared, versioned in /test-vectors)
- V1: a signed profile (valid) + the same profile with one flipped byte (must fail).
- V2: RouteRequest at 70,001 sats with a lightning-capable profile → expected rail
  = lightning under default policy.
- V3: expired profile → EXPIRED_PROFILE.
Both implementations must pass all vectors before integration week.

## 6. Non-goals of this interface
Splits, agreements, attestations, receipts semantics (GPS-side). Key custody, channel
management, fee-oracle internals (SatsPath/wallet-side).
