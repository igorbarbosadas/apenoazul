export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
export const fmtDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pt-BR'):'';
export const monthName=k=>new Date(k+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
export const monthOf=d=>String(d||'').slice(0,7);
export const today=()=>{let d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
export const monthStart=()=>today().slice(0,7);
export const addMonths=(key,n)=>{let [y,m]=key.split('-').map(Number);let d=new Date(y,m-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const number=x=>Number.isFinite(Number(x))?Number(x):0;
export function parseBRL(raw){const v=String(raw??'').trim().replace(/\s/g,'').replace(/^R\$/,'');if(!v)return NaN;let x=v;if(x.includes(',')){if(!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(x))return NaN;x=x.replace(/\./g,'').replace(',','.')}else if(/^\d{1,3}\.\d{3}$/.test(x))x=x.replace('.','');else if(!/^\d+(?:\.\d{1,2})?$/.test(x))return NaN;return Number(x)}
export const id=()=>String(Date.now())+'_'+Math.random().toString(36).slice(2,9);
export const CATEGORIES=['Moradia','Mercado','Transporte','Saúde','Educação','Lazer','Compras','Assinaturas','Serviços','Impostos','Outros'];
export const blank=()=>({schema:2,properties:[],selectedProperty:null,transactions:[],payments:[],recurrences:[],accounts:[{id:'main',name:'Conta principal',opening:0}],transfers:[],budgets:{},goals:[],documents:[],settings:{referenceIncome:0,referenceEnabled:false,bankPayment:0,bankStart:'',reserve:0,theme:'light',currency:'BRL',alerts:7},meta:{created:today(),importWarnings:[]}});
export function normalize(raw){let s=structuredClone(raw);s.schema=2;for(let k of ['properties','transactions','payments','recurrences','accounts','transfers','goals','documents'])if(!Array.isArray(s[k]))s[k]=[];s.budgets=s.budgets||{};s.settings={...blank().settings,...(s.settings||{})};s.meta=s.meta||{importWarnings:[]};return s}
const amount=v=>Math.round(number(v)*100)/100;
const dateValid=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d)))return false;const [y,m,day]=d.split('-').map(Number);const date=new Date(y,m-1,day,12);return date.getFullYear()===y&&date.getMonth()+1===m&&date.getDate()===day};
export function validate(s){if(!s||typeof s!=='object'||!Array.isArray(s.transactions)||!Array.isArray(s.payments)||!Array.isArray(s.properties))return 'Estrutura do backup inválida';if(s.transactions.length>100000||s.payments.length>30000)return 'Quantidade de registros excedida';for(let t of s.transactions){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(t.id))||!dateValid(t.date)||!['income','expense'].includes(t.kind)||!Number.isFinite(Number(t.amount))||number(t.amount)<0||number(t.amount)>1e9)return 'Movimentação inválida'}for(let p of s.payments){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(p.id))||!dateValid(p.date)||number(p.amount)<0||number(p.paid)<0)return 'Parcela inválida'}for(let key of ['properties','recurrences','accounts','transfers','goals','documents'])for(let item of s[key]||[]){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(item.id)))return 'Identificador inválido em '+key}for(let t of s.transfers||[]){if(!Number.isFinite(Number(t.amount))||Number(t.amount)<=0||Number(t.amount)>1e9||t.from===t.to||!dateValid(t.date))return 'Transferência inválida'}for(let a of s.accounts||[]){if(!Number.isFinite(Number(a.opening))||Math.abs(Number(a.opening))>1e9)return 'Saldo inicial da conta inválido'}
 const accountIds=new Set((s.accounts||[]).map(a=>a.id));
 for(const p of s.payments||[]){for(const h of p.history||[]){
  if(h.accountId!==undefined&&h.accountId!==null&&h.accountId!==''&&!accountIds.has(h.accountId))return 'Conta de origem inexistente em pagamento do imóvel';
  if(!Number.isFinite(Number(h.amount))||Number(h.amount)<0||!dateValid(h.date))return 'Histórico de pagamento inválido';
 }}return ''}
export function migrateLegacy(input){const raw=input?.data||input; if(raw?.schema===2)return {state:normalize(raw),warnings:[]};if(!Array.isArray(raw?.payments)||!Array.isArray(raw?.expenses))throw Error('Este arquivo não é um backup reconhecido.');const s=blank(),warnings=[];const pr=raw.property||{};const propertyId='urban-vila-guilherme';s.properties.push({id:propertyId,name:String(pr.label||'Meu apartamento'),price:amount(pr.price),delivery:pr.delivery||'2029-10-31',financing:amount(pr.financing),developer:'Construtora',status:'Em construção',adjustment:0,financeRate:0,financeMonths:360,financeSystem:'SAC'});s.selectedProperty=propertyId;
s.payments=raw.payments.map((p,i)=>({id:'leg-p-'+String(p.id??i),propertyId,date:p.date,title:p.title||'Parcela',amount:amount(p.value),updated:p.updated==null?null:amount(p.updated),paid:amount(p.paid),kind:p.type==='financiamento'?'financing':'developer',history:p.paid>0?[{date:p.date,amount:amount(p.paid),description:'Pagamento anterior importado'}]:[]}));
s.transactions=(raw.expenses||[]).map((e,i)=>({id:'leg-exp-'+String(e.id??i),kind:'expense',date:e.date,description:String(e.description||'Despesa'),category:String(e.category||'Outros'),source:'',amount:amount(e.value),status:'paid',accountId:'main',legacyRecurringId:e.recurringId??null}));for(let [i,e] of (raw.incomeEntries||[]).entries()){const value=amount(e.value);if(number(e.value)>0&&Math.abs(number(e.value)-value)>.000001)warnings.push(`Rendimento ${e.source||i} em ${e.date} tinha mais de duas casas decimais. Revise o lançamento de ${money(e.value)}.`);if(value>0&&value<10)warnings.push(`Confira o rendimento ${e.source||'sem origem'} de ${e.date}: valor importado ${money(value)}.`);s.transactions.push({id:'leg-inc-'+String(e.id??i),kind:'income',date:e.date,description:e.description||e.source||'Rendimento',source:e.source||'Outros',category:'Rendimentos',amount:value,status:e.status==='recebido'?'received':'planned',accountId:'main',legacyRepeatId:e.repeatRuleId??null});}
s.recurrences=(raw.recurring||[]).map((e,i)=>({id:'leg-rec-'+String(e.id??i),kind:'expense',description:e.description||'Conta recorrente',category:e.category||'Outros',amount:amount(e.value),frequency:'monthly',start:e.startMonth?e.startMonth+'-'+String(e.day||1).padStart(2,'0'):'2026-11-01',active:e.active!==false,confirmed:[],legacyRecurringId:e.id})).concat((raw.repeatRules||[]).map((e,i)=>({id:'leg-rule-'+String(e.id??i),kind:e.kind==='income'?'income':'expense',description:e.description||e.source||e.category||'Recorrência',source:e.source||'',category:e.category||'Outros',amount:amount(e.value),frequency:e.frequency||'monthly',start:e.startDate||'2026-11-01',active:!e.paused,confirmed:[],legacyRepeatId:e.id})));
// Infer prior confirmations by matching legacy IDs; never create duplicates.
for(let rec of s.recurrences){for(let item of s.transactions){if((rec.legacyRecurringId&&item.legacyRecurringId===rec.legacyRecurringId)||(rec.legacyRepeatId&&item.legacyRepeatId===rec.legacyRepeatId))rec.confirmed.push(item.date)}}
s.settings.referenceIncome=number(raw.settings?.income)+number(raw.settings?.extra);s.settings.referenceEnabled=false;if(s.settings.referenceIncome>0)warnings.push('A renda de referência foi importada, mas está desativada na projeção até você confirmar o valor líquido em Ajustes.');s.settings.reserve=number(raw.settings?.reserve);s.settings.bankPayment=number(raw.settings?.bankInstallment);s.budgets=structuredClone(raw.budgets||{});s.goals=[{id:'goal-keys',name:'Reserva para as chaves',target:number(raw.settings?.goal),saved:number(raw.settings?.saved),deadline:pr.delivery||'2029-10-31'}];s.meta.importWarnings=warnings;return {state:normalize(s),warnings};}
export function mergeDuplicateRecurrences(s){for(let r of s.recurrences){const matching=s.transactions.filter(t=>t.kind===r.kind&&monthOf(t.date)===monthOf(r.start)&&t.amount===r.amount&&(t.description===r.description||t.source===r.source));if(matching.length&&!r.confirmed.includes(r.start))r.confirmed.push(r.start)}return s}
export function recurrenceDates(r,key){if(!r.active||!r.start||monthOf(r.start)>key)return [];let output=[],d=new Date(r.start+'T12:00:00'),ending=addMonths(key,1)+'-01';let max=0;while(d.toISOString().slice(0,10)<ending&&max++<1500){const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(monthOf(date)===key&&!r.confirmed?.includes(date))output.push(date);if(r.frequency==='daily')d.setDate(d.getDate()+1);else if(r.frequency==='weekly')d.setDate(d.getDate()+7);else if(r.frequency==='yearly'){const day=d.getDate();d.setDate(1);d.setFullYear(d.getFullYear()+1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}else{const day=Number(r.start.slice(8,10));d.setDate(1);d.setMonth(d.getMonth()+1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}}
return output}
export function recurringDue(s,key){return s.recurrences.flatMap(r=>recurrenceDates(r,key).map(date=>({...r,date,occurrenceId:r.id+'|'+date}))).filter(r=>!s.transactions.some(t=>t.recurrenceId===r.id&&t.date===r.date));}
export function paymentsFor(s,key){return s.payments.filter(p=>p.kind!=='financing'&&monthOf(p.date)===key)}
// Valores financeiros são arredondados em centavos apenas na apresentação dos agregados.
// A mesma função é usada por Início, Finanças, Agenda e Relatórios.
export const cents=value=>Math.round((number(value)+Number.EPSILON)*100);
export const reais=value=>Math.round(value)/100;
export function cashflow(s,key){
 const tx=s.transactions.filter(t=>monthOf(t.date)===key);
 const sum=(items,get=t=>t.amount)=>reais(items.reduce((total,t)=>total+cents(get(t)),0));
 const incomeReceived=sum(tx.filter(t=>t.kind==='income'&&t.status==='received'));
 const incomePlanned=sum(tx.filter(t=>t.kind==='income'&&t.status!=='received'));
 const spent=sum(tx.filter(t=>t.kind==='expense'&&t.status==='paid'));
 const expensePlanned=sum(tx.filter(t=>t.kind==='expense'&&t.status!=='paid'));
 const p=paymentsFor(s,key);
 // Pagamentos realizados são reconhecidos no mês em que o dinheiro saiu,
 // não no mês do vencimento. Histórico nunca é somado novamente ao campo paid.
 const paymentHistory=s.payments.filter(t=>t.kind!=='financing').flatMap(t=>
  t.history?.length?t.history:(number(t.paid)>0?[{date:t.date,amount:t.paid}]:[]));
 const propertyPaid=sum(paymentHistory.filter(h=>monthOf(h.date)===key));
 const propertyPending=sum(p,t=>Math.max(0,number(t.updated??t.amount)-number(t.paid)));
 const due=recurringDue(s,key);
 const repeatingIncome=sum(due.filter(t=>t.kind==='income'));
 const repeatingExpenses=sum(due.filter(t=>t.kind==='expense'));
 // Referência é uma estimativa apenas para um mês sem rendimentos lançados.
 // Se o usuário já registrou receita, mesmo parcial, não inventamos o restante.
 const knownIncome=reais(cents(incomeReceived)+cents(incomePlanned)+cents(repeatingIncome));
 const hasIncomeEntries=tx.some(t=>t.kind==='income');
 const referenceUsed=!hasIncomeEntries&&s.settings.referenceEnabled
  ? Math.max(0,reais(cents(s.settings.referenceIncome)-cents(repeatingIncome))):0;
 const incomeForecast=reais(cents(knownIncome)+cents(referenceUsed));
 // Sem início contratual informado, não presumimos prestação bancária desde o início.
 const bankNeedsStart=number(s.settings.bankPayment)>0&&!s.settings.bankStart;
 const bankPay=!bankNeedsStart&&s.settings.bankStart&&key>=monthOf(s.settings.bankStart)
  ? reais(cents(s.settings.bankPayment)):0;
 const reserve=reais(cents(s.settings.reserve));
 const committed=reais([spent,expensePlanned,propertyPaid,propertyPending,repeatingExpenses,bankPay,reserve].reduce((v,n)=>v+cents(n),0));
 const projected=reais(cents(incomeForecast)-cents(committed));
 const realized=reais(cents(incomeReceived)-cents(spent)-cents(propertyPaid));
 const incomeIncomplete=!s.settings.referenceEnabled&&!hasIncomeEntries;
 return {key,incomeIncomplete,incomeReceived,incomePlanned,spent,expensePlanned,
  propertyPaid,propertyPending,repeatingIncome,repeatingExpenses,referenceUsed,
  incomeForecast,bankPay,bankNeedsStart,reserve,committed,projected,realized,
  txCount:tx.length,unconfirmed:due.length};
}

export function series(s,key,n=6){return Array.from({length:n},(_,i)=>cashflow(s,addMonths(key,i-n+1)))}
export function projection(s,key,n=12){return Array.from({length:n},(_,i)=>cashflow(s,addMonths(key,i)))}
export function categorySummary(s,key){const map=new Map();for(let t of s.transactions.filter(t=>monthOf(t.date)===key&&t.kind==='expense'&&t.status==='paid'))map.set(t.category||'Outros',(map.get(t.category||'Outros')||0)+t.amount);return [...map.entries()].sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}))}
// Pagamentos do imóvel só alteram uma conta quando o usuário informa a conta de origem.
// Histórico legado não é associado automaticamente a nenhuma conta.
export function accountBalances(s){
 const balances=new Map((s.accounts||[]).map(a=>[a.id,reais(cents(a.opening))]));
 const apply=(accountId,delta)=>{if(!balances.has(accountId))return;balances.set(accountId,reais(cents(balances.get(accountId))+cents(delta)))};
 for(const t of s.transactions||[]){
  if(t.kind==='income'&&t.status==='received')apply(t.accountId,number(t.amount));
  if(t.kind==='expense'&&t.status==='paid')apply(t.accountId,-number(t.amount));
 }
 for(const p of s.payments||[]){
  if(p.kind==='financing')continue;
  for(const h of p.history||[]){if(h.accountId)apply(h.accountId,-number(h.amount))}
 }
 for(const t of s.transfers||[]){apply(t.from,-number(t.amount));apply(t.to,number(t.amount))}
 return balances;
}
export function installmentProgress(s,propertyId){let arr=s.payments.filter(p=>p.propertyId===propertyId&&p.kind!=='financing');let due=arr.reduce((a,p)=>a+number(p.updated??p.amount),0);let paid=arr.reduce((a,p)=>a+Math.min(number(p.paid),number(p.updated??p.amount)),0);return {due,paid,remaining:Math.max(0,due-paid),ratio:due?Math.min(1,paid/due):0}}
export function loanSimulation({principal,annualRate,months,system='SAC',extra=0}){principal=number(principal);annualRate=number(annualRate);months=Math.trunc(number(months));extra=number(extra);if(principal<=0||months<=0||months>600||annualRate<0||annualRate>100)return [];let r=annualRate/1200,balance=principal,amort=principal/months,rows=[];let fixed=system==='Price'?(r?principal*r/(1-(1+r)**(-months)):principal/months):null;for(let i=1;i<=months;i++){let interest=balance*r;let p=system==='Price'?fixed:amort+interest;let principalPaid=Math.min(balance,Math.max(0,p-interest)+extra);balance=Math.max(0,balance-principalPaid);rows.push({month:i,payment:principalPaid+interest,interest,amortization:principalPaid,balance});if(balance<.005)break}return rows}
export function sanitizeForExport(s){return {app:'Ape no Azul',schema:2,exportedAt:new Date().toISOString(),data:s}}
export function csvFile(rows){let quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n')}
