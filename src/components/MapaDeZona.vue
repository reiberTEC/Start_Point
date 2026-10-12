<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import { MORELIA_CENTER, zones } from "@/data/zones";
import { tomtomFlowTilesUrl } from "@/lib/tomtom";
import { poiGroups } from "@/lib/transit";
import { businessFromPoi } from "@/lib/business";

const props = defineProps({
  center: { type: Array, default: null },
  radius: { type: Number, default: 400 },
  layers: { type: Object, required: true },
  pedHeat: { type: Array, default: () => [] },
  vehHeat: { type: Array, default: () => [] },
  pois: { type: Array, default: () => [] },
  places: { type: Array, default: () => [] },
  bestSpot: { type: Object, default: null },
  selected: { type: Object, default: null },
  initialView: { type: Object, default: null },
});
const emit = defineEmits(["pick", "view", "select"]);

const el = ref(null);
let map;
let pedLayer;
let vehLayer;
let liveLayer;
let poiLayer;
let zonesLayer;
let placesLayer;
let spotLayer;
let selectedMarker;
let areaCircle;
let centerMarker;
let radiusFrame;
let localPick = null;
let lastMoveEnd = 0;
const canvas = L.canvas({ padding: 0.3, tolerance: 6 });

// Más lejos que esto los puntos de negocios saturan el mapa.
const POI_MIN_ZOOM = 15;

const PED_GRADIENT = { 0.15: "#f7e2dc", 0.4: "#efae9f", 0.7: "#dd7a66", 1: "#c0503f" };
const VEH_GRADIENT = { 0.15: "#e3dff3", 0.45: "#a89ed6", 0.75: "#6c5eb0", 1: "#3a3172" };

function ratingColor(r) {
  if (r == null) return "#76707f";
  if (r >= 4.5) return "#6a5aa8";
  if (r >= 4) return "#a8741f";
  return "#b5574b";
}

function placeIcon(p, i) {
  const color = ratingColor(p.rating);
  const inside = p.distanceM <= props.radius;
  const size = inside ? 16 : 10;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html: `<div class="geo-dot is-clickable" style="width:${size}px;height:${size}px;--d:${Math.min(i * 45, 900)}ms;opacity:${inside ? 1 : 0.55}">
      ${inside ? `<span class="halo" style="background:${color};opacity:.3"></span>` : ""}
      <span class="core" style="background:${color};box-shadow:0 0 0 2px #fff"></span>
    </div>`,
  });
}

const centerIcon = L.divIcon({
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  html: `<div class="area-pin"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 22s-7-6.4-7-12a7 7 0 1 1 14 0c0 5.6-7 12-7 12z" fill="#6a5aa8" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="10" r="2.6" fill="#fbf8f6"/></svg></div>`,
});

const spotIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  html: `<div class="geo-dot" style="width:22px;height:22px"><span class="halo" style="background:#a8741f;opacity:.4"></span><span class="core" style="background:#a8741f;box-shadow:0 0 0 3px #fff"></span></div>`,
});

const selectedIcon = L.divIcon({
  className: "",
  iconSize: [40, 40],
  html: `<div class="selected-ring"><span></span></div>`,
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function setLayer(layer, on) {
  if (!layer || !map) return;
  if (on && !map.hasLayer(layer)) layer.addTo(map);
  if (!on && map.hasLayer(layer)) layer.remove();
}

function updateHeat(layer, points) {
  if (!layer) return;
  const c = layer._canvas;
  if (c) c.style.opacity = "0";
  setTimeout(() => {
    layer.setLatLngs(points);
    if (c) c.style.opacity = "1";
  }, 200);
}

function animateRadius(to) {
  if (!areaCircle) return;
  cancelAnimationFrame(radiusFrame);
  const from = areaCircle.getRadius();
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 450);
    areaCircle.setRadius(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) radiusFrame = requestAnimationFrame(step);
  };
  radiusFrame = requestAnimationFrame(step);
}

function pickHere({ lat, lng }) {
  localPick = [lat, lng];
  emit("pick", localPick);
}

function sameCoords(a, b) {
  return Boolean(a && b) && a[0] === b[0] && a[1] === b[1];
}

/** Lleva el mapa al área solo si quedó fuera de la vista. */
function reveal(coords) {
  const visible = map.getBounds().pad(-0.12).contains(coords);
  if (!visible || map.getZoom() < 14) map.flyTo(coords, Math.max(map.getZoom(), 15), { duration: 1 });
}

function drawArea() {
  if (!props.center) {
    areaCircle?.remove();
    centerMarker?.remove();
    areaCircle = centerMarker = null;
    return;
  }
  if (!areaCircle) {
    areaCircle = L.circle(props.center, {
      radius: 0,
      color: "#6a5aa8",
      weight: 2,
      fillColor: "#6a5aa8",
      fillOpacity: 0.06,
      dashArray: "6 8",
      interactive: false,
    }).addTo(map);
    centerMarker = L.marker(props.center, { icon: centerIcon, draggable: true, keyboard: false, zIndexOffset: 1000 }).addTo(map);
    centerMarker.on("drag", (e) => areaCircle.setLatLng(e.target.getLatLng()));
    centerMarker.on("dragend", (e) => pickHere(e.target.getLatLng()));
  } else {
    areaCircle.setLatLng(props.center);
    centerMarker.setLatLng(props.center);
  }
  animateRadius(props.radius);
  if (!sameCoords(props.center, localPick)) reveal(props.center);
}

function drawPois() {
  poiLayer.clearLayers();
  if (!props.layers.pois) return;
  props.pois.slice(0, 5000).forEach((p) => {
    L.circleMarker([p.lat, p.lng], {
      renderer: canvas,
      radius: p.name ? 4.5 : 3,
      weight: 1.5,
      color: "#fff",
      fillColor: poiGroups[p.group].color,
      fillOpacity: p.name ? 0.95 : 0.6,
      bubblingMouseEvents: false,
    })
      .bindTooltip(escapeHtml(p.name || poiGroups[p.group].label), { direction: "top", offset: [0, -4] })
      .on("click", () => emit("select", businessFromPoi(p)))
      .addTo(poiLayer);
  });
}

function drawZones() {
  zones.forEach((z) => {
    L.circle(z.coords, {
      radius: 450,
      color: "#6a5aa8",
      weight: 1.5,
      dashArray: "4 6",
      fillOpacity: 0.04,
      interactive: false,
    })
      .bindTooltip(z.short, { permanent: true, direction: "center", className: "zone-tip" })
      .addTo(zonesLayer);
  });
}

function drawPlaces() {
  placesLayer.clearLayers();
  props.places.forEach((p, i) => {
    const stars = p.rating != null ? `${p.rating.toFixed(1)} ★` : "Sin calificación";
    L.marker([p.lat, p.lng], { icon: placeIcon(p, i), keyboard: false, riseOnHover: true })
      .bindTooltip(`<strong>${escapeHtml(p.name)}</strong> · ${stars}`, { direction: "top", offset: [0, -8] })
      .on("click", () => emit("select", p))
      .addTo(placesLayer);
  });
}

function drawSpot() {
  spotLayer.clearLayers();
  if (!props.bestSpot) return;
  L.marker(props.bestSpot.coords, { icon: spotIcon, keyboard: false })
    .bindTooltip("Punto sugerido", { direction: "top", offset: [0, -12], permanent: true, className: "spot-tip" })
    .addTo(spotLayer);
}

function drawSelected() {
  selectedMarker?.remove();
  selectedMarker = null;
  const s = props.selected;
  if (!s || !map) return;
  selectedMarker = L.marker([s.lat, s.lng], { icon: selectedIcon, interactive: false, keyboard: false, zIndexOffset: 900 }).addTo(map);
  if (!map.getBounds().pad(-0.12).contains([s.lat, s.lng])) map.panTo([s.lat, s.lng]);
}

function applyLayers() {
  const l = props.layers;
  setLayer(pedLayer, l.pedestrian);
  setLayer(vehLayer, l.vehicular);
  setLayer(liveLayer, l.live);
  setLayer(poiLayer, l.pois && map.getZoom() >= POI_MIN_ZOOM);
  setLayer(zonesLayer, l.zones);
  setLayer(placesLayer, l.competitors);
  setLayer(spotLayer, l.spot);
  drawPois();
}

function emitView() {
  lastMoveEnd = Date.now();
  const b = map.getBounds();
  const c = map.getCenter();
  emit("view", {
    south: b.getSouth(),
    west: b.getWest(),
    north: b.getNorth(),
    east: b.getEast(),
    zoom: map.getZoom(),
    center: [c.lat, c.lng],
  });
}

onMounted(async () => {
  const start = props.initialView ?? { center: props.center ?? MORELIA_CENTER, zoom: 15 };
  map = L.map(el.value, { center: start.center, zoom: start.zoom, scrollWheelZoom: true, zoomControl: false });
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    className: "geo-tiles",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  poiLayer = L.layerGroup();
  zonesLayer = L.layerGroup();
  placesLayer = L.layerGroup();
  spotLayer = L.layerGroup();
  if (tomtomFlowTilesUrl) {
    liveLayer = L.tileLayer(tomtomFlowTilesUrl, { opacity: 0.8, zIndex: 5, attribution: "Tráfico &copy; TomTom" });
  }
  drawZones();

  // Un arrastre que termina justo antes del clic no debe mover el área.
  map.on("click", (e) => {
    if (Date.now() - lastMoveEnd < 250) return;
    pickHere(e.latlng);
  });
  map.on("moveend", emitView);
  map.on("zoomend", () => setLayer(poiLayer, props.layers.pois && map.getZoom() >= POI_MIN_ZOOM));

  window.L = L;
  await import("leaflet.heat");
  if (!map) return;
  const heatOptions = { radius: 20, blur: 22, maxZoom: 17, minOpacity: 0.1 };
  pedLayer = L.heatLayer(props.pedHeat, { ...heatOptions, radius: 26, blur: 30, max: 2.6, gradient: PED_GRADIENT });
  vehLayer = L.heatLayer(props.vehHeat, { ...heatOptions, radius: 11, blur: 10, max: 1.4, minOpacity: 0.2, gradient: VEH_GRADIENT });

  applyLayers();
  [pedLayer, vehLayer].forEach((h) => h._canvas?.classList.add("heat-canvas"));
  localPick = props.center;
  drawArea();
  drawPlaces();
  drawSpot();
  drawSelected();
  emitView();
});

watch(() => props.pedHeat, (v) => updateHeat(pedLayer, v));
watch(() => props.vehHeat, (v) => updateHeat(vehLayer, v));
watch(() => props.pois, drawPois);
watch(() => ({ ...props.layers }), () => {
  applyLayers();
  [pedLayer, vehLayer].forEach((h) => h?._canvas?.classList.add("heat-canvas"));
});
watch(() => props.center, drawArea);
watch(() => props.radius, () => {
  animateRadius(props.radius);
  drawPlaces();
});
watch(() => props.places, drawPlaces);
watch(() => props.bestSpot, drawSpot);
watch(() => props.selected, drawSelected);

onBeforeUnmount(() => {
  cancelAnimationFrame(radiusFrame);
  map?.remove();
  map = null;
});

defineExpose({
  focus(coords, zoom = 16) {
    map?.flyTo(coords, zoom, { duration: 1.1 });
  },
  invalidate() {
    map?.invalidateSize();
  },
});
</script>

<template>
  <div ref="el" class="isolate h-full w-full" />
</template>
