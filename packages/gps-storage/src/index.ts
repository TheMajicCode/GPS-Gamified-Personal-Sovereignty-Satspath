import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { AuditEvent, PaymentAttemptRecord, SettlementItemRecord, SettlementRecord, SettlementRepository } from '@gps/settlement';
type Row = Record<string, unknown>;
const snake=(k:string)=>k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase());
const update=(table:string,p:Record<string,unknown>)=>{const e=Object.entries(p).filter(([,v])=>v!==undefined);return{sql:`UPDATE ${table} SET ${e.map(([k])=>`${snake(k)}=?`).join(',')} WHERE id=?`,values:e.map(([,v])=>v)}};
export class SqliteSettlementRepository implements SettlementRepository {
  db:Database.Database;
  constructor(url='file:./data/gps-testnet.db') { const path=url.replace(/^file:/,''); if(path!==':memory:')mkdirSync(dirname(resolve(path)),{recursive:true}); this.db=new Database(path); this.db.exec(readFileSync(new URL('../migrations/001_init.sql',import.meta.url),'utf8')); }
  transaction<T>(f:()=>T){return this.db.transaction(f)()}
  createSettlement(s:SettlementRecord,items:SettlementItemRecord[]){this.transaction(()=>{this.db.prepare('INSERT INTO settlements VALUES(?,?,?,?,?,?,?,?,?,?)').run(s.id,s.agreementId,s.grossSat,s.network,s.status,s.maxTotalFeeSat,s.snapshotJson,s.createdAt,null,null);const q=this.db.prepare('INSERT INTO settlement_items VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');for(const i of items)q.run(i.id,i.settlementId,i.role,i.recipientDid,i.recipientName,i.weight,i.amountSat,null,null,null,i.status,i.feeLimitSat,null,null,null,null,null)})}
  getSettlement(id:string){return mapS(this.db.prepare('SELECT * FROM settlements WHERE id=?').get(id))}
  listSettlements(){return(this.db.prepare('SELECT * FROM settlements ORDER BY created_at DESC').all()as Row[]).map(mapS).filter(Boolean)as SettlementRecord[]}
  getItems(id:string){return(this.db.prepare('SELECT * FROM settlement_items WHERE settlement_id=? ORDER BY rowid').all(id)as Row[]).map(mapI).filter(Boolean)as SettlementItemRecord[]}
  getItem(id:string){return mapI(this.db.prepare('SELECT * FROM settlement_items WHERE id=?').get(id))}
  updateSettlement(id:string,p:Partial<SettlementRecord>){const q=update('settlements',p as Record<string,unknown>);this.db.prepare(q.sql).run(...q.values,id)}
  updateItem(id:string,p:Partial<SettlementItemRecord>){const q=update('settlement_items',p as Record<string,unknown>);this.db.prepare(q.sql).run(...q.values,id)}
  createAttempt(a:PaymentAttemptRecord){try{this.db.prepare('INSERT INTO payment_attempts VALUES(?,?,?,?,?,?,?,?,?)').run(a.id,a.settlementItemId,a.idempotencyKey,a.paymentHash,a.status,null,null,a.createdAt,a.updatedAt);return true}catch(e){if(e instanceof Error&&e.message.includes('UNIQUE'))return false;throw e}}
  getAttemptByHash(h:string){return mapA(this.db.prepare('SELECT * FROM payment_attempts WHERE payment_hash=?').get(h))}
  getAttemptForItem(id:string){return mapA(this.db.prepare('SELECT * FROM payment_attempts WHERE settlement_item_id=?').get(id))}
  updateAttempt(id:string,p:Partial<PaymentAttemptRecord>){const q=update('payment_attempts',p as Record<string,unknown>);this.db.prepare(q.sql).run(...q.values,id)}
  invoiceHashExists(h:string,x=''){return Boolean(this.db.prepare('SELECT 1 FROM settlement_items WHERE invoice_hash=? AND id<>?').get(h,x))}
  addEvent(e:AuditEvent){this.db.prepare('INSERT INTO audit_events VALUES(?,?,?,?,?,?)').run(e.id,e.settlementId,e.settlementItemId??null,e.type,JSON.stringify(e.metadata),e.createdAt)}
  getEvents(id:string){return(this.db.prepare('SELECT * FROM audit_events WHERE settlement_id=? ORDER BY created_at,rowid').all(id)as Row[]).map(r=>({id:String(r.id),settlementId:String(r.settlement_id),...(r.settlement_item_id?{settlementItemId:String(r.settlement_item_id)}:{}),type:String(r.type)as AuditEvent['type'],metadata:JSON.parse(String(r.metadata_json))as Record<string,unknown>,createdAt:String(r.created_at)}))}
  saveReceipt(id:string,e:Record<string,unknown>){this.db.prepare('INSERT INTO receipts(settlement_id,entry_json)VALUES(?,?)').run(id,JSON.stringify(e))}
  getReceipts(id:string){return(this.db.prepare('SELECT entry_json FROM receipts WHERE settlement_id=? ORDER BY id').all(id)as Row[]).map(r=>JSON.parse(String(r.entry_json))as Record<string,unknown>)}
  close(){this.db.close()}
}
function mapS(x:unknown):SettlementRecord|undefined{if(!x)return;const r=x as Row;return{id:String(r.id),agreementId:String(r.agreement_id),grossSat:Number(r.gross_sat),network:String(r.network)as SettlementRecord['network'],status:String(r.status)as SettlementRecord['status'],maxTotalFeeSat:Number(r.max_total_fee_sat),snapshotJson:String(r.snapshot_json),createdAt:String(r.created_at),...(r.approved_at?{approvedAt:String(r.approved_at)}:{}),...(r.completed_at?{completedAt:String(r.completed_at)}:{})}}
function mapI(x:unknown):SettlementItemRecord|undefined{if(!x)return;const r=x as Row;return{id:String(r.id),settlementId:String(r.settlement_id),role:String(r.role),recipientDid:String(r.recipient_did),recipientName:String(r.recipient_name),weight:Number(r.weight),amountSat:Number(r.amount_sat),status:String(r.status)as SettlementItemRecord['status'],feeLimitSat:Number(r.fee_limit_sat),...(r.invoice?{invoice:String(r.invoice)}:{}),...(r.invoice_hash?{invoiceHash:String(r.invoice_hash)}:{}),...(r.payment_hash?{paymentHash:String(r.payment_hash)}:{}),...(r.actual_fee_sat!=null?{actualFeeSat:Number(r.actual_fee_sat)}:{}),...(r.failure_code?{failureCode:String(r.failure_code)}:{}),...(r.failure_message?{failureMessage:String(r.failure_message)}:{}),...(r.started_at?{startedAt:String(r.started_at)}:{}),...(r.completed_at?{completedAt:String(r.completed_at)}:{})}}
function mapA(x:unknown):PaymentAttemptRecord|undefined{if(!x)return;const r=x as Row;return{id:String(r.id),settlementItemId:String(r.settlement_item_id),idempotencyKey:String(r.idempotency_key),paymentHash:String(r.payment_hash),status:String(r.status),createdAt:String(r.created_at),updatedAt:String(r.updated_at),...(r.lnd_payment_index?{lndPaymentIndex:String(r.lnd_payment_index)}:{}),...(r.failure_reason?{failureReason:String(r.failure_reason)}:{})}}
