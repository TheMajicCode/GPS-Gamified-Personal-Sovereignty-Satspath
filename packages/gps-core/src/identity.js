// Ed25519 identities as did:key (multicodec 0xed01, base58btc, 'z' multibase).
// Matches the LUCA scaffold so vault identities interop. secp256k1/Nostr DIDs
// arrive via the resolver's identity_link mapping, not here (see ARCHITECTURE).
import { generateKeyPairSync, sign as edSign, verify as edVerify, createPublicKey } from 'node:crypto';

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ED_PREFIX = Buffer.from([0xed, 0x01]);

function b58encode(buf) {
  let n = BigInt('0x' + buf.toString('hex')); let out = '';
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of buf) { if (b === 0) out = B58[0] + out; else break; }
  return out;
}
function b58decode(s) {
  let n = 0n;
  for (const c of s) n = n * 58n + BigInt(B58.indexOf(c));
  let hex = n.toString(16); if (hex.length % 2) hex = '0' + hex;
  let buf = Buffer.from(hex, 'hex');
  let pad = 0; for (const c of s) { if (c === B58[0]) pad++; else break; }
  return Buffer.concat([Buffer.alloc(pad), buf]);
}

export function newIdentity() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const raw = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
  return { did: 'did:key:z' + b58encode(Buffer.concat([ED_PREFIX, raw])), privateKey, publicKey };
}
export function sign(identity, bytes) {
  return edSign(null, bytes, identity.privateKey).toString('base64url');
}
export function verify(did, bytes, sigB64) {
  try {
    if (!did.startsWith('did:key:z')) return false;
    const decoded = b58decode(did.slice('did:key:z'.length));
    if (!decoded.subarray(0, 2).equals(ED_PREFIX)) return false;
    const raw = decoded.subarray(2);
    const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]);
    const key = createPublicKey({ key: spki, format: 'der', type: 'spki' });
    return edVerify(null, bytes, key, Buffer.from(sigB64, 'base64url'));
  } catch { return false; }
}
