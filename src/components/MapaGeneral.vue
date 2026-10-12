<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import { MORELIA_CENTER } from "@/data/zones";

const props = defineProps({
  points: { type: Array, default: () => [] },
  // [{ zone, score, level }]
  zoneScores: { type: Array, default: () => [] },
  selectedZone: { type: String, default: null },
  marker: { type: Array, default: null },
  zoom: { type: Number, default: 15 },
  interactive: { type: Boolean, default: true },
});
const emit = defineEmits(["select-zone", "pick"]);

const el = ref(null);
let map;
let tiles;
let pointsLayer;
let zonesLayer;
let markerLayer;

function setTiles() {
  if (tiles) return;
  tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    className: "geo-tiles",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
}

function dotIcon(color, delay, size = 12) {
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    html: `<div class="geo-dot" style="width:${size}px;height:${size}px;--d:${delay}ms">
      <span class="halo" style="background:${color};opacity:.35"></span>
      <span class="core" style="background:${color};box-shadow:0 0 0 2px #fff"></span>
    </div>`,
  });
}

function drawPoints() {
  pointsLayer.clearLayers();
  props.points.forEach((p, i) => {
    L.marker([p.lat, p.lng], {
      icon: dotIcon(p.color || "#b5574b", Math.min(i * 12, 1400), 10),
      interactive: false,
      keyboard: false,
    }).addTo(pointsLayer);
  });
}

function drawZones() {
  zonesLayer.clearLayers();
  props.zoneScores.forEach(({ zone, score, level }) => {
    const selected = zone.id === props.selectedZone;
    const circle = L.circle(zone.coords, {
      radius: 380,
      color: level.color,
      weight: selected ? 3 : 1.5,
      opacity: 0.9,
      fillColor: level.color,
      fillOpacity: selected ? 0.22 : 0.1,
      dashArray: selected ? null : "6 8",
    }).addTo(zonesLayer);
    circle.bindTooltip(`<strong>${zone.short}</strong> · IVC ${score}`, { direction: "top", offset: [0, -10] });
    circle.on("click", () => emit("select-zone", zone.id));
  });
}

function drawMarker() {
  markerLayer.clearLayers();
  if (!props.marker) return;
  L.marker(props.marker, { icon: dotIcon("#6a5aa8", 0, 22) }).addTo(markerLayer);
  map.flyTo(props.marker, 16, { duration: 1.2 });
}

onMounted(() => {
  map = L.map(el.value, {
    center: MORELIA_CENTER,
    zoom: props.zoom,
    zoomControl: props.interactive,
    scrollWheelZoom: false,
    dragging: props.interactive,
    attributionControl: true,
  });
  setTiles();
  zonesLayer = L.layerGroup().addTo(map);
  pointsLayer = L.layerGroup().addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  map.on("click", (e) => emit("pick", [e.latlng.lat, e.latlng.lng]));
  drawZones();
  drawPoints();
  drawMarker();
});

watch(() => props.points, drawPoints);
watch(() => [props.zoneScores, props.selectedZone], drawZones);
watch(() => props.marker, drawMarker);
watch(
  () => props.selectedZone,
  (id) => {
    const z = props.zoneScores.find((s) => s.zone.id === id);
    if (z) map.flyTo(z.zone.coords, 16, { duration: 1 });
  },
);

onBeforeUnmount(() => map?.remove());
</script>

<template>
  <div ref="el" class="h-full w-full" />
</template>
