// ENLACE DIGITAL — adaptador HTTPS de correo, preparado y expresamente desactivado.
// No expone credenciales, no genera tokens, no autentica clientes y no envia mensajes.
const headers={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://liuben810921.github.io","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Metodo no permitido"}),{status:405,headers});
 let body:{action?:string};try{body=await req.json()}catch{return new Response(JSON.stringify({error:"Solicitud invalida"}),{status:400,headers})}
 if(body?.action!=="status")return new Response(JSON.stringify({error:"Envios desactivados"}),{status:503,headers});
 const providerConfigured=Boolean(Deno.env.get("RESEND_API_KEY"))&&Boolean(Deno.env.get("EMAIL_FROM_VERIFIED"));
 return new Response(JSON.stringify({
  transport:"https_resend",
  credentials_configured:providerConfigured,
  enabled:false,
  mail_sent:false,
  reason:"Pendiente de dominio verificado, pruebas de integracion y autorizacion de activacion"
 }),{status:200,headers});
});
