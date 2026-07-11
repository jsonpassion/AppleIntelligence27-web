/* ─── 테마 토글 ─── */
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");

const saved = localStorage.getItem("ai27-theme");
if (saved) root.dataset.theme = saved;

toggle.addEventListener("click", () => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = root.dataset.theme || (prefersDark ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("ai27-theme", next);
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
// bodymovin은 defer 로드 — 준비 시점에 맞춰 초기화
if (window.lottie) initLottie();
else window.addEventListener("load", initLottie);

/* ─── Reveal ─── */
const revealIO = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
  { threshold: 0.1 }
);
document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

/* ─── 목차 스크롤 스파이 ─── */
const navLinks = [...document.querySelectorAll(".nav-links a")];
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
  { rootMargin: "-30% 0px -60% 0px" }
);
targets.forEach((t) => spyIO.observe(t));
