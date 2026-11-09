'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
function extract(start,end){const a=source.indexOf(start);assert(a>=0,start);const b=source.indexOf(end,a+start.length);assert(b>a,end);return source.slice(a,b);}
const code=[
 extract('async function edOfficialOrderPreview(selectedId=null){','function edConfirmSimulatedCheckout(){'),
 extract('async function edOfficialRecipientSave(){','function edValidCustomerName('),
 extract('async function edRestoreCustomerSession(){','async function edCustomerLogout(){')
].join('\n');
const elements={};const el=id=>elements[id]||(elements[id]={value:'',textContent:'',disabled:false});
let rendered='',requests=[],stock={removed:0,adjusted:0};
const recipient={id:7,nombre:'Entrega Uno',telefono:'+5350000001',provincia:'La Habana',municipio:'Playa',barrio:'Vedado',direccion:'Calle Uno 100',referencias:''};
const ctx={
 document:{getElementById:el},cart:[{id:5,qty:2,color:'Azul'}],
 state:{products:[{id:5,name:'Equipo',price:100}]},
 edCustomerSession:{token:'x'},edCustomerProfile:{nombre:'Comprador Uno',residencia:'extranjero'},
 edCustomerRecipients:[recipient],edCustomerDeliveryLocations:[],validateCart:()=>stock,renderFloatingCart:()=>{},
 edOfficialCustomerLogin:()=>{rendered='LOGIN';},alert:x=>{rendered=String(x);},
 modal:x=>{rendered=x;},esc:x=>String(x),money:x=>String(x),
 edCubanPhone:x=>x,edCustomerToken:async()=> {if(!ctx.edCustomerSession?.token)throw Error('Sesión no disponible');return ctx.edCustomerSession.token;},
 edCustomerRequest:async(action,payload)=>{requests.push({action,payload});if(action==='recipient-save')return {id:7};if(action==='profile')return {cliente:{nombre:'Comprador Uno'},destinatarios:[recipient]};throw Error(action);},
 edOfficialRecipientCheckout:id=>{ctx.selected=id;el('edDeliveryStatus').textContent='';},
 localStorage:{getItem:()=>JSON.stringify({token:'x',expires_at:Date.now()+100000}),setItem:()=>{}},
 ED_CUSTOMER_SESSION_KEY:'test',Date,edClearCustomerSession:()=>{ctx.cleared=true;},
 edCustomerProfileRestore:null
};
vm.createContext(ctx);vm.runInContext(code,ctx);
(async()=>{
el('edDeliveryChoice').value='7';
for(const [key,value] of Object.entries({Name:recipient.nombre,Phone:recipient.telefono,Province:recipient.provincia,Municipality:recipient.municipio,Neighborhood:recipient.barrio,Address:recipient.direccion,References:''}))el('edDelivery'+key).value=value;
await ctx.edOfficialOrderPreview();assert.match(rendered,/MODO PRUEBA/);assert.match(rendered,/200 USD/);assert.match(rendered,/Calle Uno 100/);assert.equal(requests.length,0);
el('edDeliveryChoice').value='999';await ctx.edOfficialOrderPreview();assert.match(rendered,/Selecciona una dirección/);el('edDeliveryChoice').value='7';
el('edDeliveryAddress').value=recipient.direccion;stock={removed:0,adjusted:1};await ctx.edOfficialOrderPreview();assert.match(el('edDeliveryStatus').textContent,/carrito cambió/);stock={removed:0,adjusted:0};
ctx.state.products[0].price=NaN;await ctx.edOfficialOrderPreview();assert.match(el('edDeliveryStatus').textContent,/precios no válidos/);ctx.state.products[0].price=100;
ctx.edCustomerSession=null;await ctx.edOfficialOrderPreview();assert.equal(rendered,'LOGIN');ctx.edCustomerSession={token:'x'};
{
 el('edDeliveryAddress').value='Calle Dos 200';
 await ctx.edOfficialRecipientSave();
 assert.equal(requests[0].action,'recipient-save');assert.equal(requests[0].payload.id,7);
 assert.equal(requests[1].action,'profile');assert.equal(ctx.selected,7);
 requests=[];await ctx.edRestoreCustomerSession();
 assert.equal(requests[0].action,'profile');
 assert.equal(ctx.edCustomerRecipients.length,1);
 console.log('PASS: test-only preview, invalid recipient, stale stock, invalid price, login gate, recipient save, session restore, no order writes');
}
})().catch(e=>{console.error(e);process.exitCode=1});
