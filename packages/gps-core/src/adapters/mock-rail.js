// PaymentRail port, mock implementation. Real Lightning replaces this behind
// the SAME shape: pay(endpoint, amountSat, meta) -> SettlementProof.
export class MockRail {
  constructor() { this.paid = []; }
  async pay(endpoint, amountSat, meta = {}) {
    const proof = { rail: 'mock', ref: `mock_${this.paid.length}`, amount_sat: amountSat, ts: Math.floor(Date.now() / 1000), meta };
    this.paid.push({ endpoint, ...proof });
    return proof;
  }
}
