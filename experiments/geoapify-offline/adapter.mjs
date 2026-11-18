// Offline-only contract. No network, credentials, browser globals or provider SDK.
const validPoint = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
export function parseRoute(response) {
  if (!response || typeof response !== 'object') return {status:'UNAVAILABLE'};
  if (response.httpStatus === 429) return {status:'QUOTA'};
  if (response.httpStatus === 404 || response.code === 'NoRoute') return {status:'NO_ROUTE'};
  if (response.httpStatus !== 200) return {status:'UNAVAILABLE'};
  const r = response.body?.results?.[0];
  if (!r || !Number.isFinite(r.distance) || r.distance <= 0 || !Number.isFinite(r.time) || r.time < 0) return {status:'INVALID'};
  return {status:'OK',distanceMeters:r.distance,durationSeconds:r.time,provider:'geoapify',profile:'drive'};
}
export function quoteOffline({origin,destination,fixture}) {
  if (!validPoint(origin) || !validPoint(destination)) return {status:'INVALID'};
  return parseRoute(fixture);
}
export function quoteDeliveryOffline({warehouses,destination,fixtures,minimumKm=3,ratePerKm=200}) {
  if (!Array.isArray(warehouses) || warehouses.length === 0 || !Array.isArray(fixtures) || fixtures.length !== warehouses.length || !validPoint(destination) || !Number.isFinite(minimumKm) || minimumKm < 0 || !Number.isFinite(ratePerKm) || ratePerKm < 0) return {status:'PENDIENTE'};
  const routes = warehouses.map((origin,i)=>quoteOffline({origin,destination,fixture:fixtures[i]}));
  if (routes.some(r=>r.status!=='OK')) return {status:'PENDIENTE',routeStatuses:routes.map(r=>r.status)};
  const maxMeters=Math.max(...routes.map(r=>r.distanceMeters));
  const billableKm=Math.max(minimumKm,maxMeters/1000);
  return {status:'COTIZACION_FICTICIA',distanceMeters:maxMeters,billableKm,deliveryCUP:billableKm*ratePerKm,routeCount:routes.length};
}
