// ENLACE DIGITAL — diagnostico de transporte en preparacion.
// No expone secretos, no envia mensajes ni altera cuentas.
Deno.serve(async(req:Request)=>{
 const h={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://liuben810921.github.io","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type"};
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Metodo no permitido"}),{status:405,headers:h});
 let body:any;try{body=await req.json()}catch{return new Response(JSON.stringify({error:"Solicitud invalida"}),{status:400,headers:h})}
 if(body?.action==="smtp-probe"){
  // Only tests a TLS handshake to Gmail port 465. Never authenticates or sends mail.
  let connection:Deno.TlsConn|undefined;
  let reachable=false;
  let reason="unavailable";
  try{
   connection=await Promise.race([
    Deno.connectTls({hostname:"smtp.gmail.com",port:465}),
    new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("timeout")),5000))
   ]);
   reachable=true;reason="tls_connected";
  }catch(e){reason=e instanceof Error&&e.message==="timeout"?"timeout":"connection_failed"}
  finally{try{connection?.close()}catch{}}
  return new Response(JSON.stringify({smtp_port:465,tls_reachable:reachable,result:reason,email_sent:false,credential_present:Boolean(Deno.env.get("GMAIL_APP_PASSWORD"))}),{status:200,headers:h});
 }
 if(body?.action!=="status")return new Response(JSON.stringify({error:"Operacion no disponible"}),{status:400,headers:h});
 return new Response(JSON.stringify({stage:"preparacion",credential_present:Boolean(Deno.env.get("GMAIL_APP_PASSWORD")),smtp_verified:false,automatic_emails_enabled:false,verification_enabled:false,password_recovery_enabled:false}),{status:200,headers:h});
});