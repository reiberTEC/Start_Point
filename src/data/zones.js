// Datos de demostración. Sustituir por la ingesta real de Google Places,
// TomTom Traffic y plataformas de delivery (Fase 2 del protocolo).

export const MORELIA_CENTER = [19.7027, -101.1923];

export const categories = [
  { id: "taquerias", label: "Taquerías", group: "comida", emoji: "🌮" },
  { id: "mixtos", label: "Mixtos / Antojitos", group: "comida", emoji: "🫓" },
  { id: "cafeterias", label: "Cafeterías", group: "comida", emoji: "☕" },
  { id: "mariscos", label: "Mariscos", group: "comida", emoji: "🦐" },
  { id: "rapida", label: "Comida rápida", group: "comida", emoji: "🍔" },
  { id: "panaderias", label: "Panaderías", group: "comida", emoji: "🥐" },
  { id: "postres", label: "Postres y nieves", group: "comida", emoji: "🍨" },
  { id: "farmacias", label: "Farmacias", group: "servicios", emoji: "💊" },
  { id: "papelerias", label: "Papelerías", group: "servicios", emoji: "✏️" },
  { id: "ropa", label: "Ropa y calzado", group: "servicios", emoji: "👟" },
];

// traffic: flujo peatonal/vehicular normalizado (0–1), fuente TomTom
// competitors: negocios del mismo giro en un radio de 500 m, fuente Google Places
// demand: demanda relativa por zona de cobertura, fuente Rappi / Uber Eats
// rating: calificación promedio de la competencia (1–5)
export const zones = [
  {
    id: "centro",
    name: "Centro Histórico",
    short: "Centro",
    coords: [19.7027, -101.1923],
    traffic: 0.94,
    peakHours: "13:00 – 16:00 · 19:00 – 22:00",
    description:
      "Corazón turístico y administrativo. Flujo peatonal muy alto todo el día y fuerte presencia de cafeterías y restaurantes.",
    stats: {
      taquerias: { competitors: 21, demand: 0.82, rating: 4.4 },
      mixtos: { competitors: 9, demand: 0.61, rating: 4.1 },
      cafeterias: { competitors: 34, demand: 0.88, rating: 4.6 },
      mariscos: { competitors: 5, demand: 0.57, rating: 4.0 },
      rapida: { competitors: 16, demand: 0.71, rating: 3.9 },
      panaderias: { competitors: 7, demand: 0.64, rating: 4.5 },
      postres: { competitors: 12, demand: 0.79, rating: 4.4 },
      farmacias: { competitors: 11, demand: 0.58, rating: 4.0 },
      papelerias: { competitors: 6, demand: 0.42, rating: 3.9 },
      ropa: { competitors: 29, demand: 0.66, rating: 4.1 },
    },
  },
  {
    id: "madero-ote",
    name: "Av. Madero Oriente",
    short: "Madero Ote.",
    coords: [19.7019, -101.1832],
    traffic: 0.81,
    peakHours: "08:00 – 10:00 · 14:00 – 17:00",
    description:
      "Corredor comercial con tráfico vehicular intenso y mezcla de comercio tradicional, servicios y oficinas.",
    stats: {
      taquerias: { competitors: 12, demand: 0.77, rating: 4.2 },
      mixtos: { competitors: 4, demand: 0.69, rating: 4.0 },
      cafeterias: { competitors: 9, demand: 0.63, rating: 4.3 },
      mariscos: { competitors: 3, demand: 0.52, rating: 3.8 },
      rapida: { competitors: 10, demand: 0.74, rating: 3.8 },
      panaderias: { competitors: 4, demand: 0.55, rating: 4.3 },
      postres: { competitors: 5, demand: 0.58, rating: 4.1 },
      farmacias: { competitors: 9, demand: 0.61, rating: 4.0 },
      papelerias: { competitors: 5, demand: 0.49, rating: 3.8 },
      ropa: { competitors: 14, demand: 0.51, rating: 3.9 },
    },
  },
  {
    id: "madero-pte",
    name: "Av. Madero Poniente",
    short: "Madero Pte.",
    coords: [19.7046, -101.2041],
    traffic: 0.72,
    peakHours: "07:30 – 09:30 · 18:00 – 21:00",
    description:
      "Zona mixta habitacional-comercial con flujo constante y menor saturación que el primer cuadro.",
    stats: {
      taquerias: { competitors: 8, demand: 0.73, rating: 4.1 },
      mixtos: { competitors: 3, demand: 0.66, rating: 3.9 },
      cafeterias: { competitors: 6, demand: 0.59, rating: 4.2 },
      mariscos: { competitors: 2, demand: 0.61, rating: 3.9 },
      rapida: { competitors: 7, demand: 0.68, rating: 3.7 },
      panaderias: { competitors: 3, demand: 0.62, rating: 4.4 },
      postres: { competitors: 3, demand: 0.54, rating: 4.0 },
      farmacias: { competitors: 6, demand: 0.57, rating: 4.1 },
      papelerias: { competitors: 3, demand: 0.47, rating: 3.7 },
      ropa: { competitors: 7, demand: 0.44, rating: 3.8 },
    },
  },
  {
    id: "independencia",
    name: "Mercado Independencia · Av. Lázaro Cárdenas",
    short: "Independencia",
    coords: [19.6965, -101.1886],
    traffic: 0.88,
    peakHours: "07:00 – 13:00",
    description:
      "Núcleo de abasto popular. Altísimo flujo peatonal matutino y demanda fuerte de comida tradicional económica.",
    stats: {
      taquerias: { competitors: 18, demand: 0.86, rating: 4.3 },
      mixtos: { competitors: 6, demand: 0.84, rating: 4.2 },
      cafeterias: { competitors: 3, demand: 0.41, rating: 3.9 },
      mariscos: { competitors: 6, demand: 0.73, rating: 4.1 },
      rapida: { competitors: 5, demand: 0.55, rating: 3.6 },
      panaderias: { competitors: 6, demand: 0.71, rating: 4.2 },
      postres: { competitors: 4, demand: 0.62, rating: 4.0 },
      farmacias: { competitors: 7, demand: 0.66, rating: 3.9 },
      papelerias: { competitors: 2, demand: 0.39, rating: 3.6 },
      ropa: { competitors: 19, demand: 0.71, rating: 3.8 },
    },
  },
  {
    id: "bucareli",
    name: "Av. Bucareli · Deportivo Venustiano Carranza",
    short: "Bucareli",
    coords: [19.7101, -101.1962],
    traffic: 0.63,
    peakHours: "06:00 – 09:00 · 17:00 – 21:00",
    description:
      "Entorno deportivo y escolar. Demanda creciente de comida rápida, snacks saludables y papelerías.",
    stats: {
      taquerias: { competitors: 6, demand: 0.69, rating: 4.0 },
      mixtos: { competitors: 2, demand: 0.58, rating: 3.8 },
      cafeterias: { competitors: 3, demand: 0.56, rating: 4.1 },
      mariscos: { competitors: 1, demand: 0.44, rating: 3.7 },
      rapida: { competitors: 4, demand: 0.77, rating: 3.6 },
      panaderias: { competitors: 2, demand: 0.53, rating: 4.1 },
      postres: { competitors: 2, demand: 0.67, rating: 3.9 },
      farmacias: { competitors: 3, demand: 0.52, rating: 3.9 },
      papelerias: { competitors: 2, demand: 0.71, rating: 3.8 },
      ropa: { competitors: 3, demand: 0.38, rating: 3.7 },
    },
  },
];

export function getZone(id) {
  return zones.find((z) => z.id === id);
}

export function getCategory(id) {
  return categories.find((c) => c.id === id);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Puntos sintéticos de negocios alrededor de cada zona para el heatmap.
export function businessPoints(categoryId = null) {
  const points = [];
  zones.forEach((zone, zi) => {
    const cats = categoryId ? [categoryId] : Object.keys(zone.stats);
    cats.forEach((cat, ci) => {
      const { competitors } = zone.stats[cat];
      const rand = seededRandom((zi + 1) * 977 + (ci + 1) * 131);
      for (let i = 0; i < competitors; i++) {
        const r = 0.0045 * Math.sqrt(rand());
        const t = rand() * Math.PI * 2;
        points.push({
          lat: zone.coords[0] + r * Math.cos(t),
          lng: zone.coords[1] + r * Math.sin(t) * 1.06,
          category: cat,
          zone: zone.id,
        });
      }
    });
  });
  return points;
}
