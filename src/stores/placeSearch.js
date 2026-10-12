import { reactive, watch } from "vue";

// Estado de la pantalla Lugar: sobrevive a cambios de pantalla y recargas durante la sesión.
const KEY = "geonegocio.lugar";

const defaults = {
  center: null,
  radius: 400,
  period: "mediodia",
  concept: "",
  view: null,
  mode: "geo",
  layers: {
    pedestrian: true,
    vehicular: false,
    live: false,
    pois: true,
    zones: false,
    competitors: true,
    spot: true,
  },
};

function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (!saved) return structuredClone(defaults);
    return { ...structuredClone(defaults), ...saved, layers: { ...defaults.layers, ...saved.layers } };
  } catch {
    return structuredClone(defaults);
  }
}

export const placeState = reactive(restore());

watch(placeState, (s) => sessionStorage.setItem(KEY, JSON.stringify(s)), { deep: true });
