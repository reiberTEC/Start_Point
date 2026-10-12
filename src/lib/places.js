import { getCategory } from "@/data/zones";
import { haversineKm, offsetMeters } from "@/lib/geo";
import { nearestZone } from "@/lib/ivc";
import { hasGoogleKey, searchPlacesByConcept } from "@/lib/google";

const categoryKeywords = {
  taquerias: ["taco", "taquer", "pastor", "birria", "carnitas", "suadero"],
  mixtos: ["antojit", "quesadill", "gordit", "sope", "tamal", "mixto", "enchilad", "pozole", "corunda", "uchepo"],
  cafeterias: ["caf", "coffee", "espresso", "brunch", "té "],
  mariscos: ["marisc", "cevich", "pescad", "camar", "aguachile", "ostion", "sushi"],
  rapida: ["hamburg", "burger", "pizza", "hot dog", "hotdog", "alitas", "rápida", "rapida", "papas", "pollo"],
  panaderias: ["pan", "reposter", "pastel", "bakery", "galleta"],
  postres: ["helad", "nieve", "paleta", "postre", "crepa", "waffle", "dona", "churro"],
  farmacias: ["farmac", "botica", "medic"],
  papelerias: ["papeler", "copias", "impresi", "útiles", "utiles"],
  ropa: ["ropa", "calzado", "boutique", "zapat", "tenis", "moda"],
};

/** Relaciona el concepto libre del usuario con un giro conocido (si lo hay). */
export function matchCategory(concept) {
  const c = ` ${concept.toLowerCase()} `;
  for (const [id, words] of Object.entries(categoryKeywords)) {
    if (words.some((w) => c.includes(w))) return getCategory(id);
  }
  return null;
}

/** Demanda de delivery estimada (0–1) para el concepto en la zona más cercana. */
export function deliveryDemand(zone, categoryId) {
  if (categoryId && zone.stats[categoryId]) return zone.stats[categoryId].demand;
  const all = Object.values(zone.stats);
  return all.reduce((a, s) => a + s.demand, 0) / all.length;
}

export async function findSimilarBusinesses({ concept, center, radius }) {
  const category = matchCategory(concept);
  const nearest = nearestZone(center);
  let source = "demo";
  let warning = "";
  let places;

  if (hasGoogleKey) {
    try {
      places = await searchPlacesByConcept(concept, center, radius * 2);
      source = "google";
    } catch (e) {
      warning = "No pudimos consultar Google Places; mostramos datos de demostración.";
      console.warn(e);
    }
  }
  if (!places) places = demoPlaces({ concept, center, radius, category, nearest });

  places = places
    .map((p) => ({ ...p, distanceM: Math.round(haversineKm(center, [p.lat, p.lng]) * 1000) }))
    .filter((p) => p.distanceM <= radius * 2)
    .sort((a, b) => a.distanceM - b.distanceM);

  return { source, warning, places, category, nearest };
}

// ---------- Datos de demostración ----------

function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h);
}

const namePool = {
  taquerias: { pre: ["Tacos", "Taquería"], suf: ["El Güero", "Don Chava", "La Esquina", "Los Compadres", "El Paisa", "Doña Mary", "El Fogón", "La Parrilla", "El Trompo", "Los Arcos"] },
  mixtos: { pre: ["Antojitos", "Cocina"], suf: ["Doña Lupe", "La Abuela", "El Comal", "Michoacana", "Los Portales", "Tía Rosa", "La Fonda"] },
  cafeterias: { pre: ["Café", "Cafetería"], suf: ["Cantera", "La Tostadora", "Grano Rosa", "Aqueducto", "El Patio", "Moka", "Origen", "Tres Granos"] },
  mariscos: { pre: ["Mariscos", "Cevichería"], suf: ["El Puerto", "La Ola", "Playa Azul", "El Capitán", "Las Brisas", "El Muelle"] },
  rapida: { pre: ["Burgers", "Pizzería", "Alitas"], suf: ["Express", "Del Barrio", "Smash", "La Central", "Bros", "Station"] },
  panaderias: { pre: ["Panadería", "Pan"], suf: ["La Espiga", "San José", "El Molino", "Del Centro", "La Tahona"] },
  postres: { pre: ["Nieves", "Paletería", "Crepas"], suf: ["La Michoacana", "Tentación", "Dulce Pecado", "El Glaciar", "Frutal"] },
  farmacias: { pre: ["Farmacia"], suf: ["San Juan", "Del Ahorro", "Santa Fe", "Morelia", "La Salud", "Guadalajara"] },
  papelerias: { pre: ["Papelería"], suf: ["El Lápiz", "Escolar", "La Pluma", "Arcoíris", "Copias Express"] },
  ropa: { pre: ["Boutique", "Calzado"], suf: ["Moda Viva", "Paso Firme", "Estilo", "Urbana", "La Elegante"] },
};

const reviewTemplates = {
  precio: {
    pos: ["Buenos precios para lo que te dan.", "Muy accesible, vale la pena.", "Barato y bien servido."],
    neg: ["Está caro para lo que ofrecen.", "Subieron mucho los precios últimamente.", "Muy costoso, no vale lo que cobran."],
  },
  servicio: {
    pos: ["La atención es muy amable.", "Te atienden con buena actitud, excelente servicio."],
    neg: ["La atención deja mucho que desear, poco amables.", "El personal es grosero y no te hace caso."],
  },
  calidad: {
    pos: ["Todo de muy buena calidad.", "Excelente calidad, de lo mejor de la zona.", "Muy rico y fresco."],
    neg: ["La calidad ha bajado bastante.", "Llegó frío y sin sabor.", "Calidad muy irregular, a veces bien y a veces mal."],
  },
  espera: {
    pos: ["Atienden rápido aunque esté lleno."],
    neg: ["Tardaron muchísimo en atendernos.", "Mucha espera, demasiado lento.", "Más de 40 minutos de espera."],
  },
  limpieza: {
    pos: ["El lugar está muy limpio."],
    neg: ["Las mesas y los baños estaban sucios.", "Falta higiene en el local."],
  },
  ambiente: {
    pos: ["Buen ambiente y cómodo para ir con amigos.", "El lugar es bonito y agradable."],
    neg: ["Muy ruidoso e incómodo.", "El local es pequeño y apretado."],
  },
  estacionamiento: {
    pos: ["Fácil llegar y hay dónde estacionarse."],
    neg: ["No hay estacionamiento y es difícil llegar.", "Imposible estacionarse cerca."],
  },
};

const topicIds = Object.keys(reviewTemplates);

function demoPlaces({ concept, center, radius, category, nearest }) {
  const rand = seeded(hash(`${concept.toLowerCase()}|${center.map((v) => v.toFixed(3)).join()}|${radius}`));
  const { zone, km } = nearest;
  const stat = category ? zone.stats[category.id] : null;
  const areaFactor = (radius / 500) ** 2;
  const distanceFactor = Math.max(0.15, 1 - Math.max(0, km - 0.6) / 2);
  const baseCount = stat ? stat.competitors : 4 + zone.traffic * 8;
  const count = Math.max(0, Math.min(20, Math.round(baseCount * areaFactor * distanceFactor * (0.8 + rand() * 0.4))));
  const avgRating = stat ? stat.rating : 4.1;

  const pool = (category && namePool[category.id]) || {
    pre: [capitalize(concept.trim()) || "Negocio"],
    suf: ["Centro", "La Esquina", "Del Barrio", "Express", "Plus", "Morelia", "Selecto", "Del Valle"],
  };

  // Debilidades comunes de la competencia del área: generan un patrón en las reseñas.
  const areaWeakness = [pick(topicIds, rand), pick(topicIds, rand)];
  const used = new Set();

  return Array.from({ length: count }, (_, i) => {
    let name;
    do {
      name = `${pick(pool.pre, rand)} ${pick(pool.suf, rand)}`;
    } while (used.has(name) && used.size < pool.pre.length * pool.suf.length);
    used.add(name);

    const angle = rand() * Math.PI * 2;
    const dist = radius * 1.3 * Math.sqrt(rand());
    const [lat, lng] = offsetMeters(center, Math.cos(angle) * dist, Math.sin(angle) * dist);
    const rating = clamp(round1(avgRating + (rand() - 0.5) * 1.1), 2.9, 4.9);
    const ratingCount = Math.round(Math.exp(3.4 + rand() * 2.6) * (0.5 + zone.traffic));
    const weakness = rand() < 0.65 ? pick(areaWeakness, rand) : pick(topicIds, rand);

    const reviews = Array.from({ length: 3 + Math.floor(rand() * 3) }, () => {
      const r = clamp(Math.round(rating + (rand() - 0.55) * 2.6), 1, 5);
      const negative = r <= 3;
      const topic = negative && rand() < 0.7 ? weakness : pick(topicIds, rand);
      const text = pick(reviewTemplates[topic][negative ? "neg" : "pos"], rand);
      return { text, rating: r, when: `hace ${1 + Math.floor(rand() * 11)} meses` };
    });

    return {
      id: `demo-${i}`,
      source: "demo",
      name,
      lat,
      lng,
      rating,
      ratingCount,
      priceLevel: null,
      address: zone.name,
      type: category?.label ?? "",
      closed: false,
      reviews,
    };
  });
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function round1(v) {
  return Math.round(v * 10) / 10;
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
