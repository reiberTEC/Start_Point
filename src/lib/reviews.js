// Análisis ligero de reseñas en español: detecta temas por palabras clave y usa
// la calificación de cada reseña (o un léxico si no la tiene) como sentimiento.

export const topics = {
  precio: { label: "Precio", words: ["precio", "caro", "cara", "barato", "costoso", "económic", "accesible", "cobran", "vale la pena", "porción"] },
  servicio: { label: "Atención", words: ["atención", "atencion", "servicio", "amable", "grosero", "personal", "mesero", "trato", "actitud", "atienden"] },
  calidad: { label: "Calidad / sabor", words: ["calidad", "sabor", "rico", "delicios", "fresco", "frío", "frio", "insípid", "quemad", "producto"] },
  espera: { label: "Tiempo de espera", words: ["espera", "tardaron", "tardan", "tardado", "lento", "rápido", "rapido", "demora", "minutos"] },
  limpieza: { label: "Limpieza", words: ["limpi", "sucio", "sucia", "higiene", "baño"] },
  ambiente: { label: "Ambiente / local", words: ["ambiente", "ruido", "cómodo", "comodo", "incómodo", "apretado", "bonito", "agradable", "música", "pequeño"] },
  estacionamiento: { label: "Acceso / estacionamiento", words: ["estacion", "llegar", "acceso"] },
};

const positiveWords = ["excelente", "rico", "delicios", "amable", "limpio", "rápido", "barato", "accesible", "bonito", "agradable", "recomiendo", "mejor", "vale la pena"];
const negativeWords = ["caro", "sucio", "grosero", "lento", "frío", "mal", "malo", "pésim", "tardaron", "nunca", "no vale", "incómodo", "difícil", "bajado"];

function sentimentOf(review) {
  if (review.rating != null) {
    if (review.rating >= 4) return 1;
    if (review.rating <= 3) return -1;
    return 0;
  }
  const t = review.text.toLowerCase();
  const pos = positiveWords.filter((w) => t.includes(w)).length;
  const neg = negativeWords.filter((w) => t.includes(w)).length;
  return Math.sign(pos - neg);
}

const tips = {
  precio: "Los clientes sienten que la competencia es cara: una propuesta con mejor relación precio-calidad tiene espacio.",
  servicio: "Se quejan de la atención. Un trato cálido y rápido puede ser tu mayor diferencia.",
  calidad: "La calidad es irregular en la zona. Ser consistente te hará destacar.",
  espera: "Hay mucha queja por la espera. Procesos ágiles o pedidos por adelantado serían un plus.",
  limpieza: "La limpieza es un punto débil de la zona. Un local impecable se nota y se recomienda.",
  ambiente: "Los locales se perciben incómodos. Un espacio agradable puede atraer a quienes buscan quedarse.",
  estacionamiento: "Llegar es complicado. Considera un local con acceso fácil, servicio para llevar o delivery.",
};

/**
 * @returns {{ total, positiveShare, topics: Array<{ id, label, mentions, negShare }>, complaints, strengths, tips, samples }}
 */
export function analyzeReviews(places) {
  const reviews = places.flatMap((p) => p.reviews.map((r) => ({ ...r, place: p.name })));
  const stats = Object.fromEntries(Object.keys(topics).map((id) => [id, { mentions: 0, neg: 0, pos: 0 }]));
  let positive = 0;

  for (const r of reviews) {
    const s = sentimentOf(r);
    if (s > 0) positive++;
    const text = r.text.toLowerCase();
    for (const [id, t] of Object.entries(topics)) {
      if (t.words.some((w) => text.includes(w))) {
        stats[id].mentions++;
        if (s < 0) stats[id].neg++;
        if (s > 0) stats[id].pos++;
      }
    }
  }

  const list = Object.entries(stats)
    .filter(([, s]) => s.mentions > 0)
    .map(([id, s]) => ({
      id,
      label: topics[id].label,
      mentions: s.mentions,
      negShare: s.neg / s.mentions,
      posShare: s.pos / s.mentions,
    }));

  const complaints = list
    .filter((t) => t.negShare >= 0.4 && t.mentions >= 2)
    .sort((a, b) => b.negShare * b.mentions - a.negShare * a.mentions)
    .slice(0, 3);
  const strengths = list
    .filter((t) => t.posShare >= 0.6 && t.mentions >= 2)
    .sort((a, b) => b.posShare * b.mentions - a.posShare * a.mentions)
    .slice(0, 2);

  const negativeSamples = reviews.filter((r) => sentimentOf(r) < 0).slice(0, 3);

  const adviceTips = complaints.map((c) => tips[c.id]);
  if (!adviceTips.length && reviews.length) {
    const valued = strengths.map((s) => s.label.toLowerCase()).join(" y ");
    adviceTips.push(
      valued
        ? `La competencia es fuerte en ${valued}. Tendrás que igualarlo y sumar algo distinto: especialidad, horario o experiencia.`
        : "La competencia no tiene quejas claras. Diferénciate con una especialidad o un horario que nadie cubra.",
    );
  }

  return {
    total: reviews.length,
    positiveShare: reviews.length ? positive / reviews.length : 0,
    topics: list.sort((a, b) => b.mentions - a.mentions),
    complaints,
    strengths,
    tips: adviceTips,
    samples: negativeSamples,
  };
}
