// Offline-only Geoapify contract: no fetch, SDK, credentials, or external calls.
export const DEFAULT_DAILY_BUDGET = 3000;
const point = p => !!p && typeof p==='object' && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat)<=90 && Math.abs(p.lon)<=180;
const nonneg = x => typeof x==='number' && Number.isFinite(x) && x>=0;
const positive = x => nonneg(x) && x>0;
export function parseFixture(response) {
  if (!response || typeof response!=='object' || Array.isArray(response)) return {status:'UNAVAILABLE'};
  if (response.networkError || response.timeout) return {status:'UNAVAILABLE'};
  if (response.httpStatus===429) return {status:'QUOTA'};
  if (response.httpStatus===404 || response.code==='NoRoute') return {status:'NO_ROUTE'};
  if (response.httpStatus!==200 || !response.body || typeof response.body!=='object') return {status:'UNAVAILABLE'};
  if (response.body.code==='NoRoute') return {status:'NO_ROUTE'};
  if (!Array.isArray(response.body.results) || response.body.results.length!==1) return {status:'INVALID'};
  const route=response.body.results[0];
  if (!route || typeof route!=='object' || !positive(route.distance) || !nonneg(route.time)) return {status:'INVALID'};
  return {status:'OK',distanceMeters:route.distance,durationSeconds:route.time,provider:'geoapify',profile:'drive'};
}
export function quoteFixture({origin,destination,fixture}={}) {
  if (!point(origin) || !point(destination)) return {status:'INVALID'};
  return parseFixture(fixture);
}
// Strict preflight reservation; caller must persist/atomically enforce any real quota.
export function budgetDecision({used=0,reserved=0,planned=1,limit=DEFAULT_DAILY_BUDGET}={}) {
  if (![used,reserved,planned,limit].every(x=>Number.isSafeInteger(x)&&x>=0) || planned===0 || limit===0) return {status:'INVALID'};
  return used+reserved+planned<=limit ? {status:'ALLOW',estimatedCredits:planned,remainingAfter:limit-used-reserved-planned} : {status:'QUOTA'};
}
export function deliveryFixture({warehouses,destination,fixtures,minimumKm=3,ratePerKm=200,budget}={}) {
  if (!Array.isArray(warehouses) || warehouses.length===0 || warehouses.length>100 || !warehouses.every(point) || !point(destination) || !Array.isArray(fixtures) || fixtures.length!==warehouses.length || !nonneg(minimumKm) || !nonneg(ratePerKm)) return {status:'PENDIENTE',reason:'INVALID'};
  const allowance=budgetDecision({...budget,planned:warehouses.length});
  if (allowance.status!=='ALLOW') return {status:'PENDIENTE',reason:allowance.status};
  const routes=warehouses.map((origin,i)=>quoteFixture({origin,destination,fixture:fixtures[i]}));
  if (routes.some(r=>r.status!=='OK')) return {status:'PENDIENTE',routeStatuses:routes.map(r=>r.status)};
  const meters=Math.max(...routes.map(r=>r.distanceMeters));
  const km=Math.max(minimumKm,meters/1000), charge=km*ratePerKm;
  if (!Number.isFinite(charge)) return {status:'PENDIENTE',reason:'INVALID'};
  return {status:'COTIZACION_FICTICIA',distanceMeters:meters,billableKm:km,deliveryCUP:charge,routeCount:routes.length,estimatedCredits:allowance.estimatedCredits};
}
