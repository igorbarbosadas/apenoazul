/* Apê no Azul 1.0.12. Arquivo único gerado a partir dos módulos originais. */
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const fmtDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pt-BR'):'';
const monthName=k=>new Date(k+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
const monthOf=d=>String(d||'').slice(0,7);
const today=()=>{let d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const monthStart=()=>today().slice(0,7);
const addMonths=(key,n)=>{let [y,m]=key.split('-').map(Number);let d=new Date(y,m-1+n,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=x=>Number.isFinite(Number(x))?Number(x):0;
function parseBRL(raw){const v=String(raw??'').trim().replace(/\s/g,'').replace(/^R\$/,'');if(!v)return NaN;let x=v;if(x.includes(',')){if(!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(x))return NaN;x=x.replace(/\./g,'').replace(',','.')}else if(/^\d{1,3}\.\d{3}$/.test(x))x=x.replace('.','');else if(!/^\d+(?:\.\d{1,2})?$/.test(x))return NaN;return Number(x)}
const id=()=>String(Date.now())+'_'+Math.random().toString(36).slice(2,9);
const CATEGORIES=['Moradia','Mercado','Transporte','Saúde','Educação','Lazer','Compras','Assinaturas','Serviços','Impostos','Outros'];
const blank=()=>({schema:2,properties:[],selectedProperty:null,transactions:[],payments:[],recurrences:[],cards:[],accounts:[{id:'main',name:'Conta principal',opening:0}],transfers:[],budgets:{},goals:[],documents:[],settings:{referenceIncome:0,referenceEnabled:false,bankPayment:0,bankStart:'',reserve:0,theme:'light',currency:'BRL',alerts:7},meta:{created:today(),importWarnings:[]}});
function normalize(raw){let s=structuredClone(raw);s.schema=2;for(let k of ['properties','transactions','payments','recurrences','cards','accounts','transfers','goals','documents'])if(!Array.isArray(s[k]))s[k]=[];s.budgets=s.budgets||{};s.settings={...blank().settings,...(s.settings||{})};s.meta=s.meta||{importWarnings:[]};return s}
const amount=v=>Math.round(number(v)*100)/100;
const dateValid=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d)))return false;const [y,m,day]=d.split('-').map(Number);const date=new Date(y,m-1,day,12);return date.getFullYear()===y&&date.getMonth()+1===m&&date.getDate()===day};
function validate(s){if(!s||typeof s!=='object'||!Array.isArray(s.transactions)||!Array.isArray(s.payments)||!Array.isArray(s.properties))return 'Estrutura do backup inválida';if(s.transactions.length>100000||s.payments.length>30000)return 'Quantidade de registros excedida';for(let t of s.transactions){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(t.id))||!dateValid(t.date)||!['income','expense'].includes(t.kind)||!Number.isFinite(Number(t.amount))||number(t.amount)<0||number(t.amount)>1e9)return 'Movimentação inválida'}if(new Set(s.transactions.map(x=>x.id)).size!==s.transactions.length)return 'Movimentações duplicadas no backup';
 if(new Set(s.payments.map(x=>x.id)).size!==s.payments.length)return 'Parcelas do imóvel duplicadas';for(let p of s.payments){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(p.id))||!dateValid(p.date)||![p.amount,p.paid,p.updated??0].every(v=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1e9))return 'Parcela inválida'}for(let key of ['properties','recurrences','cards','accounts','transfers','goals','documents'])for(let item of s[key]||[]){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(item.id)))return 'Identificador inválido em '+key}for(let t of s.transfers||[]){if(!Number.isFinite(Number(t.amount))||Number(t.amount)<=0||Number(t.amount)>1e9||t.from===t.to||!dateValid(t.date))return 'Transferência inválida'}for(let a of s.accounts||[]){if(!Number.isFinite(Number(a.opening))||Math.abs(Number(a.opening))>1e9)return 'Saldo inicial da conta inválido'}
 const cardIds=new Set((s.cards||[]).map(c=>c.id));
 if(cardIds.size!==(s.cards||[]).length)return 'Cartões duplicados';
 if(new Set((s.accounts||[]).map(a=>a.id)).size!==(s.accounts||[]).length)return 'Contas duplicadas';
 for(const card of s.cards||[]){
  if(!String(card.name||'').trim()||!Number.isInteger(Number(card.closingDay))||!Number.isInteger(Number(card.dueDay))||Number(card.closingDay)<1||Number(card.closingDay)>28||Number(card.dueDay)<1||Number(card.dueDay)>28)return 'Configuração de cartão inválida';
 }
 for(const t of s.transactions){
  if(t.cardId&&(!cardIds.has(t.cardId)||t.kind!=='expense'||!['paid','planned'].includes(t.status)))return 'Compra vinculada a cartão inválido';
  if(t.cardId&&t.status==='paid'&&(!t.paidAt||!dateValid(t.paidAt)||!(s.accounts||[]).some(a=>a.id===t.accountId)))return 'Pagamento da fatura sem data ou conta válida';
  if(t.cardId&&t.cardPayments!==undefined){
   if(!Array.isArray(t.cardPayments)||t.cardPayments.length>10000)return 'Histórico de fatura inválido';
   let paid=0;
   for(const h of t.cardPayments){
    if(!dateValid(h.date)||!Number.isFinite(Number(h.amount))||cents(h.amount)<=0||!(s.accounts||[]).some(a=>a.id===h.accountId))return 'Pagamento parcial inválido';
    if(h.reversed!==undefined&&typeof h.reversed!=='boolean')return 'Estorno inválido';
    if(h.reversed&&(!dateValid(h.reversedAt)||!String(h.reversalReason||'').trim()))return 'Histórico de estorno inválido';
    if(!h.reversed)paid+=cents(h.amount);
   }
   if(paid>cents(t.amount)||((paid===cents(t.amount))!==(t.status==='paid')))return 'Saldo da fatura inconsistente';
  }

 }
 const accountIds=new Set((s.accounts||[]).map(a=>a.id));
 for(const p of s.payments||[]){for(const h of p.history||[]){
  if(h.accountId!==undefined&&h.accountId!==null&&h.accountId!==''&&!accountIds.has(h.accountId))return 'Conta de origem inexistente em pagamento do imóvel';
  if(!Number.isFinite(Number(h.amount))||Number(h.amount)<0||Number(h.amount)>1e9||!dateValid(h.date))return 'Histórico de pagamento inválido';
 }}return ''}
function migrateLegacy(input){const raw=input?.data||input; if(raw?.schema===2)return {state:normalize(raw),warnings:[]};if(!Array.isArray(raw?.payments)||!Array.isArray(raw?.expenses))throw Error('Este arquivo não é um backup reconhecido.');const s=blank(),warnings=[];const pr=raw.property||{};const propertyId='urban-vila-guilherme';s.properties.push({id:propertyId,name:String(pr.label||'Meu apartamento'),price:amount(pr.price),delivery:pr.delivery||'2029-10-31',financing:amount(pr.financing),developer:'Construtora',status:'Em construção',adjustment:0,financeRate:0,financeMonths:360,financeSystem:'SAC'});s.selectedProperty=propertyId;
s.payments=raw.payments.map((p,i)=>({id:'leg-p-'+String(p.id??i),propertyId,date:p.date,title:p.title||'Parcela',amount:amount(p.value),updated:p.updated==null?null:amount(p.updated),paid:amount(p.paid),kind:p.type==='financiamento'?'financing':'developer',history:p.paid>0?[{date:p.date,amount:amount(p.paid),description:'Pagamento anterior importado'}]:[]}));
s.transactions=(raw.expenses||[]).map((e,i)=>({id:'leg-exp-'+String(e.id??i),kind:'expense',date:e.date,description:String(e.description||'Despesa'),category:String(e.category||'Outros'),source:'',amount:amount(e.value),status:'paid',accountId:'main',legacyRecurringId:e.recurringId??null}));for(let [i,e] of (raw.incomeEntries||[]).entries()){const value=amount(e.value);if(number(e.value)>0&&Math.abs(number(e.value)-value)>.000001)warnings.push(`Rendimento ${e.source||i} em ${e.date} tinha mais de duas casas decimais. Revise o lançamento de ${money(e.value)}.`);if(value>0&&value<10)warnings.push(`Confira o rendimento ${e.source||'sem origem'} de ${e.date}: valor importado ${money(value)}.`);s.transactions.push({id:'leg-inc-'+String(e.id??i),kind:'income',date:e.date,description:e.description||e.source||'Rendimento',source:e.source||'Outros',category:'Rendimentos',amount:value,status:e.status==='recebido'?'received':'planned',accountId:'main',legacyRepeatId:e.repeatRuleId??null});}
s.recurrences=(raw.recurring||[]).map((e,i)=>({id:'leg-rec-'+String(e.id??i),kind:'expense',description:e.description||'Conta recorrente',category:e.category||'Outros',amount:amount(e.value),frequency:'monthly',start:e.startMonth?e.startMonth+'-'+String(e.day||1).padStart(2,'0'):'2026-11-01',active:e.active!==false,confirmed:[],legacyRecurringId:e.id})).concat((raw.repeatRules||[]).map((e,i)=>({id:'leg-rule-'+String(e.id??i),kind:e.kind==='income'?'income':'expense',description:e.description||e.source||e.category||'Recorrência',source:e.source||'',category:e.category||'Outros',amount:amount(e.value),frequency:e.frequency||'monthly',start:e.startDate||'2026-11-01',active:!e.paused,confirmed:[],legacyRepeatId:e.id})));
// Infer prior confirmations by matching legacy IDs; never create duplicates.
for(let rec of s.recurrences){for(let item of s.transactions){if((rec.legacyRecurringId&&item.legacyRecurringId===rec.legacyRecurringId)||(rec.legacyRepeatId&&item.legacyRepeatId===rec.legacyRepeatId))rec.confirmed.push(item.date)}}
s.settings.referenceIncome=number(raw.settings?.income)+number(raw.settings?.extra);s.settings.referenceEnabled=false;if(s.settings.referenceIncome>0)warnings.push('A renda de referência foi importada, mas está desativada na projeção até você confirmar o valor líquido em Ajustes.');s.settings.reserve=number(raw.settings?.reserve);s.settings.bankPayment=number(raw.settings?.bankInstallment);s.budgets=structuredClone(raw.budgets||{});s.goals=[{id:'goal-keys',name:'Reserva para as chaves',target:number(raw.settings?.goal),saved:number(raw.settings?.saved),deadline:pr.delivery||'2029-10-31'}];s.meta.importWarnings=warnings;return {state:normalize(s),warnings};}
function mergeDuplicateRecurrences(s){for(let r of s.recurrences){const matching=s.transactions.filter(t=>t.kind===r.kind&&monthOf(t.date)===monthOf(r.start)&&t.amount===r.amount&&(t.description===r.description||t.source===r.source));if(matching.length&&!r.confirmed.includes(r.start))r.confirmed.push(r.start)}return s}
function recurrenceDates(r,key){if(!r.active||!r.start||monthOf(r.start)>key)return [];let output=[],d=new Date(r.start+'T12:00:00'),ending=addMonths(key,1)+'-01';let max=0;while(d.toISOString().slice(0,10)<ending&&max++<1500){const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(monthOf(date)===key&&!r.confirmed?.includes(date))output.push(date);if(r.frequency==='daily')d.setDate(d.getDate()+1);else if(r.frequency==='weekly')d.setDate(d.getDate()+7);else if(r.frequency==='yearly'){const day=d.getDate();d.setDate(1);d.setFullYear(d.getFullYear()+1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}else{const day=Number(r.start.slice(8,10));d.setDate(1);d.setMonth(d.getMonth()+1);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))}}
return output}
function recurringDue(s,key){return s.recurrences.flatMap(r=>recurrenceDates(r,key).map(date=>({...r,date,occurrenceId:r.id+'|'+date}))).filter(r=>!s.transactions.some(t=>t.recurrenceId===r.id&&t.date===r.date));}
function paymentsFor(s,key){return s.payments.filter(p=>p.kind!=='financing'&&monthOf(p.date)===key)}
// Valores financeiros são arredondados em centavos apenas na apresentação dos agregados.
// A mesma função é usada por Início, Finanças, Agenda e Relatórios.
const cents=value=>Math.round((number(value)+Number.EPSILON)*100);
const reais=value=>Math.round(value)/100;
const transactionEffectiveDate=t=>t.cardId&&t.status==='paid'&&t.paidAt?t.paidAt:t.date;
// Histórico novo: pagamentos distribuídos por parcela; registros antigos pagos
// continuam sendo reconhecidos exatamente uma vez, mesmo sem cardPayments.
function cardPaymentEntries(t){
 if(!t.cardId)return [];
 if(Array.isArray(t.cardPayments))return t.cardPayments.filter(p=>!p.reversed);
 return t.status==='paid'&&t.paidAt&&t.accountId
  ?[{date:t.paidAt,amount:t.amount,accountId:t.accountId}]:[];
}
const cardPaid=t=>reais(cardPaymentEntries(t).reduce((sum,p)=>sum+cents(p.amount),0));
const cardRemaining=t=>reais(Math.max(0,cents(t.amount)-cents(cardPaid(t))));
function registerCardPayment(s,cardId,key,amount,accountId,date){
 const card=(s.cards||[]).find(c=>c.id===cardId);
 if(!card)throw Error('Cartão não encontrado.');
 if(!(s.accounts||[]).some(a=>a.id===accountId))throw Error('Selecione uma conta válida.');
 if(!dateValid(date))throw Error('Informe uma data real de pagamento.');
 const valueCents=cents(amount);
 const rows=s.transactions.filter(t=>t.cardId===cardId&&monthOf(t.date)===key&&cardRemaining(t)>0)
  .sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
 const remainingCents=rows.reduce((v,t)=>v+cents(cardRemaining(t)),0);
 if(!Number.isFinite(Number(amount))||valueCents<=0||valueCents>remainingCents)throw Error('O pagamento precisa ser maior que zero e não ultrapassar o saldo da fatura.');
 let available=valueCents;const changes=[];const batchId=id();
 for(const t of rows){
  if(available<=0)break;
  const allocated=Math.min(available,cents(cardRemaining(t)));available-=allocated;
  const history=cardPaymentEntries(t).map(p=>({...p}));
  history.push({id:id(),batchId,date,amount:reais(allocated),accountId});
  changes.push({id:t.id,history,fullyPaid:history.reduce((sum,p)=>sum+cents(p.amount),0)===cents(t.amount)});
 }
 // Todas as validações ocorrem antes de alterar o estado.
 for(const ch of changes){const tx=rows.find(t=>t.id===ch.id);tx.cardPayments=ch.history;
  tx.status=ch.fullyPaid?'paid':'planned';tx.paidAt=ch.fullyPaid?date:null;
  tx.accountId=ch.fullyPaid?accountId:null;
 }
 return {paid:reais(valueCents),remaining:reais(remainingCents-valueCents),installments:changes.length};
}


// Histórico de cada pagamento mantém estornos auditáveis, sem excluir os
// lançamentos originais e sem afetar outras parcelas da mesma fatura.
function cardPaymentBatches(s,cardId,key){
 const map=new Map();
 for(const t of s.transactions.filter(t=>t.cardId===cardId&&monthOf(t.date)===key)){
  for(const [index,p] of cardPaymentEntries(t).entries()){
   // Pagamentos legados são mostrados, mas não podem ser estornados por
   // engano sem identificador. Novos pagamentos têm batchId compartilhado.
   const token=p.batchId||p.id||'';
   const identity=token||`${t.id}:historico:${index}`;
   if(!map.has(identity))map.set(identity,{id:identity,date:p.date,accountId:p.accountId,amount:0,canReverse:!!p.batchId});
   const entry=map.get(identity);entry.amount=reais(cents(entry.amount)+cents(p.amount));
  }
 }
 return [...map.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
function reverseCardPayment(s,cardId,key,batchId,reason,at=today()){
 if(!String(reason||'').trim())throw Error('Informe o motivo do estorno.');
 if(!dateValid(at))throw Error('Data do estorno inválida.');
 const changes=[];
 for(const t of s.transactions.filter(t=>t.cardId===cardId&&monthOf(t.date)===key)){
  if(!Array.isArray(t.cardPayments))continue;
  t.cardPayments.forEach((h,index)=>{
   if(h.batchId===batchId&&!h.reversed)changes.push({t,index});
  });
 }
 if(!changes.length)throw Error('Pagamento não localizado ou já estornado.');
 const sum=reais(changes.reduce((v,{t,index})=>v+cents(t.cardPayments[index].amount),0));
 // Primeiro validar tudo; só depois alterar as parcelas.
 for(const {t,index} of changes){
  const h=t.cardPayments[index];
  if(!h.accountId||!Number.isFinite(Number(h.amount))||cents(h.amount)<=0)throw Error('Pagamento incompatível com estorno.');
 }
 for(const {t,index} of changes){
  t.cardPayments[index]={...t.cardPayments[index],reversed:true,reversedAt:at,reversalReason:String(reason).trim()};
  const remain=t.cardPayments.filter(h=>!h.reversed).reduce((v,h)=>v+cents(h.amount),0);
  t.status=remain===cents(t.amount)?'paid':'planned';
  t.paidAt=t.status==='paid'?(t.cardPayments.filter(h=>!h.reversed).at(-1)?.date||null):null;
  t.accountId=t.status==='paid'?(t.cardPayments.filter(h=>!h.reversed).at(-1)?.accountId||null):null;
 }
 return {reversed:sum,installments:changes.length};
}

function cashflow(s,key){
 const tx=s.transactions.filter(t=>!t.cardId&&monthOf(transactionEffectiveDate(t))===key);
 // Compra no cartão só vira saída quando o dinheiro realmente sai da conta.
 // O restante em aberto fica previsto no mês de vencimento da fatura.
 const cardTx=s.transactions.filter(t=>t.cardId);
 const cardPaidTx=cardTx.flatMap(t=>cardPaymentEntries(t).filter(h=>monthOf(h.date)===key)
  .map(h=>({...t,amount:h.amount,date:h.date,paidAt:h.date,status:'paid',accountId:h.accountId})));
 const cardPlannedTx=cardTx.filter(t=>monthOf(t.date)===key&&cardRemaining(t)>0)
  .map(t=>({...t,amount:cardRemaining(t),status:'planned'}));
 const entries=[...tx,...cardPaidTx,...cardPlannedTx];
 const sum=(items,get=t=>t.amount)=>reais(items.reduce((total,t)=>total+cents(get(t)),0));
 const incomeReceived=sum(entries.filter(t=>t.kind==='income'&&t.status==='received'));
 const incomePlanned=sum(entries.filter(t=>t.kind==='income'&&t.status!=='received'));
 const spent=sum(entries.filter(t=>t.kind==='expense'&&t.status==='paid'));
 const expensePlanned=sum(entries.filter(t=>t.kind==='expense'&&t.status!=='paid'));
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
  txCount:entries.length,unconfirmed:due.length};
}

function series(s,key,n=6){return Array.from({length:n},(_,i)=>cashflow(s,addMonths(key,i-n+1)))}
function projection(s,key,n=12){return Array.from({length:n},(_,i)=>cashflow(s,addMonths(key,i)))}
// Uma compra parcelada gera compromissos futuros, não pagamentos realizados.
// Todos os valores são distribuídos em centavos, sem perder nem criar centavos.
// Para compras no cartão: vencimento da fatura conforme fechamento e pagamento.
function cardFirstDueDate(purchaseDate,closingDay,dueDay){
 if(!dateValid(purchaseDate)||!Number.isInteger(Number(closingDay))||!Number.isInteger(Number(dueDay))||closingDay<1||closingDay>28||dueDay<1||dueDay>28)throw Error('Dados de cartão ou data inválidos');
 const [year,m,day]=purchaseDate.split('-').map(Number);
 const closeOffset=day>closingDay?1:0;
 const invoiceOffset=closeOffset+(dueDay<=closingDay?1:0);
 const d=new Date(year,m-1+invoiceOffset,1,12);
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(dueDay).padStart(2,'0')}`;
}
function cardStatement(s,cardId,key){
 const items=s.transactions.filter(t=>t.cardId===cardId&&monthOf(t.date)===key);
 const sum=entries=>reais(entries.reduce((acc,t)=>acc+cents(t.amount),0));
 return {items,total:sum(items),pending:sum(items.map(t=>({amount:cardRemaining(t)}))),paid:sum(items.map(t=>({amount:cardPaid(t)})))};
}

// Revise ou cancele uma compra inteira apenas enquanto nenhuma parcela foi paga.
// Retorna uma nova lista: não altera o estado original caso a operação falhe.
function cardPurchaseGroup(transactions, transactionId){
 const origin=transactions.find(t=>t.id===transactionId&&t.cardId);
 if(!origin)throw Error('Compra do cartão não encontrada.');
 return transactions.filter(t=>t.cardId===origin.cardId&&(origin.installmentGroup?t.installmentGroup===origin.installmentGroup:t.id===origin.id));
}
function reviseCardPurchase(s,transactionId,{cardId,description,category,total,count,purchaseDate}){
 const old=cardPurchaseGroup(s.transactions,transactionId);
 if(old.some(t=>cardPaid(t)>0))throw Error('Esta compra já possui parcelas pagas. Os valores confirmados devem ser preservados.');
 const card=(s.cards||[]).find(c=>c.id===cardId);
 if(!card)throw Error('Selecione um cartão válido.');
 if(!String(description||'').trim()||!Number.isFinite(Number(total))||Number(total)<=0||Number(total)>1e9||!Number.isInteger(Number(count))||Number(count)<1||Number(count)>120)throw Error('Informe descrição, valor e quantidade de parcelas válidos.');
 const first=cardFirstDueDate(purchaseDate,card.closingDay,card.dueDay);
 const schedule=Number(count)===1?[{number:1,date:first,amount:reais(cents(total))}]:installmentSchedule({total,count:Number(count),firstDate:first});
 const base=old[0],group=base.installmentGroup||id();
 const replacements=schedule.map((installment,i)=>({
  id:old[i]?.id||id(),kind:'expense',cardId:card.id,description:String(description).trim(),category:category||'Outros',source:'',
  date:installment.date,purchaseDate,amount:installment.amount,status:'planned',accountId:null,
  installmentGroup:group,installmentNumber:installment.number,installmentCount:Number(count)
 }));
 return {transactions:[...s.transactions.filter(t=>!old.some(o=>o.id===t.id)),...replacements],firstDue:first};
}
function cancelCardPurchase(s,transactionId){
 const old=cardPurchaseGroup(s.transactions,transactionId);
 if(old.some(t=>cardPaid(t)>0))throw Error('Esta compra já possui parcelas pagas e não pode ser excluída por completo.');
 const ids=new Set(old.map(t=>t.id));
 return s.transactions.filter(t=>!ids.has(t.id));
}

function installmentSchedule({total, count, firstDate}){
 const value=Number(total), quantity=Number(count);
 if(!Number.isFinite(value)||value<=0||value>1e9||!Number.isInteger(quantity)||quantity<2||quantity>120||!dateValid(firstDate))throw Error('Informe valor, 2 a 120 parcelas e primeira data válida.');
 const totalCents=cents(value);
 if(totalCents<quantity)throw Error('Cada parcela deve ter pelo menos R$ 0,01.');
 const base=Math.floor(totalCents/quantity),rem=totalCents%quantity;
 const [year,month,day]=firstDate.split('-').map(Number);
 return Array.from({length:quantity},(_,i)=>{
  const date=new Date(year,month-1+i,1,12);
  const lastDay=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  const due=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(Math.min(day,lastDay)).padStart(2,'0')}`;
  return {number:i+1, date:due, amount:reais(base+(i<rem?1:0))};
 });
}
function categorySummary(s,key){
 const map=new Map();
 for(const t of s.transactions){
  if(t.kind!=='expense')continue;
  const payments=t.cardId?cardPaymentEntries(t).filter(p=>monthOf(p.date)===key).map(p=>p.amount)
   :(t.status==='paid'&&monthOf(transactionEffectiveDate(t))===key?[t.amount]:[]);
  for(const value of payments){const cat=t.category||'Outros';map.set(cat,reais(cents(map.get(cat)||0)+cents(value)))}
 }
 return [...map.entries()].sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}));
}
// Pagamentos do imóvel só alteram uma conta quando o usuário informa a conta de origem.
// Histórico legado não é associado automaticamente a nenhuma conta.
function accountBalances(s){
 const balances=new Map((s.accounts||[]).map(a=>[a.id,reais(cents(a.opening))]));
 const apply=(accountId,delta)=>{if(!balances.has(accountId))return;balances.set(accountId,reais(cents(balances.get(accountId))+cents(delta)))};
 for(const t of s.transactions||[]){
  if(t.kind==='income'&&t.status==='received')apply(t.accountId,number(t.amount));
  if(t.cardId){for(const h of cardPaymentEntries(t))apply(h.accountId,-number(h.amount));}
  else if(t.kind==='expense'&&t.status==='paid')apply(t.accountId,-number(t.amount));
 }
 for(const p of s.payments||[]){
  if(p.kind==='financing')continue;
  for(const h of p.history||[]){if(h.accountId)apply(h.accountId,-number(h.amount))}
 }
 for(const t of s.transfers||[]){apply(t.from,-number(t.amount));apply(t.to,number(t.amount))}
 return balances;
}
function installmentProgress(s,propertyId){let arr=s.payments.filter(p=>p.propertyId===propertyId&&p.kind!=='financing');let due=arr.reduce((a,p)=>a+number(p.updated??p.amount),0);let paid=arr.reduce((a,p)=>a+Math.min(number(p.paid),number(p.updated??p.amount)),0);return {due,paid,remaining:Math.max(0,due-paid),ratio:due?Math.min(1,paid/due):0}}
function loanSimulation({principal,annualRate,months,system='SAC',extra=0}){principal=number(principal);annualRate=number(annualRate);months=Math.trunc(number(months));extra=number(extra);if(principal<=0||months<=0||months>600||annualRate<0||annualRate>100)return [];let r=annualRate/1200,balance=principal,amort=principal/months,rows=[];let fixed=system==='Price'?(r?principal*r/(1-(1+r)**(-months)):principal/months):null;for(let i=1;i<=months;i++){let interest=balance*r;let p=system==='Price'?fixed:amort+interest;let principalPaid=Math.min(balance,Math.max(0,p-interest)+extra);balance=Math.max(0,balance-principalPaid);rows.push({month:i,payment:principalPaid+interest,interest,amortization:principalPaid,balance});if(balance<.005)break}return rows}
function sanitizeForExport(s){return {app:'Ape no Azul',schema:2,exportedAt:new Date().toISOString(),data:s}}
function csvFile(rows){let quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n')}


const KEY='apenoazul_v1',LEGACY='apenoazul_v021';let db=null;
function openDB(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(Error('IndexedDB indisponível'));return}const req=indexedDB.open('ApeNoAzulDatabase',1);req.onupgradeneeded=()=>req.result.createObjectStore('workspace');req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result)})}
function dbRead(){return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readonly');const r=tx.objectStore('workspace').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function dbWrite(data){return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(data,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
async function initStorage(){let warning='';try{db=await openDB()}catch(e){warning='Armazenamento IndexedDB indisponível. Usando navegador local.'}let state=null;try{if(db)state=await dbRead()}catch(e){warning='Falha na leitura do banco local. Usando cópia do navegador.'}if(!state){try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){warning='Dados locais não puderam ser lidos.'}}const existingData=!!state;
if(state&&validate(state)){
 const problem=validate(state);
 try{await saveRecovery(state);warning='Os dados armazenados apresentaram inconsistência ('+problem+'). Uma cópia local de recuperação foi criada. Não importe nem substitua registros antes de exportar uma cópia.'}
 catch(e){warning='Os dados armazenados apresentaram inconsistência ('+problem+'). A cópia de recuperação falhou. Não faça lançamentos até salvar seus dados manualmente.'}
 state=null;
}
return {state:state?normalize(state):blank(),warning,hasData:existingData};}
async function persist(s){const data=normalize(s);const err=validate(data);if(err)throw Error(err);if(db){await dbWrite(data);try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){/* IndexedDB is authoritative */}}else{localStorage.setItem(KEY,JSON.stringify(data))}return true}
function readBackup(file){return new Promise((resolve,reject)=>{if(file.size>12*1024*1024)return reject(Error('Arquivo excede 12 MB.'));const rd=new FileReader();rd.onload=()=>{try{resolve(JSON.parse(String(rd.result)))}catch(e){reject(Error('O JSON está inválido'))}};rd.onerror=()=>reject(rd.error);rd.readAsText(file)})}
async function saveRecovery(s){try{localStorage.setItem('apenoazul_recovery_'+Date.now(),JSON.stringify(s))}catch(e){throw Error('Não foi possível criar a cópia antes da importação. Exporte um backup manual.') }}


let state=blank(),page='inicio',month=monthStart(),finTab='movimentos',propertyTab='parcelas',search='',kindFilter='all',menuOpened='',storageWarning='',sampleLoaded=false;
const $=selector=>document.querySelector(selector);
const uid=x=>esc(x);
function warn(text,bad=false){const el=$('#toast');el.textContent=text;el.className='toast'+(bad?' bad':'');clearTimeout(warn.t);warn.t=setTimeout(()=>el.className='',4800)}
function down(file,content,mime='application/json'){let blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function icon(p){return ({inicio:'⌂',financas:'⇄',imovel:'▤',agenda:'▦',relatorios:'▥',metas:'◎',documentos:'▣',ajustes:'⚙'}[p]||'◇')}
const nav=[['inicio','Início'],['financas','Finanças'],['imovel','Imóvel'],['agenda','Agenda'],['relatorios','Relatórios'],['metas','Metas'],['documentos','Documentos'],['ajustes','Ajustes']];
function navHTML(mobile=false){const options=mobile?[['inicio','Início'],['financas','Finanças'],['add','Adicionar'],['imovel','Imóvel'],['mais','Mais']]:nav;return options.map(([p,t])=>`<button data-nav="${p}" class="${page===p?'active':''} ${p==='add'?'add':''}" aria-label="${t}"><span class="ico">${p==='add'?'＋':p==='mais'?'☰':icon(p)}</span><span>${t}</span></button>`).join('')}
function amt(n){return money(n)}
function infoBox(msg,kind=''){return `<div class="info ${kind}">${msg}</div>`}
function btn(text,act,cls=''){return `<button class="btn ${cls}" data-action="${act}">${text}</button>`}
function metric(label,value,desc='',cls=''){return `<div class="card metric ${cls}"><label>${label}</label><div class="num">${value}</div><div class="small">${desc}</div></div>`}
function paymentRemaining(p){return Math.max(0,number(p.updated??p.amount)-number(p.paid))}
function property(){return state.properties.find(p=>p.id===state.selectedProperty)||state.properties[0]}
function recalc(){return cashflow(state,month)}
let lastSavedState=null;
async function commit(message='Alterações salvas'){
 try{await persist(state);lastSavedState=structuredClone(state);warn(message);render();return true}
 catch(e){if(lastSavedState)state=structuredClone(lastSavedState);warn('Não foi possível salvar: '+e.message,true);render();return false}
}
function render(){document.body.classList.toggle('dark',state.settings.theme==='dark');const header=({inicio:['Seu apê, no azul.','Uma visão clara das suas contas e dos seus próximos passos.'],financas:['Finanças','Registre entradas e saídas. Organize seu dinheiro.'],imovel:['Meu imóvel','Parcelas, financiamento e todas as etapas da compra.'],agenda:['Agenda financeira','Seus vencimentos em um só lugar.'],relatorios:['Relatórios','Descubra como suas finanças estão evoluindo.'],metas:['Minhas metas','Organize a reserva para suas próximas conquistas.'],documentos:['Documentos','Guarde comprovantes e arquivos importantes.'],ajustes:['Ajustes','Personalize sua experiência e proteja seus dados.']})[page];let content=({inicio:homePage,financas:financePage,imovel:propertyPage,agenda:agendaPage,relatorios:reportsPage,metas:goalsPage,documentos:docsPage,ajustes:settingsPage})[page]();$('#app').innerHTML=`<div class="shell"><aside class="side"><div class="logo"><div class="brand-icon">⌂</div><span>apê <span>no azul.</span></span></div><div class="nav-heading">SEU ESPAÇO</div>${navHTML()}<div class="side-foot"><strong>Seus dados, seu controle</strong>Registros armazenados neste dispositivo. Você pode exportar um backup quando quiser.</div></aside><main class="main"><header class="page-head"><div><div class="eyebrow">FINANÇAS DO SEU IMÓVEL</div><h1>${header[0]}</h1><p>${header[1]}</p></div><div class="head-actions"><div class="month-switch"><button data-action="prev-month" title="Mês anterior">‹</button><span>${monthName(month)}</span><button data-action="next-month" title="Próximo mês">›</button></div></div></header>${storageWarning?infoBox(esc(storageWarning),'warning'):''}${content}<footer class="footer">apê no azul. · versão 1.0.12 · planejamento local</footer></main><nav class="bottom">${navHTML(true)}</nav></div>`}
function homePage(){const x=recalc(),prev=projection(state,month,3),p=property(),progress=p?installmentProgress(state,p.id):null;const due=state.payments.filter(z=>z.kind!=='financing'&&paymentRemaining(z)>0&&z.date>=month+'-01').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);const alerts=[];if(x.projected<0)alerts.push(['bad',`Sua projeção de ${monthName(month)} está negativa em ${amt(-x.projected)}.`]);if(x.referenceUsed>0)alerts.push(['warn','A previsão usa renda de referência. Esse dinheiro ainda não foi registrado como recebido.']);if(x.incomeIncomplete)alerts.push(['warn','Renda não informada por completo neste mês. O saldo projetado considera apenas os rendimentos cadastrados.']);if(x.bankNeedsStart)alerts.push(['warn','A prestação bancária foi informada, mas a data de início está vazia. Ela não entra na previsão até você definir a data em Ajustes.']);if(state.meta?.importWarnings?.length)alerts.push(['warn',`Há ${state.meta.importWarnings.length} observação(ões) na migração. Confira em Ajustes.`]);if(x.unconfirmed)alerts.push(['',`${x.unconfirmed} ocorrência(s) recorrente(s) aguardam confirmação neste mês.`]);return `<div class="hero"><div><small>PREVISÃO DO MÊS</small><div class="num">${amt(x.projected)}</div><p>Entradas esperadas menos despesas, parcelas, compromissos recorrentes e reserva. Não representa o saldo bancário.</p>${btn('＋ Novo lançamento','add','primary')}</div><div class="hero-side"><small>RECEBIDO NESTE MÊS</small><div class="num">${amt(x.incomeReceived)}</div><small>${amt(x.incomePlanned+x.repeatingIncome)} em rendimentos previstos ou recorrentes</small></div></div><div class="metric-grid">${metric('Despesas registradas',amt(x.spent),'Valores pagos neste mês')}${metric('Compromissos do imóvel',amt(x.propertyPending),'Parcelas em aberto no período')}${metric('Contas a confirmar',amt(x.repeatingExpenses),'Ocorrências recorrentes')}${metric('Saldo realizado',amt(x.realized),'Recebimentos menos saídas registradas',x.realized>=0?'positive':'negative')}</div><div class="grid2"><div class="card"><div class="card-head"><h2>Próximos vencimentos</h2>${btn('Ver agenda','nav-agenda','small')}</div>${due.length?due.map(z=>`<div class="line-item"><div class="line-icon">▤</div><div class="line-body"><b>${esc(z.title)}</b><small>${fmtDate(z.date)}</small></div><div class="line-amount">${amt(paymentRemaining(z))}</div></div>`).join(''):'<div class="empty"><b>Sem parcelas pendentes</b>Cadastre um imóvel e os compromissos para acompanhar aqui.</div>'}</div><div class="card"><div class="card-head"><h2>${p?'Seu progresso no imóvel':'Seu imóvel'}</h2>${btn('Gerenciar','nav-imovel','small')}</div>${p?`<div class="caption">${esc(p.name)}</div><h2 style="font-size:25px;margin:12px 0">${amt(progress.paid)} <span class="muted" style="font-size:12px;font-weight:600">pagos à construtora</span></h2><div class="progress"><span style="width:${(progress.ratio*100).toFixed(1)}%"></span></div><div class="summary-row"><span>Progresso dos pagamentos</span><strong>${(progress.ratio*100).toFixed(1)}%</strong></div><div class="summary-row"><span>Restante nominal</span><strong>${amt(progress.remaining)}</strong></div><div class="summary-row"><span>Entrega prevista</span><strong>${fmtDate(p.delivery)}</strong></div>`:'<div class="empty">Cadastre seu primeiro imóvel.</div>'}</div></div><div class="grid2"><div class="card"><div class="card-head"><h2>Próximos três meses</h2>${btn('Ver previsão','nav-agenda','small')}</div>${prev.map(m=>`<div class="bar-row"><span class="caption" style="text-transform:capitalize">${monthName(m.key).split(' ')[0]} ${m.key.slice(0,4)}</span><div class="progress"><span style="width:${Math.min(100,Math.max(4,m.committed/Math.max(...prev.map(y=>y.committed),1)*100))}%;background:${m.projected<0?'#dc7776':'var(--blue)'}"></span></div><strong style="color:${m.projected<0?'var(--red)':'var(--green)'}">${amt(m.projected)}</strong></div>`).join('')}</div><div class="card"><h2>O que merece atenção</h2><div class="alerts">${alerts.length?alerts.map(([k,t])=>`<div class="alert-row ${k}"><span>${k==='bad'?'!':'ⓘ'}</span>${t}</div>`).join(''):'<div class="alert-row">Nenhum alerta importante para o mês selecionado.</div>'}</div></div></div>`}
function financePage(){const x=recalc();const tabs=[['movimentos','Movimentações'],['orcamento','Orçamento'],['recorrentes','Recorrentes'],['contas','Contas'],['cartoes','Cartões']];let sub=finTab==='movimentos'?movements():finTab==='orcamento'?budgets():finTab==='recorrentes'?recurrences():finTab==='contas'?accounts():creditCardsPage();return `<div class="metric-grid">${metric('Entrou',amt(x.incomeReceived),'Recebido de fato','positive')}${metric('A receber',amt(x.incomePlanned+x.repeatingIncome),'Renda prevista')}${metric('Saiu',amt(x.spent),'Despesas pagas','negative')}${metric('Saldo realizado',amt(x.realized),'Recebido menos despesas pagas e pagamentos do imóvel',x.realized<0?'negative':'positive')}</div><div class="tabs">${tabs.map(([k,t])=>`<button data-tab="finance:${k}" class="${finTab===k?'active':''}">${t}</button>`).join('')}</div>${sub}`}
function movements(){let entries=state.transactions.filter(t=>monthOf(transactionEffectiveDate(t))===month).filter(t=>kindFilter==='all'||t.kind===kindFilter).filter(t=>(t.description+' '+(t.source||'')+' '+(t.category||'')).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).sort((a,b)=>b.date.localeCompare(a.date));return `<div class="card"><div class="card-head"><h2>Histórico de ${monthName(month)}</h2>${btn('＋ Novo lançamento','add','primary')}</div><div class="filters"><input class="input" id="search" value="${esc(search)}" placeholder="Buscar por descrição, origem ou categoria"><select data-filter="kind"><option value="all">Todas as movimentações</option><option value="income" ${kindFilter==='income'?'selected':''}>Rendimentos</option><option value="expense" ${kindFilter==='expense'?'selected':''}>Despesas</option></select>${btn('Exportar CSV','csv-transactions','small')}</div>${entries.length?entries.map(t=>transactionRow(t)).join(''):'<div class="empty"><b>Sem movimentações neste período</b>Use Novo lançamento para registrar entradas e despesas.</div>'}</div>`}
function transactionRow(t){const income=t.kind==='income',done=t.status===(income?'received':'paid');return `<div class="line-item transaction-item"><div class="line-icon ${income?'income':''}">${income?'↗':'↙'}</div><div class="line-body"><b>${esc(t.description||t.source||'Sem descrição')}</b><small>${income?esc(t.source||'Rendimento'):esc(t.category||'Outros')} · ${t.cardId&&t.status==='paid'&&t.paidAt?'Pago em '+fmtDate(t.paidAt)+' · Vencimento '+fmtDate(t.date):fmtDate(t.date)} · <span class="transaction-status ${done?'done':'pending'}">${done?income?'Recebido':'Pago':'Previsto'}</span>${t.installmentGroup?' · Parcela '+t.installmentNumber+'/'+t.installmentCount:''}</small></div><div class="line-amount ${income?'income':''}">${income?'+':'−'} ${amt(t.amount)}</div>${t.cardId?(done?'<span class="settled-label">✓ Na fatura paga</span>':'<span class="badge">Na fatura</span>'):(done?'<span class="settled-label">✓ Confirmado</span>':btn(income?'✓ Recebido':'✓ Pagar','settle-tx:'+t.id,'small settle-quick '+(income?'settle-income':'settle-expense')))}${t.cardId?cardPurchaseActions(t):menuActions([['Editar','edit-tx:'+t.id],['Excluir','delete-tx:'+t.id]])}</div>`}
function menuActions(items){return `<details class="menu"><summary aria-label="Mais opções">⋯</summary><div class="pop">${items.map(([name,act])=>`<button data-action="${esc(act)}" class="${name.startsWith('Excluir')?'red':''}">${name}</button>`).join('')}</div></details>`}
function cardPurchaseActions(t){
 const group=cardPurchaseGroup(state.transactions,t.id);
 if(group.some(p=>cardPaid(p)>0))return menuActions([['Editar descrição/categoria','edit-card-details:'+t.id]]);
 return menuActions([['Editar compra','edit-card-purchase:'+t.id],['Excluir compra','delete-card-purchase:'+t.id]]);
}
function budgets(){const list=CATEGORIES;const categories=categorySummary(state,month);const current=state.budgets[month]||{};const total=Object.values(current).reduce((a,b)=>a+number(b),0),spent=categories.reduce((a,b)=>a+b.total,0);return `<div class="card"><div class="card-head"><h2>Orçamento por categoria</h2>${btn('Definir limites','edit-budgets','primary')}</div><div class="mini-grid"><div class="mini-box"><small>Planejado</small><strong>${amt(total)}</strong></div><div class="mini-box"><small>Gasto</small><strong>${amt(spent)}</strong></div><div class="mini-box"><small>Disponível nas categorias</small><strong>${amt(Math.max(0,total-spent))}</strong></div></div><div style="margin-top:18px">${list.map(cat=>{const lim=number(current[cat]),val=categories.find(z=>z.name===cat)?.total||0,pct=lim?100*val/lim:0;return `<div style="padding:10px 0"><div class="summary-row" style="border:0;padding:0 0 9px"><strong>${cat}</strong><span>${amt(val)} ${lim?'de '+amt(lim):'· sem limite'}</span></div><div class="progress"><span style="width:${lim?Math.min(100,pct):0}%;background:${pct>100?'var(--red)':'var(--blue)'}"></span></div></div>`}).join('')}</div></div>`}
function recurrences(){const due=recurringDue(state,month);return `<div class="card"><div class="card-head"><h2>Programações recorrentes</h2>${btn('＋ Nova recorrência','new-recurrence','primary')}</div>${infoBox('As ocorrências previstas não são registradas como recebidas ou pagas até você confirmar.')}<div class="mini-grid"><div class="mini-box"><small>Regras ativas</small><strong>${state.recurrences.filter(r=>r.active).length}</strong></div><div class="mini-box"><small>Ocorrências a confirmar</small><strong>${due.length}</strong></div><div class="mini-box"><small>Previstas para o mês</small><strong>${amt(due.reduce((a,r)=>a+r.amount,0))}</strong></div></div>${state.recurrences.map(r=>`<div class="line-item"><div class="line-icon ${r.kind==='income'?'income':''}">${r.kind==='income'?'↗':'↙'}</div><div class="line-body"><b>${esc(r.description)}</b><small>${r.frequency==='daily'?'Diária':r.frequency==='weekly'?'Semanal':r.frequency==='yearly'?'Anual':'Mensal'} · desde ${fmtDate(r.start)} · ${r.active?'Ativa':'Pausada'}</small></div><div class="line-amount">${amt(r.amount)}</div>${menuActions([['Editar','edit-recurrence:'+r.id],[r.active?'Pausar':'Retomar','toggle-recurrence:'+r.id],['Excluir','delete-recurrence:'+r.id]])}</div>`).join('')||'<div class="empty">Nenhuma recorrência cadastrada.</div>'}</div><div class="card"><h2>Confirmar neste mês</h2>${due.map(r=>`<div class="line-item"><div class="line-icon ${r.kind==='income'?'income':''}">${r.kind==='income'?'↗':'↙'}</div><div class="line-body"><b>${esc(r.description)}</b><small>${fmtDate(r.date)} · ${r.kind==='income'?'Rendimento':'Despesa'} · ${amt(r.amount)}</small></div>${btn(r.kind==='income'?'Confirmar recebimento':'Marcar pago','confirm-recurrence:'+r.occurrenceId,'small primary')}</div>`).join('')||'<div class="empty">Nenhuma ocorrência pendente neste mês.</div>'}</div>`}
function accounts(){let accounts=state.accounts||[],balances=accountBalances(state);return `<div class="card"><div class="card-head"><h2>Contas e transferências</h2><div class="head-actions">${btn('＋ Conta','new-account','small')}${btn('Transferência','new-transfer','primary small')}</div></div>${infoBox('O saldo estimado considera rendimentos, gastos, transferências e pagamentos à construtora com conta de origem informada. Não substitui a conciliação bancária.')}<div class="grid-even">${accounts.map(a=>{return `<div class="mini-box"><div class="card-head" style="margin:0 0 6px"><strong>${esc(a.name)}</strong>${btn('Editar','edit-account:'+a.id,'small')}</div><div style="font:800 22px Manrope">${amt(balances.get(a.id)??number(a.opening))}</div><div class="caption">Estimativa pelo histórico registrado</div></div>`}).join('')}</div><h2 style="margin-top:25px">Transferências</h2>${state.transfers.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15).map(t=>`<div class="line-item"><div class="line-icon">⇄</div><div class="line-body"><b>${esc(accounts.find(a=>a.id===t.from)?.name)} → ${esc(accounts.find(a=>a.id===t.to)?.name)}</b><small>${fmtDate(t.date)}</small></div><div class="line-amount">${amt(t.amount)}</div>${menuActions([['Editar','edit-transfer:'+t.id],['Excluir','delete-transfer:'+t.id]])}</div>`).join('')||'<div class="empty">Nenhuma transferência cadastrada.</div>'}</div>`}
function creditCardsPage(){
 const cards=state.cards||[];
 return `<div class="card"><div class="card-head"><div><h2>Cartões de crédito</h2><p class="caption">Compras entram na fatura. O saldo da conta só muda quando a fatura é paga.</p></div><div class="head-actions">${cards.length?btn('＋ Nova compra','new-card-purchase','primary'):''}${btn('＋ Novo cartão','new-card','small')}</div></div>
 ${cards.length?cards.map(card=>{
 const invoice=cardStatement(state,card.id,month);
 return `<div class="credit-panel"><div class="card-head"><div><strong>${esc(card.name)}</strong><div class="caption">Fecha dia ${card.closingDay} · vence dia ${card.dueDay}</div></div></div><div class="mini-grid"><div class="mini-box"><small>Total da fatura</small><strong>${amt(invoice.total)}</strong></div><div class="mini-box"><small>A pagar</small><strong>${amt(invoice.pending)}</strong></div><div class="mini-box"><small>Pago</small><strong>${amt(invoice.paid)}</strong></div></div>
 <div class="credit-actions">${invoice.pending>0?btn('Registrar pagamento','pay-card:'+card.id,'primary'):''}${btn('Editar cartão','edit-card:'+card.id,'small')}${btn('Excluir cartão','delete-card:'+card.id,'danger small')}</div>
 ${state.transactions.some(t=>t.cardId===card.id&&monthOf(t.date)===month&&t.cardPayments?.some(h=>h.reversed))?`<details class="reversal-audit"><summary>Consultar estornos</summary>${state.transactions.filter(t=>t.cardId===card.id&&monthOf(t.date)===month).flatMap(t=>(t.cardPayments||[]).filter(h=>h.reversed).map(h=>`<div class="summary-row"><span>${esc(t.description)} · ${fmtDate(h.reversedAt)} · ${esc(h.reversalReason)}</span><strong>${amt(h.amount)}</strong></div>`)).join('')}</details>`:''}
 ${cardPaymentBatches(state,card.id,month).length?`<div class="payment-audit"><strong>Pagamentos registrados</strong>${cardPaymentBatches(state,card.id,month).map(h=>`<div class="summary-row"><span>${fmtDate(h.date)} · ${esc(state.accounts.find(a=>a.id===h.accountId)?.name||'Conta')} · ${amt(h.amount)}</span>${h.canReverse?btn('Estornar','reverse-card-payment:'+card.id+':'+h.id,'small danger'):''}</div>`).join('')}</div>`:''}
 ${invoice.items.length?invoice.items.map(t=>`<div class="line-item"><div class="line-icon">▦</div><div class="line-body"><b>${esc(t.description)}</b><small>${fmtDate(t.date)} · ${esc(t.category||'Outros')} · ${t.installmentNumber||1}/${t.installmentCount||1} · ${cardRemaining(t)===0?'Paga':cardPaid(t)>0?'Parcial: '+amt(cardPaid(t))+' pago · '+amt(cardRemaining(t))+' restante':'Aguardando pagamento'}</small></div><strong>${amt(t.amount)}</strong>${cardPurchaseActions(t)}</div>`).join(''):'<div class="empty">Nenhuma compra nesta fatura. Altere o mês para conferir outros vencimentos.</div>'}</div>`;
 }).join(''):'<div class="empty"><b>Nenhum cartão cadastrado</b>Adicione seu cartão para acompanhar compras e faturas sem registrar o pagamento duas vezes.</div>'}</div>`;
}
function cardModal(edit=null){
 const card=state.cards.find(c=>c.id===edit)||{};
 showModal(edit?'Editar cartão':'Novo cartão','Os novos dias serão usados nas próximas compras. Parcelas já cadastradas manterão os vencimentos originais.',`<div class="fields">${field('Nome do cartão','name',card.name||'','text','required maxlength="80"')}${field('Dia de fechamento','closingDay',card.closingDay||5,'number','min="1" max="28" required')}${field('Dia de vencimento','dueDay',card.dueDay||12,'number','min="1" max="28" required')}</div>`,'Salvar cartão','card',{id:edit});
}
function cardPurchaseModal(cardId,editTxId=null){
 const existing=editTxId?cardPurchaseGroup(state.transactions,editTxId):[];
 if(existing.some(t=>cardPaid(t)>0)){warn('Compra com parcelas pagas: correção bloqueada para preservar os saldos. Exporte o backup antes de corrigir lançamentos confirmados.',true);return}
 const card=state.cards.find(c=>c.id===(existing[0]?.cardId||cardId));if(!card)return;
 const first=existing[0],total=existing.reduce((sum,t)=>sum+Math.round(number(t.amount)*100),0)/100;
 const body=`<div class="fields">${field('Descrição','description',first?.description||'','text','required maxlength="120"')}${field('Valor total (R$)','amount',first?total:'','text','required')}${field('Data da compra','date',first?.purchaseDate||today(),'date','required')}${field('Quantidade de parcelas','count',existing.length||1,'number','min="1" max="120" required')}${selectField('Categoria','category',CATEGORIES,first?.category||'Compras')}${selectField('Cartão','cardId',state.cards.map(c=>[c.id,c.name]),card.id)}</div>`;
 showModal(editTxId?'Editar compra no cartão':'Nova compra no cartão',editTxId?'A alteração recalcula as parcelas que ainda não foram pagas. Compras confirmadas ficam protegidas.':'As parcelas serão previstas nas faturas. Não registre novamente a compra como despesa comum.',body,editTxId?'Salvar alterações':'Registrar compra',editTxId?'card-purchase-edit':'card-purchase',{id:editTxId||cardId});
}
function cardDetailsModal(txId){
 const group=cardPurchaseGroup(state.transactions,txId),t=group[0];
 showModal('Editar detalhes da compra','Uma compra com pagamento confirmado só permite corrigir descrição e categoria. Valores, datas e parcelas pagas permanecem preservados.',`<div class="fields">${field('Descrição','description',t.description,'text','required maxlength="120"')}${selectField('Categoria','category',CATEGORIES,t.category||'Outros')}</div>`,'Salvar detalhes','card-details',{id:txId});
}
function cardPayModal(cardId){
 const card=state.cards.find(c=>c.id===cardId);const bill=cardStatement(state,cardId,month);
 if(!card||bill.pending<=0)return;
 showModal('Registrar pagamento da fatura',`Cartão ${esc(card.name)} · ${monthName(month)} · ${amt(bill.pending)} em aberto. Você pode pagar uma parte ou o valor integral.`, `<div class="fields">${field('Valor pago (R$)','amount',bill.pending.toFixed(2).replace('.',','),'text','required')}${selectField('Conta que pagou a fatura','accountId',state.accounts.map(a=>[a.id,a.name]),state.accounts[0]?.id)}${field('Data do pagamento','paidAt',today(),'date','required')}</div><p class="caption">O pagamento será distribuído entre as parcelas desta fatura, sem criar outra despesa.</p>`,'Registrar pagamento','card-pay',{id:cardId});
}
function propertyPage(){const p=property();if(!p)return `<div class="card"><div class="empty"><b>Organize seu imóvel</b>Cadastre um apartamento ou casa para acompanhar parcelas e financiamento.</div><div style="text-align:center;margin-top:15px">${btn('＋ Cadastrar imóvel','new-property','primary')}</div></div>`;const progress=installmentProgress(state,p.id);let tabs=[['parcelas','Parcelas'],['financiamento','Financiamento'],['obra','Planejamento']];return `<div class="card"><div class="card-head"><div><h2 style="margin:0 0 6px">${esc(p.name)}</h2><span class="caption">Entrega prevista: ${fmtDate(p.delivery)} · ${esc(p.status||'Em planejamento')}</span></div><div class="head-actions">${state.properties.length>1?`<select id="propertySelect" aria-label="Selecionar imóvel">${state.properties.map(z=>`<option value="${esc(z.id)}" ${p.id===z.id?'selected':''}>${esc(z.name)}</option>`).join('')}</select>`:''}${btn('Editar','edit-property:'+p.id,'small')}${btn('Excluir','delete-property:'+p.id,'danger small')}${btn('＋ Imóvel','new-property','small')}</div></div><div class="mini-grid"><div class="mini-box"><small>Preço do imóvel</small><strong>${amt(p.price)}</strong></div><div class="mini-box"><small>Pago à construtora</small><strong>${amt(progress.paid)}</strong></div><div class="mini-box"><small>Restante à construtora</small><strong>${amt(progress.remaining)}</strong></div></div><div class="progress" style="margin-top:16px"><span style="width:${progress.ratio*100}%"></span></div></div><div class="tabs">${tabs.map(([k,t])=>`<button data-tab="property:${k}" class="${propertyTab===k?'active':''}">${t}</button>`).join('')}</div>${propertyTab==='parcelas'?propertyPayments(p):propertyTab==='financiamento'?financing(p):propertyPlanning(p)}`}
function propertyPayments(p){const list=state.payments.filter(x=>x.propertyId===p.id).sort((a,b)=>a.date.localeCompare(b.date));const total=list.filter(x=>x.kind==='developer');return `<div class="card"><div class="card-head"><h2>Cronograma de pagamentos</h2>${btn('＋ Parcela','new-payment','primary')}</div>${infoBox('A parcela de financiamento total é tratada separadamente das prestações bancárias. Atualize os boletos quando houver correção.')}<div class="table-scroll"><table class="table"><thead><tr><th>Vencimento</th><th>Descrição</th><th>Valor atualizado</th><th>Pago</th><th>Restante</th><th class="right">Ações</th></tr></thead><tbody>${list.map(r=>`<tr><td>${fmtDate(r.date)}</td><td><strong>${esc(r.title)}</strong>${r.kind==='financing'?'<br><span class="badge">Financiamento total</span>':''}</td><td>${amt(r.updated??r.amount)}</td><td>${amt(r.paid)}</td><td>${r.kind==='financing'?'Não mensal':amt(paymentRemaining(r))}</td><td class="right"><div class="actions">${btn('Editar','edit-payment:'+r.id,'small')}${btn('Excluir','delete-payment:'+r.id,'danger small')}${r.kind==='developer'&&paymentRemaining(r)>0?btn('Pagar','pay:'+r.id,'primary small'):''}</div></td></tr>`).join('')}</tbody></table></div></div>`}
function financing(p){let data=loanSimulation({principal:p.financing,annualRate:p.financeRate,months:p.financeMonths,system:p.financeSystem,extra:p.extraAmort||0});let first=data[0],interest=data.reduce((a,r)=>a+r.interest,0);return `<div class="card"><div class="card-head"><h2>Simulação de financiamento</h2>${btn('Alterar condições','edit-property:'+p.id,'small')}</div>${infoBox('Esta simulação é ilustrativa. Não inclui seguros, tarifas, TR, impostos nem regras específicas do banco. A prestação real deve ser informada em Ajustes.')}<div class="mini-grid"><div class="mini-box"><small>Principal</small><strong>${amt(p.financing)}</strong></div><div class="mini-box"><small>1ª prestação simulada</small><strong>${first?amt(first.payment):'Configure os juros'}</strong></div><div class="mini-box"><small>Juros acumulados simulados</small><strong>${amt(interest)}</strong></div></div><div class="summary-row"><span>Sistema</span><strong>${esc(p.financeSystem||'SAC')}</strong></div><div class="summary-row"><span>Juros nominais anuais</span><strong>${number(p.financeRate)}%</strong></div><div class="summary-row"><span>Prazo configurado</span><strong>${number(p.financeMonths)} meses</strong></div><div class="summary-row"><span>Amortização extra por mês</span><strong>${amt(p.extraAmort||0)}</strong></div>${data.length?`<h2 style="margin-top:24px">Primeiras prestações simuladas</h2><div class="table-scroll"><table class="table"><thead><tr><th>Mês</th><th>Prestação</th><th>Juros</th><th>Amortização</th><th>Saldo</th></tr></thead><tbody>${data.slice(0,12).map(z=>`<tr><td>${z.month}</td><td>${amt(z.payment)}</td><td>${amt(z.interest)}</td><td>${amt(z.amortization)}</td><td>${amt(z.balance)}</td></tr>`).join('')}</tbody></table></div>`:''}</div>`}
function propertyPlanning(p){return `<div class="card"><div class="card-head"><h2>Obra, reajustes e próximos passos</h2>${btn('Editar dados','edit-property:'+p.id,'small')}</div><div class="summary-row"><span>Etapa cadastrada</span><strong>${esc(p.status||'Em planejamento')}</strong></div><div class="summary-row"><span>Previsão de entrega</span><strong>${fmtDate(p.delivery)}</strong></div><div class="summary-row"><span>INCC mensal para simulação</span><strong>${number(p.adjustment).toFixed(2).replace('.',',')}%</strong></div><div class="summary-row"><span>Saldo nominal construtora</span><strong>${amt(installmentProgress(state,p.id).remaining)}</strong></div>${infoBox('O reajuste só entra no valor da parcela se você atualizar o boleto. O índice informado serve como referência, não reajusta o contrato automaticamente.')}${btn('Ver metas para as chaves','nav-metas','primary')}</div>`}
function agendaPage(){let arr=projection(state,month,12),peak=Math.max(...arr.map(z=>z.committed),1);return `<div class="metric-grid">${metric('Maior mês de compromissos',amt(peak),'Próximos 12 meses')}${metric('Total de saídas previstas',amt(arr.reduce((a,b)=>a+b.committed,0)),'Inclui custos cadastrados')}${metric('Meses com déficit',arr.filter(z=>z.projected<0).length,'Com base nas entradas informadas','negative')}${metric('Renda prevista no período',amt(arr.reduce((a,b)=>a+b.incomeForecast,0)),'Inclui referências quando usadas')}</div><div class="card"><h2>Calendário de compromissos</h2>${arr.map(m=>`<div class="bar-row"><span style="font-size:11px;text-transform:capitalize">${monthName(m.key).replace(' de ','/')}</span><div class="progress"><span style="background:${m.projected<0?'#d97879':'var(--blue)'};width:${Math.max(2,Math.min(100,100*m.committed/peak))}%"></span></div><strong style="color:${m.projected<0?'var(--red)':'var(--green)'}">${amt(m.projected)}</strong></div>`).join('')}</div><div class="card"><h2>Compromissos de ${monthName(month)}</h2>${[...state.payments.filter(p=>p.kind==='developer'&&monthOf(p.date)===month).map(p=>({date:p.date,title:p.title,amount:paymentRemaining(p),status:paymentRemaining(p)>0?'Pendente':'Pago'})),...recurringDue(state,month).filter(r=>r.kind==='expense').map(r=>({date:r.date,title:r.description,amount:r.amount,status:'Recorrente'}))].sort((a,b)=>a.date.localeCompare(b.date)).map(p=>`<div class="line-item"><div class="line-icon">▦</div><div class="line-body"><b>${esc(p.title)}</b><small>${fmtDate(p.date)} · ${p.status}</small></div><strong>${amt(p.amount)}</strong></div>`).join('')||'<div class="empty">Nenhum compromisso cadastrado para o mês.</div>'}</div>`}
function reportsPage(){const x=recalc(),months=series(state,month,6),max=Math.max(1,...months.map(m=>m.spent));const categories=categorySummary(state,month),maxCat=Math.max(1,...categories.map(c=>c.total));return `<div class="metric-grid">${metric('Rendimentos recebidos',amt(x.incomeReceived),'Neste mês','positive')}${metric('Despesas realizadas',amt(x.spent),'Neste mês')}${metric('Compromissos do imóvel',amt(x.propertyPaid+x.propertyPending),'Pagos e pendentes')}${metric('Projeção líquida',amt(x.projected),'Não equivale ao saldo bancário',x.projected<0?'negative':'positive')}</div><div class="grid-even"><div class="card"><h2>Despesas dos últimos seis meses</h2><div class="bar-chart">${months.map(m=>`<div class="bar-col"><span style="height:${Math.max(3,100*m.spent/max)}%" title="${monthName(m.key)}: ${amt(m.spent)}"></span><small>${m.key.slice(5)}/${m.key.slice(2,4)}</small></div>`).join('')}</div></div><div class="card"><h2>Despesas por categoria</h2>${categories.map(c=>`<div class="bar-row"><span class="caption">${esc(c.name)}</span><div class="progress"><span style="width:${Math.max(2,100*c.total/maxCat)}%"></span></div><strong>${amt(c.total)}</strong></div>`).join('')||'<div class="empty">Sem despesas confirmadas neste mês.</div>'}</div></div><div class="card"><div class="card-head"><h2>Resumo do mês</h2><div class="head-actions">${btn('CSV','export-csv','small')}${btn('Imprimir / PDF','print','small')}</div></div>${[['Recebido',x.incomeReceived],['Renda ainda prevista',x.incomePlanned+x.repeatingIncome],['Renda de referência usada',x.referenceUsed],['Despesas pagas',x.spent],['Despesas e recorrências previstas',x.expensePlanned+x.repeatingExpenses],['Pagamentos à construtora no mês',x.propertyPaid],['Parcelas em aberto no mês',x.propertyPending],['Prestação bancária prevista',x.bankPay],['Reserva planejada',x.reserve],['Saldo projetado',x.projected]].map(([label,val])=>`<div class="summary-row"><span>${label}</span><strong>${amt(val)}</strong></div>`).join('')}</div>`}
function goalsPage(){const total=state.goals.reduce((a,g)=>a+number(g.target),0),saved=state.goals.reduce((a,g)=>a+number(g.saved),0);return `<div class="metric-grid">${metric('Total das metas',amt(total),'Planejamento')}${metric('Valor guardado',amt(saved),'Informado por você','positive')}${metric('Falta guardar',amt(Math.max(0,total-saved)),'Para atingir suas metas')}${metric('Metas cadastradas',state.goals.length,'Objetivos pessoais')}</div><div class="card"><div class="card-head"><h2>Meus objetivos</h2>${btn('＋ Nova meta','new-goal','primary')}</div>${state.goals.map(g=>{const pct=g.target?Math.min(100,100*g.saved/g.target):0;return `<div style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="card-head" style="margin-bottom:9px"><div><strong>${esc(g.name)}</strong><div class="caption">${g.deadline?'Até '+fmtDate(g.deadline):'Sem prazo definido'} · ${amt(g.saved)} de ${amt(g.target)}</div></div><div class="head-actions">${btn('Guardar valor','add-goal:'+g.id,'small')}${btn('Editar','edit-goal:'+g.id,'small')}${btn('Excluir','delete-goal:'+g.id,'danger small')}</div></div><div class="progress"><span style="width:${pct}%"></span></div></div>`}).join('')||'<div class="empty">Crie sua primeira meta.</div>'}</div>`}
function docsPage(){const selected=property();return `<div class="card"><div class="card-head"><h2>Arquivos e comprovantes</h2>${btn('＋ Adicionar documento','new-doc','primary')}</div>${infoBox('Os documentos ficam armazenados localmente neste dispositivo. Para não perder arquivos, exporte um backup. Limite de 2 MB por arquivo nesta versão.')}${state.documents.map(d=>`<div class="doc-row"><div class="line-icon">▣</div><div class="line-body"><strong>${esc(d.name)}</strong><small>${esc(d.category||'Outros')} · ${fmtDate(d.date)} · ${esc(d.filename)}</small></div>${btn('Abrir','open-doc:'+d.id,'small')}${menuActions([['Excluir','delete-doc:'+d.id]])}</div>`).join('')||'<div class="empty"><b>Seus documentos ficam organizados aqui</b>Adicione contratos, boletos, comprovantes e arquivos do financiamento.</div>'}</div>`}
function settingsPage(){return `<div class="grid-even"><div class="card"><h2>Seu planejamento</h2><div class="summary-row"><span>Renda líquida de referência</span><strong>${amt(state.settings.referenceIncome)}</strong></div><div class="summary-row"><span>Usar renda de referência quando não houver lançamentos</span><strong>${state.settings.referenceEnabled?'Sim':'Não'}</strong></div><div class="summary-row"><span>Prestação bancária mensal</span><strong>${amt(state.settings.bankPayment)}</strong></div><div class="summary-row"><span>Início das prestações bancárias</span><strong>${state.settings.bankStart?fmtDate(state.settings.bankStart):'Não definido'}</strong></div><div class="summary-row"><span>Reserva mensal planejada</span><strong>${amt(state.settings.reserve)}</strong></div><div style="margin-top:20px">${btn('Editar parâmetros','edit-settings','primary')}</div></div><div class="card"><h2>Aparência e preferências</h2><div class="summary-row"><span>Tema</span><strong>${state.settings.theme==='dark'?'Escuro':'Claro'}</strong></div>${btn(state.settings.theme==='dark'?'Ativar tema claro':'Ativar tema escuro','toggle-theme','small')}<h2 style="margin-top:30px">Backup e restauração</h2><div class="stack">${btn('Exportar backup JSON','export-json')}${btn('Importar backup antigo ou novo','import-json')}${btn('Restaurar exemplo do apartamento','demo-reset')}</div></div></div><div class="card"><h2>Segurança dos dados</h2>${infoBox('Sem conta online e sem sincronização. Seus registros são guardados no navegador deste dispositivo. O GitHub Pages entrega apenas os arquivos do aplicativo.')}<div class="card-head"><div><strong>Informações do arquivo importado</strong><p class="caption">Alertas que precisam ser revisados</p></div></div>${state.meta?.importWarnings?.length?state.meta.importWarnings.map(w=>`<div class="alert-row warn">${esc(w)}</div>`).join(''):'<div class="alert-row">Nenhuma inconsistência conhecida no backup importado.</div>'}<div class="head-actions" style="margin-top:21px">${btn('Limpar todos os dados deste app','reset-all','danger small')}</div></div>`}
function showModal(title,desc,body,submit='Salvar',form='generic',data={}){const host=$('#modalHost');host.innerHTML=`<div class="modal-overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2><p>${esc(desc||'')}</p><form id="modalForm" data-form="${form}" data-id="${esc(data.id||'')}">${body}<div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button type="submit" class="btn primary">${submit}</button></div></form></div></div>`;host.querySelector('input,select')?.focus()}
const moneyFields=new Set(['price','financing','extraAmort','amount','updated','opening','target','saved','referenceIncome','bankPayment','reserve']);
const formatBRLInput=value=>Number.isFinite(Number(value))?Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'';
const field=(label,name,value='',type='text',extras='')=>{
 const monetary=moneyFields.has(name)||name.startsWith('cat_');
 const renderedType=monetary?'text':type;
 const renderedValue=monetary&&value!==''&&value!==null?formatBRLInput(value):value;
 const extra=monetary?('inputmode="decimal" autocomplete="off" placeholder="0,00" '+extras.replace(/\b(?:min|max|step)="[^"]*"/g,'')):extras;
 return `<div class="field"><label for="f-${name}">${label}</label><input class="input" id="f-${name}" name="${name}" type="${renderedType}" value="${esc(renderedValue)}" ${extra}></div>`
};
const selectField=(label,name,items,current='')=>`<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${items.map(o=>{let v=Array.isArray(o)?o[0]:o,t=Array.isArray(o)?o[1]:o;return `<option value="${esc(v)}" ${v===current?'selected':''}>${esc(t)}</option>`}).join('')}</select></div>`;
function updateTransactionMode(){
 const form=$('#modalForm');if(!form||form.dataset.form!=='tx'||form.dataset.id)return;
 const mode=form.elements.namedItem('entryMode')?.value||'single';
 form.querySelectorAll('[data-entry-mode]').forEach(section=>{
  const active=section.dataset.entryMode.split(' ').includes(mode);
  section.hidden=!active;
  section.querySelectorAll('input,select').forEach(el=>el.disabled=!active);
 });
 const countField=form.elements.namedItem('count');if(countField)countField.min=mode==='installment'?'2':'1';
 const status=form.elements.namedItem('status');
 if(status){const row=status.closest('.field');if(row){row.hidden=mode!=='single';status.disabled=mode!=='single';}}
 const account=form.elements.namedItem('accountId');
 if(account){const row=account.closest('.field');if(row){row.hidden=mode==='card'||mode==='recurring';account.disabled=mode==='card'||mode==='recurring';}}
}
function transactionModal(kind='expense',edit=null){
 const t=state.transactions.find(x=>x.id===edit)||{},income=kind==='income',pDate=t.date||today(),accounts=state.accounts.map(a=>[a.id,a.name]);
 const modes=income?[['single','Rendimento único'],['recurring','Rendimento recorrente']]:[
  ['single','Despesa única'],['installment','Despesa parcelada'],...(state.cards?.length?[['card','Compra no cartão']]:[]),['recurring','Despesa recorrente']
 ];
 const base=`<div class="fields">${field(income?'Descrição do rendimento':'Descrição da despesa','description',t.description||'','text','required maxlength="120"')}${field('Valor (R$)','amount',t.amount==null?'':t.amount,'text','required inputmode="decimal" placeholder="1.592,22"')}${field(income?'Data do recebimento / previsão':'Data ou primeiro vencimento','date',pDate,'date','required')}${selectField(income?'Origem':'Categoria',income?'source':'category',income?['Salário','Horas extras','Freelance','Vendas','Investimentos','Benefícios','Outros']:CATEGORIES,t[income?'source':'category']||(income?'Salário':'Mercado'))}${edit?'':selectField('Como registrar','entryMode',modes,'single')}${selectField('Situação','status',income?[['received','Recebido'],['planned','Previsto']]:[['paid','Pago'],['planned','Previsto']],t.status||(income?'received':'paid'))}${selectField('Conta','accountId',accounts,t.accountId||accounts[0]?.[0]||'main')}</div>`;
 const extras=edit?'':`<div class="fields mode-section" data-entry-mode="installment card" hidden>${field('Quantidade de parcelas','count',2,'number','min="1" max="120" step="1" required')}</div>
 <div class="fields mode-section" data-entry-mode="card" hidden>${selectField('Cartão de crédito','cardId',(state.cards||[]).map(c=>[c.id,c.name]))}</div>
 <div class="fields mode-section" data-entry-mode="recurring" hidden>${selectField('Frequência','frequency',[['daily','Diária'],['weekly','Semanal'],['monthly','Mensal'],['yearly','Anual']],'monthly')}</div>
 <p class="caption mode-section" data-entry-mode="installment" hidden>O valor informado é o total da compra. As parcelas começam previstas e serão cobradas nas datas de vencimento.</p>
 <p class="caption mode-section" data-entry-mode="card" hidden>O valor informado é o total da compra. As parcelas entram nas faturas e a conta só é debitada ao pagar a fatura.</p>
 <p class="caption mode-section" data-entry-mode="recurring" hidden>O valor informado é de cada ocorrência. Cada recebimento ou pagamento será confirmado na aba Recorrentes.</p>`;
 showModal(edit?'Editar movimentação':income?'Novo rendimento':'Nova despesa','Informe o valor e escolha a forma de lançamento no mesmo formulário.',base+extras,'Salvar lançamento','tx',{id:edit});
 $('#modalForm').dataset.kind=kind;
 updateTransactionMode();
}
function installmentModal(){
 const accounts=state.accounts.map(a=>[a.id,a.name]);
 showModal('Nova despesa parcelada','As parcelas começam como previstas. Ao pagar cada uma, edite sua situação para Pago. Não registre novamente a compra como despesa à vista.',
 `<div class="fields">${field('Descrição','description','','text','required maxlength="120"')}${field('Valor total da compra (R$)','amount','','text','inputmode="decimal" required placeholder="1.200,00"')}${field('Primeiro vencimento','date',today(),'date','required')}${field('Quantidade de parcelas','count',2,'number','min="2" max="120" step="1" required')}${selectField('Categoria','category',CATEGORIES,'Compras')}${selectField('Conta para pagamento','accountId',accounts,'main')}</div>`,
 'Criar parcelas','installment');
}
function recurrenceModal(edit=null){const r=state.recurrences.find(x=>x.id===edit)||{};showModal(edit?'Editar recorrência':'Nova recorrência','Lançamentos previstos exigem confirmação para entrarem no realizado.',`<div class="fields">${selectField('Tipo','kind',[['expense','Despesa'],['income','Rendimento']],r.kind||'expense')}${field('Descrição','description',r.description||'','text','required')}${field('Valor (R$)','amount',r.amount==null?'':String(r.amount).replace('.',','),'text','required')}${field('Primeira ocorrência','start',r.start||today(),'date','required')}${selectField('Frequência','frequency',[['daily','Diária'],['weekly','Semanal'],['monthly','Mensal'],['yearly','Anual']],r.frequency||'monthly')}${selectField('Categoria (despesa)','category',CATEGORIES,r.category||'Outros')}${field('Origem (rendimento)','source',r.source||'')}${selectField('Conta usada na confirmação','accountId',state.accounts.map(a=>[a.id,a.name]),r.accountId||state.accounts[0]?.id)}</div>`,'Salvar recorrência','recurrence',{id:edit})}
function propertyModal(edit=null){const p=state.properties.find(x=>x.id===edit)||{};showModal(edit?'Editar imóvel':'Novo imóvel','Preencha os dados contratuais. Campos de financiamento são usados apenas para simulação.',`<div class="fields">${field('Empreendimento / imóvel','name',p.name||'','text','required')}${field('Preço do imóvel (R$)','price',p.price||0,'number','min="0" step="0.01"')}${field('Entrega prevista','delivery',p.delivery||'','date')}${selectField('Situação','status',['Em planejamento','Em construção','Chaves entregues','Financiado','Quitado'],p.status||'Em construção')}${field('Financiamento previsto (R$)','financing',p.financing||0,'number','min="0" step="0.01"')}${field('Taxa anual simulada (%)','financeRate',p.financeRate||0,'number','min="0" max="100" step="0.01"')}${field('Prazo de financiamento (meses)','financeMonths',p.financeMonths||360,'number','min="1" max="600"')}${selectField('Sistema de amortização','financeSystem',['SAC','Price'],p.financeSystem||'SAC')}${field('Amortização mensal adicional (R$)','extraAmort',p.extraAmort||0,'number','min="0" step="0.01"')}${field('INCC mensal estimado (%)','adjustment',p.adjustment||0,'number','min="0" step="0.01"')}</div>`,'Salvar imóvel','property',{id:edit})}
function paymentModal(edit=null){const p=state.payments.find(x=>x.id===edit)||{};showModal(edit?'Editar parcela':'Nova parcela','O valor do financiamento total não deve ser tratado como boleto mensal.',`<div class="fields">${field('Descrição','title',p.title||'','text','required')}${field('Vencimento','date',p.date||today(),'date','required')}${field('Valor contratado (R$)','amount',p.amount||0,'number','min="0" step="0.01" required')}${field('Valor atualizado do boleto (R$)','updated',p.updated??'','number','min="0" step="0.01"')}${selectField('Tipo','kind',[['developer','Construtora'],['financing','Valor total do financiamento']],p.kind||'developer')}</div>`,'Salvar parcela','payment',{id:edit})}
function paymentPartialModal(pid){const p=state.payments.find(x=>x.id===pid);if(!p)return;showModal('Registrar pagamento',`${p.title}. Restante: ${amt(paymentRemaining(p))}`,`<div class="fields">${field('Valor pago (R$)','amount',paymentRemaining(p),'number','step="0.01" min="0.01" required')}${field('Data do pagamento','date',today(),'date','required')}${selectField('Conta de origem','accountId',[['','Não vincular a uma conta'],...state.accounts.map(a=>[a.id,a.name])],'')}${field('Observação','description','')}</div>`,'Confirmar pagamento','partial',{id:pid})}
function budgetsModal(){const b=state.budgets[month]||{};showModal('Limites de '+monthName(month),'Defina zero para deixar a categoria sem limite.',`<div class="fields">${CATEGORIES.map(cat=>field(cat,'cat_'+cat,b[cat]||0,'number','min="0" step="0.01"')).join('')}</div>`,'Salvar limites','budgets')}
function settingsModal(){showModal('Parâmetros do planejamento','A renda é sempre líquida. Não é necessário informar salário bruto.',`<div class="fields">${field('Renda líquida mensal de referência (R$)','referenceIncome',state.settings.referenceIncome,'number','min="0" step="0.01"')}${selectField('Usar referência sem rendimentos cadastrados','referenceEnabled',[['true','Sim'],['false','Não']],String(state.settings.referenceEnabled))}${field('Prestação bancária mensal (R$)','bankPayment',state.settings.bankPayment,'number','min="0" step="0.01"')}${field('Início das prestações bancárias','bankStart',state.settings.bankStart||'','date')}${field('Reserva mensal planejada (R$)','reserve',state.settings.reserve,'number','min="0" step="0.01"')}</div>`,'Salvar ajustes','settings')}
function goalModal(edit=null){const g=state.goals.find(z=>z.id===edit)||{};showModal(edit?'Editar meta':'Nova meta','Planeje sua reserva e acompanhe o valor guardado.',`<div class="fields">${field('Nome da meta','name',g.name||'','text','required')}${field('Meta (R$)','target',g.target||0,'number','min="0" step="0.01"')}${field('Guardado (R$)','saved',g.saved||0,'number','min="0" step="0.01"')}${field('Prazo','deadline',g.deadline||'','date')}</div>`,'Salvar meta','goal',{id:edit})}
function accountModal(edit=null){const a=state.accounts.find(x=>x.id===edit)||{};showModal(edit?'Editar conta':'Nova conta','Você informa o saldo inicial. Transferências não são receitas.',`<div class="fields">${field('Nome da conta','name',a.name||'','text','required')}${field('Saldo inicial (R$)','opening',a.opening||0,'number','step="0.01"')}</div>`,'Salvar conta','account',{id:edit})}
function transferModal(edit=null){
 if(state.accounts.length<2){warn('Cadastre pelo menos duas contas para transferir.');return}
 const current=state.transfers.find(t=>t.id===edit)||{};
 const from=current.from||state.accounts[0]?.id,to=current.to||state.accounts.find(a=>a.id!==from)?.id;
 showModal(edit?'Editar transferência':'Transferência entre contas','Não será contabilizada como rendimento ou despesa.',`<div class="fields">${selectField('Conta de origem','from',state.accounts.map(a=>[a.id,a.name]),from)}${selectField('Conta de destino','to',state.accounts.map(a=>[a.id,a.name]),to)}${field('Valor (R$)','amount',current.amount??'','number','min="0.01" step="0.01" required')}${field('Data','date',current.date||today(),'date','required')}</div>`,'Salvar transferência','transfer',{id:edit});
}
function documentModal(){showModal('Adicionar documento','Arquivos de até 2 MB. Dados locais precisam ser incluídos no backup.',`<div class="fields">${field('Nome','name','','text','required')}${selectField('Categoria','category',['Contrato','Comprovante','Boleto','Financiamento','Documentos','Outros'])}${field('Data','date',today(),'date','required')}<div class="field wide"><label for="docFile">Arquivo PDF, imagem ou texto</label><input type="file" id="docFile" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" required></div></div>`,'Salvar documento','document')}
function moreMenu(){showModal('Mais opções','Escolha uma área do aplicativo.',`<div class="stack">${[['agenda','Agenda financeira'],['relatorios','Relatórios'],['metas','Metas'],['documentos','Documentos'],['ajustes','Ajustes']].map(([id,label])=>`<button type="button" class="btn" data-nav="${id}">${label}</button>`).join('')}</div>`,'Fechar','more-menu')}
function addMenu(){showModal('Novo lançamento','Selecione o tipo. Parcelas, categorias e recorrências são configuradas dentro do formulário.',`<div class="stack"><button class="btn" type="button" data-action="new-income">↗ Rendimento</button><button class="btn" type="button" data-action="new-expense">↙ Despesa</button></div>`,'Fechar','add-menu')}
function closeModal(){$('#modalHost').innerHTML=''}
async function confirmAction(text){return window.confirm(text)}
async function saveForm(e){e.preventDefault();const f=e.target,k=f.dataset.form,edit=f.dataset.id;const fd=new FormData(f),get=n=>String(fd.get(n)||'').trim(),val=n=>{const raw=get(n);const amount=moneyFields.has(n)||n.startsWith('cat_');if(!raw)return 0;const value=amount?parseBRL(raw):Number(raw.replace(',','.'));if(!Number.isFinite(value))throw Error('Valor inválido em '+n+'. Exemplo: 1.592,22');return value};const current=(arr)=>arr.find(z=>z.id===edit);const update=(key,v)=>{let arr=state[key];if(edit){const i=arr.findIndex(z=>z.id===edit);if(i<0)throw Error('Registro não encontrado');arr[i]={...arr[i],...v}}else arr.push({id:id(),...v})};try{if(k==='tx'){
 const kind=f.dataset.kind,a=parseBRL(get('amount')),mode=edit?'single':get('entryMode')||'single';
 if(!get('description')||!Number.isFinite(a)||a<=0)throw Error('Informe descrição e valor válido, como 1.592,22.');
 const basic={kind,description:get('description'),source:kind==='income'?get('source'):'',category:kind==='expense'?get('category'):'Rendimentos',amount:a,date:get('date')};
 if(mode==='single'){
  if(!state.accounts.some(x=>x.id===get('accountId')))throw Error('Selecione uma conta válida.');
  update('transactions',{...basic,status:get('status'),accountId:get('accountId')});
 }else if(mode==='installment'){
  if(kind!=='expense')throw Error('Parcelamento só se aplica às despesas.');
  if(!state.accounts.some(x=>x.id===get('accountId')))throw Error('Selecione uma conta válida.');
  const count=Number(get('count'));if(!Number.isInteger(count)||count<2||count>120)throw Error('Informe de 2 a 120 parcelas.');
  const schedule=installmentSchedule({total:a,count,firstDate:get('date')}),group=id();
  for(const item of schedule)state.transactions.push({id:id(),...basic,date:item.date,amount:item.amount,status:'planned',accountId:get('accountId'),installmentGroup:group,installmentNumber:item.number,installmentCount:schedule.length});
 }else if(mode==='card'){
  if(kind!=='expense')throw Error('O cartão é uma forma de despesa.');
  const card=state.cards.find(c=>c.id===get('cardId'));
  if(!card)throw Error('Selecione um cartão cadastrado na aba Cartões.');
  const count=Number(get('count'));
  if(!Number.isInteger(count)||count<1||count>120)throw Error('Informe de 1 a 120 parcelas.');
  const first=cardFirstDueDate(get('date'),card.closingDay,card.dueDay);
  const items=count===1?[{date:first,amount:a,number:1}]:installmentSchedule({total:a,count,firstDate:first});
  const group=id();
  for(const item of items)state.transactions.push({id:id(),...basic,cardId:card.id,date:item.date,purchaseDate:get('date'),amount:item.amount,status:'planned',accountId:null,installmentGroup:group,installmentNumber:item.number,installmentCount:count});
 }else if(mode==='recurring'){
  const frequency=get('frequency');
  if(!['daily','weekly','monthly','yearly'].includes(frequency))throw Error('Frequência inválida.');
  state.recurrences.push({id:id(),kind,description:basic.description,source:basic.source,category:basic.category,amount:a,start:get('date'),frequency,accountId:get('accountId')||state.accounts[0]?.id||'main',active:true,confirmed:[]});
 }else throw Error('Forma de lançamento inválida.');
 }else if(k==='installment'){
 const description=get('description'),total=parseBRL(get('amount')),count=Number(get('count'));
 if(!description)throw Error('Informe a descrição da compra.');
 if(!state.accounts.some(a=>a.id===get('accountId')))throw Error('Selecione uma conta válida.');
 const schedule=installmentSchedule({total,count,firstDate:get('date')});
 const group=id();
 for(const item of schedule){state.transactions.push({id:id(),kind:'expense',date:item.date,description,category:get('category'),source:'',amount:item.amount,status:'planned',accountId:get('accountId'),installmentGroup:group,installmentNumber:item.number,installmentCount:schedule.length});}
 month=get('date').slice(0,7);
 }else if(k==='card'){
 const name=get('name'),closingDay=Number(get('closingDay')),dueDay=Number(get('dueDay'));
 if(!name||!Number.isInteger(closingDay)||closingDay<1||closingDay>28||!Number.isInteger(dueDay)||dueDay<1||dueDay>28)throw Error('Informe nome e dias de 1 a 28.');
 update('cards',{name,closingDay,dueDay});
 }else if(k==='card-purchase'||k==='card-purchase-edit'){
 const cardId=k==='card-purchase-edit'?get('cardId'):edit;
 const card=state.cards.find(c=>c.id===cardId),description=get('description'),total=parseBRL(get('amount')),count=Number(get('count'));
 if(!card)throw Error('Cartão não encontrado');
 if(!description||!Number.isFinite(total)||total<=0||total>1e9||!Number.isInteger(count)||count<1||count>120)throw Error('Informe descrição, valor e 1 a 120 parcelas.');
 if(k==='card-purchase-edit'){
  const result=reviseCardPurchase(state,edit,{cardId,description,category:get('category'),total,count,purchaseDate:get('date')});
  state.transactions=result.transactions;month=result.firstDue.slice(0,7);
 }else{
  const first=cardFirstDueDate(get('date'),card.closingDay,card.dueDay);
  const items=count===1?[{date:first,amount:total,number:1}]:installmentSchedule({total,count,firstDate:first});
  const group=id();
  for(const item of items)state.transactions.push({id:id(),cardId:card.id,kind:'expense',date:item.date,purchaseDate:get('date'),description,category:get('category'),source:'',amount:item.amount,status:'planned',accountId:null,installmentGroup:group,installmentNumber:item.number,installmentCount:count});
  month=first.slice(0,7);
 }
 }else if(k==='card-details'){
 const group=cardPurchaseGroup(state.transactions,edit);
 if(!get('description'))throw Error('Informe uma descrição.');
 const ids=new Set(group.map(t=>t.id));
 state.transactions=state.transactions.map(t=>ids.has(t.id)?{...t,description:get('description'),category:get('category')}:t);
 }else if(k==='card-pay'){
 const card=state.cards.find(c=>c.id===edit);
 const accountId=get('accountId'),paidAt=get('paidAt');
 if(!card||!state.accounts.some(a=>a.id===accountId)||!/^\d{4}-\d{2}-\d{2}$/.test(paidAt))throw Error('Escolha uma conta válida e informe a data de pagamento.');
 registerCardPayment(state,card.id,month,parseBRL(get('amount')),accountId,paidAt);
 }else if(k==='recurrence'){const a=parseBRL(get('amount'));if(!get('description')||!Number.isFinite(a)||a<=0)throw Error('Preencha descrição e valor válido.');update('recurrences',{kind:get('kind'),description:get('description'),source:get('source'),category:get('category'),accountId:get('accountId'),amount:a,start:get('start'),frequency:get('frequency'),active:edit?current(state.recurrences)?.active??true:true,confirmed:edit?current(state.recurrences)?.confirmed||[]:[]})}else if(k==='property'){update('properties',{name:get('name'),price:val('price'),delivery:get('delivery'),status:get('status'),financing:val('financing'),financeRate:val('financeRate'),financeMonths:val('financeMonths'),financeSystem:get('financeSystem'),extraAmort:val('extraAmort'),adjustment:val('adjustment')});if(!state.selectedProperty)state.selectedProperty=state.properties.at(-1).id}else if(k==='payment'){update('payments',{title:get('title'),date:get('date'),amount:val('amount'),updated:get('updated')===''?null:val('updated'),kind:get('kind'),propertyId:state.selectedProperty,paid:edit?current(state.payments)?.paid||0:0,history:edit?current(state.payments)?.history||[]:[]})}else if(k==='partial'){const p=current(state.payments),a=val('amount');if(!p||a<=0||a>paymentRemaining(p)+.001)throw Error('O valor pago deve ser maior que zero e não ultrapassar o restante.');p.paid=number(p.paid)+a;p.history=p.history||[];p.history.push({date:get('date'),amount:a,description:get('description'),accountId:get('accountId')||null})}else if(k==='budgets'){const b={};for(let cat of CATEGORIES)b[cat]=val('cat_'+cat);state.budgets[month]=b}else if(k==='settings'){state.settings.referenceIncome=val('referenceIncome');state.settings.referenceEnabled=get('referenceEnabled')==='true';state.settings.bankPayment=val('bankPayment');state.settings.bankStart=get('bankStart');state.settings.reserve=val('reserve')}else if(k==='goal'){update('goals',{name:get('name'),target:val('target'),saved:val('saved'),deadline:get('deadline')})}else if(k==='account'){update('accounts',{name:get('name'),opening:val('opening')})}else if(k==='transfer'){if(get('from')===get('to'))throw Error('Selecione duas contas diferentes.');const transferAmount=val('amount');if(transferAmount<=0)throw Error('O valor da transferência deve ser maior que zero.');update('transfers',{from:get('from'),to:get('to'),date:get('date'),amount:transferAmount})}else if(k==='document'){const file=fd.get('file');if(!(file instanceof File)||file.size===0)throw Error('Selecione um arquivo.');if(file.size>2*1024*1024)throw Error('Arquivo maior que 2 MB.');if(!['application/pdf','image/jpeg','image/png','image/webp','text/plain'].includes(file.type))throw Error('Tipo de arquivo não permitido.');const binary=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)});state.documents.push({id:id(),name:get('name'),category:get('category'),date:get('date'),filename:file.name,data:String(binary)})}else if(k==='add-menu'){closeModal();return}else return;if(k==='tx'){const mode=edit?'single':get('entryMode')||'single';month=(mode==='card'?cardFirstDueDate(get('date'),state.cards.find(c=>c.id===get('cardId'))?.closingDay||5,state.cards.find(c=>c.id===get('cardId'))?.dueDay||12):get('date')).slice(0,7)}closeModal();await commit()}catch(err){warn(err.message,true)}}
function downloadCSV(){let tx=state.transactions.filter(t=>monthOf(transactionEffectiveDate(t))===month).sort((a,b)=>transactionEffectiveDate(a).localeCompare(transactionEffectiveDate(b)));down('ape-no-azul-'+month+'.csv',csvFile([['Data','Tipo','Descrição','Categoria/Origem','Situação','Valor (R$)'],...tx.map(t=>[transactionEffectiveDate(t),t.kind==='income'?'Rendimento':'Despesa',t.description,t.kind==='income'?t.source:t.category,t.status,t.amount.toFixed(2).replace('.',',')])]),'text/csv;charset=utf-8')}
async function importBackupFile(file){try{const raw=await readBackup(file);let result=migrateLegacy(raw);let err=validate(result.state);if(err)throw Error(err);if(!confirm(`Importar ${result.state.transactions.length} movimentações e ${result.state.payments.length} parcelas? Os dados atuais serão preservados em uma cópia antes da substituição.`))return;await saveRecovery(state);state=result.state;month=monthStart();page='inicio';await commit('Backup importado. Confira os avisos em Ajustes.')}catch(err){warn('Importação não concluída: '+err.message,true)}}
async function handleAction(action){if(!action)return;const [name,...args]=action.split(':'),key=args.join(':');try{if(name==='prev-month'||name==='next-month'){month=addMonths(month,name==='prev-month'?-1:1);render();return}if(name==='add'){addMenu();return}if(name==='close-modal'){closeModal();return}if(name==='new-income'||name==='new-expense'){closeModal();transactionModal(name==='new-income'?'income':'expense');return}if(name==='settle-tx'){
 const tx=state.transactions.find(t=>t.id===key);
 if(!tx){warn('Lançamento não encontrado.',true);return}
 const finalStatus=tx.kind==='income'?'received':'paid';
 if(tx.status===finalStatus){warn('Este lançamento já está confirmado.');return}
 if(!state.accounts.some(a=>a.id===tx.accountId)){
  warn('Edite o lançamento e selecione uma conta válida antes de confirmar.',true);return;
 }
 tx.status=finalStatus;
 await commit(tx.kind==='income'?`${amt(tx.amount)} recebido e adicionado à conta.`:`${amt(tx.amount)} pago e descontado da conta.`);
 return;
 }if(name==='edit-tx'){let t=state.transactions.find(t=>t.id===key);if(!t)return;if(t.cardId){finTab='cartoes';render();warn('Compras do cartão são gerenciadas na aba Cartões.');return}transactionModal(t.kind,key);return}if(name==='delete-tx'){if(confirm('Excluir este lançamento?')){state.transactions=state.transactions.filter(t=>t.id!==key);await commit()}return}if(name==='new-card'||name==='edit-card'){cardModal(name==='edit-card'?key:null);return}
 if(name==='new-card-purchase'){if(!state.cards?.length){warn('Cadastre um cartão antes de registrar uma compra.',true);return}cardPurchaseModal(state.cards[0].id);return}
 if(name==='card-purchase'){cardPurchaseModal(key);return}
 if(name==='edit-card-purchase'){const tx=state.transactions.find(t=>t.id===key);if(tx?.cardId)cardPurchaseModal(tx.cardId,key);return}
 if(name==='edit-card-details'){cardDetailsModal(key);return}
 if(name==='delete-card-purchase'){
  const group=cardPurchaseGroup(state.transactions,key);
  if(group.some(t=>cardPaid(t)>0)){warn('Há parcelas pagas nesta compra. A exclusão foi bloqueada para evitar alteração de saldo.',true);return}
  if(confirm('Excluir esta compra e todas as '+group.length+' parcela(s) previstas?')){state.transactions=cancelCardPurchase(state,key);await commit('Compra e parcelas previstas excluídas.')}return;
 }
 if(name==='reverse-card-payment'){
  const [cardId,batchId]=args;
  const record=cardPaymentBatches(state,cardId,month).find(p=>p.id===batchId&&p.canReverse);
  if(!record){warn('Pagamento não encontrado ou já estornado.',true);return}
  const reason=prompt(`Estornar ${amt(record.amount)} de ${fmtDate(record.date)}? Informe o motivo:`, 'Correção de pagamento');
  if(reason===null)return;
  if(!reason.trim()){warn('Informe o motivo do estorno.',true);return}
  if(!confirm(`Confirmar estorno de ${amt(record.amount)}? O valor voltará ao saldo da conta e à fatura em aberto.`))return;
  const result=reverseCardPayment(state,cardId,month,batchId,reason);
  await commit('Estorno registrado: '+amt(result.reversed));return;
 }
 if(name==='pay-card'){cardPayModal(key);return}
 if(name==='delete-card'){
  if(state.transactions.some(t=>t.cardId===key)){warn('Este cartão possui compras. Preserve o histórico antes de excluí-lo.',true);return}
  if(confirm('Excluir cartão sem compras?')){state.cards=state.cards.filter(c=>c.id!==key);await commit()}
  return;
 }
 if(name==='new-installment'){closeModal();installmentModal();return}if(name==='new-recurrence'||name==='edit-recurrence'){closeModal();recurrenceModal(name==='edit-recurrence'?key:null);return}if(name==='toggle-recurrence'){const r=state.recurrences.find(t=>t.id===key);r.active=!r.active;await commit();return}if(name==='delete-recurrence'){if(confirm('Excluir esta regra de repetição? Os lançamentos já confirmados permanecerão.')){state.recurrences=state.recurrences.filter(t=>t.id!==key);await commit()}return}if(name==='confirm-recurrence'){const rid=args[0],dt=args.slice(1).join(':'),r=state.recurrences.find(z=>z.id===rid);if(!r||!recurringDue(state,month).some(x=>x.id===rid&&x.date===dt)){warn('Esta ocorrência já foi confirmada.');return}state.transactions.push({id:id(),recurrenceId:rid,kind:r.kind,description:r.description,source:r.source||'',category:r.category||'Outros',amount:r.amount,date:dt,status:r.kind==='income'?'received':'paid',accountId:state.accounts.some(a=>a.id===r.accountId)?r.accountId:state.accounts[0]?.id||'main'});r.confirmed.push(dt);await commit('Ocorrência confirmada');return}if(name==='delete-property'){if(!confirm('Excluir o imóvel e todas as suas parcelas? Essa ação não poderá ser desfeita sem backup.'))return;state.properties=state.properties.filter(p=>p.id!==key);state.payments=state.payments.filter(p=>p.propertyId!==key);state.selectedProperty=state.properties[0]?.id||null;await commit();return}if(name==='new-property'||name==='edit-property'){propertyModal(name==='edit-property'?key:null);return}if(name==='delete-payment'){if(confirm('Excluir esta parcela e seu histórico de pagamento?')){state.payments=state.payments.filter(p=>p.id!==key);await commit()}return}if(name==='new-payment'||name==='edit-payment'){if(!state.selectedProperty){warn('Cadastre o imóvel primeiro.');return}closeModal();paymentModal(name==='edit-payment'?key:null);return}if(name==='pay'){paymentPartialModal(key);return}if(name==='edit-budgets'){budgetsModal();return}if(name==='edit-settings'){settingsModal();return}if(name==='new-goal'||name==='edit-goal'){goalModal(name==='edit-goal'?key:null);return}if(name==='delete-goal'){if(confirm('Excluir esta meta?')){state.goals=state.goals.filter(g=>g.id!==key);await commit()}return}if(name==='add-goal'){const g=state.goals.find(x=>x.id===key);let v=prompt('Valor adicional guardado (R$):','0,00');if(v===null)return;let n=parseBRL(v);if(!Number.isFinite(n)||n<=0){warn('Digite um valor válido.',true);return}g.saved=number(g.saved)+n;await commit();return}if(name==='new-account'||name==='edit-account'){accountModal(name==='edit-account'?key:null);return}if(name==='new-transfer'||name==='edit-transfer'){transferModal(name==='edit-transfer'?key:null);return}if(name==='delete-transfer'){if(confirm('Excluir esta transferência?')){state.transfers=state.transfers.filter(x=>x.id!==key);await commit()}return}if(name==='new-doc'){documentModal();return}if(name==='delete-doc'){if(confirm('Excluir o arquivo?')){state.documents=state.documents.filter(x=>x.id!==key);await commit()}return}if(name==='open-doc'){const d=state.documents.find(x=>x.id===key);if(d){if(!/^data:(application\/pdf|image\/(jpeg|png|webp)|text\/plain);base64,/.test(d.data)){warn('Formato de documento não permitido.',true);return}let a=document.createElement('a');a.href=d.data;a.download=d.filename||'documento';a.click()}return}if(name==='toggle-theme'){state.settings.theme=state.settings.theme==='dark'?'light':'dark';await commit();return}if(name==='export-json'){down('ape-no-azul-backup-'+today()+'.json',JSON.stringify(sanitizeForExport(state),null,2));warn('Backup exportado');return}if(name==='import-json'){$('#importFile').click();return}if(name==='demo-reset'){if(!confirm('Substituir os dados atuais pelo exemplo baseado no seu backup? Exporte um backup antes.'))return;await saveRecovery(state);let r=await fetch('./demo-data.json').then(x=>x.json());state=normalize(r);await commit('Exemplo carregado');return}if(name==='reset-all'){if(!confirm('Apagar todos os dados locais do novo aplicativo? Essa ação não pode ser desfeita sem backup.'))return;if(!confirm('Confirme novamente a exclusão de todos os registros.'))return;await saveRecovery(state);state=blank();await commit('Dados locais redefinidos');return}if(name==='csv-transactions'||name==='export-csv'){downloadCSV();return}if(name==='print'){window.print();return}if(name.startsWith('nav-')){page=name.slice(4);render();return}}catch(e){warn(e.message,true)}}
async function main(){const result=await initStorage();storageWarning=result.warning;state=result.state;if(!result.hasData){try{state=normalize(await fetch('./demo-data.json').then(r=>{if(!r.ok)throw Error('sem exemplo');return r.json()}));await persist(state);sampleLoaded=true}catch(e){warn('Não foi possível carregar o exemplo. Você pode cadastrar dados manualmente.',true)}}lastSavedState=structuredClone(state);month=monthStart();render();if(sampleLoaded)warn('Exemplo do imóvel carregado. Você pode editar tudo.');if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{})}
document.addEventListener('click',e=>{const navBtn=e.target.closest('[data-nav]');if(navBtn){let target=navBtn.dataset.nav;if(target==='add'){addMenu();return}if(target==='mais'){moreMenu();return}else page=target;closeModal();window.scrollTo(0,0);render();return}const tab=e.target.closest('[data-tab]');if(tab){const [area,k]=tab.dataset.tab.split(':');if(area==='finance')finTab=k;else propertyTab=k;render();return}const action=e.target.closest('[data-action]');if(action){const label=action.dataset.action;handleAction(label);document.querySelectorAll('details.menu[open]').forEach(x=>x.open=false)}});
document.addEventListener('change',e=>{if(e.target.id==='propertySelect'){state.selectedProperty=e.target.value;commit('Imóvel selecionado')}if(e.target.id==='importFile'&&e.target.files[0]){importBackupFile(e.target.files[0]);e.target.value=''}if(e.target.dataset.filter==='kind'){kindFilter=e.target.value;render()}if(e.target.name==='entryMode')updateTransactionMode()});
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;let pos=e.target.selectionStart;render();const box=$('#search');if(box){box.focus();box.setSelectionRange(pos,pos)}}});
document.addEventListener('submit',e=>{if(e.target.id==='modalForm')saveForm(e)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))closeModal()});
main().catch(e=>{console.error(e);$('#app').innerHTML='<div class="splash"><strong>Não foi possível iniciar o aplicativo.</strong><p>Atualize a página. Se o erro continuar, restaure uma cópia do projeto.</p></div>'});
