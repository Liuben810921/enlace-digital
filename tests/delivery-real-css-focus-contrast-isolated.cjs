'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const html=fs.readFileSync('index.html','utf8');
const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]);
assert.ok(styles.length>=1,'No real CSS styles found');
const rgb=s=>{const m=s.match(/^rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);assert.ok(m,'Unsupported CSS color: '+s);return [Number(m[1]),Number(m[2]),Number(m[3])]};
const luminance=c=>c.map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);
const contrast=(a,b)=>{const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results=[];
 try{
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:850}});
   const fixture='<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+styles.map(s=>'<style>'+s+'</style>').join('')+'</head><body><main class="wrap"><section class="panel"><button class="primary" type="button">Acción principal</button> <button class="secondary" type="button">Acción secundaria</button> <button class="headbtn" type="button" style="background:#071f38">Mi cuenta</button></section></main></body></html>';
   await page.route('http://ed-css.local/**',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
   await page.goto('http://ed-css.local/');
   for(const selector of ['.primary','.secondary','.headbtn']){
    const button=page.locator('button'+selector);
    const normal=await button.evaluate(el=>{const s=getComputedStyle(el);return {fg:s.color,bg:s.backgroundColor}});
    const ratio=contrast(normal.fg,normal.bg);
    const record={width,selector,normal,ratio:Number(ratio.toFixed(2))};
    results.push(record);
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const focus=await button.evaluate(el=>{const s=getComputedStyle(el);return {active:document.activeElement===el,visible:el.matches(':focus-visible'),outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth,outlineColor:s.outlineColor}});
    record.focus=focus;
    await page.screenshot({path:'ci-evidence/real-css-'+width+'-'+selector.slice(1)+'-focus.png'});
   }
   await page.close();
  }
 }finally{await browser.close()}
 fs.mkdirSync('ci-evidence',{recursive:true});
 fs.writeFileSync('ci-evidence/real-css-focus-contrast.json',JSON.stringify(results,null,2));
 for(const r of results){
  assert.ok(r.ratio>=4.5,'Text contrast below 4.5:1: '+JSON.stringify(r));
  assert.ok(r.focus.active&&r.focus.visible,'Keyboard focus not visible: '+JSON.stringify(r));
  assert.notEqual(r.focus.outlineStyle,'none','No focus outline: '+JSON.stringify(r));
  assert.ok(parseFloat(r.focus.outlineWidth)>=2,'Focus outline below 2px: '+JSON.stringify(r));
 }
 console.log('PASS real CSS text contrast and keyboard focus on 320/375/430px');
})().catch(e=>{console.error(e);process.exitCode=1});
