import { DEFAULT_WEIGHTS, levelFor } from "@/lib/ivc";
import { bearingLabel, haversineKm, offsetMeters } from "@/lib/geo";
import { transitAt } from "@/lib/transit";
import { deliveryDemand } from "@/lib/places";

const RAW_MIN = 0.28;
const RAW_MAX = 0.85;

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** Negocios parecidos que un área puede sostener según su tránsito. */
function capacityFor(traffic, radius) {
  return (5 + 20 * traffic) * (radius / 500) ** 2;
}

function spotScore(osm, center, radius, places) {
  const traffic = transitAt(osm, center, radius).avg / 100;
  const comp = places.filter((p) => haversineKm(center, [p.lat, p.lng]) * 1000 <= radius).length;
  const capacity = capacityFor(traffic, radius);
  return { value: 0.6 * traffic + 0.4 * (1 - Math.min(1, comp / (capacity * 1.3))), traffic, comp };
}

function findBetterSpot(osm, center, radius, places) {
  const here = spotScore(osm, center, radius, places);
  let best = null;
  for (let ix = -2; ix <= 2; ix++) {
    for (let iy = -2; iy <= 2; iy++) {
      if (!ix && !iy) continue;
      const coords = offsetMeters(center, (ix * radius) / 2, (iy * radius) / 2);
      const s = spotScore(osm, coords, radius, places);
      if (!best || s.value > best.score.value) best = { coords, score: s };
    }
  }
  if (!best || best.score.value - here.value < 0.06) return null;
  return {
    coords: best.coords,
    distanceM: Math.round(haversineKm(center, best.coords) * 1000),
    direction: bearingLabel(center, best.coords),
    transit: Math.round(best.score.traffic * 100),
    competitors: best.score.comp,
  };
}

export function recommend({ concept, center, radius, places, category, nearest, reviews, osm, weights = DEFAULT_WEIGHTS }) {
  const inArea = places.filter((p) => p.distanceM <= radius && !p.closed);
  const n = inArea.length;
  const transit = transitAt(osm, center, radius);
  const traffic = transit.avg / 100;
  const capacity = capacityFor(traffic, radius);

  const rated = inArea.filter((p) => p.rating != null);
  const avgRating = rated.length ? rated.reduce((a, p) => a + p.rating, 0) / rated.length : null;
  const totalRatings = inArea.reduce((a, p) => a + (p.ratingCount || 0), 0);
  const avgRatingCount = n ? totalRatings / n : 0;

  const outside = nearest.km > 1.5;
  const delivery = deliveryDemand(nearest.zone, category?.id) * (outside ? 0.6 : 1);
  const demandSignal = clamp01(Math.log10(1 + avgRatingCount) / 3);

  const factors = {
    traffic,
    demand: n ? 0.5 * demandSignal + 0.5 * delivery : 0.35 * traffic + 0.5 * delivery,
    competition: clamp01(1 - n / (capacity * 1.3)),
    quality: avgRating != null ? clamp01((4.7 - avgRating) / 1.2) : 0.6,
  };

  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const raw = Object.keys(factors).reduce((acc, k) => acc + factors[k] * (weights[k] ?? 0), 0) / totalW;
  const gapBonus = factors.demand > 0.6 && n <= capacity * 0.3 ? 0.05 : 0;
  const differentiationBonus = Math.min(0.04, reviews.complaints.length * 0.02);
  const score = Math.round(clamp01((raw + gapBonus + differentiationBonus - RAW_MIN) / (RAW_MAX - RAW_MIN)) * 100);
  const level = levelFor(score);

  const headline = {
    alta: `Buen lugar para tu ${concept.toLowerCase()}`,
    media: "Puede funcionar si te diferencias",
    baja: "Zona difícil para este concepto",
  }[level.id];

  const reasons = [];
  if (traffic >= 0.6) {
    reasons.push({ kind: "pos", text: `Pasa mucha gente, sobre todo en la ${transit.peak.label.toLowerCase()} (${transit.peak.hours}).` });
  } else if (traffic < 0.3) {
    reasons.push({ kind: "neg", text: "Poco tránsito: dependerás más de delivery o de clientes que vayan a propósito." });
  } else {
    reasons.push({ kind: "neutral", text: `Tránsito moderado; el mejor momento es la ${transit.peak.label.toLowerCase()} (${transit.peak.hours}).` });
  }

  if (transit.vehicularAvg >= 60 && transit.pedestrianAvg < 40) {
    reasons.push({ kind: "neutral", text: "Pasan muchos autos pero poca gente a pie: piensa en estacionamiento, autoservicio o pedidos para llevar." });
  } else if (transit.pedestrianAvg >= 60 && transit.vehicularAvg < 30) {
    reasons.push({ kind: "pos", text: "Zona muy caminable: ideal para compras de impulso y negocios con vitrina." });
  }

  if (n === 0) {
    reasons.push({ kind: "neutral", text: "No encontramos negocios parecidos en el área: podrías ser el primero, pero confirma que haya demanda." });
  } else if (n > capacity) {
    reasons.push({ kind: "neg", text: `Hay ${n} negocios parecidos en ${radius} m: la zona ya está muy competida.` });
  } else {
    reasons.push({ kind: "pos", text: `Hay ${n} negocio${n === 1 ? "" : "s"} parecido${n === 1 ? "" : "s"} en ${radius} m: competencia manejable.` });
  }

  if (avgRating != null && avgRating < 4.1) {
    reasons.push({ kind: "pos", text: `La competencia tiene calificaciones bajas (${avgRating.toFixed(1)} ★): hay espacio para hacerlo mejor.` });
  } else if (avgRating != null && avgRating >= 4.5) {
    reasons.push({ kind: "neg", text: `La competencia está muy bien calificada (${avgRating.toFixed(1)} ★): tendrás que igualar ese nivel.` });
  }

  if (totalRatings > 800) {
    reasons.push({ kind: "pos", text: `Los negocios parecidos suman ${totalRatings.toLocaleString("es-MX")} reseñas: la gente sí consume esto aquí.` });
  }
  if (outside) {
    reasons.push({ kind: "neutral", text: "El área está fuera de las zonas estudiadas; la demanda de delivery es aproximada." });
  }

  return {
    score,
    level,
    headline,
    reasons,
    factors,
    inArea,
    avgRating,
    totalRatings,
    transit,
    bestSpot: findBetterSpot(osm, center, radius, places),
  };
}
