import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newIdentity, createPolicy, verifyPolicy, createAgreement, verifyAgreement, computeAmounts, settle, MockRail, DirectResolver, ReceiptLedger } from '../src/index.js';

function fixture() {
  const aura = newIdentity(), ref = newIdentity(), com = newIdentity();
  const policy = createPolicy(aura, { contextType: 'sale', roles: [
    { role: 'provider', weight: 70 }, { role: 'referrer', weight: 20 }, { role: 'community-fund', weight: 10 }] });
  const agreement = createAgreement(aura, policy, [
    { role: 'provider', did: aura.did }, { role: 'referrer', did: ref.did }, { role: 'community-fund', did: com.did }]);
  return { aura, ref, com, policy, agreement };
}

test('policy signs and verifies; tamper fails', () => {
  const { policy } = fixture();
  assert.equal(verifyPolicy(policy), true);
  const tampered = { ...policy, roles: [{ role: 'provider', weight: 100 }] };
  assert.equal(verifyPolicy(tampered), false);
});

test('agreement rejects wrong bindings and foreign signer', () => {
  const { aura, policy } = fixture();
  assert.throws(() => createAgreement(aura, policy, [{ role: 'provider', did: aura.did }])); // missing roles
  const mallory = newIdentity();
  const { agreement } = fixture();
  const forged = { ...agreement, coordinator_did: mallory.did };  // claim someone else signed
  assert.equal(verifyAgreement(forged), false);
});

test('split math is integer-exact for awkward amounts', () => {
  const { agreement } = fixture();
  for (const gross of [1, 3, 99, 100, 100001, 21_000_000]) {
    const rows = computeAmounts(agreement, gross);
    assert.equal(rows.reduce((s, r) => s + r.amount_sat, 0), gross, `sum must equal gross for ${gross}`);
    assert.ok(rows.every(r => r.amount_sat >= 0));
  }
  // 70/20/10 of 100001: floors 70000/20000/10000, remainder 1 -> largest frac (provider .7)
  const rows = computeAmounts(agreement, 100001);
  assert.deepEqual(rows.map(r => r.amount_sat), [70001, 20000, 10000]);
});

test('settlement: happy path writes verifiable receipts', async () => {
  const { aura, ref, com, agreement } = fixture();
  const resolver = new DirectResolver();
  resolver.add(aura.did, { id: 'btc-lightning-bolt12', payload: 'lno1a' });
  resolver.add(ref.did, { id: 'btc-lightning-lud16', payload: 'r@x.com' });
  resolver.add(com.did, { id: 'btc-lightning-bolt12', payload: 'lno1c' });
  const ledger = new ReceiptLedger(aura);
  const res = await settle(agreement, 100000, { resolver, rail: new MockRail(), ledger, approve: async () => true });
  assert.equal(res.ok, true);
  assert.equal(res.receipts.length, 3);
  assert.equal(ledger.verifyChain(), true);
  assert.equal(ledger.entries.at(-1).kind, 'settlement_complete');
});

test('DENIAL: no human approval -> no money moves', async () => {
  const { aura, ref, com, agreement } = fixture();
  const resolver = new DirectResolver();
  for (const [d, p] of [[aura.did, 'a'], [ref.did, 'b'], [com.did, 'c']]) resolver.add(d, { id: 'btc-lightning-bolt12', payload: p });
  const rail = new MockRail();
  const ledger = new ReceiptLedger(aura);
  const res = await settle(agreement, 100000, { resolver, rail, ledger, approve: async () => false });
  assert.equal(res.ok, false);
  assert.equal(rail.paid.length, 0);
  assert.equal(ledger.entries[0].kind, 'settlement_denied');
});

test('DENIAL: tampered agreement is refused before any payment', async () => {
  const { aura, agreement } = fixture();
  const rail = new MockRail();
  const tampered = { ...agreement, pinned_roles: [{ role: 'provider', weight: 100 }] };
  const res = await settle(tampered, 100000, { resolver: new DirectResolver(), rail, ledger: new ReceiptLedger(aura), approve: async () => true });
  assert.equal(res.ok, false);
  assert.equal(rail.paid.length, 0);
});

test('DENIAL: unresolvable recipient stops the job with a failure receipt', async () => {
  const { aura, ref, com, agreement } = fixture();
  const resolver = new DirectResolver();          // only 1 of 3 contacts present
  resolver.add(aura.did, { id: 'btc-lightning-bolt12', payload: 'lno1a' });
  const ledger = new ReceiptLedger(aura);
  const res = await settle(agreement, 100000, { resolver, rail: new MockRail(), ledger, approve: async () => true });
  assert.equal(res.ok, false);
  assert.ok(ledger.entries.some(e => e.kind === 'settlement_failed'));
  assert.equal(ledger.verifyChain(), true);
});

test('ledger detects reordering/tamper', () => {
  const { aura } = fixture();
  const ledger = new ReceiptLedger(aura);
  ledger.append('a', { x: 1 }); ledger.append('b', { x: 2 });
  assert.equal(ledger.verifyChain(), true);
  ledger.entries[0].body.x = 99;
  assert.equal(ledger.verifyChain(), false);
});
