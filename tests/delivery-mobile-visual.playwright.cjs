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
   await page.close();
   console.log('PASS Chromium '+width+'px: supplier, effective warehouse, association, quarantine, quote invalidation, recovery, screenshots');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
