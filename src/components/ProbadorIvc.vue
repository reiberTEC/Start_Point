<script setup>
import { computed, ref } from "vue";
import { categories } from "@/data/zones";
import { rankZonesForCategory } from "@/lib/ivc";
import AnilloIvc from "@/components/AnilloIvc.vue";

const quick = categories.filter((c) => ["taquerias", "cafeterias", "mariscos", "rapida", "papelerias"].includes(c.id));
const selected = ref("taquerias");
const ranking = computed(() => rankZonesForCategory(selected.value));
const top = computed(() => ranking.value[0]);
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-12">
    <div class="card p-6 sm:p-8 lg:col-span-7">
      <p class="text-sm text-mute">1. Elige qué quieres abrir</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="c in quick"
          :key="c.id"
          type="button"
          class="chip"
          :class="{ 'chip-active': selected === c.id }"
          :aria-pressed="selected === c.id"
          @click="selected = c.id"
        >
          <span aria-hidden="true">{{ c.emoji }}</span>{{ c.label }}
        </button>
      </div>

      <p class="mt-10 text-sm text-mute">2. Mira qué zona te conviene más</p>
      <TransitionGroup tag="ol" name="rank" class="mt-4 space-y-3">
        <li v-for="(r, i) in ranking" :key="r.zone.id" class="flex items-center gap-4">
          <span class="w-5 text-sm text-mute tabular-nums">{{ i + 1 }}</span>
          <span class="w-28 shrink-0 truncate text-sm font-medium sm:w-36">{{ r.zone.short }}</span>
          <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/10">
            <span
              class="block h-full rounded-full transition-[width] duration-1000 ease-out"
              :style="{ width: `${r.score}%`, background: r.level.color }"
            />
          </span>
          <span class="w-8 text-right text-sm tabular-nums">{{ r.score }}</span>
        </li>
      </TransitionGroup>
    </div>

    <div class="card flex flex-col items-center justify-center p-8 text-center lg:col-span-5">
      <p class="text-sm text-mute">Mejor lugar para tu negocio</p>
      <Transition name="fade-up" mode="out-in">
        <div :key="selected" class="mt-6 flex flex-col items-center">
          <AnilloIvc :score="top.score" :size="168" />
          <h3 class="title mt-6 text-4xl">{{ top.zone.short }}</h3>
          <span
            class="mt-3 rounded-full px-3 py-1 text-sm"
            :style="{ background: top.level.soft, color: top.level.color }"
          >
            {{ top.level.label }}
          </span>
          <p class="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft dark:text-sand/70">
            {{ top.zone.stats[selected].competitors }} competidores cerca, flujo de personas
            {{ Math.round(top.zone.traffic * 100) }}/100 y demanda {{ Math.round(top.factors.demand * 100) }}/100.
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.rank-move {
  transition: transform 0.7s var(--ease-soft);
}
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.45s var(--ease-soft);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
