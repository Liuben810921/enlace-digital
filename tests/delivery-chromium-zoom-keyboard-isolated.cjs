'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('index.html','utf8');
 const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
 const start=source.indexOf('const ED_DELIVERY_ORIGINS_KEY=');
 const end=source.indexOf('function deliveryBarrios(){',start);
 assert(start>=0&&end>start,'Delivery module not found');
 const moduleSource=source.slice(start,end);
 const browser=await chromium.launch({headless:true});
 try {
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
   page.on('dialog',dialog=>dialog.accept());
   await page.route('http://ed.local/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px Arial;margin:0;padding:12px;box-sizing:border-box}*,*:before,*:after{box-sizing:border-box}.panel{border:1px solid #ddd;padding:10px;margin:8px 0}.field{margin:8px 0}input,select,button{max-width:100%}button:focus-visible{outline:3px solid #0b5673;outline-offset:2px}</style></head><body><main id="panel"></main></body></html>'}));await page.goto('http://ed.local/');
   await page.evaluate(()=>{
    window.esc=s=>String(s);
    window.municipios=['Playa'];
    window.adminTab=()=>{document.querySelector('#panel').innerHTML=edDeliveryOriginsPanel()};
   });
   // A script element preserves global lexical constants used by the extracted functions.
   await page.addScriptTag({content:moduleSource});
   await page.evaluate(()=>{
    localStorage.setItem('ed_delivery_suppliers_demo_v1',JSON.stringify([{id:'sup',name:'Proveedor sintético',active:true}]));
    localStorage.setItem('ed_delivery_origins_demo_v1',JSON.stringify([{id:'own',name:'Almacén sintético',type:'propio',active:true,address:'Prueba',municipality:'Playa'}]));
    localStorage.setItem('ed_product_origins_demo_v1',JSON.stringify({product:['own']}));
    window.__snapshot=edDeliveryQuoteSnapshot();
    document.querySelector('#panel').innerHTML=edDeliveryOriginsPanel();
   });
   assert.equal(await page.locator('button:has-text("Editar")').count(),2);
   await page.evaluate(()=>{edDeliveryQuarantine();document.querySelector('#panel').innerHTML=edDeliveryOriginsPanel()});
   assert.equal(await page.locator('button:has-text("Editar"):disabled').count(),2,'Supplier and warehouse edit must be disabled');
   assert.equal(await page.locator('button:has-text("Desactivar"):disabled').count(),2,'Toggle actions must be disabled');
   assert.equal(await page.locator('label[for="edOriginAddress"]').count(),1,'Warehouse address must have an explicit label');
   assert.equal(await page.locator('#edOriginAddress').evaluate(el=>el.labels?.[0]?.textContent?.trim()),'Dirección de salida','Warehouse address label must be programmatically associated');
   assert.equal(await page.locator('fieldset:disabled').count(),2);
   assert.equal(await page.locator('[role="alert"]').count(),1);
   assert.equal(await page.evaluate(()=>edDeliveryQuoteStillValid(window.__snapshot)),false);
   await page.evaluate(()=>{edDeliverySupplierEdit('sup');edDeliveryOriginEdit('own')});
   assert.equal(await page.evaluate(()=>localStorage.getItem('ed_delivery_associations_quarantine_demo_v1')),'1');
   for(const zoom of [1,2]){
    await page.evaluate(z=>document.body.style.zoom=String(z),zoom);
    const overflowDetails=await page.evaluate(()=>{
     const viewport=window.innerWidth;
     const documentWidth=document.documentElement.scrollWidth;
     const offenders=[...document.querySelectorAll('body *')].map(el=>{
      const r=el.getBoundingClientRect();
      return {tag:el.tagName,id:el.id,className:String(el.className||'').slice(0,100),text:(el.textContent||'').trim().slice(0,70),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)};
     }).filter(x=>x.right>viewport+1||x.left< -1).slice(0,30);
     return {viewport,documentWidth,offenders};
    });
    await page.screenshot({path:'chromium-'+width+'-zoom-'+zoom+'-quarantine.png',fullPage:true});
    if(overflowDetails.documentWidth>overflowDetails.viewport+1){
     const diagnostic='Horizontal overflow at width '+width+' zoom '+zoom+': '+JSON.stringify(overflowDetails);
     fs.writeFileSync('ci-evidence/chromium-overflow-'+width+'-zoom-'+zoom+'.json',JSON.stringify(overflowDetails,null,2));
     assert.fail(diagnostic);
    }
   }
   await page.evaluate(()=>document.body.style.zoom='1');
   await page.keyboard.press('Tab');
   const focused=await page.evaluate(()=>document.activeElement?.textContent?.trim()||'');
   assert.match(focused,/Verificar y desbloquear/,'Keyboard focus should reach recovery control first');
   const focusStyle=await page.evaluate(()=>{
    const el=document.activeElement;
    const style=getComputedStyle(el);
    return {outlineStyle:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth),outlineColor:style.outlineColor,outlineOffset:style.outlineOffset,focusVisible:el.matches(':focus-visible')};
   });
   assert.equal(focusStyle.focusVisible,true,'Recovery control must be focus-visible with keyboard');
   assert.notEqual(focusStyle.outlineStyle,'none','Recovery control must show focus outline');
   assert.ok(focusStyle.outlineWidth>=2,'Recovery focus outline must be at least 2px');
   await page.keyboard.press('Shift+Tab');
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'','Shift+Tab must leave recovery control');
   await page.keyboard.press('Tab');
   assert.match(await page.evaluate(()=>document.activeElement?.textContent?.trim()||''),/Verificar y desbloquear/,'Tab must return to recovery control after Shift+Tab');
   await page.keyboard.press('Enter');
   assert.equal(await page.evaluate(()=>edDeliveryIsQuarantined()),false,'Keyboard recovery failed');
   assert.equal(await page.evaluate(()=>edDeliveryQuoteStillValid(window.__snapshot)),false,'Old quote was not invalidated');
   await page.evaluate(()=>{
    edDeliveryQuarantine();
    localStorage.setItem('ed_product_origins_demo_v1',JSON.stringify({product:['missing']}));
    document.querySelector('#panel').innerHTML=edDeliveryOriginsPanel();
   });
   await page.keyboard.press('Tab');
   await page.locator('button:has-text("Verificar y desbloquear")').focus();
   await page.keyboard.press('Space');
   assert.equal(await page.evaluate(()=>edDeliveryIsQuarantined()),true,'Invalid associations must remain quarantined');
   console.log('PASS Chromium width='+width+' zoom 100/200%, keyboard, quarantine and invalidation');
   await page.close();
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
