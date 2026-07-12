// SettlementResolver port, fallback implementation: a local contact book of
// DID -> payment endpoint. Proves GPS works WITHOUT SatsPath (doctrine B2).
// The SatsPath adapter implements the same resolve(did) shape per
// docs/gps-satspath-interface-v0.md and drops in beside this one.
export class DirectResolver {
  constructor(contacts = {}) { this.contacts = contacts; }   // { did: {id, payload} }
  add(did, endpoint) { this.contacts[did] = endpoint; }
  async resolve(did) { return this.contacts[did] ?? null; }
}
