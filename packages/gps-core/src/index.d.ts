import type {KeyObject} from 'node:crypto';
export interface Identity{did:string;privateKey:KeyObject;publicKey:KeyObject}
export interface Role{role:string;weight:number} export interface Binding{role:string;did:string}
export interface SplitPolicy{policy_id:string;owner_did:string;context_type:string;roles:Role[];constraints:Record<string,unknown>;version:number;created_at:number;sig:string}
export interface Agreement{agreement_id:string;policy_ref:{policy_id:string;version:number;owner_did:string};pinned_roles:Role[];bindings:Binding[];memo:string;coordinator_did:string;created_at:number;sig:string}
export function newIdentity():Identity; export function createPolicy(o:Identity,i:{contextType:string;roles:Role[]}):SplitPolicy; export function verifyPolicy(p:SplitPolicy):boolean; export function createAgreement(o:Identity,p:SplitPolicy,b:Binding[],x?:{memo?:string}):Agreement; export function verifyAgreement(a:Agreement):boolean; export function computeAmounts(a:Agreement,g:number):Array<Binding&{weight:number;amount_sat:number}>;
export class ReceiptLedger{owner:Identity;entries:Array<Record<string,unknown>>;constructor(o:Identity);append(k:string,b:Record<string,unknown>):Record<string,unknown>;verifyChain():boolean}
export class MockRail{paid:unknown[];pay(e:unknown,a:number,m?:Record<string,unknown>):Promise<Record<string,unknown>>} export class DirectResolver{constructor(c?:Record<string,unknown>);add(d:string,e:unknown):void;resolve(d:string):Promise<unknown|null>}
export function settle(a:Agreement,g:number,o:Record<string,unknown>):Promise<Record<string,unknown>>;
