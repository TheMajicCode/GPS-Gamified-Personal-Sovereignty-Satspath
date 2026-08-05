# Security model

## Boundaries

The browser is untrusted and holds no LND credentials. Next.js route handlers validate state and approval server-side. `gps-settlement` owns orchestration and idempotency; `gps-storage` owns durable SQLite state; `lightning-lnd` alone reads TLS/macaroons and executes payments. GPS domain objects never contain wallet credentials. SatsPath is not implemented and a future adapter may only resolve verified recipient capabilities, never generate invoices or control funds.

The application protects against accidental mainnet use, obvious invalid invoices, duplicate local payment hashes, repeated HTTP execution, skipped approval, fee/amount limit bypass, and silent loss of payment state. A payment attempt is inserted before LND is called. Existing hashes are tracked, not resent. TLS uses the configured CA certificate; certificate verification is never disabled. Errors redact known credentials and long hexadecimal secrets.

It does not make sequential payments atomic, guarantee route availability, protect a compromised LND host, prove a recipient's off-application identity, replace operating-system file permissions, or make an unaudited UI a security boundary. A successful early payment cannot be rolled back when a later payment fails. That outcome is explicitly `PARTIALLY_SETTLED` and requires manual handling.

The restricted macaroon needs only `info:read`, `offchain:read`, and `offchain:write`. Theft of it can expose payment information and authorize off-chain spending within node-side constraints, so protect it with filesystem permissions, rotation, network isolation, and application amount/fee caps. The mainnet lock is defense in depth, not a substitute for a dedicated testnet node.

Receipts preserve signed agreement context, payment/invoice hashes, evidence, fees, and previous hashes. Ledger verification detects body modification and reordering for the in-process ledger. Export and back up the SQLite database and signing identity together in a production successor; this MVP keeps the signing identity in server memory and therefore cannot reconstruct old in-memory ledger verification after a cold restart. That limitation must be resolved with secure key storage before production use.
