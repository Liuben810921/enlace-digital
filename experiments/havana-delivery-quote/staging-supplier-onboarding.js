(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.EDStagingSupplierOnboarding=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function build({supplierId,name,warehouses=[]}={}){
  if(typeof supplierId!=='string'||!/^supplier-[0-9a-f-]{36}$/i.test(supplierId))throw Error('ID de proveedor inválido');
  if(typeof name!=='string'||!name.trim()||name.trim().length>120)throw Error('Nombre de proveedor inválido');
  if(!Array.isArray(warehouses)||warehouses.length>10)throw Error('Lista de almacenes inválida');
  const changes=[{kind:'supplier',id:supplierId,create:true,payload:{name:name.trim(),active:true},links:[]}];
  const nonempty=warehouses.filter(w=>[w?.name,w?.municipality,w?.address].some(v=>typeof v==='string'&&v.trim()));
  const ids=new Set();
  for(let i=0;i<nonempty.length;i++){
   const w=nonempty[i];
   if(typeof w.name!=='string'||!w.name.trim()||w.name.trim().length>120||typeof w.municipality!=='string'||!w.municipality.trim()||typeof w.address!=='string'||!w.address.trim()||w.address.trim().length>300)throw Error('Completa nombre, municipio y dirección de cada almacén');
   if(typeof w.id!=='string'||!/^warehouse-[0-9a-f-]{36}$/i.test(w.id)||ids.has(w.id))throw Error('ID de almacén inválido o repetido');
   ids.add(w.id);
   changes.push({kind:'warehouse',id:w.id,create:true,payload:{name:w.name.trim(),type:'proveedor',municipality:w.municipality.trim(),address:w.address.trim(),supplierId,lat:null,lng:null,active:true,defaultForSupplier:i===0},links:[{target_kind:'supplier',target_id:supplierId}]});
  }
  return changes;
 }
 return Object.freeze({build});
});
