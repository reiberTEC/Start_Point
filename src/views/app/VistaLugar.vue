<script setup>
import { computed, nextTick, ref, shallowRef, toRef, watch } from "vue";
import MapaDeZona from "@/components/MapaDeZona.vue";
import FichaNegocio from "@/components/FichaNegocio.vue";
import AnilloIvc from "@/components/AnilloIvc.vue";
import ContadorAnimado from "@/components/ContadorAnimado.vue";
import { periods, pedestrianHeat, vehicularHeat, transitAt, transitLabel, poiGroups } from "@/lib/transit";
import { loadAround, loadBounds, mergedData } from "@/lib/osm";
import { findSimilarBusinesses } from "@/lib/places";
import { analyzeReviews } from "@/lib/reviews";
import { recommend } from "@/lib/recommend";
import { businessesAround, googleEmbedUrl, streetCamera } from "@/lib/business";
import { hasGoogleKey } from "@/lib/google";
import { hasTomTomKey, fetchFlowSegment } from "@/lib/tomtom";
import { useSettings } from "@/composables/useSettings";
import { placeState } from "@/stores/placeSearch";

const { weights } = useSettings();

const mapRef = ref(null);
const resultsRef = ref(null);

const center = toRef(placeState, "center");
const radius = toRef(placeState, "radius");
const period = toRef(placeState, "period");
const concept = toRef(placeState, "concept");
const layers = placeState.layers;
const initialView = placeState.view;
const query = ref("");
const searching = ref(false);
const error = ref("");

const menuOpen = ref(false);

const sheet = ref(null);
const selected = ref(null);
const googleQuery = ref("");
const googleSearch = ref("");

const osm = shallowRef({ roads: [], pois: [] });
const osmJobs = ref(0);
const osmLoading = computed(() => osmJobs.value > 0);
const osmError = ref("");
const zoom = ref(initialView?.zoom ?? 15);
let viewTimer;

const status = ref("idle");
const loadingStep = ref(0);
const result = ref(null);
const analyzedKey = ref("");

const conceptIdeas = ["Cafetería de especialidad", "Taquería", "Pizzería", "Nieves y paletas", "Farmacia", "Papelería"];
const quickPlaces = [
  { label: "Centro Histórico", coords: [19.7027, -101.1923] },
  { label: "Mercado Independencia", coords: [19.6965, -101.1886] },
  { label: "Av. Madero Pte.", coords: [19.7044, -101.2025] },
  { label: "Bucareli", coords: [19.7101, -101.1962] },
];
const loadingSteps = [
  "Buscando negocios parecidos",
  "Leyendo sus reseñas",
  "Midiendo el tránsito del área",
  "Preparando tu recomendación",
];

const layerGroups = computed(() => [
  {
    title: "Tránsito",
    items: [
      { key: "pedestrian", label: "Gente a pie", hint: "Comercios, paradas y calles peatonales", swatch: "legend-ped" },
      { key: "vehicular", label: "Autos", hint: "Avenidas según su jerarquía", swatch: "legend-veh" },
      { key: "live", label: "Tráfico en vivo", hint: hasTomTomKey ? "TomTom, tiempo real" : "Requiere clave de TomTom", disabled: !hasTomTomKey },
    ],
  },
  {
    title: "Lugares",
    items: [
      { key: "pois", label: "Negocios y servicios", hint: "Toca uno para ver su ficha" },
      { key: "zones", label: "Zonas de estudio", hint: "Las 5 zonas del protocolo" },
    ],
  },
  {
    title: "Tu análisis",
    items: [
      { key: "competitors", label: "Negocios parecidos", hint: "Aparecen al analizar", disabled: !result.value },
      { key: "spot", label: "Punto sugerido", hint: "Si hay uno mejor cerca", disabled: !result.value?.rec.bestSpot },
    ],
  },
]);

const activeLayers = computed(
  () => layerGroups.value.flatMap((g) => g.items).filter((item) => layers[item.key] && !item.disabled).length,
);
const hasOsm = computed(() => osm.value.roads.length + osm.value.pois.length > 0);
const pedHeat = computed(() => (layers.pedestrian ? pedestrianHeat(osm.value, period.value) : []));
const vehHeat = computed(() => (layers.vehicular ? vehicularHeat(osm.value, period.value) : []));
const transit = computed(() => (center.value && hasOsm.value ? transitAt(osm.value, center.value, radius.value) : null));
const now = computed(() => transit.value?.byPeriod.find((p) => p.id === period.value));

const currentKey = computed(() => `${center.value?.join()}|${radius.value}|${concept.value.trim().toLowerCase()}`);
const stale = computed(() => status.value === "done" && analyzedKey.value !== currentKey.value);
const canAnalyze = computed(() => center.value && concept.value.trim().length > 1 && status.value !== "loading");
const showAnalysis = computed(() => result.value && !stale.value);

const mapStatus = computed(() => {
  if (zoom.value < 14) return { text: "Acércate para ver el tránsito", spin: false };
  if (osmLoading.value) return { text: "Cargando calles y comercios…", spin: true };
  if (osmError.value) return { text: osmError.value, spin: false, warn: true };
  return null;
});

const topCompetitors = computed(() =>
  result.value ? [...result.value.rec.inArea].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 6) : [],
);

const factorRows = computed(() => {
  if (!result.value) return [];
  const f = result.value.rec.factors;
  return [
    { label: "Tránsito", value: f.traffic, hint: "Gente a pie y autos que pasan por el área" },
    { label: "Demanda", value: f.demand, hint: "Reseñas de la competencia y pedidos por delivery" },
    { label: "Espacio frente a la competencia", value: f.competition, hint: "Menos saturación, más espacio para ti" },
    { label: "Oportunidad de calidad", value: f.quality, hint: "Competencia con calificaciones bajas" },
  ];
});

async function refreshOsm(loader) {
  osmJobs.value++;
  try {
    const failed = await loader(() => (osm.value = mergedData()));
    osm.value = mergedData();
    osmError.value = failed ? "Parte del mapa no cargó; intenta mover el mapa de nuevo." : "";
  } catch {
    osmError.value = "No pudimos cargar OpenStreetMap. Revisa tu conexión.";
  } finally {
    osmJobs.value--;
  }
}

const areaBusinesses = computed(() => {
  const similar = showAnalysis.value
    ? result.value.places
        .filter((p) => p.distanceM <= radius.value)
        .map((p) => ({ ...p, similar: true, group: p.group ?? "food", type: p.type || "Parecido a tu idea" }))
    : [];
  return [...similar, ...businessesAround(osm.value.pois, center.value, radius.value)];
});

const googleSrc = computed(() => {
  const v = placeState.view;
  const c = v?.center ?? center.value;
  if (!c) return "";
  return googleEmbedUrl({ q: googleQuery.value || undefined, lat: c[0], lng: c[1], zoom: Math.round(v?.zoom ?? 16) });
});

function openList() {
  menuOpen.value = false;
  placeState.mode = "geo";
  sheet.value = "list";
}

function selectBusiness(b) {
  menuOpen.value = false;
  placeState.mode = "geo";
  selected.value = { ...b, camera: streetCamera(osm.value, b) };
  sheet.value = "detail";
}

function closeSheet() {
  sheet.value = null;
  selected.value = null;
}

function setMode(mode) {
  placeState.mode = mode;
  menuOpen.value = false;
  if (mode === "google" && !googleSearch.value) googleSearch.value = concept.value.trim();
  if (mode === "google") googleQuery.value = googleSearch.value.trim();
}

function searchGoogle(text = googleSearch.value) {
  googleSearch.value = text;
  googleQuery.value = text.trim();
}

function openInGoogle() {
  closeSheet();
  setMode("google");
}

function moveAreaTo(coords) {
  setCenter(coords);
  closeSheet();
}

watch(menuOpen, (open) => {
  if (open && sheet.value) closeSheet();
});

function onView(view) {
  placeState.view = { center: view.center, zoom: view.zoom };
  zoom.value = view.zoom;
  clearTimeout(viewTimer);
  if (view.zoom < 14) return;
  viewTimer = setTimeout(() => refreshOsm((onCell) => loadBounds(view, onCell)), 350);
}

function setCenter(coords) {
  center.value = coords;
  error.value = "";
  refreshOsm((onCell) => loadAround(coords, radius.value * 2.5, onCell));
}

async function searchAddress() {
  error.value = "";
  const q = query.value.trim();
  if (!q) return;
  const coordMatch = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (coordMatch) {
    setCenter([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
    return;
  }
  searching.value = true;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${q}, Morelia, Michoacán`)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "es" } });
    const [hit] = await res.json();
    if (!hit) throw new Error();
    setCenter([parseFloat(hit.lat), parseFloat(hit.lon)]);
  } catch {
    error.value = "No encontramos esa dirección. Prueba con calle y colonia, o toca el mapa.";
  } finally {
    searching.value = false;
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function analyze() {
  if (!canAnalyze.value) return;
  const params = { concept: concept.value.trim(), center: [...center.value], radius: radius.value };
  status.value = "loading";
  loadingStep.value = 0;
  error.value = "";

  const ticker = setInterval(() => {
    if (loadingStep.value < loadingSteps.length - 1) loadingStep.value++;
  }, 600);

  try {
    const [search, flow] = await Promise.all([
      findSimilarBusinesses(params),
      hasTomTomKey ? fetchFlowSegment(params.center).catch(() => null) : null,
      refreshOsm((onCell) => loadAround(params.center, params.radius * 2.5, onCell)),
      wait(2200),
    ]);
    const reviews = analyzeReviews(search.places.filter((p) => p.distanceM <= params.radius));
    const rec = recommend({ ...params, ...search, reviews, osm: osm.value, weights });
    result.value = { ...search, reviews, rec, flow, params };
    analyzedKey.value = currentKey.value;
    status.value = "done";
    await nextTick();
    resultsRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    console.error(e);
    error.value = "Algo salió mal al analizar el área. Intenta de nuevo.";
    status.value = result.value ? "done" : "idle";
  } finally {
    clearInterval(ticker);
  }
}

function useSpot() {
  setCenter(result.value.rec.bestSpot.coords);
  analyze();
}

function stars(r) {
  return r == null ? "" : "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
}
</script>

<template>
  <section class="mx-auto max-w-[1500px] px-3 pt-4 pb-16 md:px-6">
    <div class="flex flex-wrap items-end justify-between gap-2 px-2 animate-[fade-up_.6s_var(--ease-soft)_both]">
      <h1 class="title text-3xl sm:text-4xl">¿Dónde abrir <span class="italic text-sage">tu negocio</span>?</h1>
      <p class="text-sm text-mute">Elige el área, activa las capas que quieras y analiza tu idea.</p>
    </div>

    <div class="relative mt-4">
      <!-- Mapa -->
      <div class="card relative h-[68svh] min-h-[460px] overflow-hidden !rounded-[1.75rem] lg:h-[calc(100svh-8.5rem)] lg:min-h-[620px] animate-[fade-up_.8s_.1s_var(--ease-soft)_both]">
        <MapaDeZona
          ref="mapRef"
          :center="center"
          :radius="radius"
          :layers="layers"
          :ped-heat="pedHeat"
          :veh-heat="vehHeat"
          :pois="osm.pois"
          :places="showAnalysis ? result.places : []"
          :best-spot="showAnalysis ? result.rec.bestSpot : null"
          :selected="selected"
          :initial-view="initialView"
          @pick="setCenter"
          @view="onView"
          @select="selectBusiness"
        />

        <!-- Vista de Google Maps -->
        <Transition name="fade">
          <div v-if="placeState.mode === 'google'" class="absolute inset-0 z-[580] bg-sand">
            <iframe
              v-if="googleSrc"
              :key="googleSrc"
              :src="googleSrc"
              title="Negocios registrados en Google Maps"
              class="h-full w-full border-0"
              referrerpolicy="no-referrer-when-downgrade"
            />
            <form
              class="glass absolute bottom-7 left-1/2 flex w-[min(28rem,calc(100%-6rem))] -translate-x-1/2 items-center gap-1 rounded-full p-1.5 lg:left-[calc(50%-190px)]"
              @submit.prevent="searchGoogle()"
            >
              <svg viewBox="0 0 24 24" class="ml-2 h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input
                v-model="googleSearch"
                class="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-mute"
                placeholder="Buscar en Google Maps: cafetería, farmacia…"
                aria-label="Buscar negocios en Google Maps"
              />
              <button v-if="googleQuery" type="button" class="rounded-full px-3 py-1.5 text-xs text-ink-soft hover:bg-ink/5" @click="searchGoogle('')">Ver todo</button>
              <button type="submit" class="rounded-full bg-sage px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sage/90">Buscar</button>
            </form>
          </div>
        </Transition>

        <!-- Selector de vista -->
        <div class="absolute top-3 right-3 z-[620] lg:right-auto lg:left-[calc(50%-190px)] lg:-translate-x-1/2">
          <div class="glass relative grid grid-cols-2 rounded-full p-1 text-xs font-medium sm:text-sm">
            <span
              class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-500 dark:bg-night"
              :style="{ transform: placeState.mode === 'google' ? 'translateX(100%)' : 'none', transitionTimingFunction: 'var(--ease-soft)' }"
            />
            <button
              type="button"
              class="relative rounded-full px-3 py-1.5 transition-colors sm:px-4"
              :class="placeState.mode === 'geo' ? 'text-sage' : 'text-ink-soft dark:text-sand/70'"
              :aria-pressed="placeState.mode === 'geo'"
              @click="setMode('geo')"
            >
              Tránsito
            </button>
            <button
              type="button"
              class="relative rounded-full px-3 py-1.5 transition-colors sm:px-4"
              :class="placeState.mode === 'google' ? 'text-sage' : 'text-ink-soft dark:text-sand/70'"
              :aria-pressed="placeState.mode === 'google'"
              @click="setMode('google')"
            >
              Google Maps
            </button>
          </div>
        </div>

        <!-- Ficha / lista de negocios -->
        <Transition name="sheet">
          <div
            v-if="sheet && placeState.mode === 'geo'"
            class="absolute inset-x-2 bottom-2 z-[640] flex max-h-[80%] flex-col justify-end lg:inset-x-auto lg:top-16 lg:bottom-3 lg:left-3 lg:max-h-none lg:w-[380px] lg:justify-start"
          >
            <FichaNegocio
              :view="sheet"
              :items="areaBusinesses"
              :selected="selected"
              :area-center="center"
              @close="closeSheet"
              @back="sheet = 'list'"
              @select="selectBusiness"
              @move-area="moveAreaTo"
              @google="openInGoogle"
            />
          </div>
        </Transition>

        <!-- Menú de capas -->
        <div v-show="placeState.mode === 'geo'" class="absolute top-3 left-3 z-[600]">
          <button
            type="button"
            class="glass flex items-center gap-2 rounded-full py-2 pr-4 pl-3 text-sm font-medium transition duration-300 hover:-translate-y-0.5"
            :aria-expanded="menuOpen"
            aria-controls="layers-menu"
            @click="menuOpen = !menuOpen"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5 text-sage" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
              <path d="m12 3 9 5-9 5-9-5 9-5z" />
              <path d="m3 13 9 5 9-5" class="transition-transform duration-500" :class="menuOpen ? 'translate-y-0.5' : ''" />
            </svg>
            Capas
            <span class="grid h-5 min-w-5 place-items-center rounded-full bg-sage px-1.5 text-[11px] text-white">{{ activeLayers }}</span>
          </button>

          <Transition name="menu-pop">
            <div
              v-if="menuOpen"
              id="layers-menu"
              class="glass mt-2 max-h-[calc(68svh-5rem)] w-[min(19rem,calc(100vw-3rem))] overflow-y-auto rounded-3xl p-4 lg:max-h-[calc(100svh-14rem)]"
            >
              <p class="text-xs font-medium tracking-wide text-mute uppercase">Momento del día</p>
              <div class="mt-2 grid grid-cols-4 gap-1 rounded-2xl bg-ink/[0.04] p-1 dark:bg-white/5">
                <button
                  v-for="p in periods"
                  :key="p.id"
                  type="button"
                  class="rounded-xl py-1.5 text-xs font-medium transition duration-300"
                  :class="period === p.id ? 'bg-white text-sage shadow-sm dark:bg-night-2' : 'text-ink-soft hover:text-ink dark:text-sand/70'"
                  :title="p.hours"
                  @click="period = p.id"
                >
                  {{ p.label }}
                </button>
              </div>

              <div v-for="(group, gi) in layerGroups" :key="group.title" class="mt-5">
                <p class="text-xs font-medium tracking-wide text-mute uppercase">{{ group.title }}</p>
                <ul class="mt-2 space-y-1">
                  <li v-for="(item, i) in group.items" :key="item.key" class="layer-row" :style="{ '--i': gi * 3 + i }">
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="layers[item.key] && !item.disabled"
                      :disabled="item.disabled"
                      class="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition duration-300 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/5"
                      @click="layers[item.key] = !layers[item.key]"
                    >
                      <span class="min-w-0 flex-1">
                        <span class="flex items-center gap-2 text-sm font-medium">
                          <span v-if="item.swatch" class="h-2 w-6 rounded-full" :class="item.swatch" />
                          {{ item.label }}
                        </span>
                        <span class="block text-xs text-mute">{{ item.hint }}</span>
                      </span>
                      <span class="switch" :class="layers[item.key] && !item.disabled ? 'is-on' : ''"><span /></span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Estado del mapa -->
        <Transition name="fade">
          <div
            v-if="mapStatus && placeState.mode === 'geo'"
            class="pointer-events-none absolute top-16 left-1/2 z-[550] -translate-x-1/2 lg:left-[calc(50%-190px)]"
          >
            <div class="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium" :class="mapStatus.warn ? 'text-terra' : 'text-ink-soft dark:text-sand/80'">
              <span v-if="mapStatus.spin" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
              {{ mapStatus.text }}
            </div>
          </div>
        </Transition>

        <!-- Leyenda -->
        <TransitionGroup
          v-show="placeState.mode === 'geo' && !sheet"
          tag="div"
          name="fade"
          class="absolute bottom-3 left-3 z-[500] flex flex-col gap-1.5"
        >
          <div v-if="layers.pedestrian" key="ped" class="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] text-ink-soft dark:text-sand/80">
            <span>A pie</span><span class="legend-ped h-2 w-16 rounded-full" /><span>más gente</span>
          </div>
          <div v-if="layers.vehicular" key="veh" class="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] text-ink-soft dark:text-sand/80">
            <span>Autos</span><span class="legend-veh h-2 w-16 rounded-full" /><span>más flujo</span>
          </div>
          <div v-if="layers.pois" key="poi" class="glass flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-3 py-1.5 text-[11px] text-ink-soft dark:text-sand/80">
            <span v-for="(g, id) in poiGroups" :key="id" class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ background: g.color }" />{{ g.label }}
            </span>
          </div>
        </TransitionGroup>

        <Transition name="fade">
          <div v-if="!center && placeState.mode === 'geo'" class="pointer-events-none absolute inset-0 z-[400] grid place-items-center lg:pr-[400px]">
            <div class="glass flex items-center gap-3 rounded-full px-5 py-3 text-sm">
              <span class="h-3 w-3 animate-breathe rounded-full bg-sage" />
              Toca el mapa para elegir tu área
            </div>
          </div>
        </Transition>
      </div>

      <!-- Panel -->
      <aside
        class="mt-4 flex flex-col gap-4 lg:absolute lg:top-3 lg:right-3 lg:z-[600] lg:mt-0 lg:max-h-[calc(100%-1.5rem)] lg:w-[380px] lg:overflow-y-auto lg:rounded-[1.6rem] no-scrollbar animate-[fade-up_.8s_.25s_var(--ease-soft)_both]"
      >
        <div class="card p-5 lg:!bg-white/85 lg:backdrop-blur-xl dark:lg:!bg-night-2/90">
          <div class="flex items-center gap-3">
            <span class="step-badge" :class="center ? 'is-done' : ''">1</span>
            <h2 class="font-semibold">Tu área</h2>
          </div>

          <Transition name="swap" mode="out-in">
            <div v-if="!center" key="empty" class="mt-3">
              <p class="text-sm text-ink-soft dark:text-sand/70">Toca el mapa, busca una dirección o elige una zona:</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button v-for="p in quickPlaces" :key="p.label" type="button" class="chip !px-3 !py-1.5 text-xs" @click="setCenter(p.coords)">
                  {{ p.label }}
                </button>
              </div>
            </div>

            <div v-else-if="!transit" key="loading" class="mt-4 space-y-3">
              <div class="skeleton h-12 w-28" />
              <div class="skeleton h-4 w-full" />
              <div class="skeleton h-4 w-2/3" />
            </div>

            <div v-else key="filled" class="mt-4">
              <div class="flex items-end justify-between gap-3">
                <div>
                  <p class="text-xs text-mute">Transitabilidad · {{ now.label.toLowerCase() }}</p>
                  <p class="font-serif font-bold tracking-tight text-6xl leading-none">
                    <ContadorAnimado :value="now.combined" :duration="800" />
                  </p>
                  <p class="mt-1 text-sm font-medium text-sage">{{ transitLabel(now.combined) }}</p>
                </div>
                <div class="flex h-20 items-end gap-1.5" aria-label="Transitabilidad por momento del día">
                  <button
                    v-for="p in transit.byPeriod"
                    :key="p.id"
                    type="button"
                    class="group flex h-full w-7 flex-col items-center justify-end gap-1"
                    :title="`${p.label} (${p.hours}): ${p.combined}`"
                    @click="period = p.id"
                  >
                    <span
                      class="w-full rounded-t-lg transition-all duration-700 group-hover:opacity-80"
                      :class="period === p.id ? 'bg-sage' : 'bg-sand-2 dark:bg-white/15'"
                      :style="{ height: `${Math.max(6, p.combined * 0.6)}px` }"
                    />
                    <span class="text-[10px] text-mute">{{ p.label.slice(0, 3) }}</span>
                  </button>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="rounded-2xl bg-terra-soft/60 px-3 py-2.5 dark:bg-white/5">
                  <p class="text-[11px] text-mute">Gente a pie</p>
                  <p class="text-xl font-semibold tabular-nums text-terra">{{ now.pedestrian }}</p>
                </div>
                <div class="rounded-2xl bg-sage-soft px-3 py-2.5 dark:bg-white/5">
                  <p class="text-[11px] text-mute">Autos</p>
                  <p class="text-xl font-semibold tabular-nums text-[#6c5eb0]">{{ now.vehicular }}</p>
                </div>
              </div>
              <p class="mt-3 text-xs leading-relaxed text-mute">
                En {{ radius }} m: {{ transit.counts.pois }} comercios y servicios,
                {{ transit.counts.transport }} {{ transit.counts.transport === 1 ? "parada" : "paradas" }} de transporte y
                {{ transit.counts.avenuesKm }} km de avenidas.
              </p>
              <button
                type="button"
                class="group mt-3 flex w-full items-center justify-between rounded-2xl bg-sand/80 px-4 py-2.5 text-sm font-medium transition duration-300 hover:-translate-y-0.5 hover:bg-sand dark:bg-white/5"
                @click="openList"
              >
                <span>Ver negocios del área <span class="text-mute">({{ areaBusinesses.length }})</span></span>
                <svg viewBox="0 0 24 24" class="h-4 w-4 text-sage transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6" /></svg>
              </button>

              <label class="mt-4 block text-sm">
                <span class="flex justify-between text-ink-soft dark:text-sand/70">
                  <span>Radio del área</span><span class="font-medium tabular-nums">{{ radius }} m</span>
                </span>
                <input v-model.number="radius" type="range" min="200" max="1000" step="50" class="mt-2 w-full accent-sage" />
              </label>
              <p class="mt-1 text-xs text-mute">Arrastra el pin para mover el área.</p>
            </div>
          </Transition>

          <form class="mt-4 flex gap-2" @submit.prevent="searchAddress">
            <label class="sr-only" for="address">Buscar dirección</label>
            <input id="address" v-model="query" class="field !py-2.5 text-sm" placeholder="Buscar dirección o coordenadas" />
            <button type="submit" class="btn-ghost !px-4 !py-2.5 text-sm" :disabled="searching" aria-label="Buscar">
              <span v-if="searching" class="h-4 w-4 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
              <span v-else>Ir</span>
            </button>
          </form>
        </div>

        <div class="card p-5 lg:!bg-white/85 lg:backdrop-blur-xl dark:lg:!bg-night-2/90">
          <div class="flex items-center gap-3">
            <span class="step-badge" :class="concept.trim() ? 'is-done' : ''">2</span>
            <h2 class="font-semibold">Tu concepto</h2>
          </div>
          <label class="sr-only" for="concept">¿Qué negocio quieres abrir?</label>
          <input id="concept" v-model="concept" class="field mt-3 !py-3" placeholder="¿Qué negocio quieres abrir?" @keydown.enter.prevent="analyze" />
          <div class="mt-3 flex flex-wrap gap-1.5">
            <button
              v-for="idea in conceptIdeas"
              :key="idea"
              type="button"
              class="chip !px-3 !py-1.5 text-xs"
              :class="concept === idea ? 'chip-active' : ''"
              @click="concept = idea"
            >
              {{ idea }}
            </button>
          </div>

          <button
            type="button"
            class="btn-primary mt-5 w-full"
            :disabled="!canAnalyze"
            :class="!canAnalyze ? 'opacity-50 hover:!translate-y-0' : ''"
            @click="analyze"
          >
            {{ stale ? "Actualizar análisis" : "Analizar" }}
          </button>

          <Transition name="swap">
            <ul v-if="status === 'loading'" class="mt-4 space-y-2" aria-live="polite">
              <li
                v-for="(s, i) in loadingSteps"
                :key="s"
                class="flex items-center gap-3 text-sm transition duration-500"
                :class="i <= loadingStep ? 'opacity-100' : 'opacity-35'"
              >
                <span class="grid h-5 w-5 place-items-center rounded-full" :class="i < loadingStep ? 'bg-sage text-white' : 'bg-sage-soft'">
                  <svg v-if="i < loadingStep" viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10" /></svg>
                  <span v-else-if="i === loadingStep" class="h-2 w-2 animate-ping rounded-full bg-sage" />
                </span>
                {{ s }}
              </li>
            </ul>
          </Transition>
          <p v-if="error" class="mt-4 rounded-xl bg-terra-soft px-4 py-3 text-sm text-terra" role="alert">{{ error }}</p>
          <button
            v-if="status === 'done' && !stale"
            type="button"
            class="mt-3 w-full text-center text-sm text-sage underline-offset-4 hover:underline"
            @click="resultsRef?.scrollIntoView({ behavior: 'smooth' })"
          >
            Ver recomendación ↓
          </button>
        </div>
      </aside>
    </div>

    <!-- Resultados -->
    <div ref="resultsRef" class="mx-auto max-w-6xl scroll-mt-6">
      <Transition name="results">
        <div v-if="status === 'done' && result" :key="analyzedKey" class="mt-10">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="title text-3xl sm:text-4xl">Tu recomendación</h2>
            <span class="rounded-full px-3 py-1 text-xs" :class="result.source === 'google' ? 'bg-sage-soft text-sage' : 'bg-amber-soft text-amber'">
              {{ result.source === "google" ? "Negocios reales de Google" : "Negocios de demostración" }}
            </span>
          </div>
          <p v-if="stale" class="mt-3 rounded-xl bg-amber-soft px-4 py-2.5 text-sm text-amber">
            Cambiaste el área o el concepto. Pulsa “Actualizar análisis” para recalcular.
          </p>
          <p v-if="result.warning" class="mt-3 rounded-xl bg-amber-soft px-4 py-2.5 text-sm text-amber">{{ result.warning }}</p>

          <div class="mt-6 grid gap-5 lg:grid-cols-12">
            <article v-reveal class="card p-7 lg:col-span-5">
              <div class="flex items-center gap-5">
                <AnilloIvc :score="result.rec.score" :size="116" :stroke="9" />
                <div>
                  <span class="rounded-full px-3 py-1 text-xs" :style="{ background: result.rec.level.soft, color: result.rec.level.color }">
                    {{ result.rec.level.label }}
                  </span>
                  <h3 class="title mt-3 text-3xl">{{ result.rec.headline }}</h3>
                </div>
              </div>
              <ul class="mt-6 space-y-3">
                <li
                  v-for="(r, i) in result.rec.reasons"
                  :key="i"
                  class="flex gap-3 text-sm leading-relaxed"
                  :style="{ animation: `fade-up .6s ${300 + i * 90}ms var(--ease-soft) both` }"
                >
                  <span
                    class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                    :class="{ 'bg-sage-soft text-sage': r.kind === 'pos', 'bg-terra-soft text-terra': r.kind === 'neg', 'bg-ink/[0.06] text-mute dark:bg-white/10': r.kind === 'neutral' }"
                  >
                    {{ r.kind === "pos" ? "✓" : r.kind === "neg" ? "!" : "•" }}
                  </span>
                  <span class="text-ink-soft dark:text-sand/80">{{ r.text }}</span>
                </li>
              </ul>
            </article>

            <article v-reveal="100" class="card p-7 lg:col-span-7">
              <h3 class="text-lg font-semibold">Cómo se calculó</h3>
              <div class="mt-5 grid grid-cols-3 gap-3">
                <div class="rounded-2xl bg-sand/70 p-4 dark:bg-white/5">
                  <p class="font-serif font-bold tracking-tight text-4xl leading-none"><ContadorAnimado :value="result.rec.inArea.length" :duration="900" /></p>
                  <p class="mt-1 text-xs text-mute">negocios parecidos</p>
                </div>
                <div class="rounded-2xl bg-sand/70 p-4 dark:bg-white/5">
                  <p class="font-serif font-bold tracking-tight text-4xl leading-none">{{ result.rec.avgRating ? result.rec.avgRating.toFixed(1) : "—" }}</p>
                  <p class="mt-1 text-xs text-mute">calificación promedio</p>
                </div>
                <div class="rounded-2xl bg-sand/70 p-4 dark:bg-white/5">
                  <p class="font-serif font-bold tracking-tight text-4xl leading-none"><ContadorAnimado :value="result.rec.transit.avg" :duration="900" /></p>
                  <p class="mt-1 text-xs text-mute">
                    transitabilidad del día · a pie {{ result.rec.transit.pedestrianAvg }}, autos {{ result.rec.transit.vehicularAvg }}
                  </p>
                </div>
              </div>
              <ul class="mt-6 space-y-4">
                <li v-for="(f, i) in factorRows" :key="f.label">
                  <div class="flex items-baseline justify-between text-sm">
                    <span class="font-medium">{{ f.label }}</span>
                    <span class="tabular-nums text-mute">{{ Math.round(f.value * 100) }}</span>
                  </div>
                  <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/10">
                    <div class="bar-fill h-full rounded-full bg-sage" :style="{ '--w': `${Math.round(f.value * 100)}%`, animationDelay: `${400 + i * 120}ms` }" />
                  </div>
                  <p class="mt-1 text-xs text-mute">{{ f.hint }}</p>
                </li>
              </ul>
              <p v-if="result.flow" class="mt-5 rounded-xl bg-sand/70 px-4 py-2.5 text-xs text-ink-soft dark:bg-white/5 dark:text-sand/70">
                Tráfico vehicular ahora (TomTom): {{ result.flow.currentSpeed }} km/h de {{ result.flow.freeFlowSpeed }} km/h libres ·
                congestión {{ Math.round(result.flow.congestion * 100) }} %
              </p>
            </article>

            <article v-reveal="150" class="card p-7 lg:col-span-7">
              <div class="flex items-baseline justify-between gap-3">
                <h3 class="text-lg font-semibold">Negocios parecidos en el área</h3>
                <span class="text-xs text-mute">{{ result.params.radius }} m alrededor</span>
              </div>
              <p v-if="!topCompetitors.length" class="mt-6 rounded-2xl bg-sand/70 p-5 text-sm text-ink-soft dark:bg-white/5 dark:text-sand/70">
                No encontramos negocios como el tuyo en esta área.
              </p>
              <ul v-else class="mt-4 divide-y divide-ink/[0.06] dark:divide-white/[0.06]">
                <li
                  v-for="(p, i) in topCompetitors"
                  :key="p.id"
                  class="group flex cursor-pointer items-center gap-4 rounded-xl px-2 py-3 transition duration-300 hover:bg-sand/60 dark:hover:bg-white/5"
                  :style="{ animation: `fade-up .55s ${200 + i * 70}ms var(--ease-soft) both` }"
                  @click="selectBusiness(p); mapRef?.$el?.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                >
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-soft font-serif font-bold tracking-tight text-lg text-sage transition group-hover:scale-110">
                    {{ p.name.charAt(0) }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-medium">{{ p.name }}</span>
                    <span class="text-xs text-mute">a {{ p.distanceM }} m · {{ p.ratingCount.toLocaleString("es-MX") }} reseñas</span>
                  </span>
                  <span v-if="p.rating != null" class="text-right">
                    <span class="block text-sm font-semibold">{{ p.rating.toFixed(1) }}</span>
                    <span class="text-[11px] tracking-tight text-amber">{{ stars(p.rating) }}</span>
                  </span>
                </li>
              </ul>
            </article>

            <article v-reveal="200" class="card p-7 lg:col-span-5">
              <h3 class="text-lg font-semibold">Lo que dicen las reseñas</h3>
              <template v-if="result.reviews.total">
                <p class="mt-1 text-sm text-mute">
                  {{ result.reviews.total }} reseñas leídas · {{ Math.round(result.reviews.positiveShare * 100) }} % positivas
                </p>
                <div v-if="result.reviews.complaints.length" class="mt-5">
                  <p class="text-xs font-medium tracking-wide text-terra uppercase">Quejas frecuentes</p>
                  <ul class="mt-3 space-y-3">
                    <li v-for="(c, i) in result.reviews.complaints" :key="c.id">
                      <div class="flex justify-between text-sm">
                        <span>{{ c.label }}</span>
                        <span class="tabular-nums text-mute">{{ Math.round(c.negShare * 100) }} % negativas</span>
                      </div>
                      <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/10">
                        <div class="bar-fill h-full rounded-full bg-terra" :style="{ '--w': `${Math.round(c.negShare * 100)}%`, animationDelay: `${500 + i * 120}ms` }" />
                      </div>
                    </li>
                  </ul>
                </div>
                <div v-if="result.reviews.strengths.length" class="mt-5">
                  <p class="text-xs font-medium tracking-wide text-sage uppercase">Lo que más valoran</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span v-for="s in result.reviews.strengths" :key="s.id" class="rounded-full bg-sage-soft px-3 py-1 text-xs text-sage">{{ s.label }}</span>
                  </div>
                </div>
                <div v-if="result.reviews.tips.length" class="mt-6 rounded-2xl bg-amber-soft/60 p-4 dark:bg-white/5">
                  <p class="text-sm font-semibold">Cómo diferenciarte</p>
                  <ul class="mt-2 space-y-2 text-sm text-ink-soft dark:text-sand/80">
                    <li v-for="t in result.reviews.tips" :key="t" class="flex gap-2"><span class="text-amber">→</span>{{ t }}</li>
                  </ul>
                </div>
                <blockquote v-if="result.reviews.samples[0]" class="mt-5 border-l-2 border-terra/40 pl-3 text-sm text-ink-soft italic dark:text-sand/70">
                  “{{ result.reviews.samples[0].text }}”
                  <footer class="mt-1 text-xs text-mute not-italic">— reseña en {{ result.reviews.samples[0].place }}</footer>
                </blockquote>
              </template>
              <p v-else class="mt-4 rounded-2xl bg-sand/70 p-5 text-sm text-ink-soft dark:bg-white/5 dark:text-sand/70">
                No hay reseñas que analizar en esta área todavía.
              </p>
            </article>

            <article
              v-if="result.rec.bestSpot"
              v-reveal="250"
              class="card flex flex-col gap-4 bg-amber-soft/50 p-7 sm:flex-row sm:items-center sm:justify-between lg:col-span-12 dark:bg-white/5"
            >
              <div class="flex items-center gap-4">
                <span class="relative grid h-11 w-11 shrink-0 place-items-center">
                  <span class="absolute inset-0 animate-ping-soft rounded-full bg-amber/40" />
                  <span class="h-4 w-4 rounded-full bg-amber ring-4 ring-white" />
                </span>
                <p class="text-ink-soft dark:text-sand/80">
                  A <strong>{{ result.rec.bestSpot.distanceM }} m al {{ result.rec.bestSpot.direction }}</strong> hay un punto con mejor balance:
                  transitabilidad {{ result.rec.bestSpot.transit }} y {{ result.rec.bestSpot.competitors }}
                  {{ result.rec.bestSpot.competitors === 1 ? "negocio parecido" : "negocios parecidos" }}.
                </p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button type="button" class="btn-ghost !px-5 !py-2.5 text-sm" @click="mapRef?.focus(result.rec.bestSpot.coords, 16)">Ver</button>
                <button type="button" class="btn-primary !px-5 !py-2.5 text-sm" @click="useSpot">Analizar ahí</button>
              </div>
            </article>
          </div>

          <p class="mt-6 text-xs leading-relaxed text-mute">
            {{ result.source === "google" ? "Negocios y reseñas: Google Places." : hasGoogleKey ? "Negocios y reseñas de demostración." : "Negocios y reseñas de demostración; agrega VITE_GOOGLE_MAPS_API_KEY para usar Google Places." }}
            Transitabilidad: estimada con OpenStreetMap (comercios, paradas, calles peatonales y avenidas){{ hasTomTomKey ? " + TomTom en vivo" : "" }}.
            Demanda de delivery: estimada por zona (Rappi y Uber Eats no ofrecen API pública).
          </p>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.step-badge {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-sage-soft);
  color: var(--color-sage);
  transition: all 0.5s var(--ease-soft);
}
.step-badge.is-done {
  background: var(--color-sage);
  color: #fff;
}
.legend-ped {
  background: linear-gradient(90deg, #f7e2dc, #efae9f, #dd7a66, #c0503f);
}
.legend-veh {
  background: linear-gradient(90deg, #e3dff3, #a89ed6, #6c5eb0, #3a3172);
}
.switch {
  position: relative;
  flex-shrink: 0;
  width: 2.25rem;
  height: 1.3rem;
  border-radius: 9999px;
  background: rgb(36 33 46 / 0.15);
  transition: background 0.35s var(--ease-soft);
}
.switch > span {
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(36 33 46 / 0.25);
  transition: transform 0.35s var(--ease-soft);
}
.switch.is-on {
  background: var(--color-sage);
}
.switch.is-on > span {
  transform: translateX(0.95rem);
}
.skeleton {
  border-radius: 0.75rem;
  background: linear-gradient(90deg, rgb(36 33 46 / 0.06), rgb(36 33 46 / 0.12), rgb(36 33 46 / 0.06));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
.layer-row {
  animation: fade-up 0.45s var(--ease-soft) both;
  animation-delay: calc(var(--i) * 40ms);
}
.menu-pop-enter-active,
.menu-pop-leave-active {
  transition:
    opacity 0.3s var(--ease-soft),
    transform 0.35s var(--ease-soft);
  transform-origin: top left;
}
.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(-6px);
}
.bar-fill {
  width: 0;
  animation: bar-grow 1s var(--ease-soft) forwards;
}
@keyframes bar-grow {
  to {
    width: var(--w);
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s var(--ease-soft);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.swap-enter-active,
.swap-leave-active {
  transition: all 0.35s var(--ease-soft);
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.sheet-enter-active,
.sheet-leave-active {
  transition:
    opacity 0.35s var(--ease-soft),
    transform 0.45s var(--ease-soft);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
@media (min-width: 1024px) {
  .sheet-enter-from,
  .sheet-leave-to {
    transform: translateX(-24px);
  }
}
.results-enter-active {
  transition: all 0.7s var(--ease-soft);
}
.results-enter-from {
  opacity: 0;
  transform: translateY(24px);
}
</style>
