/* Existing delivery forms -> isolated staging; opt-in, fail-closed, no localStorage writes.
 * Staging authentication and admin allowlist checked by RPC. Never uses production ED_URL.
 */
(function(){
'use strict';
let api=null,items=[],links=[],busy=false;
const map={supplier:'suppliers',warehouse:'warehouses',product_origin:'associations',destination:'destinations',shipment_draft:'drafts'};
const rows=kind=>items.filter(x=>x.kind===kind);
const get=(kind,id)=>rows(kind).find(x=>x.id===id);
const enabled=()=>!!api;
function tell(message){const e=document.getElementById('ed-staging-status');if(e)e.textContent=message;else alert(message)}
async function refresh(){
 const r=await api.readAll();items=r.entities;links=r.links;
 if(!Array.isArray(items)||!Array.isArray(links))throw Error('Respuesta de staging inválida');
}
function panel(){
 const root=document.getElementById('admincontent');
 if(!root||!document.getElementById('edDeliveryPanelTitle')||root.querySelector('#ed-staging-connection'))return;
 const div=document.createElement('div');div.id='ed-staging-connection';div.className='panel';
 div.innerHTML='<h3>Conexión de Administración de entregas · staging</h3><p>Opcional: al conectar, estos mismos formularios guardarán en staging. No se importarán registros locales.</p><label>Clave pública de staging <input id="ed-staging-key" type="password" autocomplete="off"></label><label>Correo administrativo staging <input id="ed-staging-email" type="email" autocomplete="username"></label><label>Contraseña staging <input id="ed-staging-password" type="password" autocomplete="current-password"></label><button type="button" id="ed-staging-connect">Conectar</button> <button type="button" id="ed-staging-disconnect">Desconectar</button><p id="ed-staging-status" role="status">Modo local. No conectado.</p>';
 root.prepend(div);
 div.querySelector('#ed-staging-connect').onclick=connect;
 div.querySelector('#ed-staging-disconnect').onclick=()=>{api=null;items=[];links=[];tell('Desconectado. Modo local.');adminTab('delivery')};
}
async function connect(){
 if(busy)return;busy=true;
 try{
 const key=document.getElementById('ed-staging-key').value.trim(),email=document.getElementById('ed-staging-email').value.trim(),password=document.getElementById('ed-staging-password').value;
 if(!key.startsWith('sb_publishable_')||!email||!password)throw Error('Faltan credenciales de staging');
 const res=await fetch('https://xqahthghvozeigbojhyi.supabase.co/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const data=await res.json();if(!res.ok||!data.access_token)throw Error('Autenticación rechazada por staging');
 const candidate=EDDeliveryStaging.create({publishableKey:key,getAccessToken:async()=>data.access_token});
 const check=await candidate.readAll();if(!Array.isArray(check.entities)||!Array.isArray(check.links))throw Error('Permiso administrativo no confirmado');
 api=candidate;items=check.entities;links=check.links;
 adminTab('delivery');tell('Conectado a staging. Los guardados de los formularios son remotos.');
 }catch(e){api=null;tell('No conectado: '+e.message)}finally{busy=false}
}
async function save(kind,id,payload,targets=[]){
 if(busy){tell('Espera la operación anterior');return false}
 busy=true;
 try{
  const old=get(kind,id),rev=old?old.revision:0;
  if(!Number.isSafeInteger(rev))throw Error('Revisión de entidad inválida');
  const result=await api.save(map[kind],id,payload,rev,targets,crypto.randomUUID());
  await refresh();
  adminTab('delivery');tell('Staging confirmó '+kind+' '+id+' · revisión '+result.revision);
  return true;
 }catch(e){tell('No se guardó en staging: '+e.message);return false}finally{busy=false}
}
function field(id){return document.getElementById(id)?.value.trim()||''}
function supplier(){
 const name=field('edSupplierName');if(!name){tell('Introduce el nombre del proveedor');return false}
 if(rows('supplier').some(x=>x.payload.name?.toLowerCase()===name.toLowerCase())){tell('El proveedor ya existe');return false}
 return save('supplier','supplier-'+crypto.randomUUID(),{name,active:true});
}
function origin(){
 const id=field('edOriginId')||'origin-'+crypto.randomUUID(),name=field('edOriginName'),type=field('edOriginType'),municipality=field('edOriginMunicipality'),address=field('edOriginAddress'),supplierId=type==='proveedor'?field('edOriginSupplier'):null;
 if(!name||!municipality||!address||!['propio','proveedor'].includes(type)||!municipios.includes(municipality)){tell('Completa los campos del almacén');return false}
 if(type==='proveedor'&&!get('supplier',supplierId)){tell('Selecciona un proveedor existente en staging');return false}
 const lat=field('edOriginLat'),lng=field('edOriginLng');
 if(Boolean(lat)!==Boolean(lng)||lat&&(!Number.isFinite(+lat)||!Number.isFinite(+lng)||Math.abs(+lat)>90||Math.abs(+lng)>180)){tell('Coordenadas inválidas');return false}
 const prev=get('warehouse',id)?.payload||{};
 if(prev.type&&prev.type!==type&&links.some(l=>l.target_kind==='warehouse'&&l.target_id===id)){tell('Reasigna las asociaciones antes de cambiar el tipo');return false}
 return save('warehouse',id,{...prev,name,type,municipality,address,supplierId,lat:lat?+lat:null,lng:lng?+lng:null,active:prev.active!==false,defaultForSupplier:document.getElementById('edOriginMakeDefault')?.checked===true},supplierId?[{target_kind:'supplier',target_id:supplierId}]:[]);
}
function destination(){
 const id=field('edDestinationId')||'destination-'+crypto.randomUUID(),name=field('edDestinationName'),municipality=field('edDestinationMunicipality'),address=field('edDestinationAddress'),lat=field('edDestinationLat'),lng=field('edDestinationLng');
 if(!name||!municipality||!address||!municipios.includes(municipality)||Boolean(lat)!==Boolean(lng)||lat&&(!Number.isFinite(+lat)||!Number.isFinite(+lng)||Math.abs(+lat)>90||Math.abs(+lng)>180)){tell('Revisa nombre, municipio, dirección y coordenadas');return false}
 return save('destination',id,{name,municipality,address,lat:lat?+lat:null,lng:lng?+lng:null});
}
function association(productId,ids,expectedType){
 if(!productId||!Array.isArray(ids)||new Set(ids).size!==ids.length){tell('Asociaciones inválidas');return false}
 const warehouses=ids.map(id=>get('warehouse',id));
 if(warehouses.some(x=>!x||x.payload.active===false)||warehouses.some(x=>expectedType&&x.payload.type!==expectedType)){tell('Almacén no disponible en staging');return false}
 if(warehouses.some(x=>x.payload.type!==warehouses[0]?.payload.type||(x.payload.type==='proveedor'&&x.payload.supplierId!==warehouses[0]?.payload.supplierId))){tell('Almacenes de origen incompatible');return false}
 return save('product_origin',String(productId),{productId:String(productId),warehouseIds:ids},ids.map(id=>({target_kind:'warehouse',target_id:id})));
}
function draft(){
 const productIds=[...(document.getElementById('edQuoteDemoProduct')?.selectedOptions||[])].map(x=>x.value).filter(Boolean);
 const destinationId=field('edQuoteDemoDestination');
 if(!productIds.length||!get('destination',destinationId)||productIds.some(id=>!get('product_origin',id))){tell('Selecciona productos asociados y destino existentes en staging');return false}
 const warehouseIds=[...new Set(productIds.flatMap(id=>get('product_origin',id).payload.warehouseIds||[]))];
 if(warehouseIds.some(id=>!get('warehouse',id))){tell('Almacenes de staging incompletos');return false}
 const id='draft-'+crypto.randomUUID();
 return save('shipment_draft',id,{status:'PENDIENTE',productIds,destinationId,warehouseIds,createdAt:new Date().toISOString()},[{target_kind:'destination',target_id:destinationId},...productIds.map(id=>({target_kind:'product_origin',target_id:id}))]);
}
function read(kind){return rows(kind).map(x=>({...x.payload,id:x.id}))}
function associations(){return Object.fromEntries(rows('product_origin').map(x=>[x.id,x.payload.warehouseIds||[]]))}
function wrap(name,fn){const original=window[name];if(typeof original!=='function')throw Error('No existe '+name);window[name]=function(...args){return enabled()?fn(...args):original.apply(this,args)}}
function init(){
 wrap('edDeliverySuppliersRead',()=>read('supplier'));
 wrap('edDeliveryOriginsRead',()=>read('warehouse'));
 wrap('edDeliveryDestinationsRead',()=>read('destination'));
 wrap('edProductOriginsRead',associations);
 wrap('edDeliverySupplierAdd',supplier);
 wrap('edDeliveryOriginSave',origin);
 wrap('edDeliveryDestinationSave',destination);
 wrap('edProductOriginsSave',association);
 wrap('edDeliverySaveShipmentDraft',draft);
 const original=window.adminTab;window.adminTab=function(...args){const result=original.apply(this,args);if(args[0]==='delivery')panel();return result};
 if(document.getElementById('edDeliveryPanelTitle'))panel();
}
document.addEventListener('DOMContentLoaded',init,{once:true});
})();
