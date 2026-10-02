<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

defineProps<{ oscuro?: boolean }>()

// TODO: reemplazar con la dirección real del negocio
const NEGOCIO = {
  nombre: 'Start Point',
  direccion: 'Plaza de la Constitución, Centro, Ciudad de México',
  coordenadas: [19.4326, -99.1332] as L.LatLngTuple,
}

const contenedor = ref<HTMLElement | null>(null)
const buscando = ref(false)
const mensaje = ref('')

let mapa: L.Map | null = null
let marcadorNegocio: L.Marker | null = null
let marcadorUsuario: L.Marker | null = null
let circuloPrecision: L.Circle | null = null

const iconoNegocio = L.divIcon({
  className: 'pin-negocio',
  html: '<span>🏢</span>',
  iconSize: [44, 44],
  iconAnchor: [22, 53],
  popupAnchor: [0, -50],
})

const iconoUsuario = L.divIcon({
  className: 'pin-usuario',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

onMounted(() => {
  if (!contenedor.value) return

  mapa = L.map(contenedor.value, { center: NEGOCIO.coordenadas, zoom: 16 })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa)

  marcadorNegocio = L.marker(NEGOCIO.coordenadas, { icon: iconoNegocio, title: NEGOCIO.nombre })
    .addTo(mapa)
    .bindPopup(`<strong>${NEGOCIO.nombre}</strong><br>${NEGOCIO.direccion}`)
    .openPopup()
})

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
})

const verNegocio = () => {
  if (!mapa) return
  mapa.once('moveend', () => marcadorNegocio?.openPopup())
  mapa.flyTo(NEGOCIO.coordenadas, 16)
}

const MENSAJES_ERROR: Record<number, string> = {
  1: 'No diste permiso para usar tu ubicación.',
  2: 'No pudimos determinar tu ubicación.',
  3: 'Se agotó el tiempo para obtener tu ubicación.',
}

const verMiUbicacion = () => {
  if (!('geolocation' in navigator)) {
    mensaje.value = 'Tu navegador no permite obtener la ubicación.'
    return
  }

  buscando.value = true
  mensaje.value = ''

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      buscando.value = false
      if (!mapa) return

      const posicion: L.LatLngTuple = [coords.latitude, coords.longitude]

      marcadorUsuario?.remove()
      circuloPrecision?.remove()

      circuloPrecision = L.circle(posicion, {
        radius: coords.accuracy,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(mapa)

      marcadorUsuario = L.marker(posicion, { icon: iconoUsuario, title: 'Tu ubicación' })
        .addTo(mapa)
        .bindPopup('Estás aquí')

      mapa.closePopup()
      mapa.flyToBounds(L.latLngBounds([posicion, NEGOCIO.coordenadas]), { padding: [60, 60], maxZoom: 16 })
    },
    (error) => {
      buscando.value = false
      mensaje.value = MENSAJES_ERROR[error.code] ?? 'Ocurrió un error al obtener tu ubicación.'
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}
</script>

<template>
  <section class="mapa-seccion" aria-label="Mapa de ubicación">
    <div class="mapa-encabezado">
      <div>
        <h2>Encuéntranos</h2>
        <p>{{ NEGOCIO.direccion }}</p>
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-secundario" @click="verNegocio">🏢 Ver negocio</button>
        <button type="button" class="btn btn-primario" :disabled="buscando" @click="verMiUbicacion">
          {{ buscando ? 'Buscando…' : '📍 Mi ubicación' }}
        </button>
      </div>
    </div>

    <p v-if="mensaje" class="aviso" role="status">{{ mensaje }}</p>

    <div ref="contenedor" class="mapa" :class="{ oscuro }"></div>
  </section>
</template>

<style scoped>
.mapa-seccion {
  padding: 1.6rem;
  border-radius: 20px;
  background: var(--superficie, #ffffff);
  box-shadow: 0 10px 25px var(--sombra, rgba(15, 23, 42, 0.06));
  transition: background 0.3s;
}

.mapa-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;
}

.mapa-encabezado h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--texto, #1e1b4b);
}

.mapa-encabezado p {
  margin-top: 0.2rem;
  color: var(--texto-suave, #64748b);
}

.acciones {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.65rem 1.1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.btn-primario {
  border: none;
  background: linear-gradient(to right, #4f46e5, #6366f1);
  color: white;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.3);
}

.btn-secundario {
  border: 1.5px solid var(--borde, #e2e8f0);
  background: var(--superficie, #ffffff);
  color: var(--texto-cuerpo, #334155);
}

.btn-secundario:hover {
  background: var(--fondo, #f8fafc);
}

.aviso {
  margin-bottom: 1rem;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
}

.mapa {
  height: 480px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 0;
  background: #e5e7eb;
}

/* Modo oscuro: se invierten solo los mosaicos, los pines conservan su color */
.mapa.oscuro {
  background: #111827;
}

.mapa :deep(.leaflet-tile-pane) {
  transition: filter 0.3s;
}

.mapa.oscuro :deep(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.6);
}

.mapa.oscuro :deep(.leaflet-popup-content-wrapper),
.mapa.oscuro :deep(.leaflet-popup-tip) {
  background: #1f2937;
  color: #e5e7eb;
}

.mapa.oscuro :deep(.leaflet-popup-close-button) {
  color: #9ca3af;
}

.mapa.oscuro :deep(.leaflet-bar a) {
  border-bottom-color: #374151;
  background: #1f2937;
  color: #e5e7eb;
}

.mapa.oscuro :deep(.leaflet-bar a:hover) {
  background: #374151;
}

.mapa.oscuro :deep(.leaflet-control-attribution) {
  background: rgba(17, 24, 39, 0.8);
  color: #9ca3af;
}

.mapa.oscuro :deep(.leaflet-control-attribution a) {
  color: #93c5fd;
}

/* Los íconos los crea Leaflet fuera del árbol de Vue */
.mapa :deep(.pin-negocio) {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #4f46e5, #0ea5e9);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.35);
  font-size: 1.2rem;
}

.mapa :deep(.pin-negocio)::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -12px;
  translate: -50% 0;
  border: 8px solid transparent;
  border-top: 10px solid white;
  border-bottom: 0;
}

.mapa :deep(.pin-usuario span) {
  display: block;
  width: 20px;
  height: 20px;
  border: 3px solid white;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6);
  animation: pulso 1.8s ease-out infinite;
}

@keyframes pulso {
  to {
    box-shadow: 0 0 0 18px rgba(37, 99, 235, 0);
  }
}

@media (max-width: 600px) {
  .mapa {
    height: 360px;
  }
}
</style>
