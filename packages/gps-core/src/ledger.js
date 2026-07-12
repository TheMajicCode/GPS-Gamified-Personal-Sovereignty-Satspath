// Hash-chained, signed receipt ledger. Same shape as the LUCA scaffold's
// Identity Ledger so vault export/roundtrip stays trivial.
import { createHash } from 'node:crypto';
import { signingBytes, canonical, DOMAIN } from './canonical.js';
import { sign, verify } from './identity.js';

export class ReceiptLedger {
  constructor(owner) { this.owner = owner; this.entries = []; }
  append(kind, body) {
    const prev = this.entries.length ? this.#hash(this.entries.at(-1)) : 'genesis';
    const core = { seq: this.entries.length, kind, body, prev_hash: prev, owner_did: this.owner.did };
    const entry = { ...core, ts: Math.floor(Date.now() / 1000), sig: sign(this.owner, signingBytes(DOMAIN.receipt, core)) };
    this.entries.push(entry);
    return entry;
  }
  #hash(e) {
    const { ts, sig, ...core } = e;
    return createHash('sha256').update(canonical(core)).digest('hex');
  }
  verifyChain() {
    let prev = 'genesis';
    for (const e of this.entries) {
      const { ts, sig, ...core } = e;
      if (e.prev_hash !== prev) return false;
      if (!verify(e.owner_did, signingBytes(DOMAIN.receipt, core), sig)) return false;
      prev = this.#hash(e);
    }
    return true;
  }
}
