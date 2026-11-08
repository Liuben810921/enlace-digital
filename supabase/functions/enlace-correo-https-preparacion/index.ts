// ENLACE DIGITAL: transporte HTTPS preparado. Bloqueo de envios por codigo y configuracion.
// La activacion requiere una nueva revision, pruebas y autorizacion expresa.
const SEND_ENABLED_IN_CODE=false;
const ORIGIN="https://liuben810921.github.io";
const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type"};
function json(status:number,value:unknown){return new Response(JSON.stringify(value),{status,headers})}
function validEmail(value:unknown){return typeof value==="string"&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
function validLink(value:unknown){if(typeof value!=="string"||value.length>1500)return false;try{const url=new URL(value);return url.protocol==="https:"&&url.hostname==="liuben810921.github.io"&&url.pathname.startsWith("/enlace-digital/")&&url.hash.startsWith("#ed-email=")}catch{return false}}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return json(405,{error:"Metodo no permitido"});
 if(Number(req.headers.get("content-length")||0)>4096)return json(413,{error:"Solicitud demasiado grande"});
 let body:any;try{body=await req.json()}catch{return json(400,{error:"Solicitud invalida"})}
 if(body?.action==="status"){
  return json(200,{transport:"https_resend",credentials_configured:Boolean(Deno.env.get("RESEND_API_KEY"))&&Boolean(Deno.env.get("EMAIL_FROM_VERIFIED")),enabled:false,mail_sent:false});
 }
 if(body?.action!=="deliver")return json(400,{error:"Operacion no disponible"});
 // Defensa por capas: nunca llega al proveedor con el despliegue actual.
 if(!SEND_ENABLED_IN_CODE)return json(503,{error:"Envios desactivados"});
 if(Deno.env.get("EMAIL_SENDING_ENABLED")!=="true")return json(503,{error:"Envios desactivados"});
 const expected=Deno.env.get("EMAIL_INTERNAL_TOKEN")||"";
 const supplied=(req.headers.get("x-email-internal-token")||"");
 if(!expected||supplied.length!==expected.length)return json(403,{error:"No autorizado"});
 let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^supplied.charCodeAt(i);
 if(diff!==0)return json(403,{error:"No autorizado"});
 const apiKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("EMAIL_FROM_VERIFIED");
 if(!apiKey||!validEmail(from)||!validEmail(body?.to)||!validLink(body?.link)||!["verificar_correo","recuperar_clave"].includes(body?.purpose))return json(400,{error:"Configuracion o solicitud invalida"});
 const subject=body.purpose==="verificar_correo"?"Verifica tu correo - ENLACE DIGITAL":"Recupera tu acceso - ENLACE DIGITAL";
 const text="Has solicitado esta operacion en ENLACE DIGITAL. Abre el siguiente enlace seguro (caduca y es de un solo uso):\n"+body.link+"\nSi no lo solicitaste, ignora este mensaje.";
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[body.to],subject,text}),signal:controller.signal});
  return response.ok?json(200,{ok:true}):json(502,{error:"Proveedor de correo no disponible"});
 }catch{return json(502,{error:"Proveedor de correo no disponible"})}finally{clearTimeout(timeout)}
});
