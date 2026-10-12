import { reactive, ref, watch } from "vue";
import { DEFAULT_WEIGHTS } from "@/lib/ivc";

const THEME_KEY = "geonegocio:theme";
const WEIGHTS_KEY = "geonegocio:weights";

const dark = ref(localStorage.getItem(THEME_KEY) === "dark");
const weights = reactive({ ...DEFAULT_WEIGHTS, ...JSON.parse(localStorage.getItem(WEIGHTS_KEY) || "{}") });

function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
}
applyTheme(dark.value);

watch(dark, (v) => {
  localStorage.setItem(THEME_KEY, v ? "dark" : "light");
  applyTheme(v);
});
watch(weights, (v) => localStorage.setItem(WEIGHTS_KEY, JSON.stringify(v)), { deep: true });

export function useSettings() {
  function resetWeights() {
    Object.assign(weights, DEFAULT_WEIGHTS);
  }
  return { dark, weights, resetWeights };
}
