const API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

export const hasTomTomKey = Boolean(API_KEY);

/** Capa de teselas de flujo vehicular en tiempo real (velocidad relativa). */
export const tomtomFlowTilesUrl = API_KEY
  ? `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${API_KEY}&thickness=6`
  : null;

/**
 * Flujo vehicular del segmento de calle más cercano al punto.
 * congestion: 0 = libre, 1 = detenido.
 */
export async function fetchFlowSegment([lat, lng]) {
  if (!API_KEY) return null;
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/14/json?point=${lat},${lng}&unit=KMPH&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const { flowSegmentData: f } = await res.json();
  if (!f) return null;
  return {
    currentSpeed: f.currentSpeed,
    freeFlowSpeed: f.freeFlowSpeed,
    congestion: Math.max(0, Math.min(1, 1 - f.currentSpeed / f.freeFlowSpeed)),
  };
}
