export const project = {
  name: "GeoNegocio",
  team: "Start Point",
  question:
    "¿Cómo puede un sistema basado en geolocalización y análisis de datos mejorar la identificación de oportunidades de negocio en zonas específicas de Morelia, Michoacán?",
  event: "Feria de Proyectos de Investigación Tecnológica · 9ª Ed. 2026",
  institution:
    "Tecnológico Nacional de México · Instituto Tecnológico de Morelia · Depto. de Sistemas y Computación",
};

export const authors = [
  { name: "Emmanuel Eduardo Rodríguez Torres", control: "23121084", role: "Autor" },
  { name: "Cristian Muñoz Hinojosa", control: "23121073", role: "Autor" },
];

export const advisors = [
  { name: "José Guadalupe Ramos Díaz", role: "Asesor interno" },
  { name: "Roque Trujillo Ramos", role: "Asesor externo" },
];

export const phases = [
  {
    code: "F1",
    title: "Diseño y arquitectura",
    period: "Sem. 1–4 · Feb 2026",
    status: "done",
    items: ["Arquitectura del sistema", "BD geoespacial PostGIS", "Wireframes en Figma", "Pruebas de APIs"],
  },
  {
    code: "F2",
    title: "Desarrollo del núcleo",
    period: "Sem. 5–15 · Mar–May 2026",
    status: "active",
    items: ["Módulo de ingesta", "Algoritmo IVC", "Backend FastAPI", "Frontend Vue + mapa"],
  },
  {
    code: "F3",
    title: "Integración y refinamiento",
    period: "Sem. 16–18 · Jun 2026",
    status: "next",
    items: ["Integración de módulos", "Versión móvil", "Refinamiento del IVC", "Optimización"],
  },
  {
    code: "F4",
    title: "Evaluación final",
    period: "Sem. 19–20 · Jul–Ago 2026",
    status: "next",
    items: ["Pruebas de usabilidad", "Cuestionario SUS", "Entrevistas", "Ajustes finales"],
  },
];

export const partners = [
  "ITM · TecNM",
  "CANACO Morelia",
  "Secretaría de Economía Michoacán",
  "Google for Startups",
  "Google Maps Platform",
  "TomTom Developer",
];
