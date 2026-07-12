// SplitPolicy: a reusable TEMPLATE owned by a business/community.
// Roles + weights, signed by the owner. Context lives here, not in identity profiles.
import { randomUUID } from 'node:crypto';
import { signingBytes, DOMAIN } from './canonical.js';
import { sign, verify } from './identity.js';

export function createPolicy(owner, { contextType, roles, constraints = {} }) {
  const total = roles.reduce((s, r) => s + r.weight, 0);
  if (total <= 0) throw new Error('weights must be positive');
  if (roles.some(r => !Number.isInteger(r.weight) || r.weight < 0)) throw new Error('integer non-negative weights only');
  const body = {
    policy_id: randomUUID(), owner_did: owner.did, context_type: contextType,
    roles, constraints, version: 1, created_at: Math.floor(Date.now() / 1000),
  };
  return { ...body, sig: sign(owner, signingBytes(DOMAIN.policy, body)) };
}
export function verifyPolicy(policy) {
  const { sig, ...body } = policy;
  return verify(policy.owner_did, signingBytes(DOMAIN.policy, body), sig);
}
