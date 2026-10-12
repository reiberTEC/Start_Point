<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import AnilloIvc from "@/components/AnilloIvc.vue";

const root = ref(null);
const mx = ref(0);
const my = ref(0);

// Ilustrativo: tránsito combinado del Centro Histórico por franja (ver transit.js).
const periods = [
  { label: "Mañ", value: 64 },
  { label: "Med", value: 81 },
  { label: "Tar", value: 79 },
  { label: "Noc", value: 52 },
];

const pois = [
  [118, 96, "#b5574b"], [162, 70, "#a8741f"], [250, 88, "#b5574b"], [300, 134, "#3e7c6b"],
  [96, 182, "#a8741f"], [148, 238, "#b5574b"], [276, 226, "#6a5aa8"], [322, 270, "#b5574b"],
  [208, 300, "#a8741f"], [120, 300, "#4a6aa5"], [236, 150, "#b5574b"], [180, 128, "#3e7c6b"],
  [340, 190, "#a8741f"], [70, 120, "#6a5aa8"], [262, 320, "#b5574b"],
];

function onMove(e) {
  const r = root.value.getBoundingClientRect();
  mx.value = (e.clientX - r.left) / r.width - 0.5;
  my.value = (e.clientY - r.top) / r.height - 0.5;
}

onMounted(() => {
  if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("pointermove", onMove, { passive: true });
  }
});
onBeforeUnmount(() => window.removeEventListener("pointermove", onMove));

const layer = (depth) => ({
  transform: `translate3d(${mx.value * depth}px, ${my.value * depth}px, 0)`,
  transition: "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
});
</script>

<template>
  <div ref="root" class="relative mx-auto w-full max-w-[520px] pt-6 pb-10">
    <div class="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-sage-soft via-cream to-terra-soft opacity-80 dark:from-night-2 dark:via-night dark:to-night-2" aria-hidden="true" />

    <!-- Ventana de la app -->
    <div class="relative overflow-hidden rounded-[2rem] border border-ink/[0.07] bg-white shadow-[0_40px_80px_-40px_rgb(36_33_46/0.45)] dark:border-white/10 dark:bg-night-2" :style="layer(-8)">
      <div class="flex items-center gap-4 border-b border-ink/[0.06] px-5 py-3 dark:border-white/10">
        <span class="flex gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-terra/70" />
          <span class="h-2.5 w-2.5 rounded-full bg-amber/70" />
          <span class="h-2.5 w-2.5 rounded-full bg-sage/70" />
        </span>
        <span class="text-xs font-medium text-mute">Centro Histórico · radio 400 m</span>
      </div>

      <svg viewBox="0 0 400 380" class="block w-full" aria-hidden="true">
        <defs>
          <radialGradient id="heat-a">
            <stop offset="0%" stop-color="#d0705f" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#eaa697" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="heat-b">
            <stop offset="0%" stop-color="#6c5eb0" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#a89ed6" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="380" class="fill-sand/60 dark:fill-night" />
        <g class="stroke-ink/[0.09] dark:stroke-white/10" stroke-width="1" fill="none">
          <path v-for="x in [40, 90, 140, 190, 240, 290, 340]" :key="`v${x}`" :d="`M${x} 0 L${x + 14} 380`" />
          <path v-for="y in [50, 105, 160, 215, 270, 325]" :key="`h${y}`" :d="`M0 ${y} L400 ${y - 10}`" />
        </g>
        <g fill="none" stroke-linecap="round">
          <path d="M0 196 C 120 186, 260 196, 400 176" class="stroke-white dark:stroke-white/20" stroke-width="9" />
          <path d="M196 0 C 186 130, 206 250, 190 380" class="stroke-white dark:stroke-white/20" stroke-width="7" />
        </g>
        <circle cx="200" cy="190" r="120" fill="url(#heat-a)" class="heat-pulse" />
        <circle cx="290" cy="120" r="80" fill="url(#heat-b)" class="heat-pulse" style="animation-delay: -2s" />
        <circle cx="120" cy="270" r="70" fill="url(#heat-a)" class="heat-pulse" style="animation-delay: -4s" />

        <circle v-for="(p, i) in pois" :key="i" :cx="p[0]" :cy="p[1]" r="5" :fill="p[2]" stroke="#fff" stroke-width="2" class="poi-pop" :style="{ animationDelay: `${600 + i * 90}ms` }" />

        <circle cx="200" cy="190" r="118" fill="none" class="stroke-sage" stroke-width="1.6" stroke-dasharray="5 7" />
        <circle v-for="k in 3" :key="`r${k}`" cx="200" cy="190" r="118" fill="none" class="radar stroke-sage" stroke-width="2" :style="{ animationDelay: `${k * 1.1}s` }" />
        <g class="pin-drop">
          <path d="M200 192 c-12 -13 -19 -21 -19 -31 a19 19 0 0 1 38 0 c0 10 -7 18 -19 31z" class="fill-sage" stroke="#fff" stroke-width="2.5" />
          <circle cx="200" cy="161" r="6" fill="#fff" />
        </g>
      </svg>
    </div>

    <!-- Tránsito por franja -->
    <div class="absolute top-0 -right-2 sm:-right-8" :style="layer(22)">
      <div class="glass w-44 rounded-3xl p-4 animate-float" style="animation-delay: -2s">
        <p class="text-xs font-semibold text-ink-soft dark:text-sand/80">Tránsito hoy</p>
        <div class="mt-3 flex h-16 items-end gap-2">
          <div v-for="(p, i) in periods" :key="p.label" class="flex flex-1 flex-col items-center gap-1">
            <span class="bar w-full rounded-md bg-terra/80" :style="{ height: `${p.value * 0.6}px`, animationDelay: `${900 + i * 120}ms` }" />
            <span class="text-[10px] text-mute">{{ p.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resultado -->
    <div class="absolute bottom-0 -left-2 sm:-left-10" :style="layer(30)">
      <div class="glass flex items-center gap-4 rounded-3xl p-3 pr-5 animate-float">
        <AnilloIvc :score="78" :size="64" :stroke="6" />
        <div>
          <p class="text-xs text-mute">Cafetería en el Centro</p>
          <p class="font-serif text-lg font-bold leading-tight">Buena oportunidad</p>
        </div>
      </div>
    </div>

    <!-- Competencia -->
    <div class="absolute top-1/2 -right-3 sm:-right-12" :style="layer(16)">
      <div class="glass flex items-center gap-2 rounded-full py-2 pr-4 pl-2 animate-float" style="animation-delay: -4s">
        <span class="grid h-7 w-7 place-items-center rounded-full bg-amber-soft text-xs font-bold text-amber">12</span>
        <span class="text-sm">parecidos · 4.6 ★</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar {
  transform-box: fill-box;
  transform-origin: center;
  animation: radar 3.3s var(--ease-soft) infinite;
  opacity: 0;
}
@keyframes radar {
  0% {
    transform: scale(0.15);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
.heat-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: heat 6s ease-in-out infinite;
}
@keyframes heat {
  0%,
  100% {
    transform: scale(0.92);
  }
  50% {
    transform: scale(1.08);
  }
}
.poi-pop {
  transform-box: fill-box;
  transform-origin: center;
  animation: poi-in 0.6s var(--ease-soft) both;
}
@keyframes poi-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
.pin-drop {
  animation: pin-drop 0.8s var(--ease-soft) 0.3s both;
}
.bar {
  transform-origin: bottom;
  animation: grow 0.9s var(--ease-soft) both;
}
@keyframes grow {
  from {
    transform: scaleY(0);
  }
}
</style>
