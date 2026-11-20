/* ENLACE DIGITAL staging administration: isolated from production and localStorage.
   Disabled unless the operator explicitly connects using a staging Auth account.
   No real orders, charges, or road quotations. */
(function(){
'use strict';
const project='https://xqahthghvozeigbojhyi.supabase.co';
let client=null,token=null,rows=[],links=[],busy=false;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={supplier:'Proveedores',warehouse:'Almacenes',product_origin:'Asociaciones de productos',destination:'Destinos',shipment_draft:'Borradores de entrega'};
function host(){return document.getElementById('ed-staging-admin-host')}
function notice(message,error=false){const el=document.getElementById('ed-staging-notice');if(el){el.textContent=message;el.style.color=error?'#b42318':'#176a43'}}
function render(){
 const h=host();if(!h)return;
 h.innerHTML='<section class="panel"><h3>Pruebas conectadas · Supabase staging</h3><p>Proyecto aislado xqahthghvozeigbojhyi. No usa credenciales ni datos de producción. Sin cotización vial real.</p>'+
 (!client?'<label>Clave pública publishable de staging <input id="ed-staging-key" type="password" autocomplete="off" placeholder="sb_publishable_…"></label><label>Correo administrativo de pruebas <input id="ed-staging-email" type="email" autocomplete="username"></label><label>Contraseña de pruebas <input id="ed-staging-password" type="password" autocomplete="current-password"></label><button id="ed-staging-connect">Conectar a staging</button>':
 '<button id="ed-staging-refresh">Actualizar datos</button> <button id="ed-staging-disconnect">Desconectar</button><p>Guardado remoto: requiere confirmación del servidor; no se copian datos locales.</p>'+
 '<label>Entidad <select id="ed-staging-kind">'+Object.entries(kinds).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label>'+
 '<label>ID de entidad <input id="ed-staging-id" maxlength="160" placeholder="Identificador estable"></label>'+
 '<label>Datos JSON <textarea id="ed-staging-payload" rows="5" placeholder=\'{"name":"Ejemplo ficticio","active":true}\'></textarea></label>'+
 '<label>Relaciones JSON (objetivos existentes) <textarea id="ed-staging-links" rows="3">[]</textarea></label>'+
 '<label>Revisión esperada <input id="ed-staging-revision" type="number" min="0" value="0"></label>'+
 '<button id="ed-staging-save">Guardar en staging</button>'+
 '<div id="ed-staging-list">'+table()+'</div>')+
 '<p id="ed-staging-notice" role="status"></p></section>';
 const connect=document.getElementById('ed-staging-connect');if(connect)connect.onclick=login;
 const refresh=document.getElementById('ed-staging-refresh');if(refresh)refresh.onclick=load;
 const disconnect=document.getElementById('ed-staging-disconnect');if(disconnect)disconnect.onclick=()=>{client=null;token=null;rows=[];links=[];render()};
 const save=document.getElementById('ed-staging-save');if(save)save.onclick=write;
 document.querySelectorAll('[data-ed-staging-select]').forEach(b=>b.onclick=()=>selectRow(b.dataset.edStagingSelect));
}
function table(){
 if(!rows.length)return '<p>No hay entidades registradas en staging.</p>';
 return '<table><thead><tr><th>Tipo</th><th>ID</th><th>Rev.</th><th>Acción</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td>'+escape(kinds[r.kind]||r.kind)+'</td><td>'+escape(r.id)+'</td><td>'+escape(r.revision)+'</td><td><button type="button" data-ed-staging-select="'+i+'">Editar</button></td></tr>').join('')+'</tbody></table>';
}
function selectRow(i){
 const r=rows[Number(i)];if(!r)return;
 document.getElementById('ed-staging-kind').value=r.kind;
 document.getElementById('ed-staging-id').value=r.id;
 document.getElementById('ed-staging-payload').value=JSON.stringify(r.payload,null,2);
 document.getElementById('ed-staging-revision').value=r.revision;
 document.getElementById('ed-staging-links').value=JSON.stringify(links.filter(l=>l.source_kind===r.kind&&l.source_id===r.id).map(l=>({target_kind:l.target_kind,target_id:l.target_id})),null,2);
}
async function login(){
 if(busy)return;busy=true;
 const key=document.getElementById('ed-staging-key').value.trim(),email=document.getElementById('ed-staging-email').value.trim(),password=document.getElementById('ed-staging-password').value;
 try{
  if(!key.startsWith('sb_publishable_')||!email||!password)throw Error('Completa la clave pública y las credenciales de staging');
  const res=await fetch(project+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const data=await res.json();if(!res.ok||!data.access_token)throw Error('Autenticación staging rechazada');
  const candidate=window.EDDeliveryStaging.create({publishableKey:key,getAccessToken:async()=>data.access_token});
  await candidate.readAll(); // verifies admin allowlist before accepting the session
  client=candidate;token=data.access_token;
  render();await load();
 }catch(e){notice(e.message,true)}finally{busy=false}
}
async function load(){
 if(!client||busy)return;busy=true;
 try{const result=await client.readAll();rows=result.entities;links=result.links;render();notice('Lectura remota confirmada: '+rows.length+' entidades')}
 catch(e){notice(e.message,true)}finally{busy=false}
}
async function write(){
 if(!client||busy)return;busy=true;
 const btn=document.getElementById('ed-staging-save');btn.disabled=true;
 try{
  const kind=document.getElementById('ed-staging-kind').value,id=document.getElementById('ed-staging-id').value.trim(),payload=JSON.parse(document.getElementById('ed-staging-payload').value),relations=JSON.parse(document.getElementById('ed-staging-links').value),revision=Number(document.getElementById('ed-staging-revision').value);
  if(!id||!Number.isSafeInteger(revision)||revision<0||!Array.isArray(relations)||!relations.every(x=>x&&typeof x.target_kind==='string'&&typeof x.target_id==='string'))throw Error('ID, relaciones o revisión inválidos');
  const collection={supplier:'suppliers',warehouse:'warehouses',product_origin:'associations',destination:'destinations',shipment_draft:'drafts'}[kind];
  const op=crypto.randomUUID();const result=await client.save(collection,id,payload,revision,relations,op);
  busy=false;await load();notice('Guardado confirmado por staging: '+escape(result.id)+' (revisión '+result.revision+')');
 }catch(e){notice(e.message,true)}finally{busy=false;if(btn.isConnected)btn.disabled=false}
}
function mount(){
 const content=document.getElementById('admincontent');
 if(!content||!content.querySelector('#edDeliveryQuoteDemoResult')&&!content.querySelector('#edQuoteDemoResult'))return;
 if(host())return;
 const div=document.createElement('div');div.id='ed-staging-admin-host';content.appendChild(div);render();
}
const observer=new MutationObserver(()=>{if(!host())mount()});
document.addEventListener('DOMContentLoaded',()=>{const c=document.getElementById('admincontent');if(c){observer.observe(c,{childList:true});mount()}});
})();
