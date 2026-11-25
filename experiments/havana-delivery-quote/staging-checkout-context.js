(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.EDStagingCheckoutContext=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const fail=reason=>({ok:false,reason});
 function build({entities,links,products,inventorySnapshot,baseRevision}={}){
  if(!Array.isArray(entities)||!Array.isArray(links)||!Array.isArray(products))return fail('STAGING_CONTEXT_SHAPE_INVALID');
  if(!Number.isSafeInteger(baseRevision)||baseRevision<0)return fail('LOCAL_INVENTORY_REVISION_INVALID');
  let inventory;
  try{inventory=JSON.parse(inventorySnapshot||'null')}catch(e){return fail('LOCAL_INVENTORY_UNREADABLE')}
  if(!inventory||!Array.isArray(inventory.products)||JSON.stringify(inventory.products)!==JSON.stringify(products))return fail('LOCAL_INVENTORY_MISMATCH');
  const table=new Map();
  for(const row of entities){
   if(!row||typeof row.kind!=='string'||typeof row.id!=='string'||!row.id||!row.payload||typeof row.payload!=='object'||Array.isArray(row.payload)||!Number.isSafeInteger(row.revision)||row.revision<1)return fail('STAGING_ENTITY_INVALID');
   const key=row.kind+':'+row.id;
   if(table.has(key))return fail('STAGING_ENTITY_DUPLICATE');
   table.set(key,row);
  }
  const get=(kind,id)=>table.get(kind+':'+id);
  const relations=(kind,id,targetKind)=>links.filter(x=>x&&x.source_kind===kind&&x.source_id===id&&(!targetKind||x.target_kind===targetKind));
  for(const link of links){
   if(!link||typeof link.source_kind!=='string'||typeof link.source_id!=='string'||typeof link.target_kind!=='string'||typeof link.target_id!=='string'||!get(link.source_kind,link.source_id)||!get(link.target_kind,link.target_id))return fail('STAGING_LINK_INVALID');
  }
  const suppliers=[];
  for(const row of table.values())if(row.kind==='supplier'){
   if(typeof row.payload.name!=='string'||!row.payload.name)return fail('STAGING_SUPPLIER_INVALID');
   suppliers.push({...row.payload,id:row.id});
  }
  const origins=[];
  for(const row of table.values())if(row.kind==='warehouse'){
   const p=row.payload;
   if(typeof p.name!=='string'||!p.name||!['propio','proveedor'].includes(p.type)||typeof p.municipality!=='string'||typeof p.address!=='string')return fail('STAGING_WAREHOUSE_INVALID');
   const supplierLinks=relations('warehouse',row.id,'supplier');
   if(p.type==='proveedor'){
    if(typeof p.supplierId!=='string'||supplierLinks.length!==1||supplierLinks[0].target_id!==p.supplierId||!get('supplier',p.supplierId))return fail('STAGING_WAREHOUSE_SUPPLIER_LINK_MISMATCH');
   }else if(p.supplierId!=null||supplierLinks.length)return fail('STAGING_OWN_WAREHOUSE_LINK_MISMATCH');
   origins.push({...p,id:row.id});
  }
  const associations={};
  for(const row of table.values())if(row.kind==='product_origin'){
   const ids=row.payload.warehouseIds;
   if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)return fail('STAGING_ASSOCIATION_INVALID');
   const actual=relations('product_origin',row.id,'warehouse').map(x=>x.target_id).sort();
   if(actual.length!==ids.length||JSON.stringify(actual)!==JSON.stringify([...ids].sort()))return fail('STAGING_ASSOCIATION_LINK_MISMATCH');
   if(ids.some(id=>!get('warehouse',id)))return fail('STAGING_ASSOCIATION_WAREHOUSE_MISSING');
   associations[row.id]=ids.slice();
  }
  const destinations=[];
  for(const row of table.values())if(row.kind==='destination'){
   const p=row.payload;
   if(typeof p.name!=='string'||!p.name||typeof p.municipality!=='string'||typeof p.address!=='string')return fail('STAGING_DESTINATION_INVALID');
   destinations.push({...p,id:row.id});
  }
  const normalizedEntities=[...table.values()].map(x=>({kind:x.kind,id:x.id,payload:x.payload,revision:x.revision})).sort((a,b)=>(a.kind+':'+a.id).localeCompare(b.kind+':'+b.id));
  const normalizedLinks=links.map(x=>({source_kind:x.source_kind,source_id:x.source_id,target_kind:x.target_kind,target_id:x.target_id})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {ok:true,snapshot:{source:'supabase-staging',inventory:inventorySnapshot,associations:JSON.stringify(associations),origins:JSON.stringify(origins),suppliers:JSON.stringify(suppliers),destinations:JSON.stringify(destinations),revision:baseRevision,remoteRevision:JSON.stringify({entities:normalizedEntities,links:normalizedLinks})}};
 }
 return Object.freeze({build});
});
