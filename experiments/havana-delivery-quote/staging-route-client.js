/* Buyer checkout route client. Explicitly gated to the staging query mode. */
(function(root){
 'use strict';
 const endpoint='https://xqahthghvozeigbojhyi.supabase.co/functions/v1/ed-geoapify-routing';
 const publishableKey='sb_publishable_Avgid8eO64Xm2SFuJ7c_EA_l6LG0lCX';
 async function calculate({token,destination,productIds}={}){
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token))throw Error('Sesión del cliente de prueba inválida.');
  if(!destination||destination.province!=='La Habana'||typeof destination.municipality!=='string'||typeof destination.address!=='string')throw Error('Dirección de prueba incompleta.');
  if(!Array.isArray(productIds)||!productIds.length||productIds.length>20||productIds.some(id=>typeof id!=='string'||!id.length)||new Set(productIds).size!==productIds.length)throw Error('Productos de prueba inválidos.');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:publishableKey,Authorization:'Bearer '+token},body:JSON.stringify({destination,productIds}),cache:'no-store',credentials:'omit'});
  let body;try{body=await response.json()}catch(e){throw Error('El servicio de rutas devolvió una respuesta inválida.');}
  const messages={GEOAPIFY_API_KEY_NOT_CONFIGURED:'Falta configurar la clave de Geoapify en los secretos de la función de staging.',CUSTOMER_SESSION_INVALID:'La sesión del cliente de prueba venció. Inicia sesión de nuevo.',DESTINATION_AMBIGUOUS:'Geoapify encontró varias ubicaciones posibles. Completa mejor la dirección.',DESTINATION_NOT_FOUND:'No se pudo ubicar esa dirección en el mapa.',DESTINATION_NOT_CONFIRMED_IN_HAVANA:'El mapa no confirmó una ubicación precisa dentro de La Habana.',PRODUCT_ORIGIN_NOT_VERIFIED:'El producto y el almacén seleccionado ya no coinciden con staging.',STAGING_DAILY_ROUTE_BUDGET_EXHAUSTED:'Se agotó el presupuesto diario de rutas de staging.'};
  if(!response.ok||body?.status==='PENDIENTE'){
   throw Error(messages[body?.reason]||'Rutas de staging pendientes: '+String(body?.reason||response.status));
  }
  const allowedRouteStatus=body?.status==='RUTAS_VIALES_APROXIMADAS'?'approximate':'verified';if(!['RUTAS_VIALES_REALES','RUTAS_VIALES_APROXIMADAS'].includes(body?.status)||!Array.isArray(body.routes)||!body.routes.length||!body.destination||!Number.isFinite(body.destination.lat)||!Number.isFinite(body.destination.lon)||body.routes.some(r=>r?.status!==allowedRouteStatus||typeof r.originId!=='string'||!Number.isFinite(r.km)||r.km<0||!Number.isFinite(r.durationSeconds)))throw Error('La ruta no superó la validación de staging.');
  return body;
 }
 if(root)root.EDStagingRouteClient=Object.freeze({calculate});
 if(typeof module==='object'&&module.exports)module.exports={calculate,endpoint};
})(typeof window!=='undefined'?window:globalThis);
