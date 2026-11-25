'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {calculate,endpoint}=require('../experiments/havana-delivery-quote/staging-route-client.js');
const token='a'.repeat(64);
const destination={province:'La Habana',municipality:'La Habana Vieja',address:'Calle de prueba 12'};
const assignments=[{productId:'7',originId:'origin-1'}];
test('sends the authenticated buyer request only to the staging route function',async()=>{
 let sent;
 global.fetch=async(url,options)=>{sent={url,options};return {ok:true,json:async()=>({status:'RUTAS_VIALES_REALES',destination:{lat:23.1,lon:-82.3,formatted:'Destino de prueba'},routes:[{originId:'origin-1',originName:'Almacén Principal',km:4.2,durationSeconds:600,status:'verified'}]})}};
 const r=await calculate({token,destination,assignments});
 assert.equal(sent.url,endpoint);assert.match(endpoint,/xqahthghvozeigbojhyi/);assert.equal(sent.options.credentials,'omit');
 assert.equal(sent.options.headers.Authorization,'Bearer '+token);assert.equal(r.routes[0].km,4.2);
});
test('rejects invalid address and does not issue a request',async()=>{
 let called=false;global.fetch=async()=>{called=true;throw Error('must not call')};
 await assert.rejects(calculate({token,destination:{...destination,province:'Matanzas'},assignments}),/Dirección/);
 assert.equal(called,false);
});
test('does not promote malformed or unverified provider responses',async()=>{
 global.fetch=async()=>({ok:true,json:async()=>({status:'RUTAS_VIALES_REALES',destination:{lat:23.1,lon:-82.3},routes:[{originId:'origin-1',km:4.2,durationSeconds:600,status:'pending'}]})});
 await assert.rejects(calculate({token,destination,assignments}),/validación/);
});
test('surfaces missing Geoapify secret without exposing route credentials',async()=>{
 global.fetch=async()=>({ok:false,json:async()=>({reason:'GEOAPIFY_API_KEY_NOT_CONFIGURED'})});
 await assert.rejects(calculate({token,destination,assignments}),/Falta configurar la clave/);
});
