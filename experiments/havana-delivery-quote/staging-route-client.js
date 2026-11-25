/* Buyer checkout route client. Explicitly gated to the staging query mode. */
(function(root){
 'use strict';
 const endpoint='https://xqahthghvozeigbojhyi.supabase.co/functions/v1/ed-geoapify-routing';
 async function calculate({token,destination,assignments}={}){
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token))throw Error('Sesión del cliente de prueba inválida.');
  if(!destination||destination.province!=='La Habana'||typeof destination.municipality!=='string'||typeof destination.address!=='string')throw Error('Dirección de prueba incompleta.');
  if(!Array.isArray(assignments)||!assignments.length||assignments.length>20||assignments.some(x=>!x||typeof x.productId!=='string'||typeof x.originId!=='string'))throw Error('Selección de almacenes inválida.');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({destination,assignments}),cache:'no-store',credentials:'omit'});
  let body;try{body=await response.json()}catch(e){throw Error('El servicio de rutas devolvió una respuesta inválida.');}
  if(!response.ok){
   const messages={GEOAPIFY_API_KEY_NOT_CONFIGURED:'Falta configurar la clave de Geoapify en los secretos de la función de staging.',CUSTOMER_SESSION_INVALID:'La sesión del cliente de prueba venció. Inicia sesión de nuevo.',DESTINATION_AMBIGUOUS:'Geoapify encontró varias ubicaciones posibles. Completa mejor la dirección.',DESTINATION_NOT_FOUND:'No se pudo ubicar esa dirección en el mapa.',DESTINATION_NOT_CONFIRMED_IN_HAVANA:'El mapa no confirmó una ubicación precisa dentro de La Habana.',PRODUCT_ORIGIN_NOT_VERIFIED:'El producto y el almacén seleccionado ya no coinciden con staging.',STAGING_DAILY_ROUTE_BUDGET_EXHAUSTED:'Se agotó el presupuesto diario de rutas de staging.'};
   throw Error(messages[body?.reason]||'Rutas de staging pendientes: '+String(body?.reason||response.status));
  }
  if(body?.status!=='RUTAS_VIALES_REALES'||!Array.isArray(body.routes)||!body.routes.length||!body.destination||!Number.isFinite(body.destination.lat)||!Number.isFinite(body.destination.lon)||body.routes.some(r=>r?.status!=='verified'||typeof r.originId!=='string'||!Number.isFinite(r.km)||r.km<0||!Number.isFinite(r.durationSeconds)))throw Error('La ruta no superó la validación de staging.');
  return body;
 }
 if(root)root.EDStagingRouteClient=Object.freeze({calculate});
 if(typeof module==='object'&&module.exports)module.exports={calculate,endpoint};
})(typeof window!=='undefined'?window:globalThis);
