// Calles y puntos de interés de OpenStreetMap.
// Morelia viene precargada en public/data/morelia-osm.json (npm run data:osm);
// fuera de esa zona se consulta Overpass por celdas cacheadas.

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const STATIC_URL = `${import.meta.env.BASE_URL}data/morelia-osm.json`;

export const CELL = 0.025;
const MAX_CELLS = 6;
const SAMPLE_M = 30;

const cache = new Map();
const pending = new Map();
let staticData = null;
let staticBbox = null;
let staticPromise = null;

const ROAD_WEIGHT = {
  motorway: 1, trunk: 1, primary: 0.9, secondary: 0.7, tertiary: 0.45,
  motorway_link: 0.6, trunk_link: 0.6, primary_link: 0.55, secondary_link: 0.45, tertiary_link: 0.3,
};
const FOOT_WEIGHT = { pedestrian: 1, living_street: 0.6, footway: 0.35 };

const FOOD = new Set(["restaurant", "cafe", "fast_food", "bar", "pub", "ice_cream", "food_court"]);
const WORK = new Set(["school", "university", "college", "hospital", "clinic", "library", "post_office", "bank"]);
const LEISURE = new Set(["cinema", "theatre", "place_of_worship"]);

function poiGroup(t) {
  if (t.highway === "bus_stop" || t.amenity === "bus_station") return "transport";
  if (t.amenity && FOOD.has(t.amenity)) return "food";
  if (t.shop || t.amenity === "marketplace" || t.amenity === "pharmacy") return "shop";
  if (t.office || (t.amenity && WORK.has(t.amenity))) return "work";
  if (t.tourism || (t.amenity && LEISURE.has(t.amenity))) return "leisure";
  return "shop";
}

// Lugares que atraen mucha gente cuentan como varios comercios (igual que scripts/fetch-osm.mjs).
const GENERATORS = {
  amenity: { marketplace: 20, university: 12, college: 8, hospital: 10, bus_station: 12, school: 4, cinema: 5, theatre: 4, clinic: 2, place_of_worship: 2 },
  shop: { mall: 15, department_store: 6, supermarket: 5 },
  tourism: { museum: 3, attraction: 3, hotel: 2 },
};

function poiWeight(t) {
  for (const [key, table] of Object.entries(GENERATORS)) {
    if (t[key] && table[t[key]]) return table[t[key]];
  }
  return 1;
}

function poiKind(t) {
  if (t.highway === "bus_stop") return "bus_stop";
  if (t.amenity) return t.amenity;
  if (t.shop) return t.shop === "yes" ? "shop" : t.shop;
  if (t.office) return "office";
  return t.tourism ?? "";
}

function metersBetween(lat1, lng1, lat2, lng2) {
  const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360) * 111320;
  const y = (lat2 - lat1) * 110540;
  return Math.hypot(x, y);
}

// Calles locales: no cuentan para el tránsito, solo sirven para orientar Street View.
const LOCAL_STREETS = new Set(["residential", "unclassified"]);

/** Convierte una vía en puntos cada ~30 m con su peso y longitud. */
function sampleWay(id, highway, coords, out, streets) {
  if (LOCAL_STREETS.has(highway)) {
    if (streets) sampleStreet(coords, streets);
    return;
  }
  const vehicular = highway in ROAD_WEIGHT;
  const w = vehicular ? ROAD_WEIGHT[highway] : FOOT_WEIGHT[highway];
  if (!w) return;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[i + 1];
    const len = metersBetween(lat1, lng1, lat2, lng2);
    const steps = Math.max(1, Math.round(len / SAMPLE_M));
    for (let k = 0; k < steps; k++) {
      const t = (k + 0.5) / steps;
      out.push({ id, lat: lat1 + (lat2 - lat1) * t, lng: lng1 + (lng2 - lng1) * t, w, len: len / steps, vehicular });
    }
  }
}

function sampleStreet(coords, out) {
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[i + 1];
    const steps = Math.max(1, Math.round(metersBetween(lat1, lng1, lat2, lng2) / 12));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      out.push({ lat: lat1 + (lat2 - lat1) * t, lng: lng1 + (lng2 - lng1) * t });
    }
  }
}

// ---------- Archivo precargado ----------

function decodeStatic(json) {
  const roads = [];
  const streets = [];
  for (const row of json.roads) {
    const [id, cls] = row;
    const coords = [];
    let lat = 0;
    let lng = 0;
    for (let i = 2; i < row.length; i += 2) {
      lat += row[i];
      lng += row[i + 1];
      coords.push([lat / 1e5, lng / 1e5]);
    }
    sampleWay(id, json.classes[cls], coords, roads, streets);
  }
  const pois = json.pois.map(([lat, lng, g, name, weight = 1, kind = ""], i) => ({
    id: `s${i}`,
    lat: lat / 1e5,
    lng: lng / 1e5,
    group: json.groups[g],
    name,
    weight,
    kind,
  }));
  return { roads, pois, streets };
}

function loadStatic() {
  if (!staticPromise) {
    staticPromise = fetch(STATIC_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`static ${res.status}`))))
      .then((json) => {
        staticData = decodeStatic(json);
        staticBbox = json.bbox;
      })
      .catch((e) => console.warn("Sin datos precargados de OSM:", e));
  }
  return staticPromise;
}

function insideStatic(s, w, n, e) {
  if (!staticBbox) return false;
  const [bs, bw, bn, be] = staticBbox;
  return s >= bs && w >= bw && n <= bn && e <= be;
}

// ---------- Overpass ----------

function query(s, w, n, e) {
  const b = `(${s},${w},${n},${e})`;
  return `[out:json][timeout:25];
way["highway"~"^((motorway|trunk|primary|secondary|tertiary)(_link)?|pedestrian|living_street|footway)$"]${b};
out geom qt;
(
  nwr["shop"]${b};
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|bank|pharmacy|school|university|college|marketplace|cinema|theatre|hospital|clinic|place_of_worship|library|post_office|bus_station)$"]${b};
  nwr["office"]${b};
  nwr["tourism"~"^(hotel|hostel|museum|attraction|guest_house|gallery)$"]${b};
  node["highway"="bus_stop"]${b};
);
out center qt;`;
}

function parseOverpass(elements) {
  const roads = [];
  const pois = [];
  for (const el of elements) {
    const hw = el.tags?.highway;
    if (el.type === "way" && el.geometry && hw) {
      sampleWay(el.id, hw, el.geometry.map((p) => [p.lat, p.lon]), roads);
      continue;
    }
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || !el.tags) continue;
    pois.push({ id: `${el.type}${el.id}`, lat, lng, group: poiGroup(el.tags), name: el.tags.name ?? "", weight: poiWeight(el.tags), kind: poiKind(el.tags) });
  }
  return { roads, pois };
}

async function fetchCell(key) {
  const [i, j] = key.split(":").map(Number);
  const s = i * CELL;
  const w = j * CELL;
  const body = new URLSearchParams({ data: query(s, w, s + CELL, w + CELL) });
  let lastError;
  for (const url of ENDPOINTS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { method: "POST", body, headers: { Accept: "application/json" } });
        if (res.status === 429 || res.status === 504) {
          lastError = new Error(`Overpass ${res.status}`);
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        const json = await res.json();
        return parseOverpass(json.elements || []);
      } catch (e) {
        lastError = e;
        break;
      }
    }
  }
  throw lastError;
}

function loadCell(key) {
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (pending.has(key)) return pending.get(key);
  const p = fetchCell(key)
    .then((data) => {
      cache.set(key, data);
      return data;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}

function cellsFor(s, w, n, e) {
  const keys = [];
  for (let i = Math.floor(s / CELL); i <= Math.floor(n / CELL); i++) {
    for (let j = Math.floor(w / CELL); j <= Math.floor(e / CELL); j++) {
      if (!insideStatic(i * CELL, j * CELL, (i + 1) * CELL, (j + 1) * CELL)) keys.push(`${i}:${j}`);
    }
  }
  const ci = (s + n) / 2 / CELL;
  const cj = (w + e) / 2 / CELL;
  return keys
    .map((k) => {
      const [i, j] = k.split(":").map(Number);
      return { k, d: Math.hypot(i + 0.5 - ci, j + 0.5 - cj) };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_CELLS)
    .map((x) => x.k);
}

// ---------- API ----------

/** Datos combinados (precargados + celdas de Overpass, sin duplicar vías). */
export function mergedData() {
  const seenWays = new Set();
  const roads = [];
  const pois = [];
  const sources = staticData ? [staticData, ...cache.values()] : [...cache.values()];
  for (const data of sources) {
    const cellWays = new Set();
    for (const r of data.roads) {
      if (seenWays.has(r.id)) continue;
      cellWays.add(r.id);
      roads.push(r);
    }
    cellWays.forEach((id) => seenWays.add(id));
    pois.push(...data.pois);
  }
  return { roads, pois, streets: staticData?.streets ?? [] };
}

/**
 * Asegura los datos de un rectángulo. Las celdas fuera de la zona precargada se piden
 * a Overpass de la más central a la más lejana, de 2 en 2. Devuelve cuántas fallaron.
 */
export async function loadBounds({ south, west, north, east }, onCell) {
  const hadStatic = Boolean(staticData);
  await loadStatic();
  if (!hadStatic && staticData) onCell?.();

  const queue = cellsFor(south, west, north, east).filter((k) => !cache.has(k));
  let failed = 0;
  const worker = async () => {
    while (queue.length) {
      const key = queue.shift();
      try {
        await loadCell(key);
        onCell?.();
      } catch {
        failed++;
      }
    }
  };
  await Promise.all([worker(), worker()]);
  return failed;
}

/** Asegura los datos alrededor de un punto. */
export function loadAround([lat, lng], radiusM, onCell) {
  const dLat = radiusM / 110540;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  return loadBounds({ south: lat - dLat, north: lat + dLat, west: lng - dLng, east: lng + dLng }, onCell);
}
