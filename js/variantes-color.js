/* ENLACE DIGITAL — lógica pura de variantes. No activa cambios en la tienda hasta integrar la interfaz. */
(function(root){
"use strict";
function variants(p){return p&&p.origen_producto!=="proveedor"&&Array.isArray(p.variantes_color)?p.variantes_color.filter(v=>v&&typeof v.id==="string"&&v.id.length>0):[];}
function variant(p,id){return variants(p).find(v=>v.id===id)||null;}
function key(productId,variantId){return String(productId)+":"+(variantId||"");}
function available(p,id,quantity,cart){
 const vv=variants(p);
 if(!Number.isInteger(quantity)||quantity<1||!p||p.disponible===false||p.archivado===true)return false;
 if(vv.length){
  const v=variant(p,id);
  if(!v||v.disponible===false)return false;
  const reserved=(cart||[]).filter(c=>c.id===p.id&&c.variantId===id).reduce((n,c)=>n+c.qty,0);
  return Number.isInteger(v.cantidad)&&v.cantidad>=quantity+reserved;
 }
 if(id)return false;
 if(p.origen_producto==="proveedor")return true;
 const reserved=(cart||[]).filter(c=>c.id===p.id&&!c.variantId).reduce((n,c)=>n+c.qty,0);
 return Number.isInteger(p.qty)&&p.qty>=quantity+reserved;
}
function add(cart,p,id,quantity){
 if(!available(p,id,quantity,cart))return {ok:false,cart};
 const next=cart.map(c=>({...c}));
 let item=next.find(c=>c.id===p.id&&(c.variantId||null)===(id||null));
 if(item)item.qty+=quantity;else next.push({id:p.id,variantId:id||null,qty:quantity});
 return {ok:true,cart:next};
}
function gallery(p,id){const v=variant(p,id);return v&&Array.isArray(v.imagenes)&&v.imagenes.length?v.imagenes.slice(0,5):Array.isArray(p.photos)?p.photos:[];}
function validate(p){const list=variants(p),seen=new Set();for(const v of list){if(seen.has(v.id)||!v.nombre||!Number.isInteger(v.cantidad)||v.cantidad<0||!Array.isArray(v.imagenes)||v.imagenes.length>5)return false;seen.add(v.id);}return true;}
root.EDColorVariants={variants,variant,key,available,add,gallery,validate};
})(typeof window!=="undefined"?window:globalThis);
