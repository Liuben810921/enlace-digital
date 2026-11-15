'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-background-networking']});
 const fixture='file://'+path.resolve('tests/fixtures/delivery-mobile-real-functions.html');
 const output='tests/artifacts/delivery-mobile-visual';
 fs.mkdirSync(output,{recursive:true});
 try{
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:860},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(fixture,{waitUntil:'load'});
   assert.deepEqual(errors,[],width+' browser script errors');
   assert.match(await page.locator('#deliveryPanel').innerText(),/Proveedor ficticio/);
   assert.match(await page.locator('#edNewProductOrigins').innerText(),/Almacén proveedor ficticio/);
   assert.equal(await page.locator('#edNewProductOrigins .ed-product-origin').count(),1);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(overflow,false,width+' horizontal overflow before quarantine');
   await page.screenshot({path:path.join(output,'delivery-'+width+'-normal.png'),fullPage:true});
   await page.evaluate(()=>window.demoQuarantine());
   assert.equal(await page.locator('#edNewProductOrigins [role="alert"]').count(),1);
   assert.equal(await page.locator('#edNewProductOrigins input[type="checkbox"]').count(),0);
   assert.match(await page.locator('#deliveryPanel').innerText(),/Verificar y desbloquear/);
   assert.match(await page.locator('#quoteStatus').innerText(),/invalidada/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,width+' horizontal overflow in quarantine');
   assert.equal(await page.locator('#deliveryPanel fieldset:disabled').count(),2,'both supplier and warehouse forms must be disabled');
   assert.equal(await page.locator('#deliveryPanel #edSupplierName').isDisabled(),true);
   assert.equal(await page.locator('#deliveryPanel #edOriginName').isDisabled(),true);
   assert.equal(await page.locator('#deliveryPanel button[onclick^="edDeliveryOriginEdit"]').first().isDisabled(),true);
   await page.keyboard.press('Tab');
   assert.notEqual(await page.evaluate(()=>document.activeElement?.id),'edOriginName','keyboard focus must skip disabled warehouse field');
   await page.screenshot({path:path.join(output,'delivery-'+width+'-quarantine.png'),fullPage:true});
   assert.equal(await page.evaluate(()=>window.demoRecover()),true);
   assert.equal(await page.locator('#edNewProductOrigins input[type="checkbox"]').count(),1);
   assert.match(await page.locator('#quoteStatus').innerText(),/invalidada/);
   await page.screenshot({path:path.join(output,'delivery-'+width+'-recovered.png'),fullPage:true});
   // Zoom 200%: effective layout width remains the target mobile CSS width.
   await page.setViewportSize({width:width*2,height:860});
   await page.evaluate(()=>{document.body.style.zoom='2'});
   const zoomOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(zoomOverflow,false,width+' horizontal overflow at 200% zoom');
   assert.equal(await page.locator('#deliveryPanel #edSupplierName').isDisabled(),false,'recovery must restore supplier form');
   assert.equal(await page.locator('#deliveryPanel #edOriginName').isDisabled(),false,'recovery must restore warehouse form');
   await page.evaluate(()=>window.demoQuarantine());
   assert.equal(await page.locator('#deliveryPanel #edSupplierName').isDisabled(),true,'zoomed quarantine must block supplier form');
   assert.equal(await page.locator('#deliveryPanel #edOriginName').isDisabled(),true,'zoomed quarantine must block warehouse form');
   await page.locator('#deliveryPanel button').first().focus();
   const tabSequence=[];
   for(let k=0;k<12;k++){await page.keyboard.press('Tab');tabSequence.push(await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,disabled:!!document.activeElement?.disabled})))}
   assert(tabSequence.every(x=>!x.disabled),'keyboard Tab must never focus disabled control');
   assert(tabSequence.every(x=>x.id!=='edSupplierName'&&x.id!=='edOriginName'),'keyboard skips quarantined forms');
   assert.equal(await page.locator('#deliveryPanel [role="alert"]').count(),1,'quarantine warning has alert semantics');
   await page.screenshot({path:path.join(output,'delivery-'+width+'-zoom200-quarantine.png'),fullPage:true});
   assert.equal(await page.evaluate(()=>window.demoRecover()),true);
   await page.screenshot({path:path.join(output,'delivery-'+width+'-zoom200-recovered.png'),fullPage:true});

   await page.close();
   console.log('PASS Chromium '+width+'px: supplier, effective warehouse, association, quarantine, quote invalidation, recovery, screenshots');
  }
  // Dedicated offline SVG fixture: one interaction sequence, not a duplicate of 3-width delivery suite.
  {
   const page=await browser.newPage({viewport:{width:375,height:860},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('file://'+path.resolve('tests/fixtures/delivery-warehouse-mobile-demo.html'),{waitUntil:'load'});
   assert.deepEqual(errors,[],'SVG fixture initial script errors');
   const route=page.locator('#roadMapPlaceholder path');
   assert.equal(await route.count(),0,'no line before synthetic authorization');
   assert.equal(await page.locator('#mapSyntheticRoute').isDisabled(),true);
   await page.locator('#mapOrigin').selectOption('public_a');
   await page.locator('#mapDestination').selectOption('public_b');
   assert.equal(await page.locator('#mapSyntheticRoute').isEnabled(),true);
   await page.locator('#mapSyntheticRoute').focus();
   await page.keyboard.press('Enter');
   assert.equal(await route.count(),1,'synthetic route drawn only after explicit activation');
   assert.match(await page.locator('#mapSelectionStatus').innerText(),/SINTÉTICA/);
   assert.match(await page.locator('#deliveryPreview').innerText(),/Tarifa pendiente de confirmar/);
   assert.equal(await page.locator('#roadMapPlaceholder').getAttribute('role'),'img');
   assert.match(await page.locator('#roadMapPlaceholder').getAttribute('aria-label'),/Sin mapa vial/);
   await page.screenshot({path:path.join(output,'delivery-svg-synthetic-375.png'),fullPage:true});
   await page.locator('#mapDestination').selectOption('public_c');
   assert.equal(await route.count(),0,'selection change clears synthetic geometry');
   assert.equal(await page.locator('#mapSyntheticRoute').isDisabled(),true);
   await page.locator('#mapReset').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#mapOrigin').inputValue(),'');
   assert.equal(await page.locator('#mapDestination').inputValue(),'');
   const marker=page.locator('#roadMapPlaceholder circle').first();
   await marker.focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#mapOrigin').inputValue(),'public_a','SVG point keyboard Enter selects origin');
   await page.locator('#roadMapPlaceholder circle').nth(1).focus();await page.keyboard.press('Space');
   assert.equal(await page.locator('#mapDestination').inputValue(),'public_b','SVG point keyboard Space selects destination');
   await page.setViewportSize({width:750,height:860});
   await page.evaluate(()=>{document.body.style.zoom='2'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,'SVG at 200% zoom has no horizontal overflow');
   await page.locator('#mapSyntheticRoute').focus();await page.keyboard.press('Enter');
   assert.equal(await route.count(),1,'keyboard activation still works at zoom 200%');
   assert.match(await page.locator('#deliveryPreview').innerText(),/Tarifa pendiente de confirmar/);
   await page.screenshot({path:path.join(output,'delivery-svg-synthetic-zoom200.png'),fullPage:true});
   assert.deepEqual(errors,[],'SVG fixture no browser errors');
   await page.close();
   console.log('PASS Chromium isolated SVG: select, keyboard, clear, synthetic route, accessible status, zoom 200%, pending tariff');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
