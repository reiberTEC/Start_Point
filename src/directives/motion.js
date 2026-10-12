const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(pointer: fine)").matches;

let observer;
function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
  }
  return observer;
}

// v-reveal o v-reveal="120" (retraso en ms) para entradas escalonadas al hacer scroll.
export const reveal = {
  mounted(el, { value }) {
    el.classList.add("reveal");
    if (value) el.style.setProperty("--reveal-delay", `${value}ms`);
    if (reducedMotion()) {
      el.classList.add("is-visible");
      return;
    }
    getObserver().observe(el);
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};

// v-tilt: inclinación 3D sutil que sigue al cursor.
export const tilt = {
  mounted(el, { value = 6 }) {
    if (reducedMotion() || !finePointer()) return;
    const move = (e) => {
      if (el.classList.contains("reveal") && !el.classList.contains("is-visible")) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-y * value}deg) rotateY(${x * value}deg)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el._tilt = { move, leave };
  },
  unmounted(el) {
    if (!el._tilt) return;
    el.removeEventListener("pointermove", el._tilt.move);
    el.removeEventListener("pointerleave", el._tilt.leave);
  },
};

// v-parallax="0.15": desplazamiento vertical ligero relativo al scroll.
export const parallax = {
  mounted(el, { value = 0.12 }) {
    if (reducedMotion()) return;
    let frame;
    const update = () => {
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -value;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      frame = null;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    el._parallax = onScroll;
  },
  unmounted(el) {
    if (el._parallax) window.removeEventListener("scroll", el._parallax);
  },
};
