import { ref } from "vue";

// Autenticación simulada en localStorage hasta que exista el backend FastAPI.
const KEY = "geonegocio:user";
const user = ref(JSON.parse(localStorage.getItem(KEY) || "null"));

export function useAuth() {
  function login({ name, email }) {
    user.value = { name: name || email.split("@")[0], email, since: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(user.value));
  }

  function logout() {
    user.value = null;
    localStorage.removeItem(KEY);
  }

  return { user, login, logout };
}
