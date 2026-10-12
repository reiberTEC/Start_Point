// v-reveal="delayMs": aparición con desenfoque al entrar en el viewport.
export const reveal = {
  mounted(el, binding) {
    el.classList.add("reveal");
    if (binding.value) el.style.setProperty("--reveal-delay", `${binding.value}ms`);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    el._revealObserver = io;
  },
  unmounted(el) {
    el._revealObserver?.disconnect();
  },
};
