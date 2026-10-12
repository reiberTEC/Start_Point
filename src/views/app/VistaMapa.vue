<script setup>
import { computed, ref } from "vue";
import MapaGeneral from "@/components/MapaGeneral.vue";
import AnilloIvc from "@/components/AnilloIvc.vue";
import { businessPoints, categories, getZone } from "@/data/zones";
import { rankCategoriesForZone, rankZonesForCategory } from "@/lib/ivc";
import { useSettings } from "@/composables/useSettings";

const { weights } = useSettings();
const category = ref("taquerias");
const selectedZone = ref("centro");

const zoneScores = computed(() => rankZonesForCategory(category.value, weights));
const points = computed(() => {
  const colorByZone = Object.fromEntries(zoneScores.value.map((z) => [z.zone.id, z.level.color]));
  return businessPoints(category.value).map((p) => ({ ...p, color: colorByZone[p.zone] }));
});
const zone = computed(() => getZone(selectedZone.value));
const current = computed(() => zoneScores.value.find((z) => z.zone.id === selectedZone.value));
const topForZone = computed(() => rankCategoriesForZone(zone.value, weights).slice(0, 3));
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 pt-6 md:px-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="title text-4xl sm:text-5xl">Mapa de oportunidades</h1>
        <p class="mt-2 text-ink-soft dark:text-sand/70">Elige un giro y toca una zona para ver qué tan buena es la oportunidad.</p>
      </div>
    </div>

    <div class="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1">
      <button
        v-for="c in categories"
        :key="c.id"
        type="button"
        class="chip shrink-0"
        :class="{ 'chip-active': category === c.id }"
        :aria-pressed="category === c.id"
        @click="category = c.id"
      >
        <span aria-hidden="true">{{ c.emoji }}</span>{{ c.label }}
      </button>
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-12">
      <div class="card relative h-[52svh] overflow-hidden !rounded-[1.75rem] lg:col-span-8 lg:h-[68svh]">
        <MapaGeneral
          :points="points"
          :zone-scores="zoneScores"
          :selected-zone="selectedZone"
          :zoom="15"
          @select-zone="selectedZone = $event"
        />
        <div class="glass absolute bottom-4 left-4 z-[500] rounded-2xl px-4 py-3 text-xs">
          <p class="mb-2 text-mute">Oportunidad de la zona · cada punto es un competidor</p>
          <div class="flex flex-wrap gap-4">
            <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-sage" />Buena</span>
            <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-amber" />Moderada</span>
            <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-terra" />Muy competida</span>
          </div>
        </div>
      </div>

      <aside class="space-y-5 lg:col-span-4">
        <Transition name="panel" mode="out-in">
          <div :key="selectedZone + category" class="card p-6">
            <div class="flex items-center gap-5">
              <AnilloIvc :score="current.score" :size="104" :stroke="8" />
              <div>
                <h2 class="text-xl font-semibold leading-tight">{{ zone.short }}</h2>
                <span class="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs" :style="{ background: current.level.soft, color: current.level.color }">
                  {{ current.level.label }}
                </span>
              </div>
            </div>
            <p class="mt-5 text-sm leading-relaxed text-ink-soft dark:text-sand/70">{{ zone.description }}</p>
            <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-2xl bg-sand/70 p-3 dark:bg-white/5">
                <dt class="text-mute">Competidores</dt>
                <dd class="mt-1 text-lg font-medium">{{ zone.stats[category].competitors }}</dd>
              </div>
              <div class="rounded-2xl bg-sand/70 p-3 dark:bg-white/5">
                <dt class="text-mute">Horas pico</dt>
                <dd class="mt-1 font-medium leading-tight">{{ zone.peakHours.split(" · ")[0] }}</dd>
              </div>
            </dl>
          </div>
        </Transition>

        <div class="card p-6">
          <h3 class="text-sm text-mute">Lo que mejor funcionaría aquí</h3>
          <TransitionGroup tag="ul" name="list" class="mt-4 space-y-3">
            <li v-for="r in topForZone" :key="r.category.id" class="flex items-center gap-3">
              <span class="text-xl" aria-hidden="true">{{ r.category.emoji }}</span>
              <span class="flex-1">{{ r.category.label }}</span>
              <span class="rounded-full px-2.5 py-0.5 text-sm tabular-nums" :style="{ background: r.level.soft, color: r.level.color }">{{ r.score }}</span>
            </li>
          </TransitionGroup>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="z in zoneScores"
            :key="z.zone.id"
            type="button"
            class="chip text-xs"
            :class="{ 'chip-active': selectedZone === z.zone.id }"
            @click="selectedZone = z.zone.id"
          >
            {{ z.zone.short }}
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: all 0.4s var(--ease-soft);
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.list-move,
.list-enter-active {
  transition: all 0.5s var(--ease-soft);
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.list-leave-active {
  display: none;
}
</style>
