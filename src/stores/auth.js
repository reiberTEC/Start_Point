import { reactive, readonly } from "vue";

// Autenticación simulada en localStorage hasta que exista el backend FastAPI.
const KEY = "geonegocio.session";

const state = reactive({
  user: JSON.parse(localStorage.getItem(KEY) || "null"),
});

function persist() {
  if (state.user) localStorage.setItem(KEY, JSON.stringify(state.user));
  else localStorage.removeItem(KEY);
}

export function useAuth() {
  return {
    state: readonly(state),
    login({ email, name }) {
      state.user = {
        email,
        name: name || email.split("@")[0],
        since: new Date().toISOString(),
      };
      persist();
    },
    logout() {
      state.user = null;
      persist();
    },
    isAuthenticated: () => Boolean(state.user),
  };
}
