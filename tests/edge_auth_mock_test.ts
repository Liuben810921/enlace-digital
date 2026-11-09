// Offline Deno integration tests of the actual Edge handler with a mocked Supabase client.
// No network, credentials, database or server socket is used.
function assert(value:unknown,message="assertion failed"): asserts value {if(!value)throw Error(message)}
function assertEquals(actual:unknown,expected:unknown){if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)}
const source = await Deno.readTextFile("supabase/functions/enlace-cliente-auth-staging/index.ts");
type Call = {kind:string; name:string; args?:unknown; filters:Record<string,unknown>};
const calls:Call[]=[];
const rpcResults:Record<string,unknown[]>={};
const tableResults:Record<string,unknown[]>={};
function next(map:Record<string,unknown[]>,name:string){return (map[name]||[]).shift()??{data:null,error:null}}
function table(name:string){
 const filters:Record<string,unknown>={};
 const chain:any={
  select(){return chain},update(data:unknown){chain._update=data;return chain},
  insert(data:unknown){calls.push({kind:"insert",name,args:data,filters:{}});return chain},
  eq(k:string,v:unknown){filters[k]=v;return chain},
  order(){return chain},limit(){return chain},
  maybeSingle(){calls.push({kind:"query",name,filters:{...filters}});return Promise.resolve(next(tableResults,name))},
  single(){calls.push({kind:"query",name,filters:{...filters}});return Promise.resolve(next(tableResults,name))},
  then(resolve:(v:unknown)=>unknown){calls.push({kind:"query",name,filters:{...filters}});return Promise.resolve(next(tableResults,name)).then(resolve)}
 };
 return chain;
}
(globalThis as any).__mockCreateClient=()=>({
 rpc(name:string,args:unknown){calls.push({kind:"rpc",name,args,filters:{}});return Promise.resolve(next(rpcResults,name))},
 from:table
});
let handler:(req:Request)=>Promise<Response>;
(globalThis as any).__captureServe=(fn:typeof handler)=>{handler=fn};
const mocked=source
 .replace('import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";','const createClient = (globalThis as any).__mockCreateClient;')
 .replace('const url=Deno.env.get("SUPABASE_URL")||"";','const url="https://xqahthghvozeigbojhyi.supabase.co";')
 .replace('const configuredOrigin=Deno.env.get("ED_STAGING_ALLOWED_ORIGIN")||"";','const configuredOrigin="https://staging.example.invalid";')
 .replace('const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";','const key="mock-key";')
 .replace('const enabled=Deno.env.get("ED_STAGING_CUSTOMER_AUTH_ENABLED")==="true";','const enabled=true;')
 .replace('const validProject=(()=>{try{return new URL(url).hostname===expectedProject+".supabase.co"}catch{return false}})();','const validProject=true;')
 .replace('Deno.serve(async req=>{','(globalThis as any).__captureServe(async (req:Request)=>{');
assert(mocked.includes("__captureServe(async (req:Request)=>{"));
const temp=await Deno.makeTempFile({suffix:".ts"});
try{await Deno.writeTextFile(temp,mocked);await import("file://"+temp+"?mock="+Date.now())}finally{await Deno.remove(temp)}
handler=(globalThis as any).__handler??handler;
function reset(){calls.length=0;for(const k of Object.keys(rpcResults))delete rpcResults[k];for(const k of Object.keys(tableResults))delete tableResults[k];rpcResults.ed_cliente_limite_privado=Array.from({length:20},()=>({data:true,error:null}))}
function queueRpc(name:string,...values:unknown[]){rpcResults[name]=values}
function queueTable(name:string,...values:unknown[]){tableResults[name]=values}
async function send(action:string,extra:Record<string,unknown>={},headers:Record<string,string>={}){
 const r=await handler(new Request("https://staging-preview.invalid",{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify({action,...extra})}));
 return {status:r.status,body:await r.json()};
}
const token="a".repeat(64),customerA={numero:11},customerB={numero:22};
Deno.test("register: Cuba address and foreign no address; duplicate and validation",async()=>{
 reset();
 queueRpc("ed_cliente_registrar_residencia_privado",{data:{numero:11},error:null},{data:null,error:{code:"23505"}});
 const base={name:"Prueba Cuba",phone:"+15550001001",password:"ClaveFicticia2026!"};
 assertEquals((await send("register",{...base,residence:"cuba",address:{province:"La Habana",municipality:"Plaza",street:"Calle ficticia 123"}})).status,201);
 const reg=calls.find(c=>c.name==="ed_cliente_registrar_residencia_privado")!;
 assertEquals((reg.args as any).p_residencia,"cuba");
 assertEquals((await send("register",{...base,phone:"+15550001002",residence:"extranjero"})).status,409);
 assertEquals((await send("register",{...base,residence:"cuba"})).status,400);
 assertEquals((await send("register",{...base,password:"x".repeat(73),residence:"extranjero"})).status,400);
});
Deno.test("login: rate limit, failure, success and token hash never plaintext",async()=>{
 reset();queueRpc("ed_cliente_login_privado",{data:null,error:null},{data:customerA,error:null});
 const base={phone:"+15550001001",password:"ClaveFicticia2026!"};
 assertEquals((await send("login",base)).status,401);
 const ok=await send("login",base);assertEquals(ok.status,200);
 assertEquals((ok.body as any).token.length,64);
 const login=calls.filter(c=>c.name==="ed_cliente_login_privado").at(-1)!;
 assert((login.args as any).p_token_hash!==(ok.body as any).token);
 reset();queueRpc("ed_cliente_limite_privado",{data:false,error:null});
 assertEquals((await send("login",base)).status,429);
});
Deno.test("recipient update always filters by authenticated customer",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerB,error:null});
 queueTable("clientes_destinatarios",{data:null,error:null});
 const recipient={name:"Receptor B",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 const r=await send("recipient-save",{token,id:999,recipient});
 assertEquals(r.status,404);
 const update=calls.find(c=>c.kind==="query"&&c.name==="clientes_destinatarios")!;
 assertEquals(update.filters.cliente_numero,22);assertEquals(update.filters.id,999);
});
Deno.test("profile lists only session owner's recipients and delivery locations",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueTable("clientes_destinatarios",{data:[],error:null});
 queueTable("clientes_direcciones_entrega",{data:[],error:null});
 const r=await send("profile",{token});assertEquals(r.status,200);
 for(const name of ["clientes_destinatarios","clientes_direcciones_entrega"]){
  assertEquals(calls.find(c=>c.kind==="query"&&c.name===name)?.filters.cliente_numero,11)
 }
});
Deno.test("delivery dedup is owner scoped; logout revokes; invalid token blocked",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null},{data:{cerrada:true},error:null});
 queueTable("clientes_direcciones_entrega",{data:{id:4},error:null},{data:null,error:null});
 const location={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 assertEquals((await send("delivery-location-save",{token,location})).status,200);
 const queries=calls.filter(c=>c.kind==="query"&&c.name==="clientes_direcciones_entrega");
 assert(queries.every(c=>c.filters.cliente_numero===11));
 assertEquals((await send("logout",{token})).status,200);
 assert(calls.some(c=>c.name==="ed_cliente_sesion_privada"&&(c.args as any).p_revocar===true));
 assertEquals((await send("profile",{token:"bad"})).status,401);
});
Deno.test("oversized streaming body rejected without Content-Length",async()=>{
 reset();const body=JSON.stringify({action:"login",padding:"x".repeat(5000)});
 const r=await handler(new Request("https://staging-preview.invalid",{method:"POST",body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(body));c.close()}})}));
 assertEquals(r.status,413);
 assertEquals(calls.filter(c=>c.kind==="rpc").length,0);
});

Deno.test("RPC errors fail closed for login, registration and session",async()=>{
 reset();queueRpc("ed_cliente_login_privado",{data:null,error:{code:"XX000"}});
 const login=await send("login",{phone:"+15550001001",password:"ClaveFicticia2026!"});assertEquals(login.status,500);
 reset();queueRpc("ed_cliente_registrar_residencia_privado",{data:null,error:{code:"XX000"}});
 const reg=await send("register",{name:"Prueba Exterior",phone:"+15550001001",password:"ClaveFicticia2026!",residence:"extranjero"});assertEquals(reg.status,400);
 reset();queueRpc("ed_cliente_sesion_privada",{data:null,error:{code:"XX000"}});
 assertEquals((await send("profile",{token})).status,500);
});
Deno.test("expired and revoked sessions deny protected operations",async()=>{
 for(const action of ["profile","recipient-save","address-save","delivery-location-save","session"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:null,error:null});
  assertEquals((await send(action,{token})).status,401);
  assertEquals(calls.filter(c=>c.kind==="insert").length,0);
 }
});
Deno.test("rate limiter failure and rejection block login before credentials RPC",async()=>{
 for(const result of [{data:false,error:null},{data:null,error:{code:"XX000"}}]){
  reset();queueRpc("ed_cliente_limite_privado",result);
  assertEquals((await send("login",{phone:"+15550001001",password:"ClaveFicticia2026!"})).status,429);
  assertEquals(calls.filter(c=>c.name==="ed_cliente_login_privado").length,0);
 }
});
Deno.test("recipient ownership: successful update remains scoped and missing record is 404",async()=>{
 const recipient={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueTable("clientes_destinatarios",{data:{id:55},error:null});
 assertEquals((await send("recipient-save",{token,id:55,recipient})).status,200);
 const q=calls.find(c=>c.kind==="query"&&c.name==="clientes_destinatarios")!;
 assertEquals(q.filters.cliente_numero,11);assertEquals(q.filters.id,55);
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerB,error:null});
 queueTable("clientes_destinatarios",{data:null,error:null});
 assertEquals((await send("recipient-save",{token,id:55,recipient})).status,404);
 assertEquals(calls.find(c=>c.kind==="query"&&c.name==="clientes_destinatarios")?.filters.cliente_numero,22);
});
Deno.test("delivery dedup: same address under another owner inserts separate record",async()=>{
 const location={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerB,error:null});
 queueTable("clientes_direcciones_entrega",{data:null,error:null},{data:{id:77},error:null});
 const r=await send("delivery-location-save",{token,location});
 assertEquals(r.status,201);
 const q=calls.find(c=>c.kind==="query"&&c.name==="clientes_direcciones_entrega")!;
 assertEquals(q.filters.cliente_numero,22);
 const ins=calls.find(c=>c.kind==="insert"&&c.name==="clientes_direcciones_entrega")!;
 assertEquals((ins.args as any).cliente_numero,22);
});
Deno.test("invalid input and unknown actions reject without protected writes",async()=>{
 reset();assertEquals((await send("recipient-save",{token:"invalid"})).status,401);
 assertEquals((await send("address-save",{token:"invalid"})).status,401);
 assertEquals((await send("register",{name:"Only",phone:"bad",password:"short",residence:"cuba"})).status,400);
 assertEquals((await send("unrecognized")).status,400);
 assertEquals(calls.filter(c=>c.kind==="insert").length,0);
});
Deno.test("method and invalid JSON rejected before database operations",async()=>{
 reset();
 const get=await handler(new Request("https://staging-preview.invalid",{method:"GET"}));assertEquals(get.status,405);
 const bad=await handler(new Request("https://staging-preview.invalid",{method:"POST",body:"{broken"}));assertEquals(bad.status,400);
 assertEquals(calls.filter(c=>c.kind==="rpc").length,0);
});

Deno.test("CORS rejects unapproved origin and ignores spoofed proxy IP",async()=>{
 reset();
 const preflight=await handler(new Request("https://staging-preview.invalid",{method:"OPTIONS",headers:{origin:"https://attacker.invalid"}}));
 assertEquals(preflight.status,403);
 assertEquals(preflight.headers.get("access-control-allow-origin"),null);
 const ok=await handler(new Request("https://staging-preview.invalid",{method:"OPTIONS",headers:{origin:"https://staging.example.invalid"}}));
 assertEquals(ok.status,204);
 assertEquals(ok.headers.get("access-control-allow-origin"),"https://staging.example.invalid");
 await send("unrecognized",{},{"x-forwarded-for":"203.0.113.42","cf-connecting-ip":"198.51.100.10"});
 assert(calls.some(c=>c.name==="ed_cliente_limite_privado"&&(c.args as any).p_clave==="staging-auth-global"));
});

Deno.test("disabled Edge does not initialize privileged Supabase client",async()=>{
 const disabled=mocked.replace("const enabled=true;","const enabled=false;");
 assert(disabled.includes("const enabled=false;"));
 let disabledHandler:typeof handler|undefined;
 const original=(globalThis as any).__captureServe;
 const originalClient=(globalThis as any).__mockCreateClient;
 (globalThis as any).__captureServe=(fn:typeof handler)=>{disabledHandler=fn};
 (globalThis as any).__mockCreateClient=()=>{throw Error("privileged client initialized while disabled")};
 const file=await Deno.makeTempFile({suffix:".ts"});
 try{
  await Deno.writeTextFile(file,disabled);
  await import("file://"+file+"?disabled="+Date.now());
  assert(disabledHandler);
  const r=await disabledHandler(new Request("https://staging-preview.invalid",{method:"POST",body:'{"action":"login"}'}));
  assertEquals(r.status,503);
 }finally{
  (globalThis as any).__captureServe=original;
  (globalThis as any).__mockCreateClient=originalClient;
  await Deno.remove(file);
 }
});

Deno.test("protected write failures return 500 without false success",async()=>{
 const recipient={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 for(const action of ["recipient-save","delivery-location-save"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  const tableName=action==="recipient-save"?"clientes_destinatarios":"clientes_direcciones_entrega";
  if(action==="delivery-location-save")queueTable(tableName,{data:null,error:null},{data:null,error:{code:"XX000"}});
  else queueTable(tableName,{data:null,error:{code:"XX000"}});
  const r=await send(action,{token,...(action==="recipient-save"?{recipient}:{location:recipient})});
  assertEquals(r.status,500);
 }
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueRpc("ed_cliente_direccion_privada",{data:null,error:{code:"XX000"}});
 assertEquals((await send("address-save",{token,address:{province:"La Habana",municipality:"Plaza",street:"Calle ficticia 123"}})).status,500);
});
Deno.test("registration rate limit blocks before private registration RPC",async()=>{
 reset();queueRpc("ed_cliente_limite_privado",{data:true,error:null},{data:false,error:null});
 const r=await send("register",{name:"Prueba Exterior",phone:"+15550001001",password:"ClaveFicticia2026!",residence:"extranjero"});
 assertEquals(r.status,429);
 assertEquals(calls.filter(c=>c.name==="ed_cliente_registrar_residencia_privado").length,0);
});
Deno.test("successful foreign registration requires no Cuban address",async()=>{
 reset();queueRpc("ed_cliente_registrar_residencia_privado",{data:{numero:23},error:null});
 const r=await send("register",{name:"Prueba Exterior",phone:"+15550001001",password:"ClaveFicticia2026!",residence:"extranjero"});
 assertEquals(r.status,201);
 const args=calls.find(c=>c.name==="ed_cliente_registrar_residencia_privado")!.args as any;
 assertEquals(args.p_residencia,"extranjero");
 assertEquals(args.p_direccion,"");
});
Deno.test("invalid recipient id rejected without table mutations",async()=>{
 for(const id of [-1,0,1.5,"abc"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  const r=await send("recipient-save",{token,id,recipient:{name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"}});
  assertEquals(r.status,400);
  assertEquals(calls.filter(c=>c.kind==="insert"||c.name==="clientes_destinatarios").length,0);
 }
});

Deno.test("profile read failures fail closed and never return partial customer data",async()=>{
 for(const failedTable of ["clientes_destinatarios","clientes_direcciones_entrega"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  queueTable("clientes_destinatarios",failedTable==="clientes_destinatarios"?{data:null,error:{code:"XX000"}}:{data:[],error:null});
  queueTable("clientes_direcciones_entrega",{data:null,error:{code:"XX000"}});
  const r=await send("profile",{token});
  assertEquals(r.status,500);
  assertEquals((r.body as any).cliente,undefined);
  const reads=calls.filter(c=>c.kind==="query");
  assert(reads.every(c=>c.filters.cliente_numero===11));
  if(failedTable==="clientes_destinatarios")assertEquals(reads.some(c=>c.name==="clientes_direcciones_entrega"),false);
 }
});
Deno.test("delivery location lookup error prevents any insert or update",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueTable("clientes_direcciones_entrega",{data:null,error:{code:"XX000"}});
 const location={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 assertEquals((await send("delivery-location-save",{token,location})).status,500);
 assertEquals(calls.filter(c=>c.kind==="insert").length,0);
 const q=calls.find(c=>c.name==="clientes_direcciones_entrega")!;
 assertEquals(q.filters.cliente_numero,11);
});
Deno.test("delivery location reuse update failure returns 500 scoped to owner",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueTable("clientes_direcciones_entrega",{data:{id:41},error:null},{data:null,error:{code:"XX000"}});
 const location={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 assertEquals((await send("delivery-location-save",{token,location})).status,500);
 const q=calls.filter(c=>c.kind==="query"&&c.name==="clientes_direcciones_entrega");
 assertEquals(q.length,2);
 assertEquals(q[1].filters.cliente_numero,11);
 assertEquals(q[1].filters.id,41);
 assertEquals(calls.filter(c=>c.kind==="insert").length,0);
});
Deno.test("revoked session denies logout replay and protected profile",async()=>{
 for(const action of ["logout","profile","recipient-save","delivery-location-save","address-save"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:null,error:null});
  assertEquals((await send(action,{token})).status,401);
  assertEquals(calls.filter(c=>c.kind==="insert"||c.kind==="query").length,0);
 }
});
Deno.test("session backend errors do not leak private records",async()=>{
 for(const action of ["session","logout","profile"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:null,error:{code:"XX000"}});
  const r=await send(action,{token});
  assertEquals(r.status,500);
  assertEquals((r.body as any).cliente,undefined);
 }
});

Deno.test("unexpected JSON types and malformed payloads never reach protected writes",async()=>{
 const cases=[
  {action:"register",name:["Prueba","Cuba"],phone:"+15550001001",password:"ClaveFicticia2026!",residence:"cuba"},
  {action:"register",name:"Prueba Cuba",phone:"+15550001001",password:"ClaveFicticia2026!",residence:"cuba",address:{province:"La Habana",municipality:"Plaza",street:"short"}},
  {action:"recipient-save",token:"invalid",recipient:{name:"Receptor A"}},
  {action:"delivery-location-save",token:"invalid",location:{name:"Receptor A"}},
  {action:"profile",token:12345},
  {action:"login",phone:{"unexpected":true},password:"ClaveFicticia2026!"}
 ];
 for(const payload of cases){
  reset();
  const r=await send(String(payload.action),payload);
  assert(r.status>=400&&r.status<500);
  assertEquals(calls.filter(c=>c.kind==="insert").length,0);
 }
});
Deno.test("global rate limit fails closed before private authentication and table operations",async()=>{
 for(const action of ["register","login","profile","recipient-save","delivery-location-save"]){
  reset();queueRpc("ed_cliente_limite_privado",{data:false,error:null});
  const r=await send(action,{token});
  assertEquals(r.status,429);
  assertEquals(calls.filter(c=>c.kind==="rpc"&&c.name!=="ed_cliente_limite_privado").length,0);
  assertEquals(calls.filter(c=>c.kind==="insert"||c.kind==="query").length,0);
 }
});
Deno.test("response security headers prevent caching and disallow wildcard CORS",async()=>{
 reset();const r=await handler(new Request("https://staging-preview.invalid",{method:"POST",headers:{"origin":"https://attacker.invalid","content-type":"application/json"},body:JSON.stringify({action:"unrecognized"})}));
 assertEquals(r.status,400);
 assertEquals(r.headers.get("cache-control"),"no-store");
 assertEquals(r.headers.get("access-control-allow-origin"),null);
 assertEquals(r.headers.get("content-type"),"application/json");
});
Deno.test("invalid request bodies are rejected without private RPCs",async()=>{
 for(const raw of ["null","[]","42","true","\"string\"","{"]){
  reset();
  const r=await handler(new Request("https://staging-preview.invalid",{method:"POST",body:raw}));
  assertEquals(r.status,400);
  assertEquals(calls.filter(c=>c.kind==="rpc"&&c.name!=="ed_cliente_limite_privado").length,0);
 }
});

Deno.test("SQL contract: RPC names and parameter keys match draft v4",async()=>{
 const sql=await Deno.readTextFile("sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql");
 const contracts:Record<string,string[]>={
  ed_cliente_registrar_residencia_privado:["p_nombre","p_telefono","p_password","p_correo","p_residencia","p_provincia","p_municipio","p_barrio","p_direccion"],
  ed_cliente_login_privado:["p_telefono","p_password","p_token_hash"],
  ed_cliente_sesion_privada:["p_token_hash","p_revocar"],
  ed_cliente_direccion_privada:["p_token_hash","p_provincia","p_municipio","p_barrio","p_direccion"],
 };
 for(const [name,params] of Object.entries(contracts)){
  const match=sql.match(new RegExp("CREATE OR REPLACE FUNCTION public\\."+name+"\\(([\\s\\S]*?)\\) RETURNS","i"));
  assert(match,"SQL RPC not found: "+name);
  const declared=[...match[1].matchAll(/\b(p_[a-z_]+)\s+(?:text|boolean|integer)\b/g)].map(m=>m[1]);
  assertEquals(declared,params);
  assert(source.includes('db.rpc("'+name+'"'),"Handler does not call "+name);
 }
});
Deno.test("address RPC false is a denied operation, backend error remains 500",async()=>{
 const address={province:"La Habana",municipality:"Plaza",street:"Calle ficticia 123"};
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueRpc("ed_cliente_direccion_privada",{data:false,error:null});
 assertEquals((await send("address-save",{token,address})).status,403);
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
 queueRpc("ed_cliente_direccion_privada",{data:null,error:{code:"XX000"}});
 assertEquals((await send("address-save",{token,address})).status,500);
});
Deno.test("logout returns explicit closure, not a fabricated customer profile",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:{cerrada:true},error:null});
 const r=await send("logout",{token});
 assertEquals(r.status,200);
 assertEquals((r.body as any).closed,true);
 assertEquals((r.body as any).cliente,undefined);
});

Deno.test("structured values cannot be coerced into persisted address or recipient strings",async()=>{
 const valid={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 const malformed=[
  {action:"register",name:"Prueba Cuba",phone:"+15550001001",password:"ClaveFicticia2026!",residence:"cuba",address:{province:"La Habana",municipality:"Plaza",street:{toString:"Calle ficticia 123"}}},
  {action:"address-save",token,address:{province:"La Habana",municipality:"Plaza",street:{unexpected:"Calle ficticia 123"}}},
  {action:"recipient-save",token,recipient:{...valid,address:{unexpected:"Calle ficticia 123"}}},
  {action:"delivery-location-save",token,location:{...valid,province:["La Habana"]}}
 ];
 for(const payload of malformed){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  const r=await send(payload.action,payload);
  assertEquals(r.status,400);
  assertEquals(calls.filter(c=>c.kind==="insert").length,0);
  assertEquals(calls.filter(c=>c.name==="ed_cliente_registrar_residencia_privado"||c.name==="ed_cliente_direccion_privada").length,0);
 }
});
Deno.test("session response returns authenticated customer and never echoes bearer token",async()=>{
 reset();queueRpc("ed_cliente_sesion_privada",{data:customerB,error:null});
 const r=await send("session",{token});
 assertEquals(r.status,200);
 assertEquals((r.body as any).cliente.numero,22);
 assertEquals(JSON.stringify(r.body).includes(token),false);
 const auth=calls.find(c=>c.name==="ed_cliente_sesion_privada")!;
 assertEquals((auth.args as any).p_revocar,false);
 assertEquals((auth.args as any).p_token_hash===token,false);
});

Deno.test("malformed successful registration RPC cannot be reported as account created",async()=>{
 for(const data of [null,{}, {numero:0},{numero:"11"}]){
  reset();queueRpc("ed_cliente_registrar_residencia_privado",{data,error:null});
  const r=await send("register",{name:"Prueba Exterior",phone:"+15550001001",password:"ClaveFicticia2026!",residence:"extranjero"});
  assertEquals(r.status,500);
  assertEquals((r.body as any).cliente,undefined);
 }
});
Deno.test("malformed successful login RPC cannot issue usable token",async()=>{
 for(const data of [{},{numero:0},{numero:"11"}]){
  reset();queueRpc("ed_cliente_login_privado",{data,error:null});
  const r=await send("login",{phone:"+15550001001",password:"ClaveFicticia2026!"});
  assertEquals(r.status,500);
  assertEquals((r.body as any).token,undefined);
 }
});

Deno.test("session and profile reject malformed owner without querying customer tables",async()=>{
 for(const action of ["session","profile"]){
  for(const data of [{}, {numero:0}, {numero:"11"}]){
   reset();queueRpc("ed_cliente_sesion_privada",{data,error:null});
   const r=await send(action,{token});
   assertEquals(r.status,500);
   assertEquals((r.body as any).cliente,undefined);
   assertEquals(calls.filter(c=>c.kind==="query"||c.kind==="insert").length,0);
  }
 }
});
Deno.test("logout requires explicit revocation confirmation from SQL",async()=>{
 for(const data of [{}, {cerrada:false}, {numero:11}]){
  reset();queueRpc("ed_cliente_sesion_privada",{data,error:null});
  const r=await send("logout",{token});
  assertEquals(r.status,500);
  assertEquals((r.body as any).closed,undefined);
  const rpc=calls.find(c=>c.name==="ed_cliente_sesion_privada")!;
  assertEquals((rpc.args as any).p_revocar,true);
 }
});

Deno.test("protected writes fail closed on session backend error or invalid owner",async()=>{
 for(const action of ["address-save","recipient-save","delivery-location-save"]){
  for(const result of [{data:null,error:{code:"XX000"}},{data:{numero:"11"},error:null},{data:{numero:0},error:null}]){
   reset();queueRpc("ed_cliente_sesion_privada",result);
   const r=await send(action,{token});
   assertEquals(r.status,500);
   assertEquals(calls.filter(c=>c.kind==="insert"||c.kind==="query").length,0);
   assertEquals(calls.filter(c=>c.name==="ed_cliente_direccion_privada").length,0);
  }
 }
});
Deno.test("protected writes return unauthorized on revoked session without writes",async()=>{
 for(const action of ["address-save","recipient-save","delivery-location-save"]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:null,error:null});
  assertEquals((await send(action,{token})).status,401);
  assertEquals(calls.filter(c=>c.kind==="insert"||c.kind==="query").length,0);
 }
});

Deno.test("recipient IDs reject coercion and do not mutate records",async()=>{
 const recipient={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 for(const id of ["55",true,false,[],[55],{},1.5]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  const r=await send("recipient-save",{token,id,recipient});
  assertEquals(r.status,400);
  assertEquals(calls.filter(c=>c.name==="clientes_destinatarios").length,0);
 }
});
Deno.test("protected writes distinguish expired sessions, RPC errors and invalid owners",async()=>{
 for(const action of ["recipient-save","delivery-location-save","address-save"]){
  for(const scenario of [{data:null,error:null,status:401},{data:null,error:{code:"XX000"},status:500},{data:{numero:"11"},error:null,status:500}]){
   reset();queueRpc("ed_cliente_sesion_privada",{data:scenario.data,error:scenario.error});
   const r=await send(action,{token});
   assertEquals(r.status,scenario.status);
   assertEquals(calls.filter(c=>c.kind==="insert"||c.kind==="query").length,0);
  }
 }
});

Deno.test("recipient insert and update reject invalid or mismatched persisted IDs",async()=>{
 const recipient={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 for(const data of [null,{}, {id:"55"}, {id:0}]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  queueTable("clientes_destinatarios",{data,error:null});
  const r=await send("recipient-save",{token,recipient});
  assertEquals(r.status,500);
  assertEquals((r.body as any).id,undefined);
 }
 for(const data of [{id:56},{id:"55"},{id:0}]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  queueTable("clientes_destinatarios",{data,error:null});
  const r=await send("recipient-save",{token,id:55,recipient});
  assertEquals(r.status,500);
  assertEquals((r.body as any).id,undefined);
 }
});
Deno.test("delivery insert and reuse reject missing, malformed or mismatched IDs",async()=>{
 const location={name:"Receptor A",phone:"+5355512345",province:"La Habana",municipality:"Plaza",address:"Calle ficticia 123"};
 for(const saved of [null,{}, {id:"4"},{id:0}]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  queueTable("clientes_direcciones_entrega",{data:null,error:null},{data:saved,error:null});
  const r=await send("delivery-location-save",{token,location});
  assertEquals(r.status,500);
  assertEquals((r.body as any).id,undefined);
 }
 for(const updated of [null,{id:5},{id:"4"}]){
  reset();queueRpc("ed_cliente_sesion_privada",{data:customerA,error:null});
  queueTable("clientes_direcciones_entrega",{data:{id:4},error:null},{data:updated,error:null});
  const r=await send("delivery-location-save",{token,location});
  assertEquals(r.status,500);
  assertEquals((r.body as any).id,undefined);
  const queries=calls.filter(c=>c.kind==="query"&&c.name==="clientes_direcciones_entrega");
  assertEquals(queries[1].filters.cliente_numero,11);
  assertEquals(queries[1].filters.id,4);
 }
});
