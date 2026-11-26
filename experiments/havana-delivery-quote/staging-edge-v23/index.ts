import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.10";
import { isGeocodedPlaceUsable } from "./place-validation.mjs";

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
function normalizedPlaceName(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function streetReferenceMatchesMunicipality(place: any, municipality: string) {
  const expected = normalizedPlaceName(municipality);
  const areas = [place?.municipality, place?.district, place?.state_district, place?.suburb, place?.city]
    .map(normalizedPlaceName).filter(Boolean);
  if (areas.includes(expected)) return true;
  // Geoapify represents some Havana municipalities by their barrios instead
  // of exposing the municipality field. Víbora is within Diez de Octubre.
  if (expected === "diez de octubre") {
    return areas.some(area => ["vibora", "la vibora", "santos suarez", "lawton", "luyano", "sevillano", "vista alegre", "tamarindo", "jesus del monte", "acosta"].includes(area));
  }
  return false;
}
function addressCandidates(address: string, municipality: string) {
  const building = address.match(/\\bedificio\\s*(?:no\\.?\\s*)?#?\\s*(\\d+[a-z]?)\\b/i);
  const streetName = address.match(/\\bjos[eé]\\s+a\\.?\\s*cortina\\b/i)?.[0] ??
    address.match(/\\b(?:calle|calzada|avenida|ave\\.?|carretera)\\s+[^,;]+?(?=\\s+(?:edificio|edif\\.?|apto\\.?|apartamento|entre)\\b|[,;]|$)/i)?.[0] ?? "";
  const neighborhood = address.match(/\\b(v[ií]bora|santos su[aá]rez|lawton|luyan[oó]|sevillano|vista alegre|tamarindo|jes[uú]s del monte|acosta)\\b/i)?.[0] ?? "";
  const intersection = address.match(/\\bentre\\s+(.+?)\\s+y\\s+([^,;.]+)/i);
  const clean = address
    .replace(/\\b(?:apto\\.?|apartamento|interior)\\s*#?\\s*[\\w-]+/gi, " ")
    .replace(/\\bentre\\b[\\s\\S]*$/i, " ")
    .replace(/\\bedificio\\b/gi, " ")
    .replace(/\\s+/g, " ")
    .trim();
  const candidates: URLSearchParams[] = [];
  const seen = new Set<string>();
  const add = (params: URLSearchParams) => {
    params.set("filter", "rect:-83,22.7,-81.9,23.3|countrycode:cu");
    params.set("format", "json");
    params.set("limit", "1");
    params.set("apiKey", GEOAPIFY_KEY);
    const key = params.toString();
    if (!seen.has(key)) { seen.add(key); candidates.push(params); }
  };

  // Prefer the explicit building number and street when the customer supplied both.
  if (building && streetName) {
    const structured = new URLSearchParams();
    structured.set("housenumber", building[1]);
    structured.set("street", streetName);
    structured.set("city", "Havana");
    structured.set("state", "La Habana");
    structured.set("country", "Cuba");
    add(structured);
  }

  // Preserve the customer's complete wording, including the cross streets.
  const detailedText = new URLSearchParams();
  detailedText.set("text", [address, municipality, "La Habana", "Cuba"].join(", "));
  add(detailedText);

  // If the number is not mapped precisely, use the main street plus its between-street reference.
  if (streetName && intersection) {
    const crossingText = new URLSearchParams();
    crossingText.set("text", [streetName, "entre " + intersection[1].trim() + " y " + intersection[2].trim(), neighborhood, municipality, "La Habana", "Cuba"].filter(Boolean).join(", "));
    add(crossingText);
  }

  const freeText = new URLSearchParams();
  freeText.set("text", [clean, municipality, "La Habana", "Cuba"].join(", "));
  add(freeText);

  if (streetName) {
    const streetText = new URLSearchParams();
    streetText.set("text", [streetName, neighborhood, municipality, "La Habana", "Cuba"].filter(Boolean).join(", "));
    streetText.set("type", "street");
    add(streetText);
    const broadStreetText = new URLSearchParams();
    broadStreetText.set("text", [streetName, "Havana", "Cuba"].join(", "));
    broadStreetText.set("type", "street");
    add(broadStreetText);
  }
  return candidates;
}

const ROUTE_CACHE_VERSION = "geoapify-drive-v1";
async function ensureDeliveryAddress(customer: any, destination: any, coordinates: { lat: number; lon: number } | null, routeAddress: string) {
  const query = db.from("clientes_direcciones_entrega").select("id,cliente_numero,nombre_receptor,telefono_receptor,provincia,municipio,barrio,direccion,referencias,latitud,longitud,geocodificacion_precision,geocodificacion_direccion")
    .eq("cliente_numero", customer.numero).eq("provincia", destination.province.trim())
    .eq("municipio", destination.municipality.trim()).eq("barrio", destination.neighborhood)
    .eq("direccion", destination.address.trim()).eq("referencias", destination.references).limit(1).maybeSingle();
  const { data: existing, error: lookupError } = await query;
  if (lookupError) return { data: null, error: true };
  const name = String(destination.name || customer.nombre || "").trim().slice(0, 150) || "Cliente";
  const phone = String(destination.phone || customer.telefono || "").trim().slice(0, 30);
  const now = new Date().toISOString();
  if (existing) {
    const updates: any = { usado_en: now };
    if (coordinates) {
      updates.latitud = coordinates.lat;
      updates.longitud = coordinates.lon;
      updates.geocodificacion_precision = "coordinates";
      updates.geocodificacion_direccion = routeAddress.slice(0, 500);
    }
    const { error } = await db.from("clientes_direcciones_entrega").update(updates)
      .eq("id", existing.id).eq("cliente_numero", customer.numero);
    if (error) return { data: null, error: true };
    return { data: { ...existing, ...updates }, error: false };
  }
  const row: any = {
    cliente_numero: customer.numero, nombre_receptor: name, telefono_receptor: phone,
    provincia: destination.province.trim(), municipio: destination.municipality.trim(),
    barrio: destination.neighborhood, direccion: destination.address.trim(),
    referencias: destination.references, usado_en: now
  };
  if (coordinates) {
    row.latitud = coordinates.lat;
    row.longitud = coordinates.lon;
    row.geocodificacion_precision = "coordinates";
    row.geocodificacion_direccion = routeAddress.slice(0, 500);
  }
  const { data, error } = await db.from("clientes_direcciones_entrega").insert(row)
    .select("id,cliente_numero,nombre_receptor,telefono_receptor,provincia,municipio,barrio,direccion,referencias,latitud,longitud,geocodificacion_precision,geocodificacion_direccion")
    .single();
  return { data: error ? null : data, error: !!error };
}
async function readRouteCache(addressId: number, origins: Map<string, { id: string; name: string; lat: number; lon: number }>, lat: number, lon: number) {
  const { data, error } = await db.from("clientes_direcciones_rutas").select("punto_salida_id,origen_latitud,origen_longitud,destino_latitud,destino_longitud,distancia_km,duracion_segundos,precision_destino,version_ruta")
    .eq("direccion_entrega_id", addressId).eq("version_ruta", ROUTE_CACHE_VERSION)
    .in("punto_salida_id", [...origins.keys()]);
  if (error) return { error: true, routes: new Map<string, any>() };
  const routes = new Map<string, any>();
  for (const row of data ?? []) {
    const origin = origins.get(row.punto_salida_id);
    if (!origin || Number(row.origen_latitud) !== origin.lat || Number(row.origen_longitud) !== origin.lon ||
        Number(row.destino_latitud) !== lat || Number(row.destino_longitud) !== lon) continue;
    routes.set(origin.id, {
      originId: origin.id, originName: origin.name, km: Number(row.distancia_km), billableKm: Math.max(3, Math.round(Number(row.distancia_km))),
      durationSeconds: Number(row.duracion_segundos), provider: "Geoapify",
      status: row.precision_destino === "street" ? "approximate" : "verified",
      precision: row.precision_destino
    });
  }
  return { error: false, routes };
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
  const productIds = input?.productIds;
  const resolveByProduct = Array.isArray(productIds);
  const suppliedCoordinates = destination?.coordinates;
  const hasCoordinates = suppliedCoordinates !== undefined;
  const neighborhood = typeof destination?.neighborhood === "string" ? destination.neighborhood.trim() : "";
  const references = typeof destination?.references === "string" ? destination.references.trim() : "";
  const streetAddress = typeof destination?.address === "string" ? destination.address.trim() : "";
  const routeAddress = [neighborhood, streetAddress, references].filter(Boolean).join(", ");
  const normalizedDestination = destination && typeof destination === "object" ? {
    ...destination, address: streetAddress, neighborhood, references
  } : null;
  if (!destination || typeof destination !== "object" || typeof destination.address !== "string" ||
      typeof destination.municipality !== "string" || typeof destination.province !== "string" ||
      destination.province !== "La Habana" || streetAddress.length < 8 || streetAddress.length > 500 ||
      neighborhood.length > 150 || references.length > 500 || routeAddress.length > 800 ||
      destination.municipality.trim().length < 2 || destination.municipality.length > 100 ||
      (destination.name !== undefined && (typeof destination.name !== "string" || destination.name.length > 150)) ||
      (destination.phone !== undefined && (typeof destination.phone !== "string" || destination.phone.length > 30)) ||
      (hasCoordinates && (!suppliedCoordinates || typeof suppliedCoordinates !== "object" || Array.isArray(suppliedCoordinates) ||
        !Number.isFinite(Number(suppliedCoordinates.lat)) || !Number.isFinite(Number(suppliedCoordinates.lon)) ||
        !inBounds(Number(suppliedCoordinates.lat), Number(suppliedCoordinates.lon)))) ||
      (resolveByProduct && (assignments !== undefined || productIds.length < 1 || productIds.length > 20 ||
        productIds.some((id: unknown) => typeof id !== "string" || id.length < 1 || id.length > 160) ||
        new Set(productIds).size !== productIds.length)) ||
      (!resolveByProduct && (!Array.isArray(assignments) || assignments.length < 1 || assignments.length > 20))) {
    return reply(400, pending("INVALID_DELIVERY_CONTEXT"), cors);
  }
  const seen = new Set<string>();
  if (!resolveByProduct) {
    for (const item of assignments) {
      if (!item || typeof item.productId !== "string" || item.productId.length < 1 || item.productId.length > 160 ||
          typeof item.originId !== "string" || item.originId.length < 1 || item.originId.length > 160) return reply(400, pending("INVALID_ASSIGNMENT"), cors);
      const key = item.productId + "\u0000" + item.originId;
      if (seen.has(key)) return reply(400, pending("DUPLICATE_ASSIGNMENT"), cors);
      seen.add(key);
    }
  }
  const session = await db.rpc("ed_cliente_sesion_privada", { p_token_hash: await sha256(bearer), p_revocar: false });
  if (session.error || !session.data?.numero) return reply(401, pending("CUSTOMER_SESSION_INVALID"), cors);
  const customer = session.data;

  const origins = new Map<string, { id: string; name: string; lat: number; lon: number }>();
  if (resolveByProduct) {
    for (const productId of productIds as string[]) {
      const resolved = await db.rpc("ed_geoapify_route_origins_for_product", { p_product_id: productId });
      if (resolved.error || !Array.isArray(resolved.data) || !resolved.data.length) return reply(409, pending("PRODUCT_ORIGIN_NOT_VERIFIED"), cors);
      for (const origin of resolved.data) {
        if (!origin || typeof origin.id !== "string" || !origin.id || !inBounds(Number(origin.lat), Number(origin.lon))) return reply(409, pending("PRODUCT_ORIGIN_NOT_VERIFIED"), cors);
        origins.set(origin.id, { id: origin.id, name: String(origin.name || origin.id), lat: Number(origin.lat), lon: Number(origin.lon) });
      }
    }
  } else {
    for (const item of assignments) {
      const checked = await db.rpc("ed_geoapify_route_origin_valid", { p_product_id: item.productId, p_origin_id: item.originId });
      if (checked.error || !checked.data || !inBounds(Number(checked.data.lat), Number(checked.data.lon))) {
        return reply(409, pending("PRODUCT_ORIGIN_NOT_VERIFIED"), cors);
      }
      origins.set(item.originId, checked.data);
    }
  }
  if (origins.size < 1 || origins.size > 10) return reply(400, pending("TOO_MANY_ORIGINS"), cors);

  const savedAddress = await ensureDeliveryAddress(customer, normalizedDestination,
    hasCoordinates ? { lat: Number(suppliedCoordinates.lat), lon: Number(suppliedCoordinates.lon) } : null, routeAddress);
  if (savedAddress.error || !savedAddress.data) return reply(503, pending("DESTINATION_CACHE_UNAVAILABLE"), cors);
  const deliveryAddress = savedAddress.data;

  let place: any = null;
  let precision: "address" | "street" | "coordinates" = "address";
  let routePrecision: "address" | "street" | "coordinates" = "address";
  let usedSavedCoordinates = false;
  if (hasCoordinates) {
    place = { lat: Number(suppliedCoordinates.lat), lon: Number(suppliedCoordinates.lon), formatted: routeAddress };
    precision = "coordinates";
    routePrecision = "coordinates";
  } else if (inBounds(Number(deliveryAddress.latitud), Number(deliveryAddress.longitud))) {
    usedSavedCoordinates = true;
    place = {
      lat: Number(deliveryAddress.latitud), lon: Number(deliveryAddress.longitud),
      formatted: String(deliveryAddress.geocodificacion_direccion || routeAddress)
    };
    precision = "coordinates";
    routePrecision = deliveryAddress.geocodificacion_precision === "street" ? "street" :
      deliveryAddress.geocodificacion_precision === "address" ? "address" : "coordinates";
  }

  let cachedRoutes = new Map<string, any>();
  if (place) {
    const cache = await readRouteCache(deliveryAddress.id, origins, Number(place.lat), Number(place.lon));
    if (cache.error) return reply(503, pending("ROUTE_CACHE_READ_FAILED"), cors);
    cachedRoutes = cache.routes;
  }
  let pendingOrigins = [...origins.values()].filter(origin => !cachedRoutes.has(origin.id));
  if (place && pendingOrigins.length === 0) {
    const routes = [...cachedRoutes.values()];
    const approximate = routes.some(route => route.precision === "street");
    return reply(200, {
      status: approximate ? "RUTAS_VIALES_APROXIMADAS" : "RUTAS_VIALES_REALES", reason: null,
      destination: { lat: Number(place.lat), lon: Number(place.lon), formatted: String(place.formatted ?? routeAddress).slice(0, 240), precision: routePrecision },
      routes, cache: { reused: routes.length, calculated: 0 }
    }, cors);
  }
  const reservation = await db.rpc("ed_reserve_geoapify_credits", {
    p_credits: pendingOrigins.length + (place ? 0 : 8)
  });
  if (reservation.error || reservation.data !== true) return reply(429, pending("STAGING_DAILY_ROUTE_BUDGET_EXHAUSTED"), cors);
  let approximatePlace: any = null;
  let approximatePlaceScore = -1;
  const requestedBuildingNumber = routeAddress.match(/\\bedificio\\s*(?:no\\.?\\s*)?#?\\s*(\\d+[a-z]?)\\b/i)?.[1] ?? "";
  const approximateScore = (candidate: any, streetConfidence: number) => {
    const indexedAddress = normalizedPlaceName([candidate?.housenumber, candidate?.address_line1, candidate?.formatted].filter(Boolean).join(" "));
    const includesBuildingNumber = !!requestedBuildingNumber && indexedAddress.split(" ").includes(normalizedPlaceName(requestedBuildingNumber));
    return (includesBuildingNumber ? 200 : 0) + (String(candidate?.result_type) === "building" ? 100 : 0) + streetConfidence;
  };
  for (const params of place ? [] : addressCandidates(routeAddress, destination.municipality.trim())) {
    const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");
    geocodeUrl.search = params.toString();
    let geocoded: any;
    try {
      const response = await fetch(geocodeUrl, { signal: AbortSignal.timeout(10000), headers: { "Accept": "application/json" } });
      if (!response.ok) return reply(502, pending("GEOCODING_PROVIDER_ERROR"), cors);
      geocoded = await response.json();
    } catch { return reply(502, pending("GEOCODING_UNAVAILABLE"), cors); }
    const matches = Array.isArray(geocoded?.results) ? geocoded.results : [];
    const candidate = matches[0];
    if (!candidate) continue;
    const candidateLat = Number(candidate.lat), candidateLon = Number(candidate.lon);
    const confidence = Number(candidate.rank?.confidence);
    const verifiedArea = normalizedPlaceName(candidate.city) === "havana" && streetReferenceMatchesMunicipality(candidate, destination.municipality.trim());
    if (candidate.country_code === "cu" && inBounds(candidateLat, candidateLon) && Number.isFinite(confidence) && confidence >= 0.6 &&
        candidate.result_type !== "street") {
      place = candidate;
      precision = "address";
      break;
    }
    const streetConfidence = Number(candidate.rank?.confidence_street_level);
    if (candidate.country_code === "cu" && inBounds(candidateLat, candidateLon) && verifiedArea &&
        ["street", "building"].includes(String(candidate.result_type)) && Number.isFinite(streetConfidence) && streetConfidence >= 0.75 &&
        approximateScore(candidate, streetConfidence) > approximatePlaceScore) {
      approximatePlace = candidate;
      approximatePlaceScore = approximateScore(candidate, streetConfidence);
    }
  }
  if (!place && !hasCoordinates) {
    const neighborhood = routeAddress.match(/\b(v[ií]bora|santos su[aá]rez|lawton|luyan[oó]|sevillano|vista alegre|tamarindo|jes[uú]s del monte|acosta)\b/i)?.[0] ?? "";
    const street = routeAddress.match(/\bjos[eé]\s+a\.?\s*cortina\b/i)?.[0] ??
      routeAddress.match(/\b(?:calle|calzada|avenida|ave\.?|carretera)\s+[^,;]+?(?=\s+(?:edificio|edif\.?|apto\.?|apartamento|entre)\b|[,;]|$)/i)?.[0] ?? "";
    const queries = [
      [routeAddress, destination.municipality.trim(), "La Habana", "Cuba"].join(", "),
      [street, neighborhood, "Havana", "Cuba"].filter(Boolean).join(", "),
    ].filter((query, index, all) => query && all.indexOf(query) === index);
    for (const query of queries) {
      const autocompleteUrl = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      autocompleteUrl.searchParams.set("text", query);
      autocompleteUrl.searchParams.set("filter", "rect:-83,22.7,-81.9,23.3|countrycode:cu");
      autocompleteUrl.searchParams.set("format", "json");
      autocompleteUrl.searchParams.set("limit", "1");
      autocompleteUrl.searchParams.set("apiKey", GEOAPIFY_KEY);
      if (query === queries[1] && street) autocompleteUrl.searchParams.set("type", "street");
      try {
        const response = await fetch(autocompleteUrl, { signal: AbortSignal.timeout(10000), headers: { "Accept": "application/json" } });
        if (!response.ok) return reply(502, pending("GEOCODING_PROVIDER_ERROR"), cors);
        const body = await response.json();
        const candidate = Array.isArray(body?.results) ? body.results[0] : null;
        const candidateLat = Number(candidate?.lat), candidateLon = Number(candidate?.lon);
        const confidence = Number(candidate?.rank?.confidence);
        const verifiedArea = normalizedPlaceName(candidate?.city) === "havana" && streetReferenceMatchesMunicipality(candidate, destination.municipality.trim());
        if (candidate?.country_code === "cu" && inBounds(candidateLat, candidateLon) && Number.isFinite(confidence) && confidence >= 0.6 &&
            candidate.result_type !== "street") {
          place = candidate;
          precision = "address";
          break;
        }
        const streetConfidence = Number(candidate?.rank?.confidence_street_level);
        if (candidate?.country_code === "cu" && inBounds(candidateLat, candidateLon) && verifiedArea &&
            ["street", "building"].includes(String(candidate?.result_type)) && Number.isFinite(streetConfidence) &&
            streetConfidence >= 0.75 && approximateScore(candidate, streetConfidence) > approximatePlaceScore) {
          approximatePlace = candidate;
          approximatePlaceScore = approximateScore(candidate, streetConfidence);
        }
      } catch { return reply(502, pending("GEOCODING_UNAVAILABLE"), cors); }
    }
  }
  if (!place && approximatePlace) {
    place = approximatePlace;
    precision = "street";
  }
  if (!place) return reply(200, pending("DESTINATION_NOT_CONFIRMED_IN_HAVANA"), cors);
  if (!usedSavedCoordinates) routePrecision = precision;
  const lat = Number(place.lat), lon = Number(place.lon);
  if (!isGeocodedPlaceUsable(place, precision, destination.municipality.trim())) return reply(200, pending("DESTINATION_NOT_CONFIRMED_IN_HAVANA"), cors);
  const formattedDestination = String(place.formatted ?? routeAddress).slice(0, 500);
  if (!usedSavedCoordinates) {
    const { error } = await db.from("clientes_direcciones_entrega").update({
      latitud: lat, longitud: lon, geocodificacion_precision: routePrecision,
      geocodificacion_direccion: formattedDestination, usado_en: new Date().toISOString()
    }).eq("id", deliveryAddress.id).eq("cliente_numero", customer.numero);
    if (error) return reply(503, pending("DESTINATION_CACHE_SAVE_FAILED"), cors);
  }
  if (cachedRoutes.size === 0 && origins.size > 0) {
    const cache = await readRouteCache(deliveryAddress.id, origins, lat, lon);
    if (cache.error) return reply(503, pending("ROUTE_CACHE_READ_FAILED"), cors);
    cachedRoutes = cache.routes;
    pendingOrigins = [...origins.values()].filter(origin => !cachedRoutes.has(origin.id));
  }
  if (pendingOrigins.length === 0) {
    const routes = [...cachedRoutes.values()];
    const approximate = routes.some(route => route.precision === "street");
    return reply(200, {
      status: approximate ? "RUTAS_VIALES_APROXIMADAS" : "RUTAS_VIALES_REALES", reason: null,
      destination: { lat, lon, formatted: formattedDestination, precision: routePrecision },
      routes, cache: { reused: routes.length, calculated: 0 }
    }, cors);
  }

  const freshRoutes: any[] = [];
  for (const point of pendingOrigins) {
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
      freshRoutes.push({
        originId: point.id, originName: point.name, km: meters / 1000, billableKm: Math.max(3, Math.round(meters / 1000)), durationSeconds: seconds,
        provider: "Geoapify", status: routePrecision === "street" ? "approximate" : "verified",
        precision: routePrecision
      });
    } catch { return reply(502, pending("ROUTING_UNAVAILABLE"), cors); }
  }
  if (freshRoutes.length) {
    const cacheRows = freshRoutes.map(route => {
      const point = origins.get(route.originId)!;
      return {
        direccion_entrega_id: deliveryAddress.id, punto_salida_id: route.originId,
        origen_latitud: point.lat, origen_longitud: point.lon,
        destino_latitud: lat, destino_longitud: lon,
        distancia_km: route.km, duracion_segundos: route.durationSeconds,
        precision_destino: routePrecision, proveedor: "Geoapify",
        version_ruta: ROUTE_CACHE_VERSION, calculado_en: new Date().toISOString()
      };
    });
    const { error } = await db.from("clientes_direcciones_rutas")
      .upsert(cacheRows, { onConflict: "direccion_entrega_id,punto_salida_id" });
    if (error) return reply(503, pending("ROUTE_CACHE_SAVE_FAILED"), cors);
  }
  const routeByOrigin = new Map<string, any>([...cachedRoutes.entries()]);
  for (const route of freshRoutes) routeByOrigin.set(route.originId, route);
  const routes = [...origins.values()].map(origin => routeByOrigin.get(origin.id)).filter(Boolean);
  if (routes.length !== origins.size) return reply(503, pending("ROUTE_CACHE_INCOMPLETE"), cors);
  const farthest = [...routes].sort((a, b) => b.km - a.km)[0];
  await db.from("clientes_direcciones_entrega").update({
    distancia_km: farthest.km, punto_salida_id: farthest.originId,
    ruta_version: ROUTE_CACHE_VERSION, calculado_en: new Date().toISOString()
  }).eq("id", deliveryAddress.id).eq("cliente_numero", customer.numero);
  const approximate = routes.some(route => route.precision === "street");
  return reply(200, {
    status: approximate ? "RUTAS_VIALES_APROXIMADAS" : "RUTAS_VIALES_REALES",
    reason: null,
    destination: { lat, lon, formatted: formattedDestination, precision: routePrecision },
    routes,
    cache: { reused: cachedRoutes.size, calculated: freshRoutes.length }
  }, cors);
});