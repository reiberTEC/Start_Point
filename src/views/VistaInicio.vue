<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import MenuSitio from "@/components/MenuSitio.vue";
import PortadaVisual from "@/components/PortadaVisual.vue";
import ContadorAnimado from "@/components/ContadorAnimado.vue";
import ProbadorIvc from "@/components/ProbadorIvc.vue";
import LogoMarca from "@/components/LogoMarca.vue";
import { project } from "@/data/project";

const ideas = ["cafetería", "taquería", "papelería", "barbería", "florería", "gimnasio"];
const idea = ref(0);
let ticker;
onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ticker = setInterval(() => (idea.value = (idea.value + 1) % ideas.length), 2200);
});
onBeforeUnmount(() => clearInterval(ticker));

const stats = [
  { value: 52, suffix: " %", text: "de los negocios nuevos en México cierran antes de cumplir dos años.", source: "INEGI, Demografía de los Negocios" },
  { value: 7.5, decimals: 1, suffix: " años", text: "es lo que se espera que dure un negocio nuevo en la zona metropolitana de Morelia.", source: "Barboza Lara, 2019" },
  { value: 344935, suffix: "", text: "establecimientos compiten hoy en Michoacán; casi todos son micronegocios.", source: "INEGI, Censos Económicos 2024" },
];

const steps = [
  {
    title: "Marca tu zona",
    text: "Toca el mapa donde te gustaría abrir. Verás cuánta gente y cuántos autos pasan en cada hora del día.",
    icon: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    tone: "bg-sage-soft text-sage",
  },
  {
    title: "Cuéntanos tu idea",
    text: "Escribe qué quieres vender. Buscamos los negocios parecidos que ya están ahí y leemos sus reseñas.",
    icon: "M4 6h16M4 12h10M4 18h7m9-3 2 2-5 5h-2v-2l5-5z",
    tone: "bg-terra-soft text-terra",
  },
  {
    title: "Decide con calma",
    text: "Recibes un índice del 0 al 100, las razones detrás y qué hacer para destacar frente a la competencia.",
    icon: "M4 19V9m6 10V5m6 14v-7m4 7H2",
    tone: "bg-amber-soft text-amber",
  },
];

const petals = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 4) % 100}%`,
  delay: `${(i * 1.7) % 9}s`,
  duration: `${9 + (i % 5) * 1.6}s`,
  size: `${10 + (i % 4) * 4}px`,
}));
</script>

<template>
  <div class="relative">
    <MenuSitio />

    <main>
      <!-- Hero -->
      <section class="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-14 px-6 pt-32 pb-20 lg:grid-cols-12">
        <div class="relative z-10 lg:col-span-6">
          <p v-reveal class="eyebrow">
            <span class="h-1.5 w-1.5 rounded-full bg-sage" />
            Hecho en Morelia · Instituto Tecnológico de Morelia
          </p>
          <h1 v-reveal="120" class="title mt-6 text-[clamp(2.9rem,7.2vw,5.6rem)]">
            Encuentra la <span class="italic">esquina perfecta</span> para tu negocio.
          </h1>
          <p v-reveal="240" class="lead mt-7 max-w-lg">
            Medimos cuánta gente pasa, quién más vende lo mismo y qué opinan sus clientes. Tú eliges la zona y nos cuentas tu idea;
            nosotros hacemos las cuentas.
          </p>

          <RouterLink
            v-reveal="360"
            to="/acceso"
            class="group mt-9 flex max-w-lg items-center gap-3 rounded-full border border-ink/10 bg-white p-2 pl-6 shadow-[0_20px_40px_-28px_rgb(36_33_46/0.5)] transition duration-300 hover:-translate-y-0.5 hover:border-sage/40 dark:border-white/10 dark:bg-night-2"
          >
            <span class="flex-1 truncate text-ink-soft dark:text-sand/80">
              Quiero abrir una
              <span class="relative inline-block min-w-[7.5rem] align-bottom">
                <Transition name="word" mode="out-in">
                  <span :key="idea" class="inline-block font-semibold text-sage">{{ ideas[idea] }}</span>
                </Transition>
              </span>
            </span>
            <span class="btn-primary !px-5 !py-3 text-sm">
              Analizar
              <svg viewBox="0 0 24 24" class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </span>
          </RouterLink>

          <p v-reveal="460" class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
            <span>Datos de</span>
            <span class="font-semibold text-ink-soft dark:text-sand/80">OpenStreetMap</span>
            <span class="font-semibold text-ink-soft dark:text-sand/80">Google Maps</span>
            <span class="font-semibold text-ink-soft dark:text-sand/80">INEGI</span>
          </p>
        </div>

        <div v-reveal="200" class="lg:col-span-6">
          <PortadaVisual />
        </div>
      </section>

      <!-- Cifras -->
      <section id="problema" class="scroll-mt-24 px-4">
        <div class="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-cream sm:px-12 sm:py-20 dark:bg-night-2">
          <div class="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-sage/40 blur-3xl" aria-hidden="true" />
          <div class="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-terra/30 blur-3xl" aria-hidden="true" />
          <div class="relative grid gap-10 lg:grid-cols-12">
            <div class="lg:col-span-4">
              <p v-reveal class="text-sm font-semibold text-sage-soft">Por qué existe GeoNegocio</p>
              <h2 v-reveal="100" class="title mt-4 text-4xl !text-cream sm:text-5xl">Abrir a ciegas sale caro.</h2>
              <p v-reveal="200" class="mt-5 leading-relaxed text-cream/70">
                La mayoría elige local por intuición. La información para decidir mejor existe, pero está regada en mapas, apps y censos.
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-3 lg:col-span-8">
              <article
                v-for="(s, i) in stats"
                :key="i"
                v-reveal="i * 120"
                class="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-500 hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <p class="font-serif text-4xl font-bold tracking-tight text-cream sm:text-[2.6rem]">
                  <ContadorAnimado :value="s.value" :decimals="s.decimals ?? 0" :suffix="s.suffix" />
                </p>
                <p class="mt-4 text-sm leading-relaxed text-cream/80">{{ s.text }}</p>
                <p class="mt-6 text-[11px] text-cream/50">{{ s.source }}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- Cómo funciona -->
      <section id="como-funciona" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-32">
        <div class="max-w-2xl">
          <p v-reveal class="eyebrow">Cómo funciona</p>
          <h2 v-reveal="100" class="title mt-5 text-5xl sm:text-6xl">Tres pasos y una <span class="italic">respuesta clara</span>.</h2>
        </div>

        <ol class="relative mt-16 grid gap-6 md:grid-cols-3">
          <div class="steps-line absolute top-8 right-[16%] left-[16%] hidden h-0.5 md:block" aria-hidden="true" />
          <li v-for="(s, i) in steps" :key="s.title" v-reveal="i * 160" class="relative">
            <span class="relative z-10 grid h-16 w-16 place-items-center rounded-2xl shadow-sm ring-8 ring-cream dark:ring-night" :class="s.tone">
              <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :d="s.icon" />
              </svg>
            </span>
            <p class="mt-6 text-sm font-semibold text-mute">Paso {{ i + 1 }}</p>
            <h3 class="mt-1 font-serif text-2xl font-bold tracking-tight">{{ s.title }}</h3>
            <p class="mt-3 max-w-xs leading-relaxed text-ink-soft dark:text-sand/70">{{ s.text }}</p>
          </li>
        </ol>
      </section>

      <!-- Lo que verás -->
      <section class="bg-sand/70 py-24 sm:py-32 dark:bg-night-2/40">
        <div class="mx-auto max-w-6xl px-6">
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p v-reveal class="eyebrow">Lo que verás en la app</p>
              <h2 v-reveal="100" class="title mt-5 max-w-xl text-5xl sm:text-6xl">Todo lo que importa, <span class="italic">en un mapa</span>.</h2>
            </div>
            <RouterLink v-reveal="200" to="/acceso" class="btn-ghost">Probar el prototipo</RouterLink>
          </div>

          <div class="mt-14 grid auto-rows-[minmax(13rem,auto)] gap-5 md:grid-cols-6">
            <article v-reveal v-tilt="4" class="card flex flex-col overflow-hidden p-7 md:col-span-4 md:row-span-2">
              <p class="text-sm font-semibold text-terra">Tránsito por hora</p>
              <h3 class="mt-2 font-serif text-3xl font-bold tracking-tight">Dónde se junta la gente, mañana, tarde y noche.</h3>
              <div class="relative mt-8 min-h-56 flex-1 overflow-hidden rounded-2xl bg-sand/70 dark:bg-night">
                <div class="heat-spot absolute top-6 left-[18%] h-40 w-40" />
                <div class="heat-spot absolute top-16 left-[46%] h-52 w-52" style="animation-delay: -2s" />
                <div class="heat-spot is-veh absolute top-2 right-[8%] h-36 w-36" style="animation-delay: -4s" />
                <div class="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-white/80 dark:bg-white/10" />
                <div class="absolute inset-y-0 left-1/3 w-1.5 bg-white/80 dark:bg-white/10" />
                <div class="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-full bg-white/85 px-4 py-2 text-xs backdrop-blur dark:bg-night-2/85">
                  <span class="text-mute">Poca gente</span>
                  <span class="legend h-2 flex-1 rounded-full" />
                  <span class="text-mute">Mucha</span>
                </div>
              </div>
            </article>

            <article v-reveal="100" v-tilt="4" class="card p-7 md:col-span-2">
              <span class="grid h-11 w-11 place-items-center rounded-xl bg-sage-soft text-sage">
                <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>
              </span>
              <h3 class="mt-5 font-serif text-xl font-bold tracking-tight">Ficha de cada negocio</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-soft dark:text-sand/70">Vista de calle apuntando a la fachada, mapa, satélite y lo que dicen sus clientes.</p>
            </article>

            <article v-reveal="200" v-tilt="4" class="card flex flex-col justify-between p-7 md:col-span-2">
              <h3 class="font-serif text-xl font-bold tracking-tight">Un índice del 0 al 100</h3>
              <div class="mt-4 flex items-end gap-1.5">
                <span v-for="(h, i) in [30, 46, 38, 62, 55, 78, 70, 88]" :key="i" class="bar-grow w-full rounded-md" :class="i > 5 ? 'bg-sage' : 'bg-sage/25'" :style="{ height: `${h}px`, animationDelay: `${i * 80}ms` }" />
              </div>
              <p class="mt-4 text-sm text-ink-soft dark:text-sand/70">Tránsito, demanda, competencia y calidad, en un solo número.</p>
            </article>

            <article v-reveal v-tilt="4" class="card p-7 md:col-span-3">
              <p class="text-sm font-semibold text-amber">Consejos, no solo números</p>
              <ul class="mt-4 space-y-3 text-sm">
                <li class="flex gap-3"><span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-sage" />Pasa mucha gente al mediodía: abre temprano y aprovecha la comida.</li>
                <li class="flex gap-3"><span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber" />La competencia está muy bien calificada: tendrás que igualar ese nivel.</li>
                <li class="flex gap-3"><span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-terra" />Se quejan de la espera: el servicio rápido puede ser tu ventaja.</li>
              </ul>
            </article>

            <article v-reveal="100" v-tilt="4" class="card relative overflow-hidden p-7 md:col-span-3">
              <p class="text-sm font-semibold text-sage">¿Hay un lugar mejor cerca?</p>
              <h3 class="mt-2 max-w-xs font-serif text-2xl font-bold tracking-tight">Te sugerimos un punto cercano con más gente y menos competencia.</h3>
              <span class="absolute right-8 bottom-7 grid h-14 w-14 place-items-center rounded-full bg-amber text-white shadow-lg">
                <span class="absolute inset-0 animate-ping-soft rounded-full bg-amber/40" />
                <svg viewBox="0 0 24 24" class="relative h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18m-9-9h18" /></svg>
              </span>
            </article>
          </div>
        </div>
      </section>

      <!-- Playground IVC -->
      <section id="indice" class="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-32">
        <div class="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div class="lg:col-span-7">
            <p v-reveal class="eyebrow">Pruébalo aquí mismo</p>
            <h2 v-reveal="100" class="title mt-5 text-5xl sm:text-6xl">Elige un giro y mira <span class="italic">qué zona gana</span>.</h2>
          </div>
          <p v-reveal="200" class="lead lg:col-span-5">
            El Índice de Viabilidad Comercial combina el paso de gente, la demanda, la competencia y la calidad de quienes ya están ahí.
          </p>
        </div>
        <div v-reveal="150" class="mt-14">
          <ProbadorIvc />
        </div>
        <p class="mt-4 text-xs text-mute">Datos de demostración para cinco zonas de Morelia.</p>
      </section>

      <!-- Pregunta de investigación -->
      <section class="mx-auto max-w-4xl px-6 pb-24 text-center">
        <p v-reveal class="text-sm font-semibold text-mute">La pregunta que guía el proyecto</p>
        <p v-reveal="100" class="mt-5 font-serif text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">“{{ project.question }}”</p>
      </section>

      <!-- CTA -->
      <section class="px-4 pb-6">
        <div v-reveal class="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-sage px-6 py-20 text-center text-white sm:px-12 sm:py-28">
          <span
            v-for="(p, i) in petals"
            :key="i"
            class="petal"
            :style="{ left: p.left, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration }"
            aria-hidden="true"
          />
          <p class="relative text-sm font-semibold text-white/80">Como las jacarandas de Morelia: florece donde te va bien.</p>
          <h2 class="title relative mx-auto mt-4 max-w-3xl text-5xl !text-white sm:text-7xl">Tu próximo negocio empieza con un buen lugar.</h2>
          <RouterLink
            to="/acceso"
            class="relative mt-10 inline-flex items-center gap-2 rounded-full bg-cream px-8 py-4 font-semibold text-ink transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            Abrir GeoNegocio
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </RouterLink>
        </div>
      </section>
    </main>

    <footer class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-mute sm:flex-row">
      <LogoMarca />
      <p>{{ project.event }}</p>
    </footer>
  </div>
</template>

<style scoped>
.word-enter-active,
.word-leave-active {
  transition:
    opacity 0.35s var(--ease-soft),
    transform 0.35s var(--ease-soft);
}
.word-enter-from {
  opacity: 0;
  transform: translateY(60%);
}
.word-leave-to {
  opacity: 0;
  transform: translateY(-60%);
}

.steps-line {
  background: repeating-linear-gradient(90deg, var(--color-sand-2) 0 8px, transparent 8px 16px);
}

.heat-spot {
  border-radius: 9999px;
  background: radial-gradient(circle, rgb(208 112 95 / 0.65), rgb(234 166 151 / 0.25) 45%, transparent 70%);
  animation: breathe-heat 6s ease-in-out infinite;
}
.heat-spot.is-veh {
  background: radial-gradient(circle, rgb(108 94 176 / 0.55), rgb(168 158 214 / 0.2) 45%, transparent 70%);
}
@keyframes breathe-heat {
  0%,
  100% {
    transform: scale(0.9);
  }
  50% {
    transform: scale(1.1);
  }
}
.legend {
  background: linear-gradient(90deg, #f7e2dc, #efae9f, #dd7a66, #c0503f);
}

.bar-grow {
  transform-origin: bottom;
  animation: bar-in 0.9s var(--ease-soft) both;
}
@keyframes bar-in {
  from {
    transform: scaleY(0);
  }
}

.petal {
  position: absolute;
  top: -24px;
  border-radius: 70% 0 70% 0;
  background: rgb(255 255 255 / 0.35);
  animation-name: petal-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes petal-fall {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translate3d(60px, 560px, 0) rotate(320deg);
    opacity: 0;
  }
}
</style>
