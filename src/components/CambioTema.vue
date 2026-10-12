<script setup>
import { useSettings } from "@/composables/useSettings";

const { dark } = useSettings();
</script>

<template>
  <button
    type="button"
    class="grid h-11 w-11 place-items-center rounded-full border border-ink/10 bg-white/70 text-ink transition hover:scale-105 hover:rotate-12 dark:border-white/10 dark:bg-night-2 dark:text-cream"
    :aria-label="dark ? 'Usar modo claro' : 'Usar modo oscuro'"
    @click="dark = !dark"
  >
    <Transition name="swap" mode="out-in">
      <svg v-if="!dark" key="moon" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" stroke-linejoin="round" />
      </svg>
      <svg v-else key="sun" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round" />
      </svg>
    </Transition>
  </button>
</template>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition: all 0.3s var(--ease-soft);
}
.swap-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}
.swap-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
