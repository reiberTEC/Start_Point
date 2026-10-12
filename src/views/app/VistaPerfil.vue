<script setup>
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { useSettings } from "@/composables/useSettings";

const router = useRouter();
const { user, logout } = useAuth();
const { dark, weights, resetWeights } = useSettings();

const weightLabels = {
  traffic: { label: "Flujo de personas", hint: "TomTom Traffic" },
  demand: { label: "Demanda en la zona", hint: "Rappi · Uber Eats" },
  competition: { label: "Poca competencia", hint: "Google Places" },
  quality: { label: "Calidad de la competencia", hint: "Calificaciones" },
};

function signOut() {
  logout();
  router.push("/");
}
</script>

<template>
  <section class="mx-auto max-w-3xl px-5 pt-6 md:px-8">
    <h1 class="title text-4xl sm:text-5xl">Menú</h1>

    <div class="card mt-8 flex items-center gap-5 p-6">
      <span class="grid h-16 w-16 place-items-center rounded-full bg-sage-soft font-serif font-bold text-3xl text-sage">
        {{ user?.name?.charAt(0)?.toUpperCase() }}
      </span>
      <div>
        <p class="text-lg font-semibold">{{ user?.name }}</p>
        <p class="text-sm text-mute">{{ user?.email }}</p>
      </div>
    </div>

    <div class="card mt-5 divide-y divide-ink/[0.06] dark:divide-white/[0.06]">
      <div class="flex items-center justify-between p-6">
        <div>
          <p class="font-medium">Modo oscuro</p>
          <p class="text-sm text-mute">Tonos suaves para la noche.</p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="dark"
          aria-label="Modo oscuro"
          class="relative h-8 w-14 rounded-full transition-colors duration-300"
          :class="dark ? 'bg-sage' : 'bg-ink/15'"
          @click="dark = !dark"
        >
          <span
            class="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-500 ease-[var(--ease-soft)]"
            :class="dark ? 'translate-x-6' : ''"
          />
        </button>
      </div>

      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">¿Qué es más importante para ti?</p>
            <p class="text-sm text-mute">Ajusta cómo se calcula el índice.</p>
          </div>
          <button type="button" class="text-sm text-sage hover:underline" @click="resetWeights">Restablecer</button>
        </div>
        <div class="mt-6 space-y-5">
          <label v-for="(meta, key) in weightLabels" :key="key" class="block">
            <span class="flex justify-between text-sm">
              <span>{{ meta.label }} <span class="text-mute">· {{ meta.hint }}</span></span>
              <span class="tabular-nums text-mute">{{ Math.round(weights[key] * 100) }}</span>
            </span>
            <input v-model.number="weights[key]" type="range" min="0" max="0.6" step="0.05" class="mt-2 w-full accent-[#6a5aa8]" />
          </label>
        </div>
      </div>

      <RouterLink to="/" class="flex items-center justify-between p-6 transition hover:bg-sand/50 dark:hover:bg-white/5">
        <span>
          <span class="block font-medium">Acerca del proyecto</span>
          <span class="text-sm text-mute">Start Point · ITM · FPiT 2026</span>
        </span>
        <span aria-hidden="true">→</span>
      </RouterLink>
    </div>

    <button type="button" class="btn-ghost mt-6 w-full !border-terra/30 !text-terra hover:!bg-terra-soft" @click="signOut">
      Cerrar sesión
    </button>
  </section>
</template>
