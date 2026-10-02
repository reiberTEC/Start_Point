<script setup lang="ts">
import { ref, watch } from 'vue'
import MapaNegocio from './MapaNegocio.vue'

defineProps<{ correo: string }>()
const emit = defineEmits<{ salir: [] }>()

const CLAVE_TEMA = 'startpoint:tema'
const temaGuardado = localStorage.getItem(CLAVE_TEMA)
const modoOscuro = ref(
  temaGuardado ? temaGuardado === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches,
)

watch(modoOscuro, (oscuro) => localStorage.setItem(CLAVE_TEMA, oscuro ? 'oscuro' : 'normal'))

const anioActual = new Date().getFullYear()
</script>

<template>
  <div class="panel" :class="{ oscuro: modoOscuro }">
    <header class="barra">
      <div class="marca">
        <span aria-hidden="true">🚀</span>
        Start Point
      </div>

      <div class="usuario">
        <button
          type="button"
          role="switch"
          class="interruptor-tema"
          aria-label="Modo oscuro"
          :aria-checked="modoOscuro"
          :title="modoOscuro ? 'Cambiar a modo normal' : 'Cambiar a modo oscuro'"
          @click="modoOscuro = !modoOscuro"
        >
          <span class="interruptor-pista" aria-hidden="true">
            <span class="interruptor-perilla">{{ modoOscuro ? '🌙' : '☀️' }}</span>
          </span>
          <span class="interruptor-texto">{{ modoOscuro ? 'Modo oscuro' : 'Modo normal' }}</span>
        </button>
        <span class="correo">{{ correo }}</span>
        <button type="button" class="btn-salir" @click="emit('salir')">Cerrar sesión</button>
      </div>
    </header>

    <main class="contenido">
      <section class="hero">
        <h1>¡Bienvenido a Start Point!</h1>
        <p>Ubica nuestro negocio y descubre qué tan cerca estás de nosotros.</p>
      </section>

      <MapaNegocio :oscuro="modoOscuro" />
    </main>

    <footer class="pie">© {{ anioActual }} Start Point</footer>
  </div>
</template>

<style scoped>
.panel {
  --fondo: #f1f5f9;
  --superficie: #ffffff;
  --texto: #1e1b4b;
  --texto-cuerpo: #334155;
  --texto-suave: #64748b;
  --borde: #e2e8f0;
  --sombra: rgba(15, 23, 42, 0.06);
  --peligro: #e11d48;
  --peligro-fondo: #fff1f2;
  --peligro-borde: #fecaca;

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--fondo);
  transition: background 0.3s, color 0.3s;
}

.panel.oscuro {
  --fondo: #0b1120;
  --superficie: #111827;
  --texto: #e2e8f0;
  --texto-cuerpo: #cbd5e1;
  --texto-suave: #94a3b8;
  --borde: #1f2937;
  --sombra: rgba(0, 0, 0, 0.45);
  --peligro: #fb7185;
  --peligro-fondo: rgba(225, 29, 72, 0.12);
  --peligro-borde: rgba(251, 113, 133, 0.35);

  color-scheme: dark;
}

.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 2rem;
  background: var(--superficie);
  box-shadow: 0 4px 16px var(--sombra);
  transition: background 0.3s;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--texto);
}

.usuario {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.correo {
  color: var(--texto-suave);
  font-size: 0.95rem;
}

.interruptor-tema {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.3rem 0.8rem 0.3rem 0.3rem;
  border: 1.5px solid var(--borde);
  border-radius: 999px;
  background: var(--fondo);
  color: var(--texto-cuerpo);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s;
}

.interruptor-tema:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.interruptor-pista {
  position: relative;
  width: 52px;
  height: 28px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background 0.3s;
}

.oscuro .interruptor-pista {
  background: #4f46e5;
}

.interruptor-perilla {
  position: absolute;
  top: 3px;
  left: 3px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.3s;
}

.oscuro .interruptor-perilla {
  transform: translateX(24px);
  background: #1e1b4b;
}

.btn-salir {
  padding: 0.55rem 1.1rem;
  border: 1.5px solid var(--peligro-borde);
  border-radius: 10px;
  background: var(--peligro-fondo);
  color: var(--peligro);
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s, background 0.3s;
}

.btn-salir:hover {
  filter: brightness(0.96);
}

.contenido {
  flex: 1;
  width: 100%;
  max-width: 1150px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.hero {
  margin-bottom: 2.5rem;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  background: linear-gradient(135deg, #4f46e5, #0ea5e9);
  color: white;
  text-align: center;
  box-shadow: 0 20px 40px rgba(79, 70, 229, 0.25);
  transition: background 0.3s;
}

.oscuro .hero {
  background: linear-gradient(135deg, #312e81, #0c4a6e);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
}

.hero h1 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 900;
}

.hero p {
  margin-top: 0.5rem;
  font-size: 1.1rem;
  opacity: 0.9;
}

.pie {
  padding: 1.5rem;
  color: var(--texto-suave);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 600px) {
  .barra {
    padding: 0.8rem 1rem;
  }

  .correo,
  .interruptor-texto {
    display: none;
  }

  .interruptor-tema {
    padding: 0.3rem;
  }

  .contenido {
    padding: 2rem 1rem;
  }
}
</style>
