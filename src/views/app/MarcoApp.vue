<script setup>
import LogoMarca from "@/components/LogoMarca.vue";
import CambioTema from "@/components/CambioTema.vue";
import { useAuth } from "@/composables/useAuth";

const { user } = useAuth();

const tabs = [
  { to: "/app/mapa", label: "Mapa", icon: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14" },
  { to: "/app/lugar", label: "Lugar", icon: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
  { to: "/app/comida", label: "Comida", icon: "M4 11h16M5 11a7 7 0 0 0 14 0M8 7c0-1.5 1-2 1-3m3 3c0-1.5 1-2 1-3m3 3c0-1.5 1-2 1-3" },
  { to: "/app/perfil", label: "Menú", icon: "M4 7h16M4 12h16M4 17h10" },
];
</script>

<template>
  <div class="min-h-[100svh] pb-28 md:pb-0 md:pl-24">
    <aside
      class="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl p-2 md:inset-y-4 md:right-auto md:left-4 md:w-16 md:flex-col md:justify-between md:py-5"
      aria-label="Navegación de la app"
    >
      <RouterLink to="/" class="hidden md:block" aria-label="Inicio">
        <svg viewBox="0 0 64 64" class="h-8 w-8" aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#6a5aa8" />
          <path d="M32 50c-8-8.6-12.5-14.4-12.5-20.6a12.5 12.5 0 0 1 25 0C44.5 35.6 40 41.4 32 50z" fill="#fbf8f6" />
          <circle cx="32" cy="29.5" r="4.6" fill="#b5574b" />
        </svg>
      </RouterLink>
      <nav class="contents md:flex md:flex-col md:gap-2">
        <RouterLink
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          class="group flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-mute transition duration-300 hover:text-ink md:px-2 dark:hover:text-cream"
          active-class="!text-sage bg-sage-soft/70 dark:bg-white/5"
        >
          <svg viewBox="0 0 24 24" class="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path :d="t.icon" />
          </svg>
          <span class="text-[11px] font-medium">{{ t.label }}</span>
        </RouterLink>
      </nav>
      <div class="hidden md:block"><CambioTema /></div>
    </aside>

    <header class="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 md:px-8">
      <RouterLink to="/" class="md:hidden"><LogoMarca /></RouterLink>
      <p class="hidden text-sm text-mute md:block">Hola, {{ user?.name }} 👋</p>
      <div class="md:hidden"><CambioTema /></div>
    </header>

    <RouterView v-slot="{ Component }">
      <Transition name="view" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.view-enter-active,
.view-leave-active {
  transition:
    opacity 0.4s var(--ease-soft),
    transform 0.4s var(--ease-soft);
}
.view-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.view-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
