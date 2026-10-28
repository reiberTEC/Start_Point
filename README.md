# Start Point · GeoNegocio

Sistema inteligente de recomendación comercial basado en geolocalización, análisis de densidad de negocios y tráfico peatonal-vehicular para emprendedores de Morelia, Michoacán.

Proyecto de la Feria de Proyectos de Investigación Tecnológica (9ª Ed. 2026) · Instituto Tecnológico de Morelia.

## Frontend

Vue 3 + Vite + Tailwind CSS v4 + Leaflet.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve el build
```

### Pantallas

| Ruta            | Pantalla                                                     |
| --------------- | ------------------------------------------------------------ |
| `/`             | Landing del proyecto (problema, cómo funciona, demo del IVC) |
| `/acceso`       | Inicio de sesión, registro y recuperación de contraseña      |
| `/app/mapa`     | Mapa interactivo con competidores y zonas coloreadas por IVC |
| `/app/lugar`    | Analizar un área: mapa de calor de tránsito, índice de transitabilidad, negocios parecidos, análisis de reseñas y recomendación |
| `/app/comida`   | Búsqueda por tipo de comida, ranking de zonas                |
| `/app/perfil`   | Menú de opciones: perfil, modo oscuro, pesos del IVC, cerrar sesión |

### Claves de API (opcional)

Copia `.env.example` como `.env` y reinicia `npm run dev`:

- `VITE_GOOGLE_MAPS_API_KEY`: activa la búsqueda real de negocios parecidos y sus reseñas con Places API (New), y las fotos/horarios en la ficha de cada negocio. En Google Cloud habilita **Maps JavaScript API** y **Places API (New)**, y restringe la clave por referrer.
- `VITE_TOMTOM_API_KEY`: agrega la capa "Tráfico en vivo" y la velocidad/congestión del segmento de calle más cercano.

Sin claves, la pantalla **Lugar** funciona con datos de demostración. Rappi y Uber Eats no ofrecen API pública; la demanda de delivery se estima por zona.

### Análisis de un área (`/app/lugar`)

1. **Tránsito:** índice de transitabilidad 0–100 del área (a pie, autos y combinado) por momento del día, estimado con datos reales de OpenStreetMap: comercios, escuelas, oficinas, paradas, calles peatonales y avenidas según su jerarquía. Mercados, plazas, universidades, hospitales y terminales pesan más (`src/lib/transit.js`, `src/lib/osm.js`).
   - El menú **Capas** del mapa permite activar o desactivar: gente a pie, autos, tráfico en vivo (TomTom), comercios y servicios, zonas de estudio, negocios parecidos y punto sugerido.
   - Los datos de Morelia vienen precargados en `public/data/morelia-osm.json`. Para regenerarlos: `npm run data:osm`. Fuera de esa área se consultan a Overpass al vuelo.
   - El mapa recuerda su posición, zoom, área y capas durante la sesión (`src/stores/placeSearch.js`); arrastrarlo nunca mueve el área.
2. **Negocios del área:** al tocar un negocio del mapa (o desde "Ver negocios del área") se abre su ficha con la vista de calle de Google (Street View orientado hacia la fachada), mapa y satélite, y enlaces a Google Maps (`src/components/FichaNegocio.vue`, `src/lib/business.js`). Con clave de Google la ficha agrega fotos, horario, teléfono, sitio web y reseñas.
   - El selector **Tránsito / Google Maps** cambia el mapa por la vista de Google en la misma posición, con un buscador para ver los negocios registrados en Google (p. ej. "cafetería"). Las vistas embebidas de Google no requieren clave.
3. **Negocios parecidos:** búsqueda por concepto alrededor del área (`src/lib/places.js`, `src/lib/google.js`).
4. **Reseñas:** detección de temas (precio, atención, calidad, espera, limpieza, ambiente, acceso) y sentimiento (`src/lib/reviews.js`).
5. **Recomendación:** IVC del área para ese concepto, razones, cómo diferenciarte y un punto cercano con mejor balance (`src/lib/recommend.js`).

### Estructura

```
src/
  data/zones.js        zonas de Morelia, giros y datos de demostración
  data/project.js      contenido del protocolo (equipo, fases, aliados)
  lib/ivc.js           cálculo del Índice de Viabilidad Comercial
  lib/osm.js           calles y comercios de OpenStreetMap (archivo precargado + Overpass)
  lib/transit.js       índice de transitabilidad y mapas de calor (a pie / autos)
  lib/business.js      negocios del mapa, tipos en español y enlaces/vistas de Google Maps
  lib/places.js        negocios parecidos (Google Places o demostración)
  lib/reviews.js       análisis de reseñas
  lib/recommend.js     recomendación para un área y un concepto
  composables/         auth simulada y ajustes (tema, pesos del IVC)
  directives/motion.js v-reveal, v-tilt, v-parallax
  components/          nav con menú a pantalla completa, mapas, anillo IVC…
  views/               landing, acceso y pantallas de la app
```

### Índice de Viabilidad Comercial (IVC)

Puntuación ponderada de 0 a 100 por zona y giro:

| Factor        | Fuente                | Peso por defecto |
| ------------- | --------------------- | ---------------- |
| Flujo de personas | TomTom Traffic    | 35 %             |
| Demanda       | Rappi / Uber Eats     | 35 %             |
| Competencia (relativa a la demanda) | Google Places | 20 % |
| Calidad de la competencia | Calificaciones Google | 10 %   |

Incluye una regla de conocimiento: alta demanda con poca oferta suma un bono de brecha de mercado. Los pesos se pueden ajustar desde el menú de la app.

## Estado

Los datos de `src/data/zones.js` son **de demostración**. La autenticación es local (localStorage) y la búsqueda por dirección usa Nominatim (OpenStreetMap) mientras no exista backend.

Pendientes según el protocolo:

- Backend FastAPI + PostgreSQL/PostGIS con endpoints REST.
- Módulo de ingesta de Google Places, TomTom Traffic y datos públicos de delivery.
- Heatmap con KDE real y correlación de Pearson tráfico–densidad.
- Validación cruzada del IVC con aperturas y cierres históricos de Morelia.
- Pruebas de usabilidad SUS con 10–15 emprendedores.
