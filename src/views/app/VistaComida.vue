<script setup>
import { computed, ref } from "vue";
import AnilloIvc from "@/components/AnilloIvc.vue";
import { categories } from "@/data/zones";
import { rankZonesForCategory } from "@/lib/ivc";
import { useSettings } from "@/composables/useSettings";

const { weights } = useSettings();
const food = categories.filter((c) => c.group === "comida");
const term = ref("");
const selected = ref("taquerias");

const filtered = computed(() => {
  const t = term.value.trim().toLowerCase();
  return t ? food.filter((c) => c.label.toLowerCase().includes(t)) : food;
});
const category = computed(() => food.find((c) => c.id === selected.value));
const ranking = computed(() => rankZonesForCategory(selected.value, weights));
const top = computed(() => ranking.value[0]);
const rest = computed(() => ranking.value.slice(1));

function reason(r) {
  const s = r.zone.stats[selected.value];
  if (r.gapBonus) return "Mucha demanda y poca oferta: hay un hueco en el mercado.";
  if (s.rating < 4) return "La competencia está mal calificada: puedes destacar.";
  if (r.zone.traffic >= 0.85 && s.competitors >= 15) return "Pasa muchísima gente, aunque la competencia es fuerte.";
  if (r.zone.traffic >= 0.85) return "Muy buen flujo de personas durante el día.";
  if (s.competitors >= 15) return "Zona muy competida para este giro.";
  return "Equilibrio entre demanda y competencia.";
}
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 pt-6 md:px-8">
    <h1 class="title text-4xl sm:text-5xl">¿Qué quieres vender?</h1>
    <p class="mt-2 text-ink-soft dark:text-sand/70">Elige el tipo de comida y te mostramos dónde tiene más futuro.</p>

    <label class="mt-6 block max-w-md">
      <span class="sr-only">Buscar tipo de comida</span>
      <input v-model="term" class="field" placeholder="Buscar: tacos, café, mariscos…" />
    </label>

    <TransitionGroup tag="div" name="chips" class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="c in filtered"
        :key="c.id"
        type="button"
        class="chip"
        :class="{ 'chip-active': selected === c.id }"
        :aria-pressed="selected === c.id"
        @click="selected = c.id"
      >
        <span aria-hidden="true">{{ c.emoji }}</span>{{ c.label }}
      </button>
    </TransitionGroup>

    <h2 class="mt-12 text-sm text-mute">
      Mejores zonas para <span class="font-medium text-ink dark:text-cream">{{ category.label.toLowerCase() }}</span>
    </h2>

    <Transition name="swap" mode="out-in">
      <article :key="`${selected}-${top.zone.id}`" class="card relative mt-5 overflow-hidden p-6 sm:p-8">
        <div
          class="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full"
          :style="{ background: `radial-gradient(circle, ${top.level.color}33, transparent 68%)` }"
          aria-hidden="true"
        />
        <div class="relative grid items-center gap-8 sm:grid-cols-[1fr_auto]">
          <div class="min-w-0">
            <span
              class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              :style="{ background: `${top.level.color}1f`, color: top.level.color }"
            >
              #1 · Mejor zona · {{ top.level.label }}
            </span>
            <h3 class="title mt-4 text-4xl break-words sm:text-5xl">{{ top.zone.name ?? top.zone.short }}</h3>
            <p class="mt-3 max-w-lg leading-relaxed text-ink-soft dark:text-sand/70">{{ reason(top) }}</p>
            <dl class="mt-6 grid max-w-lg grid-cols-3 gap-3">
              <div class="rounded-2xl bg-ink/[0.04] px-4 py-3 dark:bg-white/5">
                <dt class="text-xs text-mute">Competidores</dt>
                <dd class="mt-1 font-serif text-2xl font-bold tracking-tight">{{ top.zone.stats[selected].competitors }}</dd>
              </div>
              <div class="rounded-2xl bg-ink/[0.04] px-4 py-3 dark:bg-white/5">
                <dt class="text-xs text-mute">Calificación</dt>
                <dd class="mt-1 font-serif text-2xl font-bold tracking-tight">★ {{ top.zone.stats[selected].rating.toFixed(1) }}</dd>
              </div>
              <div class="rounded-2xl bg-ink/[0.04] px-4 py-3 dark:bg-white/5">
                <dt class="text-xs text-mute">Flujo de gente</dt>
                <dd class="mt-1 font-serif text-2xl font-bold tracking-tight">{{ Math.round(top.zone.traffic * 100) }}</dd>
              </div>
            </dl>
          </div>
          <AnilloIvc :score="top.score" :size="152" :stroke="11" class="justify-self-center sm:justify-self-end" />
        </div>
      </article>
    </Transition>

    <TransitionGroup tag="div" name="cards" class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="(r, i) in rest" :key="r.zone.id" class="card flex flex-col p-5 hover:-translate-y-1">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <span class="text-xs font-semibold text-mute">#{{ i + 2 }}</span>
            <h3 class="mt-0.5 truncate font-serif text-lg font-bold tracking-tight">{{ r.zone.short }}</h3>
          </div>
          <AnilloIvc :score="r.score" :size="60" :stroke="5" class="shrink-0" />
        </div>
        <p class="mt-3 text-sm leading-relaxed text-ink-soft dark:text-sand/70">{{ reason(r) }}</p>
        <dl class="mt-auto grid grid-cols-2 gap-3 border-t border-ink/[0.06] pt-4 text-sm dark:border-white/10">
          <div>
            <dt class="text-xs text-mute">Competidores</dt>
            <dd class="font-semibold">{{ r.zone.stats[selected].competitors }}</dd>
          </div>
          <div>
            <dt class="text-xs text-mute">Calificación</dt>
            <dd class="font-semibold">★ {{ r.zone.stats[selected].rating.toFixed(1) }}</dd>
          </div>
        </dl>
      </article>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.chips-move,
.cards-move {
  transition: transform 0.6s var(--ease-soft);
}
.chips-enter-active,
.chips-leave-active {
  transition: all 0.3s var(--ease-soft);
}
.chips-enter-from,
.chips-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.chips-leave-active {
  position: absolute;
}
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.35s var(--ease-soft),
    transform 0.35s var(--ease-soft);
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
