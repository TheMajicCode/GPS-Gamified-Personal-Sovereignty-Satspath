# GPS × SATSPATH — Architecture Decision, Spec Review & Build Plan
**Decision: build them SEPARATELY, layered — exactly as the diagram shows. GPS on top, SatsPath underneath, one thin interface between them.**
**Supersedes-in-part:** SATSPATH-PROTOCOL.md (my v0) — its splits-in-profile design moves into GPS; its publication/QR/PayKit-vocabulary ideas get contributed to Rodrigo's spec.
**Doctrine:** B1 (SatsPath behind a port), B2 (GPS must work without SatsPath), B3 (GPS objects are ours), C4 (relabel "production v1.0" honestly), C5 (this doc is the artifact for the Rodrigo working session).

---

## 1. The decision, in plain language

Two different jobs were hiding inside one name:

- **SatsPath (Rodrigo's protocol)** answers: *"Given one person's name, what's the best road to pay them right now?"* — resolve a human-readable alias to a signed payment profile, then route over the optimal rail (Lightning / on-chain Silent Payments / Ark). It's the address book + navigation system. One payer → one payee → best road.
- **GPS (LUCA's heart)** answers: *"Who should get paid, how much, and why?"* — split policies, agreements, contribution attestations, receipts, business logic. It's the accountant + the contract. It then asks SatsPath for directions to each recipient, N times.

**Why separate wins (pros):**
1. **Different rates of change.** Payment rails evolve fast and deep (BOLT12, BIP-352, Ark, fee markets) — that's Bitcoin plumbing, Rodrigo's domain. Attribution semantics evolve with your business (agreements, roles, attestations) — that's LUCA's domain. Coupling them means every rail upgrade risks your value logic and vice versa.
2. **Adoption physics.** A wallet or BTCPay/POS developer will adopt a *neutral universal resolver*. They will not adopt one with someone else's value-split opinions welded in. SatsPath's reach is maximized by staying minimal — and every SatsPath user then becomes GPS-reachable for free. GPS rides SatsPath's network effects instead of throttling them.
3. **Correct semantics.** Splits are *contextual*, not global: Aura's split on a dental package ≠ its split on a referral bounty ≠ a tourism booking. So split policy belongs with the **transaction context** (a GPS Agreement), not the **identity profile** (a SatsPath profile). My earlier spec put a global `splits[]` in the profile — the diagram's layering fixes that, and it's right. (Podcasting 2.0 value blocks work as payee-declared splits only because the episode IS the context; our "episode" is the Agreement.)
4. **Clean collaboration.** Rodrigo owns a real, standalone open-source project with its own community potential. LUCA owns its differentiated heart. One versioned interface between you; no stepping on each other.
5. **Doctrine compliance.** GPS treats SatsPath as an adapter behind a `SettlementResolver` port with a fallback (direct LNURL/BOLT12 from contact records) — so GPS *integrates with* SatsPath but does not *depend on* it. Even Rodrigo's project is never load-bearing (B2). That's the honest answer to "will building on SatsPath lock us in": not if the port + fallback exist from day one.

**Cons of separate (accepted, mitigated):** two specs to maintain; an interface contract that must stay stable; coordination drift risk. Mitigation: a one-page versioned interface doc + shared test vectors, agreed in week 1 (§4).

**Cons of together (why rejected):** slower SatsPath adoption; rail changes destabilize value logic; the global-splits semantic error above; and a solo/dual team maintaining one mega-spec instead of two clean ones.

## 2. Review of Rodrigo's spec (satspath v1.0 PDF) — strengths first

**Genuinely strong:**
- **Zero custody + "registries are untrusted; signature or nothing"** — exactly the right trust model.
- **Canonical JSON + domain separation** (`SatsPathProfileV1` prefix before hashing) — prevents cross-protocol signature replay; most drafts forget this.
- **Nostr replaceable events for profile storage + DNSSEC/BIP-353 fallback** — right primary network, right legacy bridge.
- **BIP-352 Silent Payments mandated for L1** (address reuse prohibited) — strong privacy default.
- **Fee hierarchy: local node RPC first → mempool API, +10% safety margin; explicit failure when no rail meets safety bounds** — sober engineering.
- **Key-rotation chains with dual signatures; threat-model table** — mature instincts.
- **The Claim Engine** (pay an email, funds stay in sender custody until recipient self-generates keys and publishes) with the Self-Custody Axiom — clever, and the axiom is stated exactly right.

**Gaps and risks to hand Rodrigo (the critique list):**
1. **Relabel "v1.0 Production Specification."** Nothing has test vectors or an implementation yet. Per our C4 rule, call it *spec-draft v0.x* until a reference implementation passes published vectors. Overclaiming costs credibility in exactly the community this needs to win.
2. **Email alias hashing is weak.** SHA-256 of an email is trivially brute-forceable (emails are low-entropy, enumerable). Salt the hash with an intent-scoped nonce, or use HMAC(intent_secret, email). Also specify the **intent lifecycle**: expiry, cancellation, what the sender's client does with never-claimed intents, and rate-limiting so claim links don't become a spam/phishing vector (the threat table names phishing; the spec needs the mechanics).
3. **secp256k1-only identity.** Fine for the Bitcoin/Nostr world SatsPath serves. LUCA is dual-stack (Ed25519 did:key / did:pubky too). Don't force that into SatsPath — instead: GPS holds the `identity_link` mapping (we already have signed identity_link ledger entries), and optionally SatsPath adds an `also_known_as` field later. The bridge lives on our side; his spec stays clean.
4. **Ark as a first-class v1 rail is heavy.** Ark ASPs are semi-trusted, round-based, young. Recommend a **rail-plugin architecture**: ship Lightning + on-chain(SP) first; Ark as a plugin when the ecosystem hardens. (Re-verify Ark maturity before implementation — it moves fast.)
5. **Routing constants should be policy, not spec.** "Under 100,000 sats → Lightning" and "2.0% L1 fee ceiling" are sensible defaults but must be configurable `RoutePolicy`, not hard-coded law.
6. **No proofs/receipts interface.** GPS needs settlement evidence. Specify what the router returns: Lightning preimage, L1 txid, (Ark proof) — a `SettlementProof` shape. GPS wraps those into signed Receipts in the ledger (and later encrypted receipts, PayKit-style).
7. **Endpoint vocabulary harmonization.** The profile lumps lud16/lnurl/bolt12 in one `lightning` object. Suggest the PayKit-style flat identifier convention (`btc-lightning-bolt12`, `btc-bitcoin-p2tr`) — it's cleaner, and it keeps a future PayKit adapter and the Synonym conversation nearly free.
8. **Supersession rule client-side.** Replaceable Nostr events aren't guaranteed by relays; clients must verify `updated_at`/nonce monotonicity themselves — say so explicitly.
9. **Fee-oracle privacy note.** Querying public mempool APIs leaks interest; prefer local node, else fetch over Tor and cache.

## 3. The layered architecture (final)

```
LUCA (identity DIDs · vault · capabilities · ledger)
        │
┌───────▼────────────────────────────────────────────┐
│  GPS — LUCA's economic heart (ours, in the scaffold)│
│  SplitPolicy · Agreement · Attestations ·           │
│  SettlementJob · Receipts · business logic          │
└───────┬───────────────────────────────┬────────────┘
   port: SettlementResolver        port: PaymentRail
        │  (adapter: SatsPath;          │  (mock → Lightning;
        │   fallback: DirectResolver)   │   proofs back to GPS)
┌───────▼────────────────────────────────────────────┐
│  SATSPATH — Rodrigo's open protocol                 │
│  alias → signed profile (Nostr/NIP-05, BIP-353)     │
│  route discovery · rail selection · fee engine      │
└───────┬────────────────────────────────────────────┘
   Lightning (BOLT12/LNURL) · On-chain BIP-352 · (Ark later)
Wallets / POS / BTCPay integrate SatsPath directly (their keys, their funds) —
every integration makes GPS-reachable payees, without knowing GPS exists.
```

## 4. The interface contract (the ONLY coupling — one page, week 1)
`gps-satspath-interface-v0.md`, co-signed, versioned, with shared test vectors:
- `resolve(alias | pubkey) → SignedPaymentProfile` (verified or explicit error)
- `quote(RouteRequest{recipient_profile, amount_sat, policy}) → RouteQuote{rail, est_fee, expiry}`
- `pay(RouteQuote) → SettlementProof{rail, preimage|txid, amount, ts}`  *(execution may live wallet-side; the proof shape is what GPS needs)*
- Error taxonomy + the client-side supersession rule.
GPS calls resolve/quote/pay once **per recipient** in v0 (sequential, payer-side). A batch API is a later optimization on Rodrigo's side, not a v0 requirement.

## 5. GPS tech spec (our side — objects that live in the vault/ledger)
- **SplitPolicy** *(template)*: `{policy_id, owner_did, context_type: service|referral|booking|…, roles:[{role, weight}], constraints, sig}` — e.g., Aura dental package: provider 70 / referrer 20 / community 10.
- **Agreement** *(the value block of a transaction)*: `{agreement_id, policy_ref+version_pin, bindings:[{role, did}], amount_rule, parties_sigs, ts}` — pins weights at agreement time; endpoints resolve fresh at settlement (fixes the "recipient rug" and "stale profile" cases cleanly).
- **ContributionAttestation**: the signed VCs already spec'd — they *fill roles* in Agreements (v1) and later *propose* Agreements (v1.5 rule-based; automated attribution stays the research track).
- **SettlementJob**: `on payment_event(agreement, gross): compute per-recipient amounts → for each: resolver.resolve(did→alias/pubkey via identity_link) → rail.pay → collect SettlementProof → ledger.append(Receipt)` — capability-gated (pay caps + AP2 mandate ceilings, human gate per Phase-3 discipline).
- **Receipt**: signed ledger entry per recipient + one aggregate; exportable with the vault; encrypted counterparty receipts in v1.
- **Ports:** `SettlementResolver` (impls: `SatsPathResolver`, `DirectResolver` — contact-record lud16/bolt12 fallback) and the existing `PaymentRail` (mock → Lightning testnet → mainnet).

## 6. Build plan (parallel tracks, one integration point)
**Week 1 — the working session with Rodrigo:** hand over §2 critique; co-write the §4 interface + test vectors; agree vocabulary (§2.7); he relabels the spec draft; we both commit to the demo (below).
**Weeks 2–3 —**
- *Rodrigo:* `satspath-core` (canonical JSON, Schnorr, profile verify) + Nostr resolver; router with LN + SP only; publishes vectors.
- *LUCA:* GPS objects in the scaffold (TS, per B9): SplitPolicy/Agreement/SettlementJob/Receipt on the **mock rail** with `DirectResolver`; Passport shows Agreements + Receipts. *(GPS is fully demoable before SatsPath is even wired — that's B2 working.)*
**Week 4 — integration:** swap in `SatsPathResolver`; end-to-end on Lightning **testnet**.
**The demo (the artifact):** an Aura sale → Agreement (70/20/10) → three resolutions → three payments → three signed receipts landing in three ledgers → shown in the Passport. Filmed. This is the GPS story made visible, and the SatsPath launch demo, in one.
**Later:** BIP-353 publication; encrypted receipts; PayKit adapter (near-free after §2.7); batch route API; Ark plugin; then the Synonym spec-alignment conversation from peer posture.

## 7. What changed vs. my previous SatsPath doc (owning it)
The earlier SATSPATH-PROTOCOL.md put `splits[]` inside the identity profile. Rodrigo's layering is better for the three reasons in §1 (change-rate, adoption, context-correct semantics). What survives from that doc and moves where it belongs: PayKit endpoint-identifier adoption → contributed to Rodrigo's spec; Passport QR sharing → stays ours (the QR carries alias/pubkey + optional profile snapshot); multi-transport publication list → merged into his resolver roadmap; the splits design → reborn as GPS SplitPolicy/Agreement, where context lives. Archive the old doc with a superseded-in-part note.
