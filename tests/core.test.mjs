import assert from 'node:assert/strict';import fs from 'node:fs';
import {migrateLegacy,cashflow,projection,recurringDue,parseBRL,loanSimulation,validate,categorySummary,installmentProgress,blank,addMonths} from '../core.mjs';
const s=JSON.parse(fs.readFileSync(new URL('../demo-data.json',import.meta.url),'utf8'));
let count=0;function eq(a,b){assert.equal(a,b);count++}function ok(v){assert.ok(v);count++}
eq(validate(s),'');eq(s.payments.length,41);eq(s.transactions.length,12);eq(s.properties[0].price,276804.89);eq(installmentProgress(s,s.selectedProperty).paid,800);
ok(s.meta.importWarnings.some(t=>t.includes('Vale')));eq(parseBRL('1.592,22'),1592.22);eq(parseBRL('1592.22'),1592.22);ok(Number.isNaN(parseBRL('1,98102')));
const nov=cashflow(s,'2026-11');eq(nov.propertyPaid,800);eq(nov.spent,1429.9);ok(nov.incomeReceived>0);
const dec=cashflow(s,'2026-12');eq(dec.propertyPending,6094.09);eq(dec.incomeForecast,1592.22);ok(dec.incomeIncomplete);eq(dec.incomeReceived,0);
const mar=cashflow(s,'2027-03');eq(mar.propertyPending,2430);ok(mar.propertyPending<195770.8);
const due=recurringDue(s,'2026-12');ok(due.some(r=>r.description==='Vale'&&r.kind==='income'));ok(!recurringDue(s,'2026-11').some(r=>r.description==='Vale'&&r.kind==='income'));
eq(projection(s,'2026-12',12).length,12);ok(loanSimulation({principal:100000,annualRate:12,months:360,system:'SAC'})[0].payment>0);ok(loanSimulation({principal:100000,annualRate:12,months:360,system:'Price'})[0].payment>0);
const old=cashflow(s,'2026-11');s.transactions.push({id:'test_income',kind:'income',date:'2026-11-25',description:'Teste',source:'Extra',amount:200,status:'planned'});const next=cashflow(s,'2026-11');eq(next.incomeReceived,old.incomeReceived);eq(next.incomePlanned,old.incomePlanned+200);
const noBank=structuredClone(s);noBank.settings.bankPayment=900;noBank.settings.bankStart='2027-03-01';eq(cashflow(noBank,'2027-02').bankPay,0);eq(cashflow(noBank,'2027-03').bankPay,900);
const paid=structuredClone(s);const first=paid.payments.find(x=>x.id==='leg-p-1');first.history=[{date:'2026-12-03',amount:800}];eq(cashflow(paid,'2026-11').propertyPaid,0);eq(cashflow(paid,'2026-12').propertyPaid,800);
const fixture={data:{payments:[{id:1,date:'2026-11-07',title:'Entrada',value:800,type:'construtora',paid:800}],expenses:[],property:{price:100000,label:'Apartamento',financing:60000,delivery:'2029-10-31'},settings:{income:2000},incomeEntries:[{id:2,source:'Salário',value:1500,date:'2026-11-07',status:'recebido'}],repeatRules:[]}};let migrated=migrateLegacy(fixture);eq(migrated.state.transactions.length,1);eq(validate(migrated.state),'');
const recurring=structuredClone(s);recurring.recurrences.push({id:'test_repeat',kind:'expense',description:'Recorrente de teste',category:'Outros',amount:75,frequency:'monthly',start:'2026-11-02',active:true,confirmed:[]});ok(recurringDue(recurring,'2026-12').some(x=>x.id==='test_repeat'));recurring.recurrences.at(-1).confirmed.push('2026-12-02');ok(!recurringDue(recurring,'2026-12').some(x=>x.id==='test_repeat'));
console.log(`Apê no Azul: ${count} testes de regras financeiras passaram.`);
