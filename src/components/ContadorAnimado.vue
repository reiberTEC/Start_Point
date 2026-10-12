<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  value: { type: Number, required: true },
  duration: { type: Number, default: 1600 },
  suffix: { type: String, default: "" },
  prefix: { type: String, default: "" },
  decimals: { type: Number, default: 0 },
});

const fmt = (v) =>
  v.toLocaleString("es-MX", { minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals });

const el = ref(null);
const display = ref(0);
let observer;
let started = false;

function animate(from, to) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    display.value = to;
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / props.duration);
    const eased = 1 - Math.pow(1 - t, 4);
    const k = 10 ** props.decimals;
    display.value = Math.round((from + (to - from) * eased) * k) / k;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !started) {
        started = true;
        animate(0, props.value);
        observer.disconnect();
      }
    },
    { threshold: 0.4 },
  );
  observer.observe(el.value);
});

watch(
  () => props.value,
  (to, from) => {
    if (started) animate(from, to);
  },
);

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <span ref="el" class="tabular-nums">{{ prefix }}{{ fmt(display) }}{{ suffix }}</span>
</template>
