// Negocios del mapa (OpenStreetMap, Google Places o demostración) y enlaces a Google Maps.
import { haversineKm } from "@/lib/geo";
import { poiGroups } from "@/lib/transit";

const KIND_LABEL = {
  restaurant: "Restaurante", cafe: "Cafetería", fast_food: "Comida rápida", bar: "Bar", pub: "Bar",
  ice_cream: "Nevería", food_court: "Zona de comida", bank: "Banco", pharmacy: "Farmacia", chemist: "Farmacia",
  school: "Escuela", university: "Universidad", college: "Instituto", marketplace: "Mercado", cinema: "Cine",
  theatre: "Teatro", hospital: "Hospital", clinic: "Clínica", place_of_worship: "Templo", library: "Biblioteca",
  post_office: "Correos", bus_station: "Terminal de autobuses", hotel: "Hotel", hostel: "Hostal",
  guest_house: "Casa de huéspedes", museum: "Museo", attraction: "Atracción turística", gallery: "Galería",
  office: "Oficina", shop: "Tienda", supermarket: "Supermercado", convenience: "Tienda de conveniencia",
  clothes: "Ropa", shoes: "Zapatería", bakery: "Panadería", pastry: "Pastelería", butcher: "Carnicería",
  hairdresser: "Estética", beauty: "Salón de belleza", cosmetics: "Cosméticos", mobile_phone: "Celulares",
  electronics: "Electrónica", computer: "Computación", hardware: "Ferretería", doityourself: "Ferretería",
  stationery: "Papelería", copyshop: "Copias e impresiones", books: "Librería", jewelry: "Joyería",
  optician: "Óptica", furniture: "Muebles", car_repair: "Taller mecánico", car: "Agencia de autos",
  car_parts: "Refacciones", tyres: "Llantera", mall: "Plaza comercial", department_store: "Tienda departamental",
  greengrocer: "Frutería", alcohol: "Vinos y licores", beverages: "Bebidas", confectionery: "Dulcería",
  gift: "Regalos", toys: "Juguetería", sports: "Deportes", florist: "Florería", laundry: "Lavandería",
  dry_cleaning: "Tintorería", variety_store: "Tienda de variedades", kiosk: "Kiosko", pet: "Mascotas",
  travel_agency: "Agencia de viajes", tailor: "Sastrería", tattoo: "Tatuajes", bicycle: "Bicicletas",
  motorcycle: "Motos", paint: "Pinturas", music: "Música", art: "Arte", craft: "Artesanías",
  seafood: "Pescadería", deli: "Salchichonería", dairy: "Lácteos", tobacco: "Tabaquería",
  medical_supply: "Material médico", bag: "Bolsas", fabric: "Telas", photo: "Fotografía",
  massage: "Masajes", funeral_directors: "Funeraria", money_lender: "Casa de empeño", pawnbroker: "Casa de empeño",
};

export const businessGroups = Object.fromEntries(
  Object.entries(poiGroups).filter(([id]) => id !== "transport"),
);

export function kindLabel(kind, group) {
  return KIND_LABEL[kind] ?? poiGroups[group]?.label ?? "Negocio";
}

/** Negocios con nombre de OpenStreetMap dentro de un radio, del más cercano al más lejano. */
export function businessesAround(osmPois, center, radiusM) {
  if (!center) return [];
  const out = [];
  const seen = [];
  for (const p of osmPois) {
    if (!p.name || p.group === "transport") continue;
    const distanceM = Math.round(haversineKm(center, [p.lat, p.lng]) * 1000);
    if (distanceM > radiusM) continue;
    // OSM a veces trae el mismo lugar como punto y como edificio.
    if (seen.some((s) => s.name === p.name && haversineKm([s.lat, s.lng], [p.lat, p.lng]) < 0.08)) continue;
    seen.push(p);
    out.push({
      id: `osm-${p.id}`,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      group: p.group,
      type: kindLabel(p.kind, p.group),
      distanceM,
      source: "osm",
    });
  }
  return out.sort((a, b) => a.distanceM - b.distanceM);
}

/** Convierte un punto de OSM del mapa en negocio seleccionable. */
export function businessFromPoi(p) {
  return {
    id: `osm-${p.id}`,
    name: p.name || kindLabel(p.kind, p.group),
    lat: p.lat,
    lng: p.lng,
    group: p.group,
    type: kindLabel(p.kind, p.group),
    source: p.name ? "osm" : "unnamed",
  };
}

// ---------- Google Maps ----------

/** Texto que Google Maps entiende para encontrar el negocio real. */
function searchText(b) {
  if (b.source === "google" || b.source === "osm") return `${b.name}, Morelia`;
  return `${b.lat},${b.lng}`;
}

/** Vista embebida de Google Maps (no requiere clave). */
export function googleEmbedUrl({ q, lat, lng, zoom = 17, satellite = false }) {
  const params = new URLSearchParams({ z: String(zoom), hl: "es", output: "embed" });
  if (q) params.set("q", q);
  if (lat != null) params.set("ll", `${lat},${lng}`);
  if (satellite) params.set("t", "k");
  return `https://maps.google.com/maps?${params}`;
}

export function businessEmbedUrl(b, satellite = false) {
  return googleEmbedUrl({ q: searchText(b), lat: b.lat, lng: b.lng, zoom: 18, satellite });
}

export function googleMapsLink(b) {
  const params = new URLSearchParams({ api: "1", query: searchText(b) });
  if (b.googleId) params.set("query_place_id", b.googleId);
  return `https://www.google.com/maps/search/?${params}`;
}

/**
 * Dónde poner la cámara de Street View para ver la fachada: en la calle más cercana
 * (si está a menos de 45 m) mirando hacia el negocio.
 */
export function streetCamera({ roads = [], streets = [] }, { lat, lng }) {
  let best = null;
  let bestD = 45;
  for (const list of [roads, streets]) {
    for (const r of list) {
      if (Math.abs(r.lat - lat) > 0.0005 || Math.abs(r.lng - lng) > 0.0005) continue;
      const d = haversineKm([lat, lng], [r.lat, r.lng]) * 1000;
      if (d < bestD && d > 4) {
        best = r;
        bestD = d;
      }
    }
  }
  if (!best) return { lat, lng, heading: 0 };
  const y = (lng - best.lng) * Math.cos((lat * Math.PI) / 180);
  const x = lat - best.lat;
  const heading = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  return { lat: best.lat, lng: best.lng, heading };
}

/** Street View embebido (no requiere clave). */
export function streetViewEmbedUrl(camera) {
  return `https://maps.google.com/maps?layer=c&cbll=${camera.lat},${camera.lng}&cbp=11,${camera.heading},0,0,0&hl=es&output=svembed`;
}

export function streetViewLink({ lat, lng }, camera) {
  const heading = camera ? `&heading=${camera.heading}` : "";
  const at = camera ? `${camera.lat},${camera.lng}` : `${lat},${lng}`;
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${at}${heading}`;
}
