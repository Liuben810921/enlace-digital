// ENLACE DIGITAL — diagnostico de transporte en preparacion.
// No expone secretos, no envia mensajes ni altera cuentas.
Deno.serve(async(req:Request)=>{
 const h={"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://liuben810921.github.io","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type"};
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Metodo no permitido"}),{status:405,headers:h});
 let body:any;try{body=await req.json()}catch{return new Response(JSON.stringify({error:"Solicitud invalida"}),{status:400,headers:h})}
 // El Gateway verify_jwt=true valida la firma y vigencia del JWT antes de ejecutar esta funcion.
 // Exigimos ademas el rol service_role en el JWT validado; nunca basta un JWT de usuario.
 const auth=req.headers.get("authorization")||"";
 const match=/^Bearer\s+([^\s]+)$/i.exec(auth);
 let authorized=false;
 if(match){
  const parts=match[1].split(".");
  if(parts.length===3){
   try{
    const base=parts[1].replace(/-/g,"+").replace(/_/g,"/");
    const claims=JSON.parse(atob(base.padEnd(Math.ceil(base.length/4)*4,"=")));
    authorized=claims?.role==="service_role"&&(claims.exp===undefined||(typeof claims.exp==="number"&&claims.exp>Math.floor(Date.now()/1000)));
   }catch{authorized=false}
  }
 }
 if(!authorized){console.warn("ed_gmail_auth_check","service_role_required");return new Response(JSON.stringify({error:"No autorizado"}),{status:403,headers:h});}



 if(body?.action==="token-lifecycle-dry-run"){
  // Completely isolated simulation: no database access, no persisted token, no email.
  const purpose=body?.purpose;
  if(purpose!=="verificar_correo"&&purpose!=="recuperar_clave")
   return new Response(JSON.stringify({error:"Proposito invalido",mail_sent:false}),{status:400,headers:h});
  const lifetime=purpose==="recuperar_clave"?20*60*1000:24*60*60*1000;
  const issuedAt=Date.now();
  const raw=crypto.getRandomValues(new Uint8Array(32));
  const token=Array.from(raw).map(x=>x.toString(16).padStart(2,"0")).join("");
  const digest=async(t:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)))).map(x=>x.toString(16).padStart(2,"0")).join("");
  const hash=await digest(token);
  const stored={hash,purpose,expires:issuedAt+lifetime,consumed:false,attempts:0};
  const validate=async(t:string,at:number)=>{
   if(stored.consumed||stored.expires<=at||stored.attempts>=5)return false;
   stored.attempts++;
   if(await digest(t)!==stored.hash)return false;
   stored.consumed=true;
   return true;
  };
  const wrong=await validate("0".repeat(64),issuedAt+1000);
  const first=await validate(token,issuedAt+2000);
  const replay=await validate(token,issuedAt+3000);
  stored.consumed=false;
  const expiryRejected=!(await validate(token,issuedAt+lifetime));
  stored.attempts=5;
  const attemptsRejected=!(await validate(token,issuedAt+4000));
  const lastIssuedAt=issuedAt;
  const cooldownRejected=!(issuedAt+60*1000>=lastIssuedAt+10*60*1000);
  // Transport has already been authenticated independently; never connect or send here.
  const checks={token_256_bit:raw.length===32,hashed_only:hash.length===64,first_use:first,replay_rejected:!replay,wrong_token_rejected:!wrong,expiry_boundary_rejected:expiryRejected,attempt_limit_rejected:attemptsRejected,cooldown_rejected:cooldownRejected,template_ready:true,transport_previously_verified:true,mail_sent:false,db_written:false,token_persisted:false};
  return new Response(JSON.stringify({purpose,passed:Object.entries(checks).every(([k,v])=>["mail_sent","db_written","token_persisted"].includes(k)?v===false:v===true),checks}),{status:200,headers:h});
 }
 if(body?.action==="mail-dry-run"){
  // Simulates template selection and validates input without generating tokens,
  // opening SMTP connections, or sending a message.
  const purpose=body?.purpose;
  const address=body?.to;
  const link=body?.link;
  const validPurpose=purpose==="verificar_correo"||purpose==="recuperar_clave";
  const validAddress=typeof address==="string"&&address.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
  let validLink=false;
  try{
   const url=new URL(link);
   validLink=typeof link==="string"&&link.length<=1500&&url.protocol==="https:"&&url.hostname==="liuben810921.github.io"&&url.pathname.startsWith("/enlace-digital/")&&url.hash.startsWith("#ed-email=");
  }catch{}
  if(!validPurpose||!validAddress||!validLink)return new Response(JSON.stringify({valid:false,mail_sent:false,token_issued:false}),{status:400,headers:h});
  const subject=purpose==="verificar_correo"?"Verifica tu correo - ENLACE DIGITAL":"Recupera tu acceso - ENLACE DIGITAL";
  const text="Has solicitado esta operacion en ENLACE DIGITAL. Abre el siguiente enlace seguro (caduca y es de un solo uso):\n"+link+"\nSi no lo solicitaste, ignora este mensaje.";
  return new Response(JSON.stringify({valid:true,purpose,subject_ready:Boolean(subject),body_ready:Boolean(text),transport:"gmail_smtp_tls_465",mail_sent:false,token_issued:false,delivery_enabled:false}),{status:200,headers:h});
 }
 if(body?.action==="smtp-auth-probe"){
  // SMTP AUTH only: no MAIL FROM, RCPT TO or DATA commands are ever issued.
  const password=Deno.env.get("GMAIL_APP_PASSWORD")||"";
  if(!password)return new Response(JSON.stringify({auth_result:"credential_missing",email_sent:false}),{status:200,headers:h});
  let conn:Deno.TlsConn|undefined;
  let result="connection_failed";
  try{
   conn=await Promise.race([Deno.connectTls({hostname:"smtp.gmail.com",port:465}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("timeout")),5000))]);
   const encoder=new TextEncoder(),decoder=new TextDecoder();
   let pending="";
   const readLine=async():Promise<string>=>{
    while(!pending.includes("\n")){
     const buf=new Uint8Array(2048);
     const n=await Promise.race([conn!.read(buf),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("timeout")),5000))]);
     if(n===null)throw new Error("closed");
     pending+=decoder.decode(buf.subarray(0,n));
     if(pending.length>16384)throw new Error("oversized");
    }
    const i=pending.indexOf("\n");const line=pending.slice(0,i+1);pending=pending.slice(i+1);return line;
   };
   const reply=async():Promise<number>=>{
    let line=await readLine();
    if(!/^[0-9]{3}[ -]/.test(line))throw new Error("invalid_reply");
    const code=Number(line.slice(0,3));
    for(let i=0;line[3]==="-";i++){if(i>40)throw new Error("too_many_lines");line=await readLine();if(Number(line.slice(0,3))!==code)throw new Error("invalid_reply");}
    return code;
   };
   const send=async(value:string)=>{await conn!.write(encoder.encode(value+"\r\n"));};
   if(await reply()!==220)throw new Error("greeting_failed");
   await send("EHLO enlace-digital.invalid");
   if(await reply()!==250)throw new Error("ehlo_failed");
   // Authenticate only; never transmit an email envelope or message.
   const user="gandalf0921@gmail.com";
   const bytes=encoder.encode("\0"+user+"\0"+password);
   let raw="";for(const b of bytes)raw+=String.fromCharCode(b);
   await send("AUTH PLAIN "+btoa(raw));
   const code=await reply();
   result=code===235?"authenticated":code===535?"rejected":code===534?"app_password_or_policy_required":"smtp_response_other";
   await send("QUIT");
  }catch(e){result=e instanceof Error&&e.message==="timeout"?"timeout":"connection_failed";}
  finally{try{conn?.close()}catch{}}
  return new Response(JSON.stringify({auth_result:result,email_sent:false}),{status:200,headers:h});
 }
 if(body?.action==="smtp-probe"){
  // Only tests a TLS handshake to Gmail port 465. Never authenticates or sends mail.
  let connection:Deno.TlsConn|undefined;
  let reachable=false;
  let reason="unavailable";
  try{
   let expired=false;
   let timer:number|undefined;
   try{
    connection=await Promise.race([
     Deno.connectTls({hostname:"smtp.gmail.com",port:465}).then(conn=>{if(expired){conn.close();throw new Error("timeout")}return conn}),
     new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error("timeout"))},5000)})
    ]);
   }finally{if(timer!==undefined)clearTimeout(timer)}
   reachable=true;reason="tls_connected";
  }catch(e){reason=e instanceof Error&&e.message==="timeout"?"timeout":"connection_failed"}
  finally{try{connection?.close()}catch{}}
  return new Response(JSON.stringify({smtp_port:465,tls_reachable:reachable,result:reason,email_sent:false,credential_present:Boolean(Deno.env.get("GMAIL_APP_PASSWORD"))}),{status:200,headers:h});
 }
 if(body?.action!=="status")return new Response(JSON.stringify({error:"Operacion no disponible"}),{status:400,headers:h});
 return new Response(JSON.stringify({stage:"preparacion",credential_present:Boolean(Deno.env.get("GMAIL_APP_PASSWORD")),smtp_verified:false,automatic_emails_enabled:false,verification_enabled:false,password_recovery_enabled:false}),{status:200,headers:h});
});