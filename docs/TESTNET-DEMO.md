# GPS Testnet Console demo

GPS Testnet Console is a human-approved, testnet-only orchestrator. A settlement is a sequence of independent payments and can finish partially.

## Requirements and mock mode

Install Node 20+ and pnpm, then run:

```bash
cp .env.example .env
pnpm install
GPS_PAYMENT_MODE=mock pnpm dev
```

Open `http://localhost:3000`. The seeded **Aura Test Sale** is 100,001 sats split 70,001 / 20,000 / 10,000. Type `TESTNET`, approve, then execute. All results say Mock payment and no funds move. For a development reset, stop the server and remove `data/gps-testnet.db*`, then restart; never do this against audit data you need to retain.

## LND testnet

LND must be fully configured for Bitcoin testnet, synchronized, funded with testnet sats, and have sufficient outbound liquidity. Copy `.env.example` to `.env`, set `GPS_PAYMENT_MODE=testnet`, absolute credential paths, limits, timeout, and `DATABASE_URL`. The application refuses mainnet or an indeterminate network.

Create a restricted macaroon on the LND host (adjust paths for your installation):

```bash
lncli --network=testnet bakemacaroon --save_to=gps-testnet.macaroon \
  info:read offchain:read offchain:write
```

These permissions cover node information, invoice decode/payment tracking, and Router payment execution. The application does not request invoice, on-chain, address, signer, peer, or macaroon administration permissions. Do not use `admin.macaroon`.

Start with:

```bash
GPS_PAYMENT_MODE=testnet pnpm dev
```

Obtain one BOLT11 testnet invoice from each recipient wallet for exactly 70,001, 20,000, and 10,000 sats. Amountless, expired, mainnet, duplicate, self-payment, previously used, or over-limit invoices are rejected. Paste each invoice, review payer/node/network/fee caps, type `TESTNET`, approve in the backend, and execute.

Receipts are visible after execution and exportable as JSON. Chain verification validates the live signed ledger. If the process stops at `PAYING`, `IN_FLIGHT`, or `UNKNOWN`, restart the app: the attempt remains in SQLite and must be tracked by payment hash; it must not be resent. An uncertain result requires human inspection of LND before any manual retry. Never generate a replacement invoice merely to hide uncertainty.

No real testnet payment can be demonstrated without access to a configured LND node and three current recipient invoices. Bitcoin testnet coins have no monetary value.
