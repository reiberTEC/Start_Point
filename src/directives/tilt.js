// v-tilt="intensidad": inclinación 3D y brillo que siguen al cursor.
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const tilt = {
  mounted(el, binding) {
    if (!finePointer()) return;
    const max = binding.value ?? 8;
    el.style.transformStyle = "preserve-3d";
    el.style.transition = "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)";

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transition = "transform 120ms linear";
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg)`;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    };
    const onLeave = () => {
      el.style.transition = "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)";
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el._tilt = { onMove, onLeave };
  },
  unmounted(el) {
    if (!el._tilt) return;
    el.removeEventListener("pointermove", el._tilt.onMove);
    el.removeEventListener("pointerleave", el._tilt.onLeave);
  },
};
