import { zones, categories } from "@/data/zones";
import { haversineKm } from "@/lib/geo";

// Pesos del algoritmo de puntuación ponderada (filtrado basado en contenido).
export const DEFAULT_WEIGHTS = {
  traffic: 0.35,
  demand: 0.35,
  competition: 0.2,
  quality: 0.1,
};

// Competidores que una zona con demanda máxima puede absorber antes de saturarse.
const SATURATION = 30;
// Rango típico del puntaje bruto; se reescala a 0–100 para que las diferencias sean legibles.
const RAW_MIN = 0.3;
const RAW_MAX = 0.85;

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Índice de Viabilidad Comercial (IVC), escala 0–100.
 *  - traffic: flujo peatonal-vehicular (más es mejor)
 *  - demand: demanda digital por zona (más es mejor)
 *  - competition: 1 - saturación (competidores frente a lo que la demanda soporta)
 *  - quality: hueco de calidad; competencia mal calificada es oportunidad
 */
export function computeIVC(zone, categoryId, weights = DEFAULT_WEIGHTS) {
  const s = zone.stats[categoryId];
  const factors = {
    traffic: clamp01(zone.traffic),
    demand: clamp01(s.demand),
    competition: clamp01(1 - s.competitors / (SATURATION * Math.max(s.demand, 0.1))),
    quality: clamp01((5 - s.rating) / 2),
  };
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const raw = Object.keys(factors).reduce((acc, k) => acc + factors[k] * (weights[k] ?? 0), 0);

  // Regla de conocimiento: alta demanda con poca oferta es una brecha de mercado.
  const gapBonus = s.demand > 0.65 && s.competitors <= 4 ? 0.05 : 0;

  const normalized = (raw / totalW + gapBonus - RAW_MIN) / (RAW_MAX - RAW_MIN);
  const score = Math.round(clamp01(normalized) * 100);
  return { score, factors, level: levelFor(score), gapBonus: gapBonus > 0 };
}

export function levelFor(score) {
  if (score >= 72) return { id: "alta", label: "Buena oportunidad", color: "#6a5aa8", soft: "#ebe7f6" };
  if (score >= 58) return { id: "media", label: "Oportunidad moderada", color: "#a8741f", soft: "#f5e8cd" };
  return { id: "baja", label: "Zona muy competida", color: "#b5574b", soft: "#f7e1dc" };
}

export function rankZonesForCategory(categoryId, weights) {
  return zones
    .map((zone) => ({ zone, ...computeIVC(zone, categoryId, weights) }))
    .sort((a, b) => b.score - a.score);
}

export function rankCategoriesForZone(zone, weights) {
  return categories
    .map((category) => ({ category, ...computeIVC(zone, category.id, weights) }))
    .sort((a, b) => b.score - a.score);
}

export function nearestZone(coords) {
  return zones
    .map((zone) => ({ zone, km: haversineKm(coords, zone.coords) }))
    .sort((a, b) => a.km - b.km)[0];
}
