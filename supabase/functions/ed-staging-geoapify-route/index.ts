import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEOAPIFY_KEY = Deno.env.get("GEOAPIFY_API_KEY") ?? "";
const ALLOWED_ORIGIN = "https://liuben810921.github.io";
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const BOUNDS = { latMin: 22.7, latMax: 23.3, lonMin: -83.0, lonMax: -81.9 };
const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin" };

function reply(status: number, body: unknown, origin?: string | null) {
  const headers = new Headers(jsonHeaders);
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(JSON.stringify(body), { status, headers });
}
function inBounds(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= BOUNDS.latMin && lat <= BOUNDS.latMax && lon >= BOUNDS.lonMin && lon <= BOUNDS.lonMax;
}
async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function pending(reason: string) {
  return { status: "PENDIENTE", reason, routes: [], destination: null };
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = origin === ALLOWED_ORIGIN ? origin : null;
  if (req.method === "OPTIONS") {
    const headers = new Headers({ ...jsonHeaders, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Max-Age": "300" });
    if (cors) headers.set("Access-Control-Allow-Origin", cors);
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") return reply(405, pending("METHOD_NOT_ALLOWED"), cors);
  if (!cors) return reply(403, pending("ORIGIN_NOT_ALLOWED"));
  if (!SUPABASE_URL || !SERVICE_KEY) return reply(503, pending("STAGING_DATABASE_UNAVAILABLE"), cors);
  if (!GEOAPIFY_KEY) return reply(503, pending("GEOAPIFY_API_KEY_NOT_CONFIGURED"), cors);
  const media = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (media !== "application/json") return reply(415, pending("JSON_REQUIRED"), cors);
  const bearer = (req.headers.get("authorization") ?? "").match(/^Bearer ([a-f0-9]{64})$/i)?.[1] ?? "";
  if (!bearer) return reply(401, pending("CUSTOMER_SESSION_REQUIRED"), cors);
  let raw = "";
  try {
    raw = await req.text();
    if (new TextEncoder().encode(raw).length > 12288) return reply(413, pending("BODY_TOO_LARGE"), cors);
  } catch { return reply(400, pending("INVALID_BODY"), cors); }
  let input: any;
  try { input = JSON.parse(raw); } catch { return reply(400, pending("INVALID_JSON"), cors); }
  const destination = input?.destination;
  const assignments = input?.assignments;
  if (!destination || typeof destination !== "object" || typeof destination.address !== "string" ||
      typeof destination.municipality !== "string" || typeof destination.province !== "string" ||
      destination.province !== "La Habana" || destination.address.trim().length < 8 || destination.address.length > 500 ||
      destination.municipality.trim().length < 2 || destination.municipality.length > 100 ||
      !Array.isArray(assignments) || assignments.length < 1 || assignments.length > 20) {
    return reply(400, pending("INVALID_DELIVERY_CONTEXT"), cors);
  }
  const seen = new Set<string>();
  for (const item of assignments) {
    if (!item || typeof item.productId !== "string" || item.productId.length < 1 || item.productId.length > 160 ||
        typeof item.originId !== "string" || item.originId.length < 1 || item.originId.length > 160) return reply(400, pending("INVALID_ASSIGNMENT"), cors);
    const key = item.productId + "\u0000" + item.originId;
    if (seen.has(key)) return reply(400, pending("DUPLICATE_ASSIGNMENT"), cors);
    seen.add(key);
  }
  const auth = await db.rpc("ed_geoapify_session_valid", { p_token_hash: await sha256(bearer) });
  if (auth.error || auth.data !== true) return reply(401, pending("CUSTOMER_SESSION_INVALID"), cors);

  const origins = new Map<string, { id: string; name: string; lat: number; lon: number }>();
  for (const item of assignments) {
    const checked = await db.rpc("ed_geoapify_route_origin_valid", { p_product_id: item.productId, p_origin_id: item.originId });
    if (checked.error || !checked.data || !inBounds(Number(checked.data.lat), Number(checked.data.lon))) {
      return reply(409, pending("PRODUCT_ORIGIN_NOT_VERIFIED"), cors);
    }
    origins.set(item.originId, checked.data);
  }
  if (origins.size < 1 || origins.size > 10) return reply(400, pending("TOO_MANY_ORIGINS"), cors);

  const reservation = await db.rpc("ed_reserve_geoapify_credits", { p_credits: origins.size + 1 });
  if (reservation.error || reservation.data !== true) return reply(429, pending("STAGING_DAILY_ROUTE_BUDGET_EXHAUSTED"), cors);

  const addressText = [destination.address.trim(), destination.municipality.trim(), "La Habana", "Cuba"].join(", ");
  const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");
  geocodeUrl.searchParams.set("text", addressText);
  geocodeUrl.searchParams.set("filter", "rect:-83,22.7,-81.9,23.3|countrycode:cu");
  geocodeUrl.searchParams.set("format", "json");
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("apiKey", GEOAPIFY_KEY);
  let geocoded: any;
  try {
    const response = await fetch(geocodeUrl, { signal: AbortSignal.timeout(10000), headers: { "Accept": "application/json" } });
    if (!response.ok) return reply(502, pending("GEOCODING_PROVIDER_ERROR"), cors);
    geocoded = await response.json();
  } catch { return reply(502, pending("GEOCODING_UNAVAILABLE"), cors); }
  const matches = Array.isArray(geocoded?.results) ? geocoded.results : [];
  if (!matches.length) return reply(200, pending("DESTINATION_NOT_FOUND"), cors);
  const place = matches[0];
  const lat = Number(place.lat), lon = Number(place.lon), confidence = Number(place.rank?.confidence);
  if (!inBounds(lat, lon) || !Number.isFinite(confidence) || confidence < 0.6) return reply(200, pending("DESTINATION_NOT_CONFIRMED_IN_HAVANA"), cors);

  const routes = [];
  for (const point of origins.values()) {
    const routeUrl = new URL("https://api.geoapify.com/v1/routing");
    routeUrl.searchParams.set("waypoints", point.lat + "," + point.lon + "|" + lat + "," + lon);
    routeUrl.searchParams.set("mode", "drive");
    routeUrl.searchParams.set("format", "geojson");
    routeUrl.searchParams.set("apiKey", GEOAPIFY_KEY);
    try {
      const response = await fetch(routeUrl, { signal: AbortSignal.timeout(12000), headers: { "Accept": "application/json" } });
      if (!response.ok) return reply(502, pending("ROUTING_PROVIDER_ERROR"), cors);
      const body = await response.json();
      const feature = body?.features?.length === 1 ? body.features[0] : null;
      const meters = Number(feature?.properties?.distance), seconds = Number(feature?.properties?.time);
      if (!feature || !["LineString", "MultiLineString"].includes(feature?.geometry?.type) ||
          !Number.isFinite(meters) || meters < 0 || meters > 300000 || !Number.isFinite(seconds) || seconds < 0) {
        return reply(200, pending("ROAD_ROUTE_NOT_AVAILABLE"), cors);
      }
      routes.push({ originId: point.id, originName: point.name, km: meters / 1000, durationSeconds: seconds, provider: "Geoapify", status: "verified" });
    } catch { return reply(502, pending("ROUTING_UNAVAILABLE"), cors); }
  }
  return reply(200, { status: "RUTAS_VIALES_REALES", reason: null, destination: { lat, lon, formatted: String(place.formatted ?? "").slice(0, 240) }, routes }, cors);
});
