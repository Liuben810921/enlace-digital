// Staging-only, opt-in transport for offline integration. Never imported by production index.html.
const STAGING_ENDPOINT='https://xqahthghvozeigbojhyi.supabase.co/functions/v1/enlace-cliente-auth-staging';
export function createStagingCustomerTransport({endpoint=STAGING_ENDPOINT,publishableKey,fetchImpl=fetch}={}){
 if(endpoint!==STAGING_ENDPOINT)throw new Error('Solo se permite el endpoint oficial de staging');
 if(typeof publishableKey!=='string'||!publishableKey.startsWith('sb_publishable_'))throw new Error('Falta clave publica de staging');
 if(typeof fetchImpl!=='function')throw new Error('fetch no disponible');
 return async function stagingCustomerRequest(action,data={}){
  if(typeof action!=='string'||!action||!data||typeof data!=='object'||Array.isArray(data))throw new Error('Solicitud invalida');
  const response=await fetchImpl(endpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':publishableKey},body:JSON.stringify({action,...data}),cache:'no-store'});
  let result;try{result=await response.json()}catch{throw new Error('Respuesta no JSON del servicio de staging')}
  if(!response.ok)throw new Error(typeof result?.error==='string'?result.error:'HTTP '+response.status);
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('Respuesta invalida del servicio de staging');
  return result;
 };
}
