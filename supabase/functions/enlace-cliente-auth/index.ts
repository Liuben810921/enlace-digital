import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
const url=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://liuben810921.github.io","Access-Control-Allow-Headers":"content-type,apikey,authorization","Access-Control-Allow-Methods":"POST,OPTIONS"};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
async function sha(s:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")}
function havanaCoordinates(value:any){if(value==null)return null;const lat=Number(value.lat),lon=Number(value.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<22.7||lat>23.3||lon< -83||lon> -81.9)return undefined;return {lat,lon}}
async function saveAddressCoordinates(customer:any,address:any,coordinates:any,name:string,phone:string){
 if(!coordinates)return null;
 const query=db.from("clientes_direcciones_entrega").select("id").eq("cliente_numero",customer.numero).eq("provincia",address.province).eq("municipio",address.municipality).eq("barrio",address.neighborhood).eq("direccion",address.street).limit(1).maybeSingle();
 const {data:found,error:lookupError}=await query;if(lookupError)return false;
 const row={nombre_receptor:name,telefono_receptor:phone,latitud:coordinates.lat,longitud:coordinates.lon};
 if(found){const {error}=await db.from("clientes_direcciones_entrega").update(row).eq("id",found.id).eq("cliente_numero",customer.numero);return !error}
 const {error}=await db.from("clientes_direcciones_entrega").insert({cliente_numero:customer.numero,nombre_receptor:name,telefono_receptor:phone,provincia:address.province,municipio:address.municipality,barrio:address.neighborhood,direccion:address.street,referencias:"",latitud:coordinates.lat,longitud:coordinates.lon});
 return !error;
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply(405,{error:"Metodo no permitido"});
 if((req.headers.get("content-length")||"0") && Number(req.headers.get("content-length"))>4096)return reply(413,{error:"Solicitud demasiado grande"});
 let body:any;try{body=await req.json()}catch{return reply(400,{error:"Solicitud invalida"})}
 const action=String(body?.action||"");
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").trim().slice(0,80);
 const identity=await sha(ip);
 const limit=async(k:string,max:number,secs:number)=>{const {data,error}=await db.rpc("ed_cliente_limite_privado",{p_clave:k,p_max:max,p_ventana_seg:secs});return !error&&data===true};
 if(action==="register"){
  if(!(await limit("reg-ip:"+identity,3,3600)))return reply(429,{error:"Demasiados intentos. Intenta mas tarde."});
  const name=String(body?.name||"").trim(),phone=String(body?.phone||"").trim(),password=String(body?.password||""),email=String(body?.email||"").trim();
  if(name.length>150||name.split(/\s+/).length<2||!/^\+[1-9][0-9]{7,14}$/.test(phone)||password.length<8||password.length>128||email.length>254||(email&&!/^[^ @]+@[^ @]+\.[^ @]+$/.test(email)))return reply(400,{error:"Revisa los datos del registro"});
  if(!(await limit("reg-phone:"+await sha(phone),3,86400)))return reply(429,{error:"Demasiados intentos. Intenta mas tarde."});
  const residence=String(body?.residence||"");
  const address=body?.address||{};
  const province=String(address.province||"").trim(),municipality=String(address.municipality||"").trim(),neighborhood=String(address.neighborhood||"").trim(),street=String(address.street||"").trim();
  const coordinates=address.coordinates==null?null:havanaCoordinates(address.coordinates);
  if(coordinates===undefined)return reply(400,{error:"Las coordenadas deben señalar una ubicación válida de La Habana."});
  if(!["cuba","extranjero"].includes(residence)||(residence==="cuba"&&(province.length<2||municipality.length<2||street.length<8))||province.length>100||municipality.length>100||neighborhood.length>150||street.length>500)return reply(400,{error:"Selecciona tu residencia y completa la direccion habitual si resides en Cuba."});
  const {data,error}=await db.rpc("ed_cliente_registrar_residencia_privado",{p_nombre:name,p_telefono:phone,p_password:password,p_correo:email||null,p_residencia:residence,p_provincia:province,p_municipio:municipality,p_barrio:neighborhood,p_direccion:street});
  if(error){if(error.message?.includes("Telefono ya registrado")||error.code==="23505")return reply(409,{error:"Este telefono ya esta registrado. Si es tu cuenta, inicia sesion."});console.error("Registration error",error.code);return reply(400,{error:"No se pudo completar el registro. Comprueba tus datos."})}
  const coordinatesSaved=coordinates?await saveAddressCoordinates(data,{province,municipality,neighborhood,street},coordinates,name,phone):null;
  return reply(201,{cliente:data,coordinates_saved:coordinates?coordinatesSaved===true:null,notice:"Cuenta creada. El correo de recuperacion requiere verificacion antes de habilitarse."});
 }

 if(action==="login"){
  const phone=String(body?.phone||"").trim(),password=String(body?.password||"");
  if(!/^\+[1-9][0-9]{7,14}$/.test(phone)||!password||password.length>128)return reply(400,{error:"Datos invalidos"});
  if(!(await limit("login-ip:"+identity,20,900))||!(await limit("login-phone:"+await sha(phone),10,900)))return reply(429,{error:"Demasiados intentos. Intenta mas tarde."});
  const bytes=crypto.getRandomValues(new Uint8Array(32));const token=Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");
  const {data,error}=await db.rpc("ed_cliente_login_privado",{p_telefono:phone,p_password:password,p_token_hash:await sha(token)});
  if(error){console.error("Login backend error",error.code);return reply(500,{error:"No se pudo iniciar sesion"})}
  if(!data)return reply(401,{error:"Telefono o contrasena incorrectos, o acceso temporalmente bloqueado"});
  return reply(200,{cliente:data,token,expires_in:2592000});
 }
 if(action==="address-save"){
  const token=String(body?.token||"");
  if(!/^[0-9a-f]{64}$/.test(token))return reply(401,{error:"Sesion invalida"});
  const {data:customer,error:authError}=await db.rpc("ed_cliente_sesion_privada",{p_token_hash:await sha(token),p_revocar:false});
  if(authError||!customer?.numero)return reply(401,{error:"Sesion caducada"});
  const a=body?.address||{};
  const province=String(a.province||"").trim(),municipality=String(a.municipality||"").trim(),neighborhood=String(a.neighborhood||"").trim(),street=String(a.street||"").trim();
  const coordinates=a.coordinates==null?null:havanaCoordinates(a.coordinates);
  if(coordinates===undefined)return reply(400,{error:"Las coordenadas deben señalar una ubicación válida de La Habana."});
  if(province.length<2||municipality.length<2||street.length<8||province.length>100||municipality.length>100||neighborhood.length>150||street.length>500)return reply(400,{error:"Completa una direccion habitual valida."});
  const {data,error}=await db.rpc("ed_cliente_direccion_privada",{p_token_hash:await sha(token),p_provincia:province,p_municipio:municipality,p_barrio:neighborhood,p_direccion:street});
  if(error||!data)return reply(500,{error:"No se pudo guardar la direccion habitual."});
  const coordinatesSaved=coordinates?await saveAddressCoordinates(customer,{province,municipality,neighborhood,street},coordinates,String(customer.nombre||""),String(customer.telefono||"")):null;
  return reply(200,{saved:true,coordinates_saved:coordinates?coordinatesSaved===true:null});
 }
 if(action==="delivery-location-save"){
  const token=String(body?.token||"");
  if(!/^[0-9a-f]{64}$/.test(token))return reply(401,{error:"Sesion invalida"});
  const {data:customer,error:authError}=await db.rpc("ed_cliente_sesion_privada",{p_token_hash:await sha(token),p_revocar:false});
  if(authError||!customer?.numero)return reply(401,{error:"Sesion caducada"});
  if(!(await limit("location:"+customer.numero,30,3600)))return reply(429,{error:"Demasiados intentos"});
  const a=body?.location||{};
  const name=String(a.name||"").trim(),phone=String(a.phone||"").trim(),province=String(a.province||"").trim(),municipality=String(a.municipality||"").trim(),neighborhood=String(a.neighborhood||"").trim(),address=String(a.address||"").trim(),references=String(a.references||"").trim();
  const coordinates=a.coordinates==null?null:havanaCoordinates(a.coordinates);
  if(coordinates===undefined)return reply(400,{error:"Las coordenadas deben señalar una ubicación válida de La Habana."});
  if(name.length<2||name.length>150||!/^(?:\\+53)?[0-9]{8}$/.test(phone)||province.length<2||province.length>100||municipality.length<2||municipality.length>100||neighborhood.length>150||address.length<8||address.length>500||references.length>500)return reply(400,{error:"Revisa los datos de la direccion ocasional"});
  const base=db.from("clientes_direcciones_entrega");
  const {data:found,error:lookupError}=await base.select("id").eq("cliente_numero",customer.numero).eq("provincia",province).eq("municipio",municipality).eq("barrio",neighborhood).eq("direccion",address).limit(1).maybeSingle();
  if(lookupError)return reply(500,{error:"No se pudo consultar la direccion"});
  if(found){
   const updates={nombre_receptor:name,telefono_receptor:phone,referencias:references,usado_en:new Date().toISOString(),...(coordinates?{latitud:coordinates.lat,longitud:coordinates.lon}:{})};
   const {error}=await db.from("clientes_direcciones_entrega").update(updates).eq("id",found.id).eq("cliente_numero",customer.numero);
   if(error)return reply(500,{error:"No se pudo actualizar la direccion"});
   return reply(200,{id:found.id,reused:true});
  }
  const {data:saved,error}=await db.from("clientes_direcciones_entrega").insert({cliente_numero:customer.numero,nombre_receptor:name,telefono_receptor:phone,provincia:province,municipio:municipality,barrio:neighborhood,direccion:address,referencias:references,...(coordinates?{latitud:coordinates.lat,longitud:coordinates.lon}:{})}).select("id").single();
  if(error)return reply(500,{error:"No se pudo guardar la direccion"});
  return reply(201,{id:saved.id,reused:false});
 }
 if(action==="recipient-save"){
  const token=String(body?.token||"");
  if(!/^[0-9a-f]{64}$/.test(token))return reply(401,{error:"Sesion invalida"});
  const {data:customer,error:authError}=await db.rpc("ed_cliente_sesion_privada",{p_token_hash:await sha(token),p_revocar:false});
  if(authError||!customer?.numero)return reply(401,{error:"Sesion caducada"});
  const r=body?.recipient||{};
  const name=String(r.name||"").trim(),phone=String(r.phone||"").trim(),province=String(r.province||"").trim(),municipality=String(r.municipality||"").trim(),neighborhood=String(r.neighborhood||"").trim(),address=String(r.address||"").trim(),references=String(r.references||"").trim();
  if(name.length<2||name.length>150||!/^(?:\+53)?[0-9]{8}$/.test(phone)||province.length<2||province.length>100||municipality.length<2||municipality.length>100||address.length<8||address.length>500||neighborhood.length>150||references.length>500)return reply(400,{error:"Revisa el destinatario y la direccion"});
  const id=body?.id==null?null:Number(body.id);
  if(id!==null&&(!Number.isSafeInteger(id)||id<=0))return reply(400,{error:"Destinatario invalido"});
  const record={nombre:name,telefono:phone,provincia:province,municipio:municipality,barrio:neighborhood,direccion:address,referencias:references};
  if(id!==null){
   const {data,error}=await db.from("clientes_destinatarios").update(record).eq("id",id).eq("cliente_numero",customer.numero).select("id").maybeSingle();
   if(error)return reply(500,{error:"No se pudo actualizar el destinatario"});
   if(!data)return reply(404,{error:"Destinatario no encontrado"});
   return reply(200,{id:data.id});
  }
  const {data,error}=await db.from("clientes_destinatarios").insert({...record,cliente_numero:customer.numero}).select("id").single();
  if(error)return reply(500,{error:"No se pudo guardar el destinatario"});
  return reply(201,{id:data.id});
 }
 if(action==="session"||action==="logout"||action==="profile"){
  const token=String(body?.token||"");
  if(!/^[0-9a-f]{64}$/.test(token))return reply(401,{error:"Sesion invalida"});
  const {data,error}=await db.rpc("ed_cliente_sesion_privada",{p_token_hash:await sha(token),p_revocar:action==="logout"});
  if(error)return reply(500,{error:"No se pudo verificar la sesion"});
  if(!data)return reply(401,{error:"Sesion caducada"});
  if(action==="profile"){
   const {data:recipients,error:recError}=await db.from("clientes_destinatarios").select("id,nombre,telefono,provincia,municipio,barrio,direccion,referencias").eq("cliente_numero",data.numero).order("creado_en",{ascending:false}).limit(100);
   if(recError)return reply(500,{error:"No se pudo consultar los destinatarios"});
   const {data:locations,error:locError}=await db.from("clientes_direcciones_entrega").select("id,nombre_receptor,telefono_receptor,provincia,municipio,barrio,direccion,referencias,latitud,longitud,distancia_km,punto_salida_id,ruta_version,calculado_en").eq("cliente_numero",data.numero).order("usado_en",{ascending:false}).limit(50);
   if(locError)return reply(500,{error:"No se pudieron consultar las direcciones"});
   return reply(200,{cliente:data,destinatarios:recipients||[],direcciones_entrega:locations||[]});
  }
  return reply(200,{cliente:data});
 }
 return reply(400,{error:"Operacion no disponible"});
});