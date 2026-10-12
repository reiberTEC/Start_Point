// Transitabilidad estimada a partir de OpenStreetMap:
//  - peatonal: densidad de comercios, servicios, paradas y calles peatonales
//  - vehicular: longitud de avenidas ponderada por jerarquía vial
// Cada tipo de lugar tiene un ritmo distinto a lo largo del día.

export const periods = [
  { id: "manana", label: "Mañana", hours: "7–11 h" },
  { id: "mediodia", label: "Mediodía", hours: "12–16 h" },
  { id: "tarde", label: "Tarde", hours: "17–21 h" },
  { id: "noche", label: "Noche", hours: "21–24 h" },
];

const RHYTHM = {
  food: { manana: 0.45, mediodia: 1, tarde: 1, noche: 0.75 },
  shop: { manana: 0.7, mediodia: 1, tarde: 0.85, noche: 0.25 },
  work: { manana: 1, mediodia: 0.8, tarde: 0.45, noche: 0.1 },
  transport: { manana: 1, mediodia: 0.75, tarde: 1, noche: 0.35 },
  leisure: { manana: 0.5, mediodia: 0.9, tarde: 1, noche: 0.6 },
  foot: { manana: 0.6, mediodia: 1, tarde: 0.95, noche: 0.5 },
  road: { manana: 1, mediodia: 0.75, tarde: 1, noche: 0.4 },
};

const POI_WEIGHT = { food: 1, shop: 1, work: 1.2, transport: 1.5, leisure: 1.2 };
const GROUPS = Object.keys(POI_WEIGHT);

// Referencias de saturación: un valor bruto igual a REF da un índice de ~63.
const REF_PED = 100;
const REF_VEH = 3.5;
const FOOT_FACTOR = 25;

export const poiGroups = {
  food: { label: "Comida y bebida", color: "#b5574b" },
  shop: { label: "Tiendas", color: "#a8741f" },
  work: { label: "Escuelas, oficinas y salud", color: "#3e7c6b" },
  transport: { label: "Paradas de transporte", color: "#4a6aa5" },
  leisure: { label: "Cultura y turismo", color: "#6a5aa8" },
};

export function pedestrianHeat(data, period) {
  const pts = data.pois.map((p) => [p.lat, p.lng, POI_WEIGHT[p.group] * Math.min(p.weight ?? 1, 2.5) * RHYTHM[p.group][period]]);
  for (const r of data.roads) {
    // Las aceras de las avenidas también llevan gente a pie, aunque menos que las calles peatonales.
    const w = r.vehicular ? r.w * 0.12 : r.w * 0.5;
    pts.push([r.lat, r.lng, w * RHYTHM.foot[period]]);
  }
  return pts;
}

export function vehicularHeat(data, period) {
  const pts = [];
  for (const r of data.roads) {
    if (r.vehicular) pts.push([r.lat, r.lng, r.w * RHYTHM.road[period]]);
  }
  return pts;
}

function distM(lat1, lng1, lat2, lng2) {
  const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360) * 111320;
  const y = (lat2 - lat1) * 110540;
  return Math.hypot(x, y);
}

function toIndex(raw, ref) {
  return Math.round(100 * (1 - Math.exp(-raw / ref)));
}

/**
 * Transitabilidad del área en cada momento del día.
 * @returns {{ byPeriod, avg, peak, counts }}
 */
export function transitAt(data, [lat, lng], radiusM) {
  const sums = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  const counts = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  let footKm = 0;
  let roadKm = 0;
  let avenuesKm = 0;

  for (const p of data.pois) {
    const d = distM(lat, lng, p.lat, p.lng);
    if (d > radiusM) continue;
    sums[p.group] += (p.weight ?? 1) * (1 - 0.5 * (d / radiusM));
    counts[p.group]++;
  }
  for (const r of data.roads) {
    const d = distM(lat, lng, r.lat, r.lng);
    if (d > radiusM) continue;
    const decay = 1 - 0.5 * (d / radiusM);
    const km = r.len / 1000;
    if (r.vehicular) {
      roadKm += km * r.w * decay;
      if (r.w >= 0.45) avenuesKm += km;
    } else {
      footKm += km * r.w * decay;
    }
  }

  const areaKm2 = Math.PI * (radiusM / 1000) ** 2;
  const byPeriod = periods.map((p) => {
    const ped =
      GROUPS.reduce((a, g) => a + sums[g] * POI_WEIGHT[g] * RHYTHM[g][p.id], 0) / areaKm2 +
      (footKm * FOOT_FACTOR * RHYTHM.foot[p.id]) / areaKm2;
    const veh = (roadKm * RHYTHM.road[p.id]) / areaKm2;
    const pedestrian = toIndex(ped, REF_PED);
    const vehicular = toIndex(veh, REF_VEH);
    return { ...p, pedestrian, vehicular, combined: Math.round(0.6 * pedestrian + 0.4 * vehicular) };
  });

  const avg = (key) => Math.round(byPeriod.reduce((a, p) => a + p[key], 0) / byPeriod.length);
  return {
    byPeriod,
    avg: avg("combined"),
    pedestrianAvg: avg("pedestrian"),
    vehicularAvg: avg("vehicular"),
    peak: byPeriod.reduce((a, p) => (p.combined > a.combined ? p : a)),
    counts: {
      pois: GROUPS.reduce((a, g) => a + counts[g], 0),
      ...counts,
      avenuesKm: Math.round(avenuesKm * 10) / 10,
    },
  };
}

export function transitLabel(value) {
  if (value >= 70) return "Muy transitada";
  if (value >= 45) return "Tránsito medio";
  if (value >= 20) return "Tránsito bajo";
  return "Poco tránsito";
}
