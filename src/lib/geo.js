export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Desplaza un punto `meters` hacia el norte (dy) y el este (dx). */
export function offsetMeters([lat, lng], dx, dy) {
  const dLat = dy / 111320;
  const dLng = dx / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

export function bearingLabel(from, to) {
  const dy = to[0] - from[0];
  const dx = (to[1] - from[1]) * Math.cos((from[0] * Math.PI) / 180);
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  const names = ["norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste"];
  return names[Math.round(((deg + 360) % 360) / 45) % 8];
}
