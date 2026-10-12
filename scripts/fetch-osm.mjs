// Descarga calles y puntos de interés de Morelia desde OpenStreetMap (Overpass)
// y los guarda compactos en public/data/morelia-osm.json.
// Uso: npm run data:osm

import { mkdir, writeFile } from "node:fs/promises";

const BBOX = [19.655, -101.255, 19.745, -101.135];
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
export const ROAD_CLASSES = [
  "motorway", "trunk", "primary", "secondary", "tertiary",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
  "pedestrian", "living_street", "footway",
  "residential", "unclassified",
];
const GROUPS = ["food", "shop", "work", "transport", "leisure"];
const FOOD = new Set(["restaurant", "cafe", "fast_food", "bar", "pub", "ice_cream", "food_court"]);
const WORK = new Set(["school", "university", "college", "hospital", "clinic", "library", "post_office", "bank"]);
const LEISURE = new Set(["cinema", "theatre", "place_of_worship"]);

function group(t) {
  if (t.highway === "bus_stop" || t.amenity === "bus_station") return "transport";
  if (t.amenity && FOOD.has(t.amenity)) return "food";
  if (t.shop || t.amenity === "marketplace" || t.amenity === "pharmacy") return "shop";
  if (t.office || (t.amenity && WORK.has(t.amenity))) return "work";
  if (t.tourism || (t.amenity && LEISURE.has(t.amenity))) return "leisure";
  return "shop";
}

// Lugares que atraen mucha gente cuentan como varios comercios.
const GENERATORS = {
  amenity: { marketplace: 20, university: 12, college: 8, hospital: 10, bus_station: 12, school: 4, cinema: 5, theatre: 4, clinic: 2, place_of_worship: 2 },
  shop: { mall: 15, department_store: 6, supermarket: 5 },
  tourism: { museum: 3, attraction: 3, hotel: 2 },
};

function weight(t) {
  for (const [key, table] of Object.entries(GENERATORS)) {
    if (t[key] && table[t[key]]) return table[t[key]];
  }
  return 1;
}

function kind(t) {
  if (t.highway === "bus_stop") return "bus_stop";
  if (t.amenity) return t.amenity;
  if (t.shop) return t.shop === "yes" ? "shop" : t.shop;
  if (t.office) return "office";
  return t.tourism ?? "";
}

const [s, w, n, e] = BBOX;
const b = `(${s},${w},${n},${e})`;
const query = `[out:json][timeout:180];
way["highway"~"^((motorway|trunk|primary|secondary|tertiary)(_link)?|pedestrian|living_street|footway|residential|unclassified)$"]${b};
out geom qt;
(
  nwr["shop"]${b};
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|bank|pharmacy|school|university|college|marketplace|cinema|theatre|hospital|clinic|place_of_worship|library|post_office|bus_station)$"]${b};
  nwr["office"]${b};
  nwr["tourism"~"^(hotel|hostel|museum|attraction|guest_house|gallery)$"]${b};
  node["highway"="bus_stop"]${b};
);
out center qt;`;

async function download() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "User-Agent": "GeoNegocio/0.1 (ITM Start Point)" },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(200000),
      });
      if (res.ok) return res.json();
      console.warn(`${url} → ${res.status}, reintentando…`);
    } catch (err) {
      console.warn(`${url} → ${err.message}, reintentando…`);
    }
    await new Promise((r) => setTimeout(r, 10000 * (attempt + 1)));
  }
  throw new Error("Overpass no respondió");
}

const E5 = (v) => Math.round(v * 1e5);
const t0 = Date.now();
const { elements } = await download();

const roads = [];
const pois = [];
for (const el of elements) {
  const hw = el.tags?.highway;
  const cls = ROAD_CLASSES.indexOf(hw);
  if (el.type === "way" && el.geometry && cls >= 0) {
    const row = [el.id, cls];
    let plat = 0;
    let plng = 0;
    for (const p of el.geometry) {
      const lat = E5(p.lat);
      const lng = E5(p.lon);
      row.push(lat - plat, lng - plng);
      plat = lat;
      plng = lng;
    }
    roads.push(row);
    continue;
  }
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || !el.tags) continue;
  pois.push([E5(lat), E5(lng), GROUPS.indexOf(group(el.tags)), el.tags.name ?? "", weight(el.tags), kind(el.tags)]);
}

const out = { v: 3, bbox: BBOX, generated: new Date().toISOString().slice(0, 10), classes: ROAD_CLASSES, groups: GROUPS, roads, pois };
await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
const json = JSON.stringify(out);
await writeFile(new URL("../public/data/morelia-osm.json", import.meta.url), json);
console.log(`Listo en ${Math.round((Date.now() - t0) / 1000)} s: ${roads.length} vías, ${pois.length} puntos, ${(json.length / 1e6).toFixed(2)} MB`);
