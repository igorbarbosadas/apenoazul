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
export const blank=()=>({schema:2,properties:[],selectedProperty:null,transactions:[],payments:[],recurrences:[],cards:[],accounts:[{id:'main',name:'Conta principal',opening:0}],transfers:[],budgets:{},goals:[],documents:[],settings:{referenceIncome:0,referenceEnabled:false,bankPayment:0,bankStart:'',reserve:0,theme:'light',currency:'BRL',alerts:7},meta:{created:today(),importWarnings:[]}});
export function normalize(raw){let s=structuredClone(raw);s.schema=2;for(let k of ['properties','transactions','payments','recurrences','cards','accounts','transfers','goals','documents'])if(!Array.isArray(s[k]))s[k]=[];s.budgets=s.budgets||{};s.settings={...blank().settings,...(s.settings||{})};s.meta=s.meta||{importWarnings:[]};return s}
const amount=v=>Math.round(number(v)*100)/100;
const dateValid=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d)))return false;const [y,m,day]=d.split('-').map(Number);const date=new Date(y,m-1,day,12);return date.getFullYear()===y&&date.getMonth()+1===m&&date.getDate()===day};
export function validate(s){if(!s||typeof s!=='object'||!Array.isArray(s.transactions)||!Array.isArray(s.payments)||!Array.isArray(s.properties))return 'Estrutura do backup inválida';if(s.transactions.length>100000||s.payments.length>30000)return 'Quantidade de registros excedida';for(let t of s.transactions){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(t.id))||!dateValid(t.date)||!['income','expense'].includes(t.kind)||!Number.isFinite(Number(t.amount))||number(t.amount)<0||number(t.amount)>1e9)return 'Movimentação inválida'}if(new Set(s.transactions.map(x=>x.id)).size!==s.transactions.length)return 'Movimentações duplicadas no backup';
 if(new Set(s.payments.map(x=>x.id)).size!==s.payments.length)return 'Parcelas do imóvel duplicadas';for(let p of s.payments){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(p.id))||!dateValid(p.date)||number(p.amount)<0||number(p.paid)<0)return 'Parcela inválida'}for(let key of ['properties','recurrences','cards','accounts','transfers','goals','documents'])for(let item of s[key]||[]){if(!/^[A-Za-z0-9_-]{1,100}$/.test(String(item.id)))return 'Identificador inválido em '+key}for(let t of s.transfers||[]){if(!Number.isFinite(Number(t.amount))||Number(t.amount)<=0||Number(t.amount)>1e9||t.from===t.to||!dateValid(t.date))return 'Transferência inválida'}for(let a of s.accounts||[]){if(!Number.isFinite(Number(a.opening))||Math.abs(Number(a.opening))>1e9)return 'Saldo inicial da conta inválido'}
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
    paid+=cents(h.amount);
   }
   if(paid>cents(t.amount)||((paid===cents(t.amount))!==(t.status==='paid')))return 'Saldo da fatura inconsistente';
  }

 }
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
export const transactionEffectiveDate=t=>t.cardId&&t.status==='paid'&&t.paidAt?t.paidAt:t.date;
// Histórico novo: pagamentos distribuídos por parcela; registros antigos pagos
// continuam sendo reconhecidos exatamente uma vez, mesmo sem cardPayments.
export function cardPaymentEntries(t){
 if(!t.cardId)return [];
 if(Array.isArray(t.cardPayments))return t.cardPayments;
 return t.status==='paid'&&t.paidAt&&t.accountId
  ?[{date:t.paidAt,amount:t.amount,accountId:t.accountId}]:[];
}
export const cardPaid=t=>reais(cardPaymentEntries(t).reduce((sum,p)=>sum+cents(p.amount),0));
export const cardRemaining=t=>reais(Math.max(0,cents(t.amount)-cents(cardPaid(t))));
export function registerCardPayment(s,cardId,key,amount,accountId,date){
 const card=(s.cards||[]).find(c=>c.id===cardId);
 if(!card)throw Error('Cartão não encontrado.');
 if(!(s.accounts||[]).some(a=>a.id===accountId))throw Error('Selecione uma conta válida.');
 if(!dateValid(date))throw Error('Informe uma data real de pagamento.');
 const valueCents=cents(amount);
 const rows=s.transactions.filter(t=>t.cardId===cardId&&monthOf(t.date)===key&&cardRemaining(t)>0)
  .sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
 const remainingCents=rows.reduce((v,t)=>v+cents(cardRemaining(t)),0);
 if(!Number.isFinite(Number(amount))||valueCents<=0||valueCents>remainingCents)throw Error('O pagamento precisa ser maior que zero e não ultrapassar o saldo da fatura.');
 let available=valueCents;const changes=[];
 for(const t of rows){
  if(available<=0)break;
  const allocated=Math.min(available,cents(cardRemaining(t)));available-=allocated;
  const history=cardPaymentEntries(t).map(p=>({...p}));
  history.push({id:id(),date,amount:reais(allocated),accountId});
  changes.push({id:t.id,history,fullyPaid:history.reduce((sum,p)=>sum+cents(p.amount),0)===cents(t.amount)});
 }
 // Todas as validações ocorrem antes de alterar o estado.
 for(const ch of changes){const tx=rows.find(t=>t.id===ch.id);tx.cardPayments=ch.history;
  tx.status=ch.fullyPaid?'paid':'planned';tx.paidAt=ch.fullyPaid?date:null;
  tx.accountId=ch.fullyPaid?accountId:null;
 }
 return {paid:reais(valueCents),remaining:reais(remainingCents-valueCents),installments:changes.length};
}

export function cashflow(s,key){
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

export function series(s,key,n=6){return Array.from({length:n},(_,i)=>cashflow(s,addMonths(key,i-n+1)))}
export function projection(s,key,n=12){return Array.from({length:n},(_,i)=>cashflow(s,addMonths(key,i)))}
// Uma compra parcelada gera compromissos futuros, não pagamentos realizados.
// Todos os valores são distribuídos em centavos, sem perder nem criar centavos.
// Para compras no cartão: vencimento da fatura conforme fechamento e pagamento.
export function cardFirstDueDate(purchaseDate,closingDay,dueDay){
 if(!dateValid(purchaseDate)||!Number.isInteger(Number(closingDay))||!Number.isInteger(Number(dueDay))||closingDay<1||closingDay>28||dueDay<1||dueDay>28)throw Error('Dados de cartão ou data inválidos');
 const [year,m,day]=purchaseDate.split('-').map(Number);
 const closeOffset=day>closingDay?1:0;
 const invoiceOffset=closeOffset+(dueDay<=closingDay?1:0);
 const d=new Date(year,m-1+invoiceOffset,1,12);
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(dueDay).padStart(2,'0')}`;
}
export function cardStatement(s,cardId,key){
 const items=s.transactions.filter(t=>t.cardId===cardId&&monthOf(t.date)===key);
 const sum=entries=>reais(entries.reduce((acc,t)=>acc+cents(t.amount),0));
 return {items,total:sum(items),pending:sum(items.map(t=>({amount:cardRemaining(t)}))),paid:sum(items.map(t=>({amount:cardPaid(t)})))};
}

// Revise ou cancele uma compra inteira apenas enquanto nenhuma parcela foi paga.
// Retorna uma nova lista: não altera o estado original caso a operação falhe.
export function cardPurchaseGroup(transactions, transactionId){
 const origin=transactions.find(t=>t.id===transactionId&&t.cardId);
 if(!origin)throw Error('Compra do cartão não encontrada.');
 return transactions.filter(t=>t.cardId===origin.cardId&&(origin.installmentGroup?t.installmentGroup===origin.installmentGroup:t.id===origin.id));
}
export function reviseCardPurchase(s,transactionId,{cardId,description,category,total,count,purchaseDate}){
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
export function cancelCardPurchase(s,transactionId){
 const old=cardPurchaseGroup(s.transactions,transactionId);
 if(old.some(t=>cardPaid(t)>0))throw Error('Esta compra já possui parcelas pagas e não pode ser excluída por completo.');
 const ids=new Set(old.map(t=>t.id));
 return s.transactions.filter(t=>!ids.has(t.id));
}

export function installmentSchedule({total, count, firstDate}){
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
export function categorySummary(s,key){
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
export function accountBalances(s){
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
export function installmentProgress(s,propertyId){let arr=s.payments.filter(p=>p.propertyId===propertyId&&p.kind!=='financing');let due=arr.reduce((a,p)=>a+number(p.updated??p.amount),0);let paid=arr.reduce((a,p)=>a+Math.min(number(p.paid),number(p.updated??p.amount)),0);return {due,paid,remaining:Math.max(0,due-paid),ratio:due?Math.min(1,paid/due):0}}
export function loanSimulation({principal,annualRate,months,system='SAC',extra=0}){principal=number(principal);annualRate=number(annualRate);months=Math.trunc(number(months));extra=number(extra);if(principal<=0||months<=0||months>600||annualRate<0||annualRate>100)return [];let r=annualRate/1200,balance=principal,amort=principal/months,rows=[];let fixed=system==='Price'?(r?principal*r/(1-(1+r)**(-months)):principal/months):null;for(let i=1;i<=months;i++){let interest=balance*r;let p=system==='Price'?fixed:amort+interest;let principalPaid=Math.min(balance,Math.max(0,p-interest)+extra);balance=Math.max(0,balance-principalPaid);rows.push({month:i,payment:principalPaid+interest,interest,amortization:principalPaid,balance});if(balance<.005)break}return rows}
export function sanitizeForExport(s){return {app:'Ape no Azul',schema:2,exportedAt:new Date().toISOString(),data:s}}
export function csvFile(rows){let quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n')}
