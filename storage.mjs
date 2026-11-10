import {blank,normalize,validate} from './core.mjs';
const KEY='apenoazul_v1',LEGACY='apenoazul_v021';let db=null;
function openDB(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(Error('IndexedDB indisponível'));return}const req=indexedDB.open('ApeNoAzulDatabase',1);req.onupgradeneeded=()=>req.result.createObjectStore('workspace');req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result)})}
function dbRead(){return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readonly');const r=tx.objectStore('workspace').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function dbWrite(data){return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(data,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
export async function initStorage(){let warning='';try{db=await openDB()}catch(e){warning='Armazenamento IndexedDB indisponível. Usando navegador local.'}let state=null;try{if(db)state=await dbRead()}catch(e){warning='Falha na leitura do banco local. Usando cópia do navegador.'}if(!state){try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){warning='Dados locais não puderam ser lidos.'}}const existingData=!!state;
if(state&&validate(state)){
 const problem=validate(state);
 try{await saveRecovery(state);warning='Os dados armazenados apresentaram inconsistência ('+problem+'). Uma cópia local de recuperação foi criada. Não importe nem substitua registros antes de exportar uma cópia.'}
 catch(e){warning='Os dados armazenados apresentaram inconsistência ('+problem+'). A cópia de recuperação falhou. Não faça lançamentos até salvar seus dados manualmente.'}
 state=null;
}
return {state:state?normalize(state):blank(),warning,hasData:existingData};}
export async function persist(s){const data=normalize(s);const err=validate(data);if(err)throw Error(err);if(db){await dbWrite(data);try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){/* IndexedDB is authoritative */}}else{localStorage.setItem(KEY,JSON.stringify(data))}return true}
export function readBackup(file){return new Promise((resolve,reject)=>{if(file.size>12*1024*1024)return reject(Error('Arquivo excede 12 MB.'));const rd=new FileReader();rd.onload=()=>{try{resolve(JSON.parse(String(rd.result)))}catch(e){reject(Error('O JSON está inválido'))}};rd.onerror=()=>reject(rd.error);rd.readAsText(file)})}
export async function saveRecovery(s){try{localStorage.setItem('apenoazul_recovery_'+Date.now(),JSON.stringify(s))}catch(e){throw Error('Não foi possível criar a cópia antes da importação. Exporte um backup manual.') }}
