<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import LogoMarca from "@/components/LogoMarca.vue";
import CambioTema from "@/components/CambioTema.vue";

const open = ref(false);
const scrolled = ref(false);

const links = [
  { label: "Por qué", href: "#problema" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Pruébalo", href: "#indice" },
];

function onScroll() {
  scrolled.value = window.scrollY > 24;
}
function onKey(e) {
  if (e.key === "Escape") open.value = false;
}

watch(open, (v) => {
  document.body.style.overflow = v ? "hidden" : "";
});

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKey);
  onScroll();
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>

<template>
  <header class="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
    <nav
      class="flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2 pl-5 transition-all duration-500"
      :class="scrolled || open ? 'glass' : 'bg-transparent'"
      aria-label="Principal"
    >
      <RouterLink to="/" class="relative z-[70]" @click="open = false">
        <LogoMarca />
      </RouterLink>

      <ul class="hidden items-center gap-1 md:flex">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            class="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition duration-300 hover:bg-sage-soft hover:text-sage dark:text-sand/80 dark:hover:bg-white/5"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>

      <div class="relative z-[70] flex items-center gap-2">
        <CambioTema />
        <RouterLink to="/acceso" class="btn-primary hidden !px-5 !py-2.5 text-sm sm:inline-flex">
          Abrir la app
        </RouterLink>
        <button
          type="button"
          class="group grid h-11 w-11 place-items-center rounded-full border border-ink/10 bg-white/70 transition hover:scale-105 md:hidden dark:border-white/10 dark:bg-night-2"
          :aria-expanded="open"
          aria-controls="fullscreen-menu"
          :aria-label="open ? 'Cerrar menú' : 'Abrir menú'"
          @click="open = !open"
        >
          <span class="relative block h-3 w-5">
            <span
              class="absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-500 dark:bg-cream"
              :class="open ? 'top-1.5 rotate-45' : 'top-0'"
            />
            <span
              class="absolute left-0 h-0.5 rounded bg-ink transition-all duration-500 dark:bg-cream"
              :class="open ? 'top-1.5 w-5 -rotate-45' : 'top-3 w-3 group-hover:w-5'"
            />
          </span>
        </button>
      </div>
    </nav>
  </header>

  <Transition name="menu">
    <div
      v-if="open"
      id="fullscreen-menu"
      class="fixed inset-0 z-40 flex flex-col justify-between bg-sand px-6 pt-32 pb-10 sm:px-12 dark:bg-night"
    >
      <ul class="mx-auto w-full max-w-5xl space-y-1">
        <li v-for="(link, i) in links" :key="link.href" class="menu-item overflow-hidden" :style="{ '--i': i }">
          <a
            :href="link.href"
            class="group flex items-baseline gap-5 py-2 font-serif text-5xl font-bold tracking-tight text-ink transition-colors duration-300 hover:text-sage sm:text-7xl dark:text-cream"
            @click="open = false"
          >
            <span class="font-sans text-sm text-mute">0{{ i + 1 }}</span>
            <span class="transition-transform duration-500 ease-out group-hover:translate-x-3">{{ link.label }}</span>
          </a>
        </li>
      </ul>
      <div
        class="menu-item mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-6"
        :style="{ '--i': links.length }"
      >
        <p class="max-w-sm text-ink-soft dark:text-sand/70">
          Datos de ubicación, competencia y tráfico para decidir qué negocio abrir en Morelia.
        </p>
        <RouterLink to="/acceso" class="btn-primary" @click="open = false">Abrir la app →</RouterLink>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: clip-path 0.8s var(--ease-soft);
}
.menu-enter-from,
.menu-leave-to {
  clip-path: circle(0% at calc(100% - 3.5rem) 2.75rem);
}
.menu-enter-to,
.menu-leave-from {
  clip-path: circle(150% at calc(100% - 3.5rem) 2.75rem);
}
.menu-enter-active .menu-item {
  animation: menu-rise 0.8s var(--ease-soft) both;
  animation-delay: calc(0.25s + var(--i) * 70ms);
}
@keyframes menu-rise {
  from {
    opacity: 0;
    transform: translateY(60%);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
