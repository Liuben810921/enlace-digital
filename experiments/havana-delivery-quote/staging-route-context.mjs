const PENDING=reason=>({status:"PENDIENTE",reason,legs:[]});
const BOUNDS={latMin:22.7,latMax:23.3,lonMin:-83,lonMax:-81.9};
const ID=/^[A-Za-z0-9_-]{1,160}$/;
function point(lat,lon){
 return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=BOUNDS.latMin&&lat<=BOUNDS.latMax&&lon>=BOUNDS.lonMin&&lon<=BOUNDS.lonMax;
}
function entityKey(kind,id){return kind+"\u0000"+id}
export function resolveStagingRouteContext({productIds,destinationId,snapshot}={}){
 if(!Array.isArray(productIds)||productIds.length<1||productIds.length>100||
    productIds.some(x=>typeof x!=="string"||!ID.test(x))||new Set(productIds).size!==productIds.length||
    typeof destinationId!=="string"||!ID.test(destinationId))
  return PENDING("INVALID_SELECTION");
 if(!snapshot||typeof snapshot!=="object"||!Array.isArray(snapshot.entities)||!Array.isArray(snapshot.links)||
    snapshot.entities.length>5000||snapshot.links.length>10000)
  return PENDING("INVALID_STAGING_SNAPSHOT");
 const entities=new Map();
 for(const row of snapshot.entities){
  if(!row||typeof row.kind!=="string"||typeof row.id!=="string"||!ID.test(row.id)||
     !Number.isSafeInteger(row.revision)||row.revision<1||!row.payload||typeof row.payload!=="object"||Array.isArray(row.payload))
   return PENDING("INVALID_STAGING_ENTITY");
  const key=entityKey(row.kind,row.id);
  if(entities.has(key))return PENDING("DUPLICATE_STAGING_ENTITY");
  entities.set(key,row);
 }
 const links=new Set();
 for(const link of snapshot.links){
  if(!link||typeof link.source_kind!=="string"||typeof link.source_id!=="string"||
     typeof link.target_kind!=="string"||typeof link.target_id!=="string")
   return PENDING("INVALID_STAGING_LINK");
  const key=[link.source_kind,link.source_id,link.target_kind,link.target_id].join("\u0000");
  if(links.has(key))return PENDING("DUPLICATE_STAGING_LINK");
  links.add(key);
 }
 const destination=entities.get(entityKey("destination",destinationId));
 if(!destination||destination.payload.active===false||!point(destination.payload.lat,destination.payload.lng))
  return PENDING("DESTINATION_NOT_ROUTABLE");
 const legsByWarehouse=new Map();
 for(const productId of productIds){
  const association=entities.get(entityKey("product_origin",productId));
  const warehouseIds=association?.payload?.warehouseIds;
  if(!Array.isArray(warehouseIds)||warehouseIds.length<1||warehouseIds.some(id=>typeof id!=="string"||!ID.test(id))||new Set(warehouseIds).size!==warehouseIds.length)
   return PENDING("PRODUCT_ORIGINS_INVALID");
  const expectedLinks=new Set(warehouseIds);
  for(const id of warehouseIds){
   if(!links.has(["product_origin",productId,"warehouse",id].join("\u0000")))return PENDING("PRODUCT_ORIGIN_LINK_MISMATCH");
   const warehouse=entities.get(entityKey("warehouse",id));
   if(!warehouse||warehouse.payload.active!==true||!["propio","proveedor"].includes(warehouse.payload.type))
    return PENDING("WAREHOUSE_NOT_ACTIVE");
   if(warehouse.payload.type==="proveedor"){
    const supplierId=warehouse.payload.supplierId;
    const supplier=typeof supplierId==="string"?entities.get(entityKey("supplier",supplierId)):null;
    if(!supplier||supplier.payload.active!==true||!links.has(["warehouse",id,"supplier",supplierId].join("\u0000")))
     return PENDING("SUPPLIER_NOT_ACTIVE_OR_LINKED");
   }else if(warehouse.payload.supplierId!=null||links.has(["warehouse",id,"supplier",String(warehouse.payload.supplierId)].join("\u0000"))){
    return PENDING("OWN_WAREHOUSE_HAS_SUPPLIER");
   }
   if(!point(warehouse.payload.lat,warehouse.payload.lng))return PENDING("WAREHOUSE_COORDINATES_INVALID");
   const leg=legsByWarehouse.get(id)||{originId:id,lat:warehouse.payload.lat,lon:warehouse.payload.lng,productIds:[]};
   leg.productIds.push(productId);legsByWarehouse.set(id,leg);
  }
  const linkedIds=[...links].filter(key=>key.startsWith(["product_origin",productId,"warehouse"].join("\u0000")+"\u0000")).map(key=>key.split("\u0000")[3]);
  if(linkedIds.length!==expectedLinks.size||linkedIds.some(id=>!expectedLinks.has(id)))return PENDING("PRODUCT_ORIGIN_LINK_MISMATCH");
 }
 return {status:"CONTEXTO_LISTO",destination:{id:destinationId,lat:destination.payload.lat,lon:destination.payload.lng},legs:[...legsByWarehouse.values()].sort((a,b)=>a.originId.localeCompare(b.originId))};
}
