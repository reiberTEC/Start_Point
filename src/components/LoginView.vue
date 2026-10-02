<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ ingresar: [correo: string] }>()

const correo = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)
const intentoEnviar = ref(false)

const errorCorreo = computed(() => {
  if (!correo.value.trim()) return 'Escribe tu correo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim())) return 'El correo no es válido.'
  return ''
})

const errorContrasena = computed(() => {
  if (!contrasena.value) return 'Escribe tu contraseña.'
  if (contrasena.value.length < 6) return 'Debe tener al menos 6 caracteres.'
  return ''
})

const iniciarSesion = () => {
  intentoEnviar.value = true
  if (errorCorreo.value || errorContrasena.value) return

  // TODO: validar las credenciales contra el backend
  emit('ingresar', correo.value.trim())
}
</script>

<template>
  <main class="login">
    <div class="fondo-vineta" aria-hidden="true"></div>
    <form class="tarjeta" novalidate @submit.prevent="iniciarSesion">
      <div class="marca">
        <h1>Start Point</h1>
      </div>
      <p class="bienvenida">Inicia sesión para continuar</p>

      <label class="campo">
        <span>Correo electrónico</span>
        <input
          v-model="correo"
          type="email"
          autocomplete="email"
          placeholder="tucorreo@ejemplo.com"
          :aria-invalid="intentoEnviar && !!errorCorreo"
        />
        <small v-if="intentoEnviar && errorCorreo" class="error">{{ errorCorreo }}</small>
      </label>

      <div class="campo">
        <label for="contrasena">Contraseña</label>
        <div class="contrasena">
          <input
            id="contrasena"
            v-model="contrasena"
            :type="mostrarContrasena ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            :aria-invalid="intentoEnviar && !!errorContrasena"
          />
          <button
            type="button"
            class="ver"
            :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="mostrarContrasena = !mostrarContrasena"
          >
            {{ mostrarContrasena ? '🙈' : '👁️' }}
          </button>
        </div>
        <small v-if="intentoEnviar && errorContrasena" class="error">{{ errorContrasena }}</small>
      </div>

      <button type="submit" class="btn-entrar">Iniciar sesión</button>
    </form>
  </main>
</template>

<style scoped>
.login {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: #000;
}

/* Viñeta: el verde se desvanece hacia negro en las orillas */
.fondo-vineta {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0, 0, 0, 0.45) 70%, #000 100%);
  pointer-events: none;
}

/* Neblina verde metálica que se mueve lentamente */
.login::before {
  content: '';
  position: absolute;
  inset: -25%;
  z-index: -3;
  background:
    radial-gradient(circle at 30% 35%, rgba(0, 255, 136, 0.4), transparent 34%),
    radial-gradient(circle at 70% 30%, rgba(57, 255, 20, 0.26), transparent 30%),
    radial-gradient(circle at 62% 70%, rgba(0, 230, 118, 0.34), transparent 34%),
    radial-gradient(circle at 35% 72%, rgba(16, 185, 129, 0.24), transparent 30%);
  filter: blur(60px);
  animation: neblina 22s ease-in-out infinite alternate;
}

/* Pigmentos verdes y destello metálico */
.login::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    linear-gradient(115deg, transparent 38%, rgba(190, 255, 220, 0.07) 48%, rgba(120, 255, 180, 0.12) 50%, transparent 60%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.25 0 0 0 0 1 0 0 0 0 0.55 0 0 0 10 -6.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 250% 100%, 300px 300px;
  background-position: 120% 0, 0 0;
  mix-blend-mode: screen;
  opacity: 0.9;
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  animation: destello 10s ease-in-out infinite;
}

@keyframes neblina {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(4%, -3%) scale(1.08) rotate(6deg);
  }
  100% {
    transform: translate(-4%, 3%) scale(1.03) rotate(-5deg);
  }
}

@keyframes destello {
  0%,
  100% {
    background-position: 120% 0, 0 0;
  }
  50% {
    background-position: -20% 0, 0 -8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login::before,
  .login::after {
    animation: none;
  }
}

.tarjeta {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  position: relative;
  overflow: hidden;
  padding: 2.5rem 2rem;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04) 45%, rgba(203, 213, 225, 0.1));
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(148, 163, 184, 0.2);
}

/* Borde plateado con degradado metálico */
.tarjeta::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1.5px;
  border-radius: inherit;
  background: linear-gradient(135deg, #f8fafc, #94a3b8 25%, #e2e8f0 45%, #64748b 65%, #f1f5f9 85%, #cbd5e1);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  pointer-events: none;
}

/* Reflejo plateado que cruza el cuadro */
.tarjeta::after {
  content: '';
  position: absolute;
  top: -50%;
  left: 0;
  width: 60%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(241, 245, 249, 0.16), transparent);
  transform: translateX(-150%) rotate(20deg);
  animation: reflejo-plata 7s ease-in-out infinite;
  pointer-events: none;
}

@keyframes reflejo-plata {
  0%,
  60% {
    transform: translateX(-150%) rotate(20deg);
  }
  100% {
    transform: translateX(260%) rotate(20deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tarjeta::after {
    animation: none;
  }
}

.marca {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.marca h1 {
  font-size: 1.9rem;
  font-weight: 800;
  background: linear-gradient(180deg, #ffffff 10%, #cbd5e1 45%, #94a3b8 55%, #e2e8f0 90%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.bienvenida {
  margin-top: -0.5rem;
  color: #cbd5e1;
  text-align: center;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
}

.campo input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1.5px solid rgba(203, 213, 225, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.07);
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.campo input::placeholder {
  color: rgba(226, 232, 240, 0.45);
}

.campo input:focus {
  border-color: #e2e8f0;
  background: rgba(255, 255, 255, 0.11);
  box-shadow: 0 0 0 4px rgba(226, 232, 240, 0.15);
}

.campo input[aria-invalid='true'] {
  border-color: #f87171;
}

.contrasena {
  position: relative;
}

.contrasena input {
  padding-right: 3rem;
}

.ver {
  position: absolute;
  top: 50%;
  right: 0.6rem;
  transform: translateY(-50%);
  border: none;
  background: none;
  font-size: 1.1rem;
  cursor: pointer;
}

.error {
  color: #fca5a5;
  font-weight: 500;
}

.btn-entrar {
  position: relative;
  overflow: hidden;
  margin-top: 0.4rem;
  padding: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 35%, #94a3b8 52%, #cbd5e1 70%, #f1f5f9 100%);
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  cursor: pointer;
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(71, 85, 105, 0.35);
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}

/* Destello que recorre el metal al pasar el cursor */
.btn-entrar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
  transform: translateX(-150%) skewX(-20deg);
  pointer-events: none;
}

.btn-entrar:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.5),
    0 0 18px rgba(226, 232, 240, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(71, 85, 105, 0.35);
}

.btn-entrar:hover::after {
  animation: destello-boton 0.8s ease-out;
}

.btn-entrar:active {
  transform: translateY(0);
  filter: brightness(0.95);
}

.btn-entrar:focus-visible {
  outline: 2px solid #f8fafc;
  outline-offset: 3px;
}

@keyframes destello-boton {
  to {
    transform: translateX(350%) skewX(-20deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn-entrar:hover::after {
    animation: none;
  }
}
</style>
