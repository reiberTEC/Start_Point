<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";

const el = ref(null);
const enabled = ref(false);
let frame;
let target = { x: -500, y: -500 };
let pos = { x: -500, y: -500 };

function onMove(e) {
  target = { x: e.clientX, y: e.clientY };
}

function loop() {
  pos.x += (target.x - pos.x) * 0.08;
  pos.y += (target.y - pos.y) * 0.08;
  if (el.value) el.value.style.transform = `translate3d(${pos.x - 210}px, ${pos.y - 210}px, 0)`;
  frame = requestAnimationFrame(loop);
}

onMounted(() => {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced) return;
  enabled.value = true;
  window.addEventListener("pointermove", onMove, { passive: true });
  frame = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onMove);
  cancelAnimationFrame(frame);
});
</script>

<template>
  <div
    v-if="enabled"
    ref="el"
    aria-hidden="true"
    class="pointer-events-none fixed top-0 left-0 z-0 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl dark:opacity-15"
    style="background: radial-gradient(circle, #ebe7f6 0%, #f7e1dc 45%, transparent 70%)"
  />
</template>
