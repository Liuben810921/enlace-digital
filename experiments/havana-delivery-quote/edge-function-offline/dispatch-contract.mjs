// Deterministic, offline context binding. Trusted ledger must compare digest atomically.
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function contextDigest(principal, body) {
  const normalized={principal,operationId:body.operationId,contextRevision:body.contextRevision,mode:body.mode,destination:[body.destination.lat,body.destination.lon],origins:body.origins.map(o=>[o.id,o.lat,o.lon]).sort((a,b)=>a[0].localeCompare(b[0],'en'))};
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(normalized)))));
}
export function reservationAccepted(receipt,digest) {
  return receipt?.committed===true && receipt?.lifecycle==='RESERVED' && ['RESERVED','REPLAY_RESERVED'].includes(receipt?.reason) && typeof receipt.reservationId==='string' && receipt.reservationId.length>0 && receipt.contextDigest===digest;
}
export function dispatchAccepted(gate,receipt,body,digest) {
  return gate?.authorized===true && gate?.lifecycle==='DISPATCHED' && gate?.reason==='APPLIED' && gate?.reservationId===receipt.reservationId && gate?.operationId===body.operationId && gate?.contextRevision===body.contextRevision && gate?.contextDigest===digest;
}
