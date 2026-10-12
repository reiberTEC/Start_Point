<script setup>
import AuraCursor from "@/components/AuraCursor.vue";
import { useSettings } from "@/composables/useSettings";

useSettings();
</script>

<template>
  <AuraCursor />
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.matched[0]?.path" />
    </Transition>
  </RouterView>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.5s var(--ease-soft),
    transform 0.5s var(--ease-soft);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
