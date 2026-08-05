import { ReceiptLedger, createAgreement, createPolicy, newIdentity } from '@luca/gps-core';
import { SettlementService } from '@gps/settlement';
import { SqliteSettlementRepository } from '@gps/storage';
import { LndRestTransport, LndTestnetRail, MockPaymentRail, loadLndConfig } from '@gps/lightning-lnd';
function build(){
  const mode:'mock'|'testnet'=process.env.GPS_PAYMENT_MODE==='testnet'?'testnet':'mock';
  const repo=new SqliteSettlementRepository(process.env.DATABASE_URL??'file:./data/gps-testnet.db');
  const owner=newIdentity(),ledger=new ReceiptLedger(owner);
  const rail=mode==='testnet'?(()=>{const c=loadLndConfig();return new LndTestnetRail(new LndRestTransport(c),c)})():new MockPaymentRail();
  const service=new SettlementService(repo,rail,ledger,{maxPaymentSat:Number(process.env.GPS_MAX_PAYMENT_SAT??100000),maxSettlementSat:Number(process.env.GPS_MAX_SETTLEMENT_SAT??300000),maxFeeSat:Number(process.env.GPS_MAX_FEE_SAT??100)});
  return{mode,repo,owner,ledger,rail,service};
}
const g=globalThis as typeof globalThis&{gpsRuntime?:ReturnType<typeof build>};
export const runtime=g.gpsRuntime??=build();
export function seed(){
  const existing=runtime.repo.listSettlements()[0];if(existing)return existing;
  const ref=newIdentity(),community=newIdentity();
  const policy=createPolicy(runtime.owner,{contextType:'test-sale',roles:[{role:'provider',weight:70},{role:'referrer',weight:20},{role:'community-fund',weight:10}]});
  const agreement=createAgreement(runtime.owner,policy,[{role:'provider',did:runtime.owner.did},{role:'referrer',did:ref.did},{role:'community-fund',did:community.did}],{memo:'Aura Test Sale'});
  return runtime.service.createPlan(agreement,100001,{[runtime.owner.did]:'Aura Provider',[ref.did]:'Referral Partner',[community.did]:'Community Fund'},runtime.mode);
}
export function view(id:string){const settlement=runtime.repo.getSettlement(id);if(!settlement)return null;const receipts=runtime.repo.getReceipts(id);return{settlement,items:runtime.repo.getItems(id).map(({invoice,...i})=>({...i,hasInvoice:Boolean(invoice)})),events:runtime.repo.getEvents(id),receipts,ledgerValid:receipts.length===runtime.ledger.entries.length&&runtime.ledger.verifyChain(),mode:runtime.mode}}
