const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const navOverlay = document.getElementById("navOverlay");

function closeMenu() {
  navToggle.classList.remove("is-active");
  navMenu.classList.remove("is-open");
  navOverlay.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

function openMenu() {
  navToggle.classList.add("is-active");
  navMenu.classList.add("is-open");
  navOverlay.classList.add("is-open");
  navToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.contains("is-open");
  isOpen ? closeMenu() : openMenu();
});

navOverlay.addEventListener("click", closeMenu);

navMenu.querySelectorAll(".nav-menu__link").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

/* ---------- Stack de cards de serviços (sem dependencias) ---------- */
function initStack(container, { sensitivity = 70, randomRotation = true, elastic = 1 } = {}) {
  let cards = Array.from(container.children);

  function restTransform(card, i) {
    const total = cards.length;
    const fromTop = total - 1 - i;
    const rotate = randomRotation ? (Number(card.dataset.rot) || 0) : 0;
    const scale = 1 - fromTop * 0.06;
    return `rotateZ(${fromTop * 4 + rotate}deg) scale(${scale})`;
  }

  function layout() {
    cards.forEach((card, i) => {
      if (randomRotation) card.dataset.rot = (Math.random() * 10 - 5).toFixed(2);
      card.style.zIndex = i;
      card.style.transform = restTransform(card, i);
    });
  }

  function sendToBack(card) {
    const idx = cards.indexOf(card);
    cards.splice(idx, 1);
    cards.unshift(card);
    layout();
  }

  cards.forEach((card) => {
    let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false;

    card.addEventListener("pointerdown", (e) => {
      if (cards[cards.length - 1] !== card) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      card.classList.add("is-dragging");
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = (e.clientX - startX) * elastic;
      dy = (e.clientY - startY) * elastic;
      const rotateX = Math.max(-60, Math.min(60, dy * -0.6));
      const rotateY = Math.max(-60, Math.min(60, dx * 0.6));
      card.style.transform = `translate(${dx}px, ${dy}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1)`;
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("is-dragging");

      const isTap = Math.abs(dx) < 6 && Math.abs(dy) < 6;

      if (isTap || Math.abs(dx) > sensitivity || Math.abs(dy) > sensitivity) {
        sendToBack(card);
      } else {
        card.style.transform = restTransform(card, cards.indexOf(card));
      }

      dx = 0;
      dy = 0;
    }

    card.addEventListener("pointerup", endDrag);
    card.addEventListener("pointercancel", endDrag);
  });

  layout();
}

document.querySelectorAll(".stack-container").forEach((el) => initStack(el));

/* ---------- scroll reveal (tudo, exceto a hero) ---------- */
(function () {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

/* ---------- Logo: 7s na hero, depois voa até a navbar ---------- */
(function () {
  const heroLogoWrap = document.querySelector(".hero__logo-wrap");
  const navLogo = document.querySelector(".navbar__brand-logo");
  if (!heroLogoWrap || !navLogo) return;

  setTimeout(() => {
    const heroRect = heroLogoWrap.getBoundingClientRect();
    const navRect = navLogo.getBoundingClientRect();
    const shine = heroLogoWrap.querySelector(".hero__logo-shine");
    if (shine) shine.style.display = "none";

    heroLogoWrap.style.animation = "none";
    heroLogoWrap.style.margin = "0";
    heroLogoWrap.style.maxWidth = "none";
    heroLogoWrap.style.position = "fixed";
    heroLogoWrap.style.top = heroRect.top + "px";
    heroLogoWrap.style.left = heroRect.left + "px";
    heroLogoWrap.style.width = heroRect.width + "px";
    heroLogoWrap.style.height = heroRect.height + "px";
    heroLogoWrap.style.transform = "none";
    heroLogoWrap.style.opacity = "1";

    // força o navegador a "commitar" essa posição (sem transição) antes de animar
    heroLogoWrap.getBoundingClientRect();

    requestAnimationFrame(() => {
      heroLogoWrap.classList.add("is-traveling");
      requestAnimationFrame(() => {
        heroLogoWrap.style.top = navRect.top + "px";
        heroLogoWrap.style.left = navRect.left + "px";
        heroLogoWrap.style.width = navRect.width + "px";
        heroLogoWrap.style.height = navRect.height + "px";
      });
    });

    heroLogoWrap.addEventListener(
      "transitionend",
      function onArrive(e) {
        if (e.propertyName !== "top") return;
        navLogo.classList.add("is-visible");
        heroLogoWrap.classList.add("is-arrived");
        heroLogoWrap.style.opacity = "0";
        heroLogoWrap.removeEventListener("transitionend", onArrive);
        setTimeout(() => {
          heroLogoWrap.style.display = "none";
        }, 350);
      }
    );
  }, 7000);
})();

/* ---------- Lightbox dos barbeiros ---------- */
(function () {
  const lightbox = document.getElementById("barberLightbox");
  if (!lightbox) return;

  const photo = document.getElementById("barberLightboxPhoto");
  const bookBtn = document.getElementById("barberLightboxBook");
  const instaLink = document.getElementById("barberLightboxInstagram");
  const instaText = document.getElementById("barberLightboxInstagramText");
  const closeBtn = document.getElementById("barberLightboxClose");
  const backdrop = lightbox.querySelector(".barber-lightbox__backdrop");

  function openLightbox(card) {
    const name = card.dataset.name;
    const src = card.dataset.photo;
    photo.src = src;
    photo.alt = name;
    bookBtn.textContent = "Agendar com " + name;
    bookBtn.href = card.dataset.booking || "#";
    instaText.textContent = "Seguir " + name;
    instaLink.href = card.dataset.instagram || "https://instagram.com/";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".barber-card[data-photo]").forEach((card) => {
    card.addEventListener("click", () => openLightbox(card));
  });

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);
})();

/* ---------- carrossel de cortes + lightbox ---------- */
(function () {
  const track = document.getElementById("carouselTrack");
  const lightbox = document.getElementById("carouselLightbox");
  if (!track || !lightbox) return;

  const photo = document.getElementById("carouselLightboxPhoto");
  const closeBtn = document.getElementById("carouselLightboxClose");

  function openLightbox(img) {
    photo.src = img.src;
    photo.alt = img.alt;
    track.classList.add("is-paused");
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    track.classList.remove("is-paused");
    document.body.style.overflow = "";
  }

  track.querySelectorAll(".carousel__img").forEach((img) => {
    img.addEventListener("click", () => openLightbox(img));
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
})();

/* ---------- Cenas da section4 (dispara só quando a seção entra por inteiro) ---------- */
(function () {
  const stage = document.getElementById("cenaStage");
  if (!stage) return;

  const cenas = Array.from(stage.querySelectorAll(".cena"));
  let timers = [];
  let played = false;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function resetCenas() {
    cenas.forEach((c) => c.classList.remove("is-active", "is-leaving"));
  }

  function showCena(index, holdMs, onDone) {
    cenas.forEach((c, i) => {
      c.classList.remove("is-leaving");
      if (i === index) c.classList.add("is-active");
      else c.classList.remove("is-active");
    });

    if (holdMs <= 0) return;

    timers.push(
      setTimeout(() => {
        cenas[index].classList.add("is-leaving");
        timers.push(
          setTimeout(() => {
            cenas[index].classList.remove("is-active", "is-leaving");
            if (onDone) onDone();
          }, 700)
        );
      }, holdMs)
    );
  }

  function playSequence() {
    clearTimers();
    resetCenas();
    showCena(0, 2800, () => {
      showCena(1, 3600, () => {
        showCena(2, 0);
      });
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.92 && !played) {
          played = true;
          playSequence();
          observer.unobserve(stage);
        }
      });
    },
    { threshold: [0.92, 1] }
  );

  observer.observe(stage);
})();

/* ---------- Overlay em tela cheia do Instagram (independente da sequência) ---------- */
(function () {
  const overlay = document.getElementById("instaOverlay");
  const openBtn = document.getElementById("instaTriggerBtn");
  const closeBtn = document.getElementById("instaOverlayClose");
  if (!overlay || !openBtn) return;

  function openOverlay() {
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openOverlay);
  closeBtn.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });
})();
