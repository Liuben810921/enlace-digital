#!/usr/bin/env python3
"""Offline-only browser fixture generated from actual index.html delivery functions."""
from pathlib import Path
import re
html=Path('index.html').read_text()
scripts=re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',html,flags=re.I)
src='\n'.join(scripts)
start=src.index('const ED_DELIVERY_ORIGINS_KEY=')
end=src.index('function deliveryBarrios(){',start)
delivery=src[start:end]
out=Path('tests/fixtures/delivery-mobile-real-functions.html')
page='''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ENLACE DIGITAL - funciones reales de entregas - laboratorio sin red</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:12px;font:15px system-ui;background:#091d30;color:#f3f7fc}
main{max-width:560px;margin:auto}h1{font-size:21px}h3,h4{font-size:17px}
.panel{border:1px solid #53718c;border-radius:12px;padding:12px;margin:12px 0;background:#102d45}
.note{color:#c4d4e0}button,input,select{font:inherit;max-width:100%;min-height:44px}
button{border:1px solid #80b3d0;background:#154e70;color:white;border-radius:7px;padding:8px;margin:4px}
input,select{background:#0b2339;color:white;border:1px solid #80b3d0;padding:7px}
.field{margin:10px 0}label{display:block}strong{overflow-wrap:anywhere}
</style></head><body><main><h1>Administración de entregas · Prueba aislada</h1>
<p class="note">Funciones de index.html; solo datos ficticios, sin servicios externos.</p>
<div id="deliveryPanel"></div><h3>Asociaciones de producto</h3>
<select id="porigin"><option value="proveedor">Proveedor</option><option value="propio">Propio</option></select>
<div id="edNewProductOrigins"></div>
<output id="quoteStatus"></output></main><script>
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const municipios=['Playa'];function adminTab(){renderTest()}
function renderTest(){document.getElementById('deliveryPanel').innerHTML=edDeliveryOriginsPanel();edProductOriginsRender('new','demo');document.getElementById('quoteStatus').textContent=edDeliveryQuoteStillValid(window.originalQuote)?'Cotización anterior vigente':'Cotización anterior invalidada'}
</script><script>'''+delivery+'''</script><script>
localStorage.clear();
localStorage.setItem(ED_DELIVERY_SUPPLIERS_KEY,JSON.stringify([{id:'sup',name:'Proveedor ficticio',active:true}]));
localStorage.setItem(ED_DELIVERY_ORIGINS_KEY,JSON.stringify([{id:'own',name:'Almacén propio ficticio',municipality:'Playa',type:'propio',active:true},{id:'vendor',name:'Almacén proveedor ficticio',municipality:'Playa',type:'proveedor',supplierId:'sup',active:true}]));
localStorage.setItem(ED_PRODUCT_ORIGINS_KEY,JSON.stringify({demo:['vendor']}));
window.originalQuote=edDeliveryQuoteSnapshot();
renderTest();
window.demoQuarantine=()=>{edDeliveryQuarantine();renderTest()};
window.demoRecover=()=>{const ok=edDeliveryRecoverQuarantine();renderTest();return ok};
</script></body></html>'''
out.write_text(page)
print(out)
