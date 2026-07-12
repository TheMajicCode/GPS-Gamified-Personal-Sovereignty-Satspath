// Agreement: a SplitPolicy instantiated for ONE transaction context —
// real DIDs bound to roles, weights PINNED at agreement time. The "value block".
import { randomUUID } from 'node:crypto';
import { signingBytes, DOMAIN } from './canonical.js';
import { sign, verify } from './identity.js';
import { verifyPolicy } from './policy.js';

export function createAgreement(coordinator, policy, bindings, { memo = '' } = {}) {
  if (!verifyPolicy(policy)) throw new Error('invalid policy signature');
  const roleNames = policy.roles.map(r => r.role).sort();
  const boundRoles = bindings.map(b => b.role).sort();
  if (JSON.stringify(roleNames) !== JSON.stringify(boundRoles)) throw new Error('bindings must cover exactly the policy roles');
  const body = {
    agreement_id: randomUUID(),
    policy_ref: { policy_id: policy.policy_id, version: policy.version, owner_did: policy.owner_did },
    pinned_roles: policy.roles,
    bindings,
    memo, coordinator_did: coordinator.did,
    created_at: Math.floor(Date.now() / 1000),
  };
  return { ...body, sig: sign(coordinator, signingBytes(DOMAIN.agreement, body)) };
}
export function verifyAgreement(agreement) {
  const { sig, ...body } = agreement;
  return verify(agreement.coordinator_did, signingBytes(DOMAIN.agreement, body), sig);
}

// Integer-exact split: floor shares, then distribute the remainder by largest
// fractional part (ties broken by binding order). Sum ALWAYS equals gross.
export function computeAmounts(agreement, grossSat) {
  if (!Number.isInteger(grossSat) || grossSat <= 0) throw new Error('grossSat must be a positive integer');
  const total = agreement.pinned_roles.reduce((s, r) => s + r.weight, 0);
  const rows = agreement.bindings.map((b, i) => {
    const w = agreement.pinned_roles.find(r => r.role === b.role).weight;
    const exact = (grossSat * w) / total;
    return { ...b, weight: w, floor: Math.floor(exact), frac: exact - Math.floor(exact), i };
  });
  let remainder = grossSat - rows.reduce((s, r) => s + r.floor, 0);
  rows.sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const r of rows) { r.amount_sat = r.floor + (remainder > 0 ? 1 : 0); if (remainder > 0) remainder--; }
  rows.sort((a, b) => a.i - b.i);
  return rows.map(({ role, did, weight, amount_sat }) => ({ role, did, weight, amount_sat }));
}
