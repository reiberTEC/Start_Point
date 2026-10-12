<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import LogoMarca from "@/components/LogoMarca.vue";
import PortadaVisual from "@/components/PortadaVisual.vue";

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

const mode = ref("login");
const form = reactive({ name: "", email: "", password: "" });
const error = ref("");
const sent = ref(false);

const titles = {
  login: { h: "Hola de nuevo", p: "Entra para ver las oportunidades de tu zona." },
  register: { h: "Crea tu cuenta", p: "Gratis para emprendedores de Morelia." },
  recover: { h: "Recupera tu acceso", p: "Te enviaremos un enlace a tu correo." },
};
const title = computed(() => titles[mode.value]);

function submit() {
  error.value = "";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    error.value = "Escribe un correo válido.";
    return;
  }
  if (mode.value === "recover") {
    sent.value = true;
    return;
  }
  if (form.password.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }
  login({ name: form.name, email: form.email });
  router.push(route.query.next || { name: "map" });
}

function switchTo(m) {
  mode.value = m;
  error.value = "";
  sent.value = false;
}
</script>

<template>
  <main class="grid min-h-[100svh] lg:grid-cols-2">
    <section class="flex flex-col justify-between px-6 py-8 sm:px-12">
      <RouterLink to="/" class="self-start"><LogoMarca /></RouterLink>

      <div class="mx-auto w-full max-w-sm py-12">
        <Transition name="swap" mode="out-in">
          <div :key="mode">
            <h1 class="title text-5xl">{{ title.h }}</h1>
            <p class="mt-3 text-ink-soft dark:text-sand/70">{{ title.p }}</p>
          </div>
        </Transition>

        <form class="mt-10 space-y-4" novalidate @submit.prevent="submit">
          <Transition name="field">
            <label v-if="mode === 'register'" class="block">
              <span class="mb-2 block text-sm">Nombre</span>
              <input v-model="form.name" class="field" autocomplete="name" placeholder="¿Cómo te llamas?" />
            </label>
          </Transition>
          <label class="block">
            <span class="mb-2 block text-sm">Correo</span>
            <input v-model="form.email" type="email" class="field" autocomplete="email" placeholder="tu@correo.com" />
          </label>
          <Transition name="field">
            <label v-if="mode !== 'recover'" class="block">
              <span class="mb-2 flex justify-between text-sm">
                Contraseña
                <button v-if="mode === 'login'" type="button" class="text-sage hover:underline" @click="switchTo('recover')">
                  ¿La olvidaste?
                </button>
              </span>
              <input
                v-model="form.password"
                type="password"
                class="field"
                :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
                placeholder="Mínimo 6 caracteres"
              />
            </label>
          </Transition>

          <p v-if="error" class="rounded-xl bg-terra-soft px-4 py-3 text-sm text-terra" role="alert">{{ error }}</p>
          <p v-if="sent" class="rounded-xl bg-sage-soft px-4 py-3 text-sm text-sage" role="status">
            Listo. Si el correo existe, recibirás un enlace en unos minutos.
          </p>

          <button type="submit" class="btn-primary w-full">
            {{ mode === "login" ? "Entrar" : mode === "register" ? "Crear cuenta" : "Enviar enlace" }}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-ink-soft dark:text-sand/70">
          <template v-if="mode === 'login'">
            ¿Primera vez?
            <button type="button" class="font-medium text-sage hover:underline" @click="switchTo('register')">Crea una cuenta</button>
          </template>
          <template v-else>
            <button type="button" class="font-medium text-sage hover:underline" @click="switchTo('login')">← Volver a entrar</button>
          </template>
        </p>
      </div>

      <p class="text-xs text-mute">Prototipo · la autenticación real llegará con el backend.</p>
    </section>

    <aside class="relative hidden items-center justify-center overflow-hidden bg-sand p-12 lg:flex dark:bg-night-2">
      <div class="w-full max-w-md">
        <PortadaVisual />
        <p class="title mt-12 text-center text-3xl italic">Decide con datos, no con corazonadas.</p>
      </div>
    </aside>
  </main>
</template>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition: all 0.35s var(--ease-soft);
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.field-enter-active,
.field-leave-active {
  transition: all 0.4s var(--ease-soft);
  overflow: hidden;
}
.field-enter-from,
.field-leave-to {
  opacity: 0;
  max-height: 0;
}
.field-enter-to,
.field-leave-from {
  max-height: 120px;
}
</style>
