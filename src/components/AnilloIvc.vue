<script setup>
import { computed, onMounted, ref } from "vue";
import { levelFor } from "@/lib/ivc";

const props = defineProps({
  score: { type: Number, required: true },
  size: { type: Number, default: 140 },
  stroke: { type: Number, default: 10 },
});

const shown = ref(false);
onMounted(() => requestAnimationFrame(() => (shown.value = true)));

const r = computed(() => (props.size - props.stroke) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const offset = computed(() => (shown.value ? circ.value * (1 - props.score / 100) : circ.value));
const level = computed(() => levelFor(props.score));
</script>

<template>
  <div class="relative inline-grid place-items-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke-width="stroke"
        class="stroke-ink/[0.07] dark:stroke-white/10"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="level.color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circ"
        :stroke-dashoffset="offset"
        style="transition: stroke-dashoffset 1.2s var(--ease-soft), stroke 0.6s"
      />
    </svg>
    <div class="absolute text-center">
      <div class="font-serif font-bold leading-none tracking-tight" :style="{ fontSize: `${size * 0.32}px`, color: level.color }">
        {{ score }}
      </div>
      <div class="mt-1 text-[10px] tracking-[0.2em] text-mute uppercase">IVC</div>
    </div>
  </div>
</template>
