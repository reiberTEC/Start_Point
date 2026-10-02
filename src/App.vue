<script setup lang="ts">
import { ref } from 'vue'
import LoginView from './components/LoginView.vue'
import PanelPrincipal from './components/PanelPrincipal.vue'

const CLAVE_SESION = 'startpoint:sesion'

const sesion = ref(localStorage.getItem(CLAVE_SESION) ?? '')

const ingresar = (correo: string) => {
  localStorage.setItem(CLAVE_SESION, correo)
  sesion.value = correo
}

const salir = () => {
  localStorage.removeItem(CLAVE_SESION)
  sesion.value = ''
}
</script>

<template>
  <PanelPrincipal v-if="sesion" :correo="sesion" @salir="salir" />
  <LoginView v-else @ingresar="ingresar" />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

button,
input {
  font: inherit;
}
</style>
