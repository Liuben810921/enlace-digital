'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(const script of scripts)new vm.Script(script);
assert.match(html,/edDeliveryOriginsPanel\(\)\+edDeliveryLocationPreview\(\)\+edOsmAndMatrixPanel\(\)/);
const source=scripts.join('\n');
const start=source.indexOf('const ED_OSMAND_MATRIX_KEY='),end=source.indexOf('function edDeliveryLocationPreview(){',start);
assert.ok(start>=0&&end>start);
const store=new Map(),elements={},messages=[];
const el=id=>elements[id]||(elements[id]={value:''});
const ctx={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{getElementById:el},esc:s=>String(s).replaceAll('<','&lt;'),alert:m=>messages.push(m),confirm:()=>true,adminTab:t=>ctx.tab=t,JSON,Number,Math,String,Set};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
const call=expr=>vm.runInContext(expr,ctx);
el('edMatrixId').value='H01';el('edMatrixLabel').value='Centro Habana prueba';
el('edMatrixOsmAnd').value='7.4';el('edMatrixEngine').value='7.8';el('edMatrixStatus').value='ok';
assert.equal(call('edOsmAndMatrixAdd()'),true);
assert.equal(call('edOsmAndMatrixRead().length'),1);
assert.equal(call('edOsmAndMatrixAssess(edOsmAndMatrixRead()[0]).approved'),true);
const exported=call('edOsmAndMatrixExport()');
assert.equal(JSON.parse(exported)[0].id,'H01');
assert.equal(call('edOsmAndMatrixPanel().includes("Dentro de tolerancia")'),true);
el('edMatrixJson').value=JSON.stringify([{id:'H02',label:'Periferia sintética',osmandKm:10,engineKm:13,status:'ok'},{id:'H03',label:'Ruta caída',osmandKm:5,engineKm:0,status:'unavailable'}]);
assert.equal(call('edOsmAndMatrixImport()'),true);
assert.equal(call('edOsmAndMatrixRead().length'),2);
assert.equal(call('edOsmAndMatrixAssess(edOsmAndMatrixRead()[0]).reason'),'Tarifa pendiente de confirmar');
assert.equal(call('edOsmAndMatrixAssess(edOsmAndMatrixRead()[1]).reason'),'Servicio no disponible');
el('edMatrixJson').value='[{"id":"x","label":"<img>","osmandKm":1,"engineKm":1,"status":"ok"},{"id":"x","label":"dup","osmandKm":1,"engineKm":1,"status":"ok"}]';
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),2);
el('edMatrixJson').value='not json';
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),2);
assert.equal(call('edOsmAndMatrixClear()'),true);
assert.equal(call('edOsmAndMatrixRead().length'),0);

assert.equal(call('edOsmAndMatrixLoadFixtures()'),true);
assert.equal(call('edOsmAndMatrixRead().length'),12);
const stats=JSON.parse(JSON.stringify(call('edOsmAndMatrixStats(edOsmAndMatrixRead())')));
assert.equal(stats.total,12);
assert.equal(stats.unavailable,1);
assert.equal(stats.available,11);
assert.equal(stats.withinTolerance+stats.requiresReview,11);
assert.ok(stats.meanAbsoluteErrorKm>0);
const report=JSON.parse(call('edOsmAndMatrixExportReport()'));
assert.equal(report.synthetic,true);
assert.equal(report.routes.length,12);
assert.equal(report.statistics.total,12);
assert.equal(call('edOsmAndMatrixPanel().includes("Error absoluto medio")'),true);
el('edMatrixJson').value=JSON.stringify([{id:'P01',label:'Injected',osmandKm:'7',engineKm:8,status:'ok'}]);
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),12);
el('edMatrixJson').value=JSON.stringify([{id:'P02',label:'<img src=x onerror=alert(1)>',osmandKm:7,engineKm:8,status:'ok'}]);
assert.equal(call('edOsmAndMatrixImport()'),false);
el('edMatrixJson').value=JSON.stringify([{id:'P03',label:'extra',osmandKm:7,engineKm:8,status:'ok',customerPhone:'123'}]);
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),12);


const snapshot=call('edOsmAndMatrixExport()');
const same=JSON.parse(snapshot);
assert.equal(call('edOsmAndMatrixValidate('+JSON.stringify(same)+').length'),12);
const generatedReport=call('edOsmAndMatrixExportReport()');
el('edMatrixJson').value=generatedReport;
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),12);
for(const label of ['Casa 22','Calle 17','Contacto 53544655','Línea \u007f inválida']){
 el('edMatrixJson').value=JSON.stringify([{id:'SAFE',label,osmandKm:7,engineKm:8,status:'ok'}]);
 assert.equal(call('edOsmAndMatrixImport()'),false);
}
for(const bad of [
 [{id:'bad',label:'synthetic',osmandKm:0,engineKm:1,status:'ok'}],
 [{id:'bad',label:'synthetic',osmandKm:301,engineKm:1,status:'ok'}],
 [{id:'bad',label:'synthetic',osmandKm:1,engineKm:-1,status:'ok'}],
 [{id:'bad',label:'synthetic',osmandKm:1,engineKm:301,status:'ok'}],
 [{id:'bad',label:'synthetic',osmandKm:1,engineKm:1,status:'broken'}],
 Array.from({length:101},(_,i)=>({id:'R'+i,label:'Prueba',osmandKm:1,engineKm:1,status:'ok'}))
]){
 el('edMatrixJson').value=JSON.stringify(bad);
 assert.equal(call('edOsmAndMatrixImport()'),false);
 assert.equal(call('edOsmAndMatrixRead().length'),12);
}
el('edMatrixJson').value='x'.repeat(50001);
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),12);
store.set('ed_osmand_route_matrix_demo_v1','{malformed');
assert.equal(call('edOsmAndMatrixRead().length'),0);
store.set('ed_osmand_route_matrix_demo_v1',snapshot);
assert.equal(call('edOsmAndMatrixRead().length'),12);
const oldSet=ctx.localStorage.setItem;
ctx.localStorage.setItem=()=>{throw Error('QuotaExceededError')};
el('edMatrixId').value='FAIL';el('edMatrixLabel').value='Ruta ficticia';el('edMatrixOsmAnd').value='4';el('edMatrixEngine').value='4';el('edMatrixStatus').value='ok';
assert.equal(call('edOsmAndMatrixAdd()'),false);
assert.equal(call('edOsmAndMatrixRead().length'),12);
ctx.localStorage.setItem=oldSet;
const oldGet=ctx.localStorage.getItem;
ctx.localStorage.getItem=()=>{throw Error('StorageAccessDenied')};
assert.equal(call('edOsmAndMatrixRead().length'),0);
ctx.localStorage.getItem=oldGet;
assert.equal(JSON.parse(call('edOsmAndMatrixExportReport()')).routes.length,12);


const ui=call('edOsmAndMatrixPanel()');
for(const id of ['edMatrixId','edMatrixLabel','edMatrixOsmAnd','edMatrixEngine','edMatrixStatus','edMatrixJson'])assert.match(ui,new RegExp('for="'+id+'"'));
assert.match(ui,/aria-live="polite"/);
assert.match(ui,/role="region"/);
assert.match(ui,/tabindex="0"/);
assert.match(ui,/<caption>Comparación sintética de rutas<\/caption>/);
assert.match(ui,/inputmode="decimal"/);
const oldSetAgain=ctx.localStorage.setItem;
ctx.localStorage.setItem=()=>{throw Error('QuotaExceededError')};
el('edMatrixJson').value=JSON.stringify([{id:'A11',label:'Ruta simulada',osmandKm:4,engineKm:4.2,status:'ok'}]);
assert.equal(call('edOsmAndMatrixImport()'),false);
ctx.localStorage.setItem=oldSetAgain;
assert.equal(call('edOsmAndMatrixRead().length'),12);
el('edMatrixJson').value='invalid JSON';
assert.equal(call('edOsmAndMatrixImport()'),false);
assert.match(messages[messages.length-1],/JSON válido/);

console.log('PASS isolated admin route lab: input, tolerance, import/export, invalid JSON, duplicate ID, clearing');
