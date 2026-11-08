import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
const db=createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",{auth:{persistSession:false,autoRefreshToken:false}});
const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://liuben810921.github.io","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type,apikey,authorization"};
const respond=(code:number,body:unknown)=>new Response(JSON.stringify(body),{status:code,headers});
async function digest(s:string){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,"0")).join("")}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return respond(405,{error:"Metodo no permitido"});
 if(Number(req.headers.get("content-length")||0)>4096)return respond(413,{error:"Solicitud demasiado grande"});
 let body:any;try{body=await req.json()}catch{return respond(400,{error:"Solicitud invalida"})}
 const action=String(body?.action||"");
 if(action==="status")return respond(200,{available:false,message:"La verificacion y recuperacion por correo estan en preparacion."});
 if(action==="request"){
  // Fail closed until a verified email transport is configured.
  // Do not issue tokens that cannot be delivered securely.
  return respond(503,{error:"La recuperacion por correo aun no esta habilitada."});
 }
 if(action!=="consume")return respond(400,{error:"Operacion no disponible"});
 const purpose=String(body?.purpose||""),token=String(body?.token||""),password=String(body?.password||"");
 if(!["verificar_correo","recuperar_clave"].includes(purpose)||!/^[0-9a-f]{64}$/i.test(token)||(purpose==="recuperar_clave"&&(password.length<8||password.length>128)))return respond(400,{error:"Enlace invalido o caducado"});
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").trim().slice(0,80);
 const identity=await digest(ip);
 const {data:allowed,error:rateError}=await db.rpc("ed_cliente_limite_privado",{p_clave:"correo-consumo:"+identity,p_max:10,p_ventana_seg:900});
 if(rateError||allowed!==true)return respond(429,{error:"Demasiados intentos. Intenta mas tarde."});
 // La funcion SQL privada verifica los tres interruptores de seguridad y rechaza cuando estan desactivados.
 const {data,error}=await db.rpc("ed_correo_consumir_token_servicio",{p_token_hash:await digest(token.toLowerCase()),p_proposito:purpose,p_password_nueva:purpose==="recuperar_clave"?password:null});
 if(error){console.error("Email token consume error",error.code);return respond(503,{error:"Servicio temporalmente no disponible"})}
 return data===true?respond(200,{ok:true}):respond(400,{error:"Enlace invalido o caducado"});
});