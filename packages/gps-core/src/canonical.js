// Canonical JSON: keys sorted alphabetically at every depth, no whitespace.
// Domain separation prevents cross-protocol signature replay (same discipline
// as SatsPath's "SatsPathProfileV1" prefix).
export const DOMAIN = { policy: 'GPSSplitPolicyV0', agreement: 'GPSAgreementV0', receipt: 'GPSReceiptV0' };

export function canonical(obj) {
  return Buffer.from(stringify(obj), 'utf8');
}
function stringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stringify).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stringify(v[k])).join(',') + '}';
}
export function signingBytes(domain, obj) {
  return Buffer.concat([Buffer.from(domain, 'utf8'), canonical(obj)]);
}
