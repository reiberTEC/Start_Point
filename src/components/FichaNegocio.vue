<script setup>
import { computed, ref, watch } from "vue";
import { businessGroups, businessEmbedUrl, googleMapsLink, streetViewEmbedUrl, streetViewLink } from "@/lib/business";
import { fetchPlaceDetails, hasGoogleKey } from "@/lib/google";
import { poiGroups } from "@/lib/transit";
import { haversineKm } from "@/lib/geo";

const props = defineProps({
  view: { type: String, default: "list" },
  items: { type: Array, default: () => [] },
  selected: { type: Object, default: null },
  areaCenter: { type: Array, default: null },
});
const emit = defineEmits(["close", "select", "back", "move-area", "google"]);

const search = ref("");
const filter = ref("all");
const media = ref("street");
const frameLoaded = ref(false);
const details = ref(null);
const detailsLoading = ref(false);
const photoIndex = ref(0);
const detailsCache = new Map();

const sourceBadge = {
  google: { label: "Google Maps", cls: "bg-sage-soft text-sage" },
  osm: { label: "OpenStreetMap", cls: "bg-[#e1e7f3] text-[#4a6aa5]" },
  unnamed: { label: "OpenStreetMap", cls: "bg-[#e1e7f3] text-[#4a6aa5]" },
  demo: { label: "Demostración", cls: "bg-amber-soft text-amber" },
};

const filters = computed(() => {
  const list = [{ id: "all", label: "Todos" }];
  if (props.items.some((b) => b.similar)) list.push({ id: "similar", label: "Parecidos a tu idea" });
  for (const [id, g] of Object.entries(businessGroups)) {
    if (props.items.some((b) => b.group === id)) list.push({ id, label: g.label });
  }
  return list;
});

const visible = computed(() => {
  const q = search.value.trim().toLowerCase();
  return props.items
    .filter((b) => filter.value === "all" || (filter.value === "similar" ? b.similar : b.group === filter.value))
    .filter((b) => !q || b.name.toLowerCase().includes(q) || b.type?.toLowerCase().includes(q))
    .slice(0, 150);
});

const b = computed(() => props.selected);
const info = computed(() => ({ ...b.value, ...(details.value ?? {}) }));
const photos = computed(() => details.value?.photos ?? []);
const reviews = computed(() => (details.value?.reviews?.length ? details.value.reviews : (b.value?.reviews ?? []).slice(0, 2)));
const distance = computed(() =>
  b.value && props.areaCenter ? Math.round(haversineKm(props.areaCenter, [b.value.lat, b.value.lng]) * 1000) : null,
);
const camera = computed(() => b.value?.camera ?? (b.value ? { lat: b.value.lat, lng: b.value.lng, heading: 0 } : null));
const mediaTabs = computed(() => [
  ...(photos.value.length ? [{ id: "photos", label: "Fotos" }] : []),
  { id: "street", label: "Calle" },
  { id: "map", label: "Mapa" },
  { id: "sat", label: "Satélite" },
]);
const embedSrc = computed(() => {
  if (!b.value) return "";
  if (media.value === "street") return streetViewEmbedUrl(camera.value);
  return businessEmbedUrl({ ...b.value, googleId: details.value?.googleId }, media.value === "sat");
});
const mapsHref = computed(() => details.value?.mapsUrl || (b.value ? googleMapsLink(b.value) : "#"));

function stars(r) {
  return r == null ? "" : "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
}

function color(item) {
  return poiGroups[item.group]?.color ?? "#6a5aa8";
}

watch(
  () => props.selected?.id,
  async () => {
    details.value = null;
    photoIndex.value = 0;
    frameLoaded.value = false;
    media.value = "street";
    const s = props.selected;
    if (!s || !hasGoogleKey || !["google", "osm"].includes(s.source)) return;
    if (detailsCache.has(s.id)) {
      details.value = detailsCache.get(s.id);
    } else {
      detailsLoading.value = true;
      try {
        const d = await fetchPlaceDetails(s);
        detailsCache.set(s.id, d);
        if (props.selected?.id === s.id) details.value = d;
      } catch (e) {
        console.warn("Sin ficha de Google:", e);
      } finally {
        detailsLoading.value = false;
      }
    }
    if (details.value?.photos.length) media.value = "photos";
  },
  { immediate: true },
);

watch(embedSrc, () => (frameLoaded.value = false));
</script>

<template>
  <div class="glass flex max-h-full flex-col overflow-hidden rounded-[1.6rem] !bg-white/90 dark:!bg-night-2/95">
    <Transition name="sheet-swap" mode="out-in">
      <!-- Ficha -->
      <div v-if="view === 'detail' && b" :key="`d-${b.id}`" class="flex min-h-0 flex-col">
        <div class="flex items-center justify-between gap-2 px-4 pt-3">
          <button
            v-if="items.length"
            type="button"
            class="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-soft transition hover:bg-ink/5 dark:text-sand/70"
            @click="emit('back')"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6" /></svg>
            Negocios del área
          </button>
          <span v-else />
          <button type="button" class="grid h-8 w-8 place-items-center rounded-full transition hover:bg-ink/5" aria-label="Cerrar" @click="emit('close')">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div class="min-h-0 overflow-y-auto px-4 pb-4 no-scrollbar">
          <!-- Imagen / vista de Google -->
          <div class="relative mt-2 aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
            <template v-if="media === 'photos' && photos.length">
              <Transition name="fade" mode="out-in">
                <img :key="photoIndex" :src="photos[photoIndex].url" :alt="info.name" class="h-full w-full object-cover" />
              </Transition>
              <div class="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent p-2 text-[10px] text-white">
                <a v-if="photos[photoIndex].author" :href="photos[photoIndex].authorUri" target="_blank" rel="noopener" class="truncate hover:underline">
                  Foto: {{ photos[photoIndex].author }}
                </a>
                <span class="flex gap-1">
                  <button
                    v-for="(p, i) in photos"
                    :key="p.url"
                    type="button"
                    class="h-1.5 rounded-full bg-white transition-all"
                    :class="i === photoIndex ? 'w-4' : 'w-1.5 opacity-60'"
                    :aria-label="`Foto ${i + 1}`"
                    @click="photoIndex = i"
                  />
                </span>
              </div>
            </template>
            <template v-else>
              <div v-if="!frameLoaded" class="sheet-skeleton absolute inset-0 grid place-items-center text-xs text-mute">
                {{ media === "street" ? "Cargando vista de calle…" : "Cargando Google Maps…" }}
              </div>
              <iframe
                :key="embedSrc"
                :src="embedSrc"
                :title="`${info.name} en Google Maps`"
                class="h-full w-full border-0 transition-opacity duration-500"
                :class="frameLoaded ? 'opacity-100' : 'opacity-0'"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                @load="frameLoaded = true"
              />
            </template>
          </div>
          <div class="mt-2 grid grid-flow-col gap-1 rounded-xl bg-ink/[0.04] p-1 text-xs dark:bg-white/5">
            <button
              v-for="m in mediaTabs"
              :key="m.id"
              type="button"
              class="rounded-lg py-1.5 font-medium transition duration-300"
              :class="media === m.id ? 'bg-white text-sage shadow-sm dark:bg-night' : 'text-ink-soft dark:text-sand/70'"
              @click="media = m.id"
            >
              {{ m.label }}
            </button>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="rounded-full px-2.5 py-0.5 text-[11px] font-medium" :class="sourceBadge[info.source]?.cls">
              {{ details ? "Google Maps" : sourceBadge[info.source]?.label }}
            </span>
            <span v-if="info.type" class="flex items-center gap-1.5 text-xs text-mute">
              <span class="h-2 w-2 rounded-full" :style="{ background: color(info) }" />{{ info.type }}
            </span>
          </div>
          <h3 class="title mt-2 text-3xl leading-tight">{{ info.name }}</h3>

          <p v-if="info.rating != null" class="mt-1 flex items-center gap-2 text-sm">
            <span class="font-semibold">{{ info.rating.toFixed(1) }}</span>
            <span class="tracking-tight text-amber">{{ stars(info.rating) }}</span>
            <span class="text-mute">{{ (info.ratingCount ?? 0).toLocaleString("es-MX") }} reseñas</span>
          </p>
          <p v-if="details?.openNow != null" class="mt-1 text-sm font-medium" :class="details.openNow ? 'text-sage' : 'text-terra'">
            {{ details.openNow ? "Abierto ahora" : "Cerrado ahora" }}
          </p>
          <p v-if="detailsLoading" class="mt-2 flex items-center gap-2 text-xs text-mute">
            <span class="h-3 w-3 animate-spin rounded-full border-2 border-sage/30 border-t-sage" /> Buscando su ficha en Google…
          </p>

          <p v-if="details?.summary" class="mt-3 text-sm text-ink-soft dark:text-sand/80">{{ details.summary }}</p>
          <ul class="mt-3 space-y-1.5 text-sm text-ink-soft dark:text-sand/80">
            <li v-if="info.address" class="flex gap-2">
              <svg viewBox="0 0 24 24" class="info-icon"><path d="M12 21s-6-5.6-6-10.5a6 6 0 1 1 12 0C18 15.4 12 21 12 21z" /><circle cx="12" cy="10.5" r="2" /></svg>
              {{ info.address }}
            </li>
            <li v-if="distance != null" class="flex gap-2">
              <svg viewBox="0 0 24 24" class="info-icon"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" /></svg>
              a {{ distance }} m del centro de tu área
            </li>
            <li v-if="details?.phone" class="flex gap-2">
              <svg viewBox="0 0 24 24" class="info-icon"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
              {{ details.phone }}
            </li>
            <li v-if="details?.website" class="flex min-w-0 gap-2">
              <svg viewBox="0 0 24 24" class="info-icon"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
              <a :href="details.website" target="_blank" rel="noopener" class="truncate text-sage hover:underline">{{ details.website }}</a>
            </li>
          </ul>
          <details v-if="details?.hours.length" class="mt-3 text-sm">
            <summary class="cursor-pointer text-ink-soft dark:text-sand/80">Horario</summary>
            <ul class="mt-2 space-y-0.5 text-xs text-mute">
              <li v-for="h in details.hours" :key="h">{{ h }}</li>
            </ul>
          </details>

          <div v-if="reviews.length" class="mt-4 space-y-2">
            <p class="text-xs font-medium tracking-wide text-mute uppercase">Reseñas</p>
            <blockquote v-for="(r, i) in reviews" :key="i" class="rounded-2xl bg-sand/70 p-3 text-sm dark:bg-white/5">
              <span class="text-[11px] tracking-tight text-amber">{{ stars(r.rating) }}</span>
              <p class="mt-1 text-ink-soft dark:text-sand/80">“{{ r.text }}”</p>
              <footer class="mt-1 text-[11px] text-mute">{{ [r.author, r.when].filter(Boolean).join(" · ") }}</footer>
            </blockquote>
          </div>

          <p v-if="info.source === 'demo'" class="mt-4 rounded-xl bg-amber-soft/70 px-3 py-2 text-xs text-amber">
            Negocio de demostración. Abre la vista Google Maps para ver los negocios reales de la zona.
          </p>
          <p v-else-if="!details && !detailsLoading && info.source !== 'unnamed'" class="mt-4 text-xs text-mute">
            Abre Google Maps para ver su calificación, horarios, fotos y reseñas.
          </p>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <a :href="mapsHref" target="_blank" rel="noopener" class="btn-primary col-span-2 !py-2.5 text-sm">Abrir en Google Maps</a>
            <a :href="streetViewLink(info, camera)" target="_blank" rel="noopener" class="btn-ghost !px-3 !py-2 text-sm">Street View</a>
            <button type="button" class="btn-ghost !px-3 !py-2 text-sm" @click="emit('move-area', [info.lat, info.lng])">Mi área aquí</button>
          </div>
        </div>
      </div>

      <!-- Lista -->
      <div v-else key="list" class="flex min-h-0 flex-col">
        <div class="flex items-start justify-between gap-2 px-4 pt-4">
          <div>
            <h3 class="font-semibold">Negocios en tu área</h3>
            <p class="text-xs text-mute">{{ items.length }} con nombre · toca uno para ver de qué se trata</p>
          </div>
          <button type="button" class="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-ink/5" aria-label="Cerrar" @click="emit('close')">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div class="px-4 pt-3">
          <input v-model="search" class="field !py-2 text-sm" placeholder="Buscar por nombre o tipo" aria-label="Buscar negocio" />
          <div class="mt-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              v-for="f in filters"
              :key="f.id"
              type="button"
              class="chip shrink-0 !px-3 !py-1 text-xs"
              :class="filter === f.id ? 'chip-active' : ''"
              @click="filter = f.id"
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <ul class="mt-1 min-h-0 flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
          <li v-for="(item, i) in visible" :key="item.id" :style="{ animation: `fade-up .4s ${Math.min(i, 12) * 30}ms var(--ease-soft) both` }">
            <button
              type="button"
              class="group flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition duration-300 hover:bg-sand/70 dark:hover:bg-white/5"
              @click="emit('select', item)"
            >
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-full font-serif font-bold text-lg text-white transition duration-300 group-hover:scale-110"
                :style="{ background: color(item) }"
              >
                {{ item.name.charAt(0) }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ item.name }}</span>
                <span class="block truncate text-xs text-mute">{{ item.type }} · a {{ item.distanceM }} m</span>
              </span>
              <span v-if="item.rating != null" class="text-xs font-semibold">{{ item.rating.toFixed(1) }} <span class="text-amber">★</span></span>
            </button>
          </li>
          <li v-if="!visible.length" class="px-3 py-6 text-center text-sm text-mute">No hay negocios con ese filtro.</li>
        </ul>
        <button
          type="button"
          class="mx-4 mb-4 flex items-center justify-center gap-2 rounded-2xl bg-sage-soft px-3 py-2.5 text-sm font-medium text-sage transition hover:-translate-y-0.5"
          @click="emit('google')"
        >
          ¿No ves alguno? Míralos en Google Maps
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.info-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.15rem;
  fill: none;
  stroke: var(--color-mute);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.sheet-skeleton {
  background: linear-gradient(90deg, rgb(36 33 46 / 0.05), rgb(36 33 46 / 0.1), rgb(36 33 46 / 0.05));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
.sheet-swap-enter-active,
.sheet-swap-leave-active {
  transition:
    opacity 0.3s var(--ease-soft),
    transform 0.35s var(--ease-soft);
}
.sheet-swap-enter-from {
  opacity: 0;
  transform: translateX(14px);
}
.sheet-swap-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s var(--ease-soft);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
