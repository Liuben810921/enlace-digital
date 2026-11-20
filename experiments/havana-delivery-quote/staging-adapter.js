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
  async readAll(){const result=await rpc('ed_delivery_staging_read',{});if(!result||!Array.isArray(result.entities)||!Array.isArray(result.links))throw Error('Estructura de staging inválida');return result},
  async deactivate(collection,id,expectedRevision,operationId){
   const kind=KINDS[collection];
   if(!['supplier','warehouse','destination'].includes(kind)||!Number.isSafeInteger(expectedRevision)||expectedRevision<1||typeof id!=='string'||!id||typeof operationId!=='string')throw Error('Desactivación inválida');
   return rpc('ed_delivery_staging_deactivate',{p_kind:kind,p_id:id,p_expected_revision:expectedRevision,p_operation_id:operationId});
  },
  async save(collection,id,payload,expectedRevision,links=[],operationId){
   const kind=KINDS[collection];
   if(!kind||typeof id!=='string'||!id||!payload||Array.isArray(payload)||typeof payload!=='object'||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||!Array.isArray(links))throw Error('Datos de guardado inválidos');
   if(typeof operationId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId))throw Error('Identificador de operación UUID requerido');
   return rpc('ed_delivery_staging_write',{p_operation_id:operationId,p_kind:kind,p_id:id,p_payload:payload,p_expected_revision:expectedRevision,p_links:links});
  }
 });
}
global.EDDeliveryStaging=Object.freeze({create,collections:KINDS,projectRef:'xqahthghvozeigbojhyi'});
})(window);
