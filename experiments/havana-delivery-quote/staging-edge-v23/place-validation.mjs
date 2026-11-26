const BOUNDS = { latMin: 22.7, latMax: 23.3, lonMin: -83.0, lonMax: -81.9 };

function normalizedPlaceName(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function streetReferenceMatchesMunicipality(place, municipality) {
  const expected = normalizedPlaceName(municipality);
  const areas = [place?.municipality, place?.district, place?.state_district, place?.suburb, place?.city]
    .map(normalizedPlaceName).filter(Boolean);
  if (areas.includes(expected)) return true;
  if (expected === "diez de octubre") {
    return areas.some(area => ["vibora", "la vibora", "santos suarez", "lawton", "luyano", "sevillano", "vista alegre", "tamarindo", "jesus del monte", "acosta"].includes(area));
  }
  return false;
}

export function isGeocodedPlaceUsable(place, precision, municipality) {
  const lat = Number(place?.lat), lon = Number(place?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < BOUNDS.latMin || lat > BOUNDS.latMax || lon < BOUNDS.lonMin || lon > BOUNDS.lonMax) return false;
  if (precision === "coordinates") return true;
  if (precision === "address") return Number.isFinite(Number(place?.rank?.confidence)) && Number(place.rank.confidence) >= 0.6;
  if (precision !== "street") return false;
  return place?.country_code === "cu" && normalizedPlaceName(place?.city) === "havana" &&
    ["street", "building"].includes(String(place?.result_type)) &&
    Number.isFinite(Number(place?.rank?.confidence_street_level)) && Number(place.rank.confidence_street_level) >= 0.75 &&
    streetReferenceMatchesMunicipality(place, municipality);
}
