const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* کرسر سفارشی با لیبل زمینه‌ای از data-cursor */
export function initCursor() {
  const cursor = document.querySelector("#customCursor");
  const label = document.querySelector("#cursorLabel");
  if (!cursor || !label || !window.matchMedia("(pointer: fine)").matches || reduceMotion.matches) return;

  let visible = false;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let targetX = x;
  let targetY = y;
  let raf = 0;

  const render = () => {
    x += (targetX - x) * 0.26;
    y += (targetY - y) * 0.26;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    if (Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  };

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!visible) {
      visible = true;
      cursor.classList.add("is-visible");
    }
    if (!raf) raf = requestAnimationFrame(render);
  }, { passive: true });

  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-cursor], a, button, .destination-card__image, .globe-canvas canvas");
    if (!target) return;
    const text = target.dataset.cursor || (target.closest(".globe-canvas") ? "بچرخان" : "ببین");
    label.textContent = text;
    cursor.classList.add("is-label");
  });

  document.addEventListener("pointerout", (event) => {
    if (event.target.closest("[data-cursor], a, button, .destination-card__image, .globe-canvas canvas")) {
      cursor.classList.remove("is-label");
    }
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));
  window.addEventListener("blur", () => cursor.classList.remove("is-visible", "is-label"));
}

/* حرکت بسیار محدود دکمه‌ها به سمت اشاره‌گر؛ خاموش برای لمس یا reduced motion */
export function initMagneticButtons() {
  if (!window.matchMedia("(pointer: fine)").matches || reduceMotion.matches) return;

  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      button.style.transform = `translate(${dx * 0.08}px, ${dy * 0.08}px)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "translate(0, 0)";
    });
  });
}

/* گرد و غبار نورانی بسیار سبک؛ روی موبایل تعداد نقاط کمتر می‌شود. */
export function initAmbientParticles(canvas) {
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reduced = reduceMotion.matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const count = reduced ? 0 : (coarse ? 24 : 58);
  const particles = [];
  let width = 0;
  let height = 0;
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.25 + 0.25,
        alpha: Math.random() * 0.45 + 0.12,
        speed: Math.random() * 0.18 + 0.035,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      if (!reduced) {
        particle.y -= particle.speed;
        particle.phase += 0.005;
        if (particle.y < -3) {
          particle.y = height + 3;
          particle.x = Math.random() * width;
        }
      }
      const alpha = particle.alpha * (0.72 + Math.sin(time * 0.0006 + particle.phase) * 0.28);
      context.beginPath();
      context.fillStyle = `rgba(218, 197, 151, ${alpha})`;
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();
    });
    if (!reduced) raf = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf), { once: true });
}
