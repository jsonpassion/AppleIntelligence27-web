/* ─── 테마 토글 (기본은 라이트 — 레퍼런스 디자인과 동일) ─── */
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");

const saved = localStorage.getItem("ai27-theme");
if (saved === "dark") root.dataset.theme = "dark";

toggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  if (next === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  localStorage.setItem("ai27-theme", next);
});

/* ─── 코드 복사 ─── */
document.querySelectorAll(".codebox").forEach((box) => {
  const btn = box.querySelector(".copy-btn");
  const code = box.querySelector("pre code");
  if (!btn || !code) return;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      const prev = btn.textContent;
      btn.textContent = "복사됨";
      setTimeout(() => { btn.textContent = prev; }, 1400);
    } catch {
      btn.textContent = "실패";
    }
  });
});

/* ─── Lottie (자체 제작 에셋 · assets/lottie) — 모션 축소 설정 시 정지 프레임 ─── */
function initLottie() {
  const boxes = document.querySelectorAll("[data-lottie]");
  if (!boxes.length) return;
  if (!window.lottie) {
    boxes.forEach((el) => { el.textContent = el.getAttribute("aria-label"); });
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  boxes.forEach((el) => {
    const anim = window.lottie.loadAnimation({
      container: el,
      renderer: "svg",
      loop: el.dataset.loop !== "false",
      autoplay: !reduced,
      path: el.dataset.lottie,
    });
    if (reduced) {
      anim.addEventListener("DOMLoaded", () => anim.goToAndStop(Number(el.dataset.still || 0), true));
    }
  });
}
if (window.lottie) initLottie();
else window.addEventListener("load", initLottie);

/* ─── 리빌 ─── */
const revealIO = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
  { threshold: 0.08 }
);
document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

/* ─── 사이드바 목차 스크롤 스파이 ─── */
const navLinks = [...document.querySelectorAll(".sidebar-nav a")];
const targets = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const spyIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
    });
  },
  { rootMargin: "-20% 0px -70% 0px" }
);
targets.forEach((t) => spyIO.observe(t));
