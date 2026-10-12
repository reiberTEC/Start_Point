// v-magnetic="fuerza": el elemento se desplaza hacia el cursor al acercarse.
export const magnetic = {
  mounted(el, binding) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const strength = binding.value ?? 0.35;
    el.style.transition = "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)";

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el._magnetic = { onMove, onLeave };
  },
  unmounted(el) {
    if (!el._magnetic) return;
    el.removeEventListener("pointermove", el._magnetic.onMove);
    el.removeEventListener("pointerleave", el._magnetic.onLeave);
  },
};
