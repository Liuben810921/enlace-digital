/* ENLACE DIGITAL: adaptador exclusivo staging; NO se activa automáticamente.
 * No usa ED_URL/ED_KEY de producción. Requiere JWT real de Supabase Auth staging.
 * Las operaciones son remotas, no equivalen a escrituras en localStorage.
 */
(function(global){
'use strict';
const URL='https://xqahthghvozeigbojhyi.supabase.co';
const KINDS=Object.freeze({suppliers:'supplier',warehouses:'warehouse',associations:'product_origin',destinations:'destination',drafts:'shipment_draft'});
function create({publishableKey,getAccessToken}={}){
 if(typeof publishableKey!=='string'||!publishableKey.startsWith('sb_publishable_')||typeof getAccessToken!=='function')throw Error('Configuración segura de staging pendiente');
 async function rpc(name,payload){
  const token=await getAccessToken();
  if(typeof token!=='string'||!token||token===publishableKey)throw Error('Se requiere sesión administrativa de Supabase staging');
  const response=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  let body;try{body=await response.json()}catch(e){throw Error('Respuesta de staging inválida')}
  if(!response.ok)throw Error('Staging rechazó la operación ('+response.status+'): '+String(body?.message||body?.code||'error'));
  return body;
 }
 return Object.freeze({
  async readAll(){const result=await rpc('ed_delivery_staging_read_v2',{});if(!result||!Array.isArray(result.entities)||!Array.isArray(result.links))throw Error('Estructura de staging inválida');return result},
  async batch(changes){
   if(!Array.isArray(changes)||changes.length<1||changes.length>100)throw Error('Lote inválido');
   const items=changes.map(x=>{
    const kind=KINDS[x.collection];
    if(!kind||typeof x.id!=='string'||!x.id||!Number.isSafeInteger(x.expectedRevision)||x.expectedRevision<0||!x.payload||typeof x.payload!=='object'||Array.isArray(x.payload)||!Array.isArray(x.links)||typeof x.operationId!=='string')throw Error('Cambio de lote inválido');
    return {kind,id:x.id,payload:x.payload,expected_revision:x.expectedRevision,links:x.links,operation_id:x.operationId};
   }).sort((a,b)=>{const x=a.kind+':'+a.id,y=b.kind+':'+b.id;return x<y?-1:x>y?1:0});
   if(items.some((x,i)=>i>0&&x.kind===items[i-1].kind&&x.id===items[i-1].id))throw Error('Entidad duplicada en lote');
   return rpc('ed_delivery_staging_batch_v2',{p_items:items});
  },
  async deactivate(collection,id,expectedRevision,operationId){
   const kind=KINDS[collection];
   if(!['supplier','warehouse','destination'].includes(kind)||!Number.isSafeInteger(expectedRevision)||expectedRevision<1||typeof id!=='string'||!id||typeof operationId!=='string')throw Error('Desactivación inválida');
   return rpc('ed_delivery_staging_deactivate_v2',{p_kind:kind,p_id:id,p_expected_revision:expectedRevision,p_operation_id:operationId});
  },
  async save(collection,id,payload,expectedRevision,links=[],operationId){
   const kind=KINDS[collection];
   if(!kind||typeof id!=='string'||!id||!payload||Array.isArray(payload)||typeof payload!=='object'||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||!Array.isArray(links))throw Error('Datos de guardado inválidos');
   if(typeof operationId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId))throw Error('Identificador de operación UUID requerido');
   return rpc('ed_delivery_staging_write_v2',{p_operation_id:operationId,p_kind:kind,p_id:id,p_payload:payload,p_expected_revision:expectedRevision,p_links:links});
  }
 });
}
global.EDDeliveryStaging=Object.freeze({create,collections:KINDS,projectRef:'xqahthghvozeigbojhyi'});
})(window);
