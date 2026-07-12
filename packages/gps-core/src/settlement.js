// SettlementJob: Agreement + gross amount -> resolve each recipient -> pay ->
// receipts. Human approval gate is MANDATORY (Phase-3 discipline: agent
// proposes, human confirms money movement). Fail-fast v0: a rail failure stops
// the job and records a failure receipt; idempotent retry is an open issue (#roadmap).
import { verifyAgreement, computeAmounts } from './agreement.js';

export async function settle(agreement, grossSat, { resolver, rail, ledger, approve }) {
  if (!verifyAgreement(agreement)) return { ok: false, reason: 'invalid agreement signature' };
  const rows = computeAmounts(agreement, grossSat);
  const plan = { agreement_id: agreement.agreement_id, grossSat, rows };
  if (!(await approve(plan))) {
    ledger.append('settlement_denied', { agreement_id: agreement.agreement_id, grossSat });
    return { ok: false, reason: 'human approval denied' };
  }
  const receipts = [];
  for (const row of rows) {
    const endpoint = await resolver.resolve(row.did);           // SatsPath or Direct
    if (!endpoint) {
      ledger.append('settlement_failed', { ...row, reason: 'unresolvable recipient' });
      return { ok: false, reason: `unresolvable: ${row.did}`, receipts };
    }
    let proof;
    try {
      proof = await rail.pay(endpoint, row.amount_sat, { memo: agreement.memo, agreement_id: agreement.agreement_id });
    } catch (err) {
      ledger.append('settlement_failed', { ...row, reason: String(err.message || err) });
      return { ok: false, reason: `rail failure at ${row.role}`, receipts };
    }
    receipts.push(ledger.append('split_receipt', { ...row, endpoint: endpoint.id, proof }));
  }
  const aggregate = ledger.append('settlement_complete', {
    agreement_id: agreement.agreement_id, grossSat, recipients: rows.length,
  });
  return { ok: true, receipts, aggregate };
}
