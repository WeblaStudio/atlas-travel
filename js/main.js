"use strict";

/*
 * ==========================================================
 * ATLAS — Cinematic Travel Experience
 * Main JavaScript
 * ES Modules | Three.js | No backend
 * ==========================================================
 */

import { initGlobe } from "./globe.js";

import {
  initCursor,
  initMagneticButtons,
  initAmbientParticles
} from "./cursor.js";


/* ----------------------------------------------------------
   01. ابزارهای عمومی
   ---------------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const coarsePointer = window.matchMedia(
  "(pointer: coarse)"
);

function persianDigits(value) {
  return new Intl.NumberFormat("fa-IR").format(value);
}


/* ----------------------------------------------------------
   02. لودر سینمایی
   رفع مشکل گیر کردن روی ۹۹ درصد
   ---------------------------------------------------------- */

const loader = $("#pageLoader");
const loaderPercent = $("#loaderPercent");
const loaderBar = $("#loaderBar");

let displayedProgress = 0;
let targetProgress = 12;

let loaderFrame = 0;
let loaderFinished = false;
let loaderStartedAt = performance.now();
let globeReady = false;

const MIN_LOADER_TIME = 700;
const LOADER_FAILSAFE_TIME = 5000;


/*
 * نمایش درصد و نوار پیشرفت.
 */
function renderLoaderProgress(value) {
  const safeValue = Math.max(0, Math.min(100, Math.floor(value)));

  if (loaderPercent) {
    loaderPercent.textContent = persianDigits(safeValue);
  }

  if (loaderBar) {
    loaderBar.style.width = `${safeValue}%`;
  }
}


/*
 * پایان امن لودر.
 * این تابع فقط یک بار اجرا می‌شود.
 */
function finishLoader() {
  if (loaderFinished) return;

  loaderFinished = true;

  // نمایش تیتر و انیمیشن ورود هیرو
  document.body.classList.add("is-ready");

  displayedProgress = 100;
  targetProgress = 100;

  if (loaderFrame) {
    cancelAnimationFrame(loaderFrame);
    loaderFrame = 0;
  }

  renderLoaderProgress(100);

  const elapsed = performance.now() - loaderStartedAt;
  const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsed);

  window.setTimeout(() => {
    if (!loader) return;

    loader.classList.add("is-hidden");

    window.setTimeout(() => {
      loader.remove();
    }, reduceMotion.matches ? 0 : 850);

  }, remainingTime);
}


/*
 * انیمیشن درصد.
 *
 * نکته:
 * در کد قبلی، درصد به‌صورت تدریجی به ۱۰۰ نزدیک می‌شد.
 * این نسخه وقتی فاصله کم شود، مقدار را دقیقاً ۱۰۰ می‌کند.
 */
function animateLoader() {
  if (loaderFinished) return;

  const now = performance.now();

  displayedProgress +=
    (targetProgress - displayedProgress) * 0.12;

  /*
   * اصلاح کلیدی:
   * اجازه نمی‌دهیم عدد به‌صورت اعشاری نزدیک ۱۰۰ گیر کند.
   */
  if (
    targetProgress >= 100 &&
    Math.abs(targetProgress - displayedProgress) < 0.6
  ) {
    displayedProgress = 100;
  }

  renderLoaderProgress(displayedProgress);

  /*
   * شرط پایان باید بر اساس مقدار واقعی باشد،
   * نه فقط عدد گرد شده‌ای که روی صفحه نمایش می‌دهیم.
   */
  if (displayedProgress >= 100) {
    finishLoader();
    return;
  }

  /*
   * اگر کره آماده نشده باشد، لودر فرصت ادامه دارد.
   * اما تایمر اطمینان، انتظار بی‌نهایت را متوقف می‌کند.
   */
  if (now - loaderStartedAt >= LOADER_FAILSAFE_TIME) {
    displayedProgress = 100;
    finishLoader();
    return;
  }

  loaderFrame = requestAnimationFrame(animateLoader);
}


/*
 * آغاز انیمیشن لودر.
 */
renderLoaderProgress(0);

loaderFrame = requestAnimationFrame(animateLoader);


/* ----------------------------------------------------------
   03. پایان لودر در صورت آماده‌شدن کره
   ---------------------------------------------------------- */

function markGlobeReady() {
  if (globeReady || loaderFinished) return;

  globeReady = true;
  targetProgress = 100;
}


/*
 * این تایمر مستقل از بارگذاری کره است.
 * اگر CDN یا یکی از تکسچرها کند باشد،
 * لودر برای همیشه باز نمی‌ماند.
 */
window.setTimeout(() => {
  if (!loaderFinished) {
    targetProgress = 100;
  }
}, LOADER_FAILSAFE_TIME);


/* ----------------------------------------------------------
   04. منوی تمام‌صفحه
   ---------------------------------------------------------- */

const menuTrigger = $("#menuTrigger");
const fullMenu = $("#fullMenu");

function setMenuOpen(open) {
  if (!menuTrigger || !fullMenu) return;

  menuTrigger.classList.toggle("is-active", open);

  fullMenu.classList.toggle("is-open", open);

  menuTrigger.setAttribute(
    "aria-expanded",
    String(open)
  );

  menuTrigger.setAttribute(
    "aria-label",
    open ? "بستن منو" : "باز کردن منو"
  );

  fullMenu.setAttribute(
    "aria-hidden",
    String(!open)
  );

  fullMenu.inert = !open;

  document.body.classList.toggle(
    "is-menu-open",
    open
  );

  if (open) {
    const firstLink = $(".full-menu__link", fullMenu);

    window.setTimeout(() => {
      firstLink?.focus({ preventScroll: true });
    }, reduceMotion.matches ? 0 : 200);
  } else {
    menuTrigger.focus({ preventScroll: true });
  }
}


if (menuTrigger && fullMenu) {
  menuTrigger.addEventListener("click", () => {
    const isOpen =
      menuTrigger.getAttribute("aria-expanded") === "true";

    setMenuOpen(!isOpen);
  });

  $$(".full-menu__link", fullMenu).forEach((link) => {
    link.addEventListener("click", () => {
      setMenuOpen(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      fullMenu.classList.contains("is-open")
    ) {
      setMenuOpen(false);
    }
  });

  /*
   * بستن منو با کلیک بیرون از لینک‌ها.
   */
  fullMenu.addEventListener("click", (event) => {
    if (event.target === fullMenu) {
      setMenuOpen(false);
    }
  });
}


/* ----------------------------------------------------------
   05. هدر کوچک‌شونده هنگام اسکرول
   ---------------------------------------------------------- */

const header = $("#siteHeader");

function updateHeader() {
  if (!header) return;

  header.classList.toggle(
    "is-scrolled",
    window.scrollY > 40
  );
}

window.addEventListener(
  "scroll",
  updateHeader,
  { passive: true }
);

window.addEventListener(
  "resize",
  updateHeader,
  { passive: true }
);

updateHeader();


/* ----------------------------------------------------------
   06. نوار پیشرفت مسیر
   ---------------------------------------------------------- */

const progressTrack = $("#scrollProgress span");

let scrollQueued = false;

function updateScrollProgress() {
  if (!progressTrack) {
    scrollQueued = false;
    return;
  }

  const scrollTop = window.scrollY;

  const pageHeight =
    document.documentElement.scrollHeight;

  const viewportHeight = window.innerHeight;

  const maximumScroll = Math.max(
    1,
    pageHeight - viewportHeight
  );

  const progress = Math.min(
    100,
    Math.max(0, (scrollTop / maximumScroll) * 100)
  );

  progressTrack.style.height = `${progress}%`;

  scrollQueued = false;
}

function requestScrollUpdate() {
  if (scrollQueued) return;

  scrollQueued = true;

  requestAnimationFrame(updateScrollProgress);
}

window.addEventListener(
  "scroll",
  requestScrollUpdate,
  { passive: true }
);

window.addEventListener(
  "resize",
  requestScrollUpdate,
  { passive: true }
);

updateScrollProgress();


/* ----------------------------------------------------------
   07. نور دنبال‌کنندهٔ موس
   ---------------------------------------------------------- */

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty(
      "--pointer-x",
      `${event.clientX}px`
    );

    document.documentElement.style.setProperty(
      "--pointer-y",
      `${event.clientY}px`
    );
  }, { passive: true });
}


/* ----------------------------------------------------------
   08. کرسر، دکمه‌های مغناطیسی و ذرات
   ---------------------------------------------------------- */

/*
 * این توابع از js/cursor.js می‌آیند.
 */
try {
  initCursor();
} catch (error) {
  console.warn("ATLAS cursor:", error);
}

try {
  initMagneticButtons();
} catch (error) {
  console.warn("ATLAS magnetic buttons:", error);
}

try {
  initAmbientParticles($("#particlesCanvas"));
} catch (error) {
  console.warn("ATLAS ambient particles:", error);
}


/* ----------------------------------------------------------
   09. سال جاری فوتر
   ---------------------------------------------------------- */

const currentYear = $("#currentYear");

if (currentYear) {
  currentYear.textContent = persianDigits(
    new Date().getFullYear()
  );
}


/* ----------------------------------------------------------
   10. راه‌اندازی کرهٔ سه‌بعدی
   ---------------------------------------------------------- */

const globeMessage = $("#globeMessage");

let globeController = null;

function setGlobeFallbackMessage(message) {
  if (!globeMessage) return;

  globeMessage.textContent = message;
}


/*
 * راه‌اندازی کره داخل try/catch انجام می‌شود
 * تا خطای WebGL باعث توقف تمام رابط کاربری نشود.
 */
try {
  globeController = initGlobe({
    onReady: () => {
      markGlobeReady();

      setGlobeFallbackMessage(
        "یک مقصد را انتخاب کن؛ جهان منتظر توست."
      );
    },

    onError: (message) => {
      setGlobeFallbackMessage(
        message ||
        "کرهٔ سه‌بعدی در دسترس نیست؛ از فهرست مقصدها استفاده کن."
      );

      /*
       * حتی در صورت پشتیبانی‌نشدن WebGL،
       * لودر باید پایان یابد.
       */
      markGlobeReady();
    }
  });

} catch (error) {
  console.error(
    "ATLAS: خطا در راه‌اندازی کرهٔ سه‌بعدی",
    error
  );

  setGlobeFallbackMessage(
    "کرهٔ تعاملی در دسترس نیست؛ فهرست مقصدها همچنان قابل استفاده است."
  );

  markGlobeReady();
}


/* ----------------------------------------------------------
   11. انتخاب مقصدها از فهرست
   ---------------------------------------------------------- */

document.addEventListener("click", (event) => {
  const destinationButton =
    event.target.closest("[data-destination]");

  if (!destinationButton) return;

  const destinationId =
    destinationButton.dataset.destination;

  if (!destinationId) return;

  if (
    globeController &&
    typeof globeController.selectDestination === "function"
  ) {
    globeController.selectDestination(
      destinationId,
      {
        pin: true,
        focusGlobe: true
      }
    );
  } else {
    setGlobeFallbackMessage(
      `مقصد ${destinationButton.textContent.trim()} انتخاب شد.`
    );
  }
});


/* ----------------------------------------------------------
   12. بستن کارت مقصد
   ---------------------------------------------------------- */

const destinationCardClose = $("#destinationCardClose");

if (destinationCardClose) {
  destinationCardClose.addEventListener("click", () => {
    if (
      globeController &&
      typeof globeController.clearSelection === "function"
    ) {
      globeController.clearSelection();
    }

    setGlobeFallbackMessage(
      "یک مقصد را انتخاب کن؛ جهان منتظر توست."
    );
  });
}


/* ----------------------------------------------------------
   13. پشتیبان نهایی لودر
   ---------------------------------------------------------- */

/*
 * اگر به هر دلیلی هیچ callbackای از کره اجرا نشود،
 * این بخش اجازه نمی‌دهد لودر روی ۹۹٪ باقی بماند.
 *
 * توجه: تایمر اصلی انیمیشن نیز همین محدودیت را دارد؛
 * این پشتیبان یک مسیر مستقل و اضافی است.
 */
window.setTimeout(() => {
  if (loaderFinished) return;

  targetProgress = 100;
  displayedProgress = 100;

  finishLoader();
}, LOADER_FAILSAFE_TIME + 300);


/* ----------------------------------------------------------
   14. مدیریت خطای کلی منابع
   ---------------------------------------------------------- */

window.addEventListener("error", (event) => {
  /*
   * خطاهای تصویر یا تکسچر نباید سایت را متوقف کنند.
   * اطلاعات خطا برای بررسی در Console باقی می‌ماند.
   */
  if (event.message) {
    console.warn(
      "ATLAS resource/runtime warning:",
      event.message
    );
  }
});


/* ----------------------------------------------------------
   15. پاک‌سازی هنگام خروج از صفحه
   ---------------------------------------------------------- */

window.addEventListener("pagehide", () => {
  if (loaderFrame) {
    cancelAnimationFrame(loaderFrame);
    loaderFrame = 0;
  }

  if (
    globeController &&
    typeof globeController.destroy === "function"
  ) {
    globeController.destroy();
  }
});


/* ----------------------------------------------------------
   16. وضعیت آماده‌شدن اولیه
   ---------------------------------------------------------- */

document.documentElement.classList.add("atlas-ready");