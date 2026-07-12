// The demo: an Aura sale -> 70/20/10 Agreement -> 3 payments -> 3 receipts.
import { newIdentity, createPolicy, createAgreement, computeAmounts, settle, MockRail, DirectResolver, ReceiptLedger } from './src/index.js';

const aura = newIdentity(), referrer = newIdentity(), community = newIdentity();
console.log('Aura     :', aura.did.slice(0, 24) + '…');
console.log('Referrer :', referrer.did.slice(0, 24) + '…');
console.log('Community:', community.did.slice(0, 24) + '…\n');

const policy = createPolicy(aura, {
  contextType: 'dental-package-sale',
  roles: [{ role: 'provider', weight: 70 }, { role: 'referrer', weight: 20 }, { role: 'community-fund', weight: 10 }],
});
const agreement = createAgreement(aura, policy, [
  { role: 'provider', did: aura.did },
  { role: 'referrer', did: referrer.did },
  { role: 'community-fund', did: community.did },
], { memo: 'Smile Restoration Package #0001' });

const gross = 100001; // odd number on purpose: watch the remainder land exactly
console.log('Split of', gross, 'sats:', computeAmounts(agreement, gross), '\n');

const resolver = new DirectResolver();
resolver.add(aura.did,      { id: 'btc-lightning-bolt12', payload: 'lno1aura…' });
resolver.add(referrer.did,  { id: 'btc-lightning-lud16',  payload: 'ref@getalby.com' });
resolver.add(community.did, { id: 'btc-lightning-bolt12', payload: 'lno1community…' });

const ledger = new ReceiptLedger(aura);
const result = await settle(agreement, gross, {
  resolver, rail: new MockRail(), ledger,
  approve: async plan => { console.log('HUMAN APPROVAL GATE — plan:', plan.rows.map(r => `${r.role}:${r.amount_sat}`).join(' ')); return true; },
});
console.log('\nsettled:', result.ok, '| receipts:', result.receipts.length);
console.log('ledger chain valid:', ledger.verifyChain());
for (const e of ledger.entries) console.log(`  #${e.seq} ${e.kind}`, e.body.role ?? '', e.body.amount_sat ?? '');
