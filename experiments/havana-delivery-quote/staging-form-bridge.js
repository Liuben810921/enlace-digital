/* Existing delivery forms -> isolated staging; opt-in, fail-closed, no localStorage writes.
 * Staging authentication and admin allowlist checked by RPC. Never uses production ED_URL.
 */
(function(){
'use strict';
let api=null,items=[],links=[],busy=false;
const map={supplier:'suppliers',warehouse:'warehouses',product_origin:'associations',destination:'destinations',shipment_draft:'drafts'};
const STAGING_REFRESH_KEY='ed_staging_refresh_v1';
function storedRefresh(){try{return sessionStorage.getItem(STAGING_REFRESH_KEY)||''}catch(e){return ''}}
function saveRefresh(token){try{sessionStorage.setItem(STAGING_REFRESH_KEY,token);return true}catch(e){return false}}
function clearRefresh(){try{sessionStorage.removeItem(STAGING_REFRESH_KEY)}catch(e){}}
function stagingClient(key,data){
 let access=data.access_token,refreshToken=data.refresh_token,expires=Date.now()+Math.max(0,(Number(data.expires_in)||300)-60)*1000;
 return EDDeliveryStaging.create({publishableKey:key,getAccessToken:async()=>{
  if(Date.now()<expires)return access;
  if(!refreshToken)throw Error('Sesión staging caducada; vuelve a conectar');
  const renewal=await fetch('https://xqahthghvozeigbojhyi.supabase.co/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})});
  const next=await renewal.json();if(!renewal.ok||!next.access_token||!next.refresh_token){clearRefresh();throw Error('No se pudo renovar la sesión staging')}
  access=next.access_token;refreshToken=next.refresh_token;expires=Date.now()+Math.max(0,(Number(next.expires_in)||300)-60)*1000;saveRefresh(refreshToken);
  return access;
 }});
}
let restoring=false;
async function restoreStagingSession(){
 if(restoring||api)return;
 const token=storedRefresh(),key=document.getElementById('ed-staging-key')?.value.trim();
 if(!token||!key)return;
 restoring=true;busy=true;
 try{
  const res=await fetch('https://xqahthghvozeigbojhyi.supabase.co/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:token})});
  const data=await res.json();if(!res.ok||!data.access_token||!data.refresh_token){clearRefresh();throw Error('La sesión venció')}
  saveRefresh(data.refresh_token);
  const candidate=stagingClient(key,data),check=await candidate.readAll();
  if(!Array.isArray(check.entities)||!Array.isArray(check.links)){clearRefresh();throw Error('Permiso administrativo no confirmado')}
  api=candidate;items=check.entities;links=check.links;enhanceSupplierForm();
  tell('Staging reconectado automáticamente. Guardados remotos activos.');
 }catch(e){api=null;items=[];links=[];clearRefresh();tell('La sesión de staging expiró. Conecta de nuevo para continuar.')}
 finally{restoring=false;busy=false}
}
const rows=kind=>items.filter(x=>x.kind===kind);
const get=(kind,id)=>rows(kind).find(x=>x.id===id);
const enabled=()=>!!api;
function tell(message){const e=document.getElementById('ed-staging-status');if(e)e.textContent=message;else alert(message)}
async function refresh(){
 const r=await api.readAll();items=r.entities;links=r.links;
 if(!Array.isArray(items)||!Array.isArray(links))throw Error('Respuesta de staging inválida');
}
function stagingWarehouseRow(index){
 const row=document.createElement('div');row.dataset.stagingWarehouse='1';row.style.cssText='border:1px solid #dce6ed;border-radius:10px;padding:10px;margin:10px 0';
 const field=(id,labelText,tag='input')=>{
  const wrap=document.createElement('div');wrap.className='field';
  const label=document.createElement('label');label.htmlFor=id;label.textContent=labelText;
  const control=document.createElement(tag);control.id=id;control.dataset.stagingWarehouseField=tag==='select'?'municipality':tag==='textarea'?'address':'name';
  if(tag==='input'){control.maxLength=120;control.placeholder='Ej.: Almacén principal'}
  if(tag==='textarea'){control.maxLength=300;control.rows=2;control.placeholder='Calle, número y referencias'}
  if(tag==='select'){
   control.innerHTML='<option value="">Selecciona municipio</option>'+municipios.map(m=>'<option value="'+esc(m)+'">'+esc(m)+'</option>').join('');
  }
  wrap.append(label,control);row.append(wrap);
 };
 const title=document.createElement('strong');title.textContent='Almacén '+(index+1);row.append(title);
 field('edStagingWarehouseName'+index,'Nombre del almacén');
 field('edStagingWarehouseMunicipality'+index,'Municipio (La Habana)','select');
 field('edStagingWarehouseAddress'+index,'Dirección','textarea');
 const location=document.createElement('div');location.className='field';
 const gpsLabel=document.createElement('label');gpsLabel.htmlFor='edStagingWarehouseGps'+index;gpsLabel.textContent='Coordenadas GPS de OsmAnd';
 const gps=document.createElement('input');gps.id='edStagingWarehouseGps'+index;gps.placeholder='23.13024 -82.36028';gps.dataset.stagingWarehouseField='gps';
 const lat=document.createElement('input');lat.type='hidden';lat.dataset.stagingWarehouseField='lat';
 const lng=document.createElement('input');lng.type='hidden';lng.dataset.stagingWarehouseField='lng';
 const status=document.createElement('small');status.textContent='Pega las coordenadas una vez; se guardarán automáticamente.';
 gps.addEventListener('input',()=>{const point=edParseOsmAndCoordinates(gps.value);if(point){lat.value=String(point.lat);lng.value=String(point.lng);status.textContent='Ubicación lista: '+point.lat+', '+point.lng}else{lat.value='';lng.value='';status.textContent=gps.value.trim()?'Formato no reconocido. Usa latitud y longitud, por ejemplo 23.13024 -82.36028.':'Pega las coordenadas una vez; se guardarán automáticamente.'}});
 location.append(gpsLabel,gps,status,lat,lng);row.append(location);
 if(index>0){
  const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Quitar este almacén';remove.onclick=()=>row.remove();row.append(remove);
 }
 return row;
}
function enhanceSupplierForm(){
 const input=document.getElementById('edSupplierName'),fieldset=input?.closest('fieldset');
 if(!enabled()){document.getElementById('edStagingSupplierWarehouses')?.remove();return}
 if(!input||!fieldset||document.getElementById('edStagingSupplierWarehouses'))return;
 const details=document.createElement('details');details.id='edStagingSupplierWarehouses';details.open=true;details.style.cssText='margin:12px 0;padding:10px;border:1px solid #dce6ed;border-radius:11px';
 const summary=document.createElement('summary');summary.textContent='Almacenes del proveedor';summary.style.cssText='font-weight:700;cursor:pointer';details.append(summary);
 const note=document.createElement('p');note.className='note';note.textContent='Añade aquí el almacén principal y, si quieres, otros. Se guardarán junto con el proveedor en una sola operación.';details.append(note);
 const list=document.createElement('div');list.id='edStagingSupplierWarehouseRows';list.append(stagingWarehouseRow(0));details.append(list);
 let count=1;
 const add=document.createElement('button');add.type='button';add.className='secondary';add.textContent='+ Añadir otro almacén';
 add.onclick=()=>{if(count>=10){tell('Máximo 10 almacenes por alta');return}list.append(stagingWarehouseRow(count++))};
 details.append(add);
 const submit=fieldset.querySelector('button[onclick="edDeliverySupplierAdd()"]');
 if(submit)fieldset.insertBefore(details,submit);else fieldset.append(details);
}
function panel(){
 const root=document.getElementById('admincontent');
 if(!root||!document.getElementById('edDeliveryPanelTitle'))return;
 if(!root.querySelector('#ed-staging-connection')){
 const div=document.createElement('div');div.id='ed-staging-connection';div.className='panel';
 div.innerHTML='<details><summary style="cursor:pointer;font-weight:700">Conexión técnica de pruebas · staging</summary><p>Opcional: al conectar, estos formularios guardarán en staging. No se importarán registros locales.</p><p>La contraseña puede estar guardada para supabase.com. Como esta página está en GitHub Pages, Chrome quizá no la sugiera automáticamente.</p><p><a href="https://passwords.google.com/" target="_blank" rel="noopener noreferrer">Abrir Contraseñas de Google</a> y buscar supabase.com.</p><label style="display:block;margin:12px 0;line-height:1.4">Clave pública de staging (configurada) <input style="display:block;width:100%;max-width:100%;margin-top:6px;padding:12px;border:1px solid #cbd8e1;border-radius:9px;box-sizing:border-box" id="ed-staging-key" type="password" autocomplete="off" readonly value="sb_publishable_Avgid8eO64Xm2SFuJ7c_EA_l6LG0lCX"></label><label style="display:block;margin:12px 0;line-height:1.4">Correo administrativo staging <input style="display:block;width:100%;max-width:100%;margin-top:6px;padding:12px;border:1px solid #cbd8e1;border-radius:9px;box-sizing:border-box" id="ed-staging-email" type="email" autocomplete="username"></label><label style="display:block;margin:12px 0;line-height:1.4">Contraseña staging <input style="display:block;width:100%;max-width:100%;margin-top:6px;padding:12px;border:1px solid #cbd8e1;border-radius:9px;box-sizing:border-box" id="ed-staging-password" type="password" autocomplete="current-password"></label><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ed-staging-connect" style="padding:11px 16px;border:0;border-radius:9px;background:#087f7a;color:white;font-weight:700">Conectar</button><button type="button" id="ed-staging-disconnect" style="padding:11px 16px;border:1px solid #cbd8e1;border-radius:9px;background:#eef4f6;color:#173343">Desconectar</button></div></details><p id="ed-staging-status" role="status">Modo local. No conectado.</p>';
 root.append(div);
 div.querySelector('#ed-staging-connect').onclick=connect;
 div.querySelector('#ed-staging-disconnect').onclick=()=>{clearRefresh();api=null;items=[];links=[];tell('Desconectado. Modo local.');adminTab('delivery')};
 }
 enhanceSupplierForm();
 if(!api)restoreStagingSession();
}
async function connect(){
 if(busy)return;busy=true;
 try{
 const key=document.getElementById('ed-staging-key').value.trim(),email=document.getElementById('ed-staging-email').value.trim(),password=document.getElementById('ed-staging-password').value;
 if(!key.startsWith('sb_publishable_')||!email||!password)throw Error('Faltan credenciales de staging');
 const res=await fetch('https://xqahthghvozeigbojhyi.supabase.co/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const data=await res.json();if(!res.ok||!data.access_token||!data.refresh_token)throw Error('Autenticación rechazada por staging');
 const candidate=stagingClient(key,data),check=await candidate.readAll();
 if(!Array.isArray(check.entities)||!Array.isArray(check.links))throw Error('Permiso administrativo no confirmado');
 api=candidate;items=check.entities;links=check.links;
 const remembered=saveRefresh(data.refresh_token);
 document.getElementById('ed-staging-password').value='';
 adminTab('delivery');
 tell(remembered?'Conectado a staging. Se mantendrá conectado al recargar esta pestaña.':'Conectado a staging. Los guardados son remotos; la sesión no se pudo conservar en esta pestaña.');
 }catch(e){api=null;tell('No conectado: '+e.message)}finally{busy=false}
}
async function save(kind,id,payload,targets=[]){
 if(busy){tell('Espera la operación anterior');return false}
 busy=true;
 try{
  const old=get(kind,id),rev=old?old.revision:0;
  if(!Number.isSafeInteger(rev))throw Error('Revisión de entidad inválida');
  const result=await api.save(map[kind],id,payload,rev,targets,crypto.randomUUID());
  // A confirmed write must not be reported as failed merely because the refresh fails.
  let refreshed=true;try{await refresh()}catch(refreshError){refreshed=false}
  if(!refreshed){tell('Guardado confirmado por staging (revisión '+result.revision+'), pero no se pudo actualizar la vista. Reconecta para comprobar los datos.');return true}
  adminTab('delivery');tell('Staging confirmó '+kind+' '+id+' · revisión '+result.revision);
  return true;
 }catch(e){tell('No se guardó en staging: '+e.message);return false}finally{busy=false}
}
function field(id){return document.getElementById(id)?.value.trim()||''}
function supplier(){
 const name=field('edSupplierName');if(!name){tell('Introduce el nombre del proveedor');return false}
 if(rows('supplier').some(x=>x.payload.name?.toLowerCase()===name.toLowerCase())){tell('El proveedor ya existe');return false}
 const helper=window.EDStagingSupplierOnboarding?.build;
 if(typeof helper!=='function'){tell('Formulario de alta de proveedor no disponible');return false}
 const supplierId='supplier-'+crypto.randomUUID();
 const warehouses=[...document.querySelectorAll('#edStagingSupplierWarehouseRows [data-staging-warehouse]')].map(row=>({
  id:'warehouse-'+crypto.randomUUID(),
  name:row.querySelector('[data-staging-warehouse-field="name"]')?.value||'',
  municipality:row.querySelector('[data-staging-warehouse-field="municipality"]')?.value||'',
  address:row.querySelector('[data-staging-warehouse-field="address"]')?.value||'',
  lat:row.querySelector('[data-staging-warehouse-field="lat"]')?.value||null,
  lng:row.querySelector('[data-staging-warehouse-field="lng"]')?.value||null
 }));
 let changes;
 try{changes=helper({supplierId,name,warehouses})}catch(e){tell(e.message);return false}
 return batch(changes);
}
function origin(){
 const id=field('edOriginId')||'origin-'+crypto.randomUUID(),name=field('edOriginName'),type=field('edOriginType'),municipality=field('edOriginMunicipality'),address=field('edOriginAddress'),supplierId=type==='proveedor'?field('edOriginSupplier'):null;
 if(!name||!municipality||!address||!['propio','proveedor'].includes(type)||!municipios.includes(municipality)){tell('Completa los campos del almacén');return false}
 if(type==='proveedor'&&!get('supplier',supplierId)){tell('Selecciona un proveedor existente en staging');return false}
 const lat=field('edOriginLat'),lng=field('edOriginLng');
 if(Boolean(lat)!==Boolean(lng)||lat&&(!Number.isFinite(+lat)||!Number.isFinite(+lng)||Math.abs(+lat)>90||Math.abs(+lng)>180)){tell('Coordenadas inválidas');return false}
 const prev=get('warehouse',id)?.payload||{};
 if(prev.type&&(prev.type!==type||prev.supplierId!==supplierId)&&links.some(l=>l.target_kind==='warehouse'&&l.target_id===id)){tell('Reasigna las asociaciones antes de cambiar el tipo');return false}
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
 if(!ids.length||warehouses.some(x=>!x||x.payload.active===false)||warehouses.some(x=>expectedType&&x.payload.type!==expectedType)){tell('Almacén no disponible en staging');return false}
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
async function deactivate(kind,id){
 if(busy)return false;
 const row=get(kind,id);if(!row){tell('Entidad no encontrada en staging');return false}
 if(kind==='supplier'&&rows('warehouse').some(w=>w.payload.supplierId===id&&w.payload.active!==false)){tell('Desactiva o reasigna sus almacenes antes de desactivar el proveedor');return false}
 if(kind==='warehouse'&&links.some(l=>l.target_kind==='warehouse'&&l.target_id===id)){tell('Reasigna productos antes de desactivar el almacén');return false}
 busy=true;
 try{
  const result=await api.deactivate(map[kind],id,row.revision,crypto.randomUUID());
  try{await refresh()}catch(e){tell('Desactivación confirmada, pero la vista no pudo actualizarse');return true}
  adminTab('delivery');tell('Desactivación confirmada: '+id+' · revisión '+result.revision);return true;
 }catch(e){tell('Desactivación rechazada: '+e.message);return false}finally{busy=false}
}
function supplierEdit(id){
 const row=get('supplier',id),fieldEl=document.getElementById('edSupplierEdit-'+id),input=document.getElementById('edSupplierEditName-'+id);
 if(!row||!fieldEl||!input)return false;
 if(fieldEl.hidden){fieldEl.dataset.stagingRevision=String(row.revision);input.value=row.payload.name;fieldEl.hidden=false;input.focus();return true}
 const name=input.value.trim();
 if(!name||rows('supplier').some(x=>x.id!==id&&x.payload.name?.toLowerCase()===name.toLowerCase())){tell('Nombre inválido o duplicado');return false}
 if(String(row.revision)!==fieldEl.dataset.stagingRevision){tell('Proveedor modificado durante la edición');return false}
 return save('supplier',id,{...row.payload,name});
}
function supplierToggle(id){
 const row=get('supplier',id);if(!row)return false;
 if(row.payload.active!==false)return deactivate('supplier',id);
 return save('supplier',id,{...row.payload,active:true});
}
function originToggle(id){
 const row=get('warehouse',id);if(!row)return false;
 if(row.payload.active!==false)return deactivate('warehouse',id);
 if(row.payload.supplierId&&get('supplier',row.payload.supplierId)?.payload.active===false){tell('Activa primero el proveedor');return false}
 return save('warehouse',id,{...row.payload,active:true});
}
function duplicateWarehouse(id){
 const row=get('warehouse',id);if(!row)return false;
 const p=row.payload;
 return batch([{kind:'warehouse',id:'origin-copy-'+crypto.randomUUID(),create:true,payload:{...p,name:p.name+' (copia)',active:false,defaultForSupplier:false,lat:null,lng:null},links:p.supplierId?[{target_kind:'supplier',target_id:p.supplierId}]:[]}]);
}
function archive(){
 const name=field('edQuoteDraftName');if(!name||name.length>80){tell('Nombre de archivo inválido');return false}
 const latest=rows('shipment_draft').filter(x=>x.payload.status==='PENDIENTE'&&!x.payload.archivedAt).sort((a,b)=>String(b.payload.createdAt||'').localeCompare(String(a.payload.createdAt||'')))[0];
 if(!latest){tell('No hay borrador remoto pendiente para archivar');return false}
 return save('shipment_draft',latest.id,{...latest.payload,name,archivedAt:new Date().toISOString(),status:'ARCHIVADO'},links.filter(l=>l.source_kind==='shipment_draft'&&l.source_id===latest.id).map(l=>({target_kind:l.target_kind,target_id:l.target_id})));
}
async function batch(changes){
 if(busy||!changes.length||changes.length>100)return false;
 busy=true;
 try{
  const result=await api.batch(changes.map(c=>{
   const old=get(c.kind,c.id);if(!old&&c.create!==true)throw Error('Entidad inexistente: '+c.id);
   return {collection:map[c.kind],id:c.id,payload:c.payload,expectedRevision:old?.revision??0,
    links:c.links??links.filter(l=>l.source_kind===c.kind&&l.source_id===c.id).map(l=>({target_kind:l.target_kind,target_id:l.target_id})),operationId:crypto.randomUUID()};
  }));
  try{await refresh()}catch(e){tell('Lote confirmado por staging; actualización de pantalla pendiente');return true}
  adminTab('delivery');tell('Staging confirmó '+result.length+' cambios atómicos');return true;
 }catch(e){tell('Lote rechazado sin aplicar cambios: '+e.message);return false}finally{busy=false}
}
function selected(className,panelId){
 const panel=document.getElementById(panelId);
 if(!panel||panel.disabled)return [];
 const ids=[...panel.querySelectorAll('.'+className+':checked')].map(e=>e.value);
 return ids.length===new Set(ids).size?ids:[];
}
function bulkSupplierActive(active){
 const ids=selected('edSupplierBulkCheck','edSupplierBulkSelection');
 if(!ids.length||ids.some(id=>!get('supplier',id))){tell('Selecciona proveedores válidos');return false}
 const affected=rows('warehouse').filter(w=>ids.includes(w.payload.supplierId));
 if(!active&&affected.some(w=>links.some(l=>l.target_kind==='warehouse'&&l.target_id===w.id))){tell('Reasigna los productos dependientes antes de desactivar');return false}
 return batch(ids.filter(id=>(get('supplier',id).payload.active!==false)!==active).map(id=>({kind:'supplier',id,payload:{...get('supplier',id).payload,active}})));
}
function bulkWarehouseActive(active){
 const ids=selected('edOriginBulkCheck','edOriginBulkSelection');
 if(!ids.length||ids.some(id=>!get('warehouse',id))){tell('Selecciona almacenes válidos');return false}
 if(!active&&ids.some(id=>links.some(l=>l.target_kind==='warehouse'&&l.target_id===id))){tell('Hay productos asociados; reasigna antes de desactivar');return false}
 if(active&&ids.some(id=>{const w=get('warehouse',id).payload;return w.supplierId&&get('supplier',w.supplierId)?.payload.active===false})){tell('Activa primero el proveedor');return false}
 return batch(ids.filter(id=>(get('warehouse',id).payload.active!==false)!==active).map(id=>({kind:'warehouse',id,payload:{...get('warehouse',id).payload,active}})));
}
function bulkMunicipality(){
 const municipality=field('edOriginBulkMunicipality'),ids=selected('edOriginBulkCheck','edOriginBulkSelection');
 if(!municipios.includes(municipality)||!ids.length||ids.some(id=>!get('warehouse',id))){tell('Municipio o almacenes inválidos');return false}
 const changed=ids.filter(id=>get('warehouse',id).payload.municipality!==municipality);
 if(!changed.length)return false;
 if(!confirm('Trasladar '+changed.length+' almacenes y borrar sus coordenadas anteriores?'))return false;
 return batch(changed.map(id=>({kind:'warehouse',id,payload:{...get('warehouse',id).payload,municipality,lat:null,lng:null}})));
}
function setDefault(id){
 const chosen=get('warehouse',id);if(!chosen||chosen.payload.type!=='proveedor'||chosen.payload.active===false||get('supplier',chosen.payload.supplierId)?.payload.active===false){tell('Almacén o proveedor inválido');return false}
 const group=rows('warehouse').filter(w=>w.payload.type==='proveedor'&&w.payload.supplierId===chosen.payload.supplierId);
 const changed=group.filter(w=>(w.payload.defaultForSupplier===true)!==(w.id===id));
 return batch(changed.map(w=>({kind:'warehouse',id:w.id,payload:{...w.payload,defaultForSupplier:w.id===id}})));
}
function bulkTransferSupplier(){
 const targetId=field('edOriginBulkSupplier'),ids=selected('edOriginBulkCheck','edOriginBulkSelection');
 if(!get('supplier',targetId)||get('supplier',targetId).payload.active===false||!ids.length){tell('Proveedor destino o selección inválidos');return false}
 if(ids.some(id=>!get('warehouse',id)||get('warehouse',id).payload.type!=='proveedor')){tell('Solo se admiten almacenes de proveedor');return false}
 const changed=ids.filter(id=>get('warehouse',id).payload.supplierId!==targetId);
 if(changed.some(id=>links.some(l=>l.target_kind==='warehouse'&&l.target_id===id))){tell('Reasigna productos asociados antes de transferir almacenes');return false}
 return batch(changed.map(id=>({kind:'warehouse',id,payload:{...get('warehouse',id).payload,supplierId:targetId,defaultForSupplier:false},links:[{target_kind:'supplier',target_id:targetId}]})));
}
function duplicateSuppliers(){
 const ids=selected('edSupplierBulkCheck','edSupplierBulkSelection');
 if(!ids.length||ids.some(id=>!get('supplier',id))){tell('Selección de proveedores inválida');return false}
 if(!confirm('Crear '+ids.length+' proveedores independientes e inactivos en staging?'))return false;
 return batch(ids.map(id=>{const p=get('supplier',id).payload;return {kind:'supplier',id:'supplier-copy-'+crypto.randomUUID(),create:true,payload:{name:p.name+' (copia)',active:false},links:[]}}));
}
function duplicateWarehouses(){
 const ids=selected('edOriginBulkCheck','edOriginBulkSelection');
 if(!ids.length||ids.some(id=>!get('warehouse',id))){tell('Selección de almacenes inválida');return false}
 if(!confirm('Duplicar '+ids.length+' almacenes inactivos, sin coordenadas ni asociaciones?'))return false;
 return batch(ids.map(id=>{const p=get('warehouse',id).payload;return {kind:'warehouse',id:'origin-copy-'+crypto.randomUUID(),create:true,payload:{...p,name:p.name+' (copia)',active:false,defaultForSupplier:false,lat:null,lng:null},links:p.supplierId?[{target_kind:'supplier',target_id:p.supplierId}]:[]}}));
}
function transferSupplierWarehouses(sourceId){
 const ids=[...(document.getElementById('edTransferWarehouses-'+sourceId)?.querySelectorAll('input[type="checkbox"]:checked')||[])].map(x=>x.value);
 const targetId=field('edTransferSupplier-'+sourceId);
 if(!ids.length||ids.length!==new Set(ids).size||!get('supplier',targetId)||get('supplier',targetId).payload.active===false||sourceId===targetId){tell('Selección o proveedor destino inválidos');return false}
 if(ids.some(id=>!get('warehouse',id)||get('warehouse',id).payload.supplierId!==sourceId)){tell('Almacenes de origen inválidos');return false}
 if(ids.some(id=>links.some(l=>l.target_kind==='warehouse'&&l.target_id===id))){tell('Existen asociaciones: reasigna los productos antes de transferir');return false}
 const makeDefault=document.getElementById('edTransferMakeDefault-'+sourceId)?.checked===true;
 const changes=ids.map(id=>({kind:'warehouse',id,payload:{...get('warehouse',id).payload,supplierId:targetId,defaultForSupplier:makeDefault&&id===ids[0]},links:[{target_kind:'supplier',target_id:targetId}]}));
 if(makeDefault)for(const w of rows('warehouse'))if(w.payload.supplierId===targetId&&w.payload.defaultForSupplier===true)changes.push({kind:'warehouse',id:w.id,payload:{...w.payload,defaultForSupplier:false}});
 return batch(changes);
}
function bulkDeleteSuppliers(){
 const ids=selected('edSupplierBulkCheck','edSupplierBulkSelection');
 if(!ids.length||ids.some(id=>!get('supplier',id))){tell('Proveedores seleccionados inválidos');return false}
 if(ids.some(id=>rows('warehouse').some(w=>w.payload.supplierId===id&&w.payload.active!==false))){tell('Hay almacenes activos asociados. Reasígnalos o desactívalos antes');return false}
 if(!confirm('Desactivar '+ids.length+' proveedores en staging? Se conservará el historial.'))return false;
 return batch(ids.filter(id=>get('supplier',id).payload.active!==false).map(id=>({kind:'supplier',id,payload:{...get('supplier',id).payload,active:false}})));
}
function bulkDeleteWarehouses(){
 const ids=selected('edOriginBulkCheck','edOriginBulkSelection');
 if(!ids.length||ids.some(id=>!get('warehouse',id))){tell('Almacenes seleccionados inválidos');return false}
 if(ids.some(id=>links.some(l=>l.target_kind==='warehouse'&&l.target_id===id&&l.source_kind==='product_origin'))){tell('Existen productos asociados. Reasígnalos antes');return false}
 if(!confirm('Desactivar '+ids.length+' almacenes en staging? Se conservará el historial.'))return false;
 return batch(ids.filter(id=>get('warehouse',id).payload.active!==false).map(id=>({kind:'warehouse',id,payload:{...get('warehouse',id).payload,active:false,defaultForSupplier:false}})));
}
function read(kind){return rows(kind).map(x=>({...x.payload,id:x.id}))}
function associations(){return Object.fromEntries(rows('product_origin').map(x=>[x.id,x.payload.warehouseIds||[]]))}
function checkoutContext({products,inventorySnapshot,baseRevision}={}){
 if(!enabled())return {ok:false,reason:'STAGING_NOT_CONNECTED'};
 const builder=window.EDStagingCheckoutContext?.build;
 if(typeof builder!=='function')return {ok:false,reason:'STAGING_CHECKOUT_CONTEXT_UNAVAILABLE'};
 return builder({entities:items,links,products,inventorySnapshot,baseRevision});
}
function wrap(name,fn){const original=window[name];if(typeof original!=='function')throw Error('No existe '+name);window[name]=function(...args){return enabled()?fn(...args):original.apply(this,args)}}
window.EDDeliveryStagingBridge=Object.freeze({isConnected:enabled,checkoutContext,projectRef:'xqahthghvozeigbojhyi'});
function init(){
 wrap('edDeliverySuppliersRead',()=>read('supplier'));
 wrap('edDeliveryOriginsRead',()=>read('warehouse'));
 wrap('edDeliveryDestinationsRead',()=>read('destination'));
 wrap('edProductOriginsRead',associations);
 wrap('edDeliverySupplierAdd',supplier);
 wrap('edDeliverySupplierEdit',supplierEdit);
 wrap('edDeliverySupplierToggle',supplierToggle);
 wrap('edDeliveryArchiveShipmentDraft',archive);
 wrap('edDeliveryOriginDelete',id=>deactivate('warehouse',id));
 wrap('edDeliveryOriginToggle',originToggle);
 wrap('edDeliveryOriginDuplicate',duplicateWarehouse);
 wrap('edDeliverySupplierDelete',id=>deactivate('supplier',id));
 wrap('edDeliveryOriginSave',origin);
 wrap('edDeliveryDestinationSave',destination);
 wrap('edProductOriginsSave',association);
 wrap('edDeliverySaveShipmentDraft',draft);
 wrap('edDeliverySuppliersSetSelectedActive',bulkSupplierActive);
 wrap('edDeliveryOriginsSetSelectedActive',bulkWarehouseActive);
 wrap('edDeliveryOriginsMoveSelected',bulkMunicipality);
 wrap('edDeliveryOriginSetDefault',setDefault);
 wrap('edDeliveryOriginsTransferSelectedSupplier',bulkTransferSupplier);
 wrap('edDeliverySuppliersDuplicateSelected',duplicateSuppliers);
 wrap('edDeliveryOriginsDuplicateSelected',duplicateWarehouses);
 wrap('edDeliverySupplierTransferWarehouses',transferSupplierWarehouses);
 wrap('edDeliverySuppliersDeleteSelected',bulkDeleteSuppliers);
 wrap('edDeliveryOriginsDeleteSelected',bulkDeleteWarehouses);
 // Prevent unsupported local-only mutations from being mistaken for remote saves.
 const unsupported=['edDeliveryPersistAndInvalidate'];
 for(const name of unsupported){
  if(typeof window[name]!=='function')continue;
  const original=window[name];
  window[name]=function(...args){if(enabled()){tell('Operación no habilitada en staging: '+name+'. No se han modificado datos.');return false}return original.apply(this,args)};
 }

 const original=window.adminTab;window.adminTab=function(...args){const result=original.apply(this,args);if(args[0]==='delivery')panel();return result};
 if(document.getElementById('edDeliveryPanelTitle'))panel();
}
document.addEventListener('DOMContentLoaded',init,{once:true});
})();
