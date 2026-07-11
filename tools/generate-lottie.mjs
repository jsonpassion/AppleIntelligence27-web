/*
 * AppleIntelligence27 — 자체 제작 Lottie 생성 스크립트
 * 애니메이션 JSON을 프로그래밍 방식으로 생성합니다 (외부 에셋 없음, 저작권 100% 자체 보유).
 *   1. hero-abstraction.json : 다섯 개의 모델 칩이 하나의 세션 카드로 합쳐지는 모션 (모델 추상화 레이어)
 *   2. pcc-privacy.json      : 기기에서 클라우드로 요청 펄스가 오가고 자물쇠가 잠기는 모션 (Private Cloud Compute)
 *   3. profile-switch.json   : 세션 카드의 지시문·도구·모델 배지가 두 상태를 오가는 모션 (Dynamic Profiles)
 * 실행: node tools/generate-lottie.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "lottie");
mkdirSync(OUT, { recursive: true });

/* ─── 팔레트 (사이트 토큰과 동일 계열) ─── */
const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};
const C = {
  blue: hex("#0A84FF"), purple: hex("#BF5AF2"), green: hex("#34C759"),
  orange: hex("#FF9F0A"), teal: hex("#64D2FF"), pink: hex("#FF6482"),
  slate: hex("#8E8E93"), card: hex("#3A3A3F"), cardLight: hex("#55555C"),
  white: [1, 1, 1, 1],
};

/* ─── 로티 빌딩 블록 ─── */
const EASE_OUT = { o: { x: 0.25, y: 0 }, i: { x: 0.25, y: 1 } };
const EASE_BOTH = { o: { x: 0.45, y: 0 }, i: { x: 0.55, y: 1 } };

const arr = (v) => (Array.isArray(v) ? v : [v]);
const kf = (t, s, ease) => ({ t, s: arr(s), ...(ease ? { i: ease.i, o: ease.o } : {}) });
const an = (frames) => ({ a: 1, k: frames });
const st = (v) => ({ a: 0, k: v });

const rect = (w, h, r) => ({ ty: "rc", d: 1, s: st([w, h]), p: st([0, 0]), r: st(r) });
const ellipse = (d, dy = d) => ({ ty: "el", d: 1, s: st([d, dy]), p: st([0, 0]) });
const fill = (c, o = 100) => ({ ty: "fl", c: st(c), o: st(o), r: 1 });
const strokeShape = (c, w, o = 100) => ({ ty: "st", c: st(c), o: st(o), w: st(w), lc: 2, lj: 2, ml: 4 });
const path = (pts, closed = false) => ({
  ty: "sh",
  ks: st({ i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]), v: pts, c: closed }),
});
const group = (items, { x = 0, y = 0, r = 0, s = [100, 100], o = 100 } = {}, oAnim, sAnim) => ({
  ty: "gr",
  it: [
    ...items,
    { ty: "tr", p: st([x, y]), a: st([0, 0]), s: sAnim || st(s), r: st(r), o: oAnim || st(o), sk: st(0), sa: st(0) },
  ],
});
const layer = ({ nm, ind, shapes, p, s, r, o, a = [0, 0, 0], ip = 0, op, stt = 0 }) => ({
  ddd: 0, ind, ty: 4, nm, sr: 1,
  ks: { o: o ?? st(100), r: r ?? st(0), p: p ?? st([0, 0, 0]), a: st(a), s: s ?? st([100, 100, 100]) },
  ao: 0, shapes, ip, op, st: stt, bm: 0,
});
const doc = (nm, w, h, op, layers) => ({
  v: "5.7.4", fr: 60, ip: 0, op, w, h, nm, ddd: 0, assets: [], layers,
});

/* 팝인(스케일 오버슈트) */
const popIn = (t, dur = 14, peak = 112) =>
  an([kf(t, [0, 0, 100], EASE_OUT), kf(t + dur * 0.6, [peak, peak, 100], EASE_OUT), kf(t + dur, [100, 100, 100])]);
const fadeIn = (t, dur = 8) => an([kf(t, 0, EASE_OUT), kf(t + dur, 100)]);

/* ════════════════════════════════════════════════════════
 * 1. hero-abstraction — 모델 칩 5개 → LanguageModelSession 카드
 * 760 x 340, 380f (6.3s)
 * ════════════════════════════════════════════════════════ */
{
  const W = 760, H = 340, OP = 380;
  const CX = 380, CY = 175;

  // 칩: 온디바이스(blue) · PCC(teal) · Claude(orange) · Gemini(purple) · MLX(green)
  const chips = [
    { c: C.blue,   x: 120, y: 78,  r: -10, d: 0 },
    { c: C.teal,   x: 320, y: 46,  r: 6,   d: 5 },
    { c: C.orange, x: 560, y: 70,  r: 12,  d: 10 },
    { c: C.purple, x: 150, y: 268, r: 8,   d: 15 },
    { c: C.green,  x: 610, y: 250, r: -12, d: 20 },
  ];

  const chipLayers = chips.map((b, i) => {
    const t0 = b.d;            // 팝인
    const tc = 90 + b.d;       // 수렴 시작
    const tcEnd = tc + 48;     // 수렴 끝(카드 속으로)
    return layer({
      nm: `chip-${i + 1}`,
      ind: i + 1,
      ip: 0,
      op: tcEnd + 4,
      p: an([kf(tc, [b.x, b.y, 0], EASE_BOTH), kf(tcEnd, [CX, CY, 0])]),
      r: an([kf(tc, b.r, EASE_BOTH), kf(tcEnd, 0)]),
      s: an([
        kf(t0, [0, 0, 100], EASE_OUT), kf(t0 + 9, [112, 112, 100], EASE_OUT), kf(t0 + 15, [100, 100, 100], EASE_BOTH),
        kf(tc, [100, 100, 100], EASE_BOTH), kf(tcEnd, [42, 42, 100]),
      ]),
      o: an([kf(t0, 0, EASE_OUT), kf(t0 + 7, 100, EASE_BOTH), kf(tcEnd - 14, 100, EASE_BOTH), kf(tcEnd - 2, 0)]),
      shapes: [
        // 칩 다이(die) 위 흰 코어 + 핀 느낌의 바
        group([rect(26, 26, 7), fill(C.white, 90)]),
        group([rect(46, 5, 2.5), fill(C.white, 45)], { y: 24 }),
        group([rect(46, 5, 2.5), fill(C.white, 45)], { y: -24 }),
        group([rect(64, 64, 16), fill(b.c)]),
      ],
    });
  });

  const tCard = 150; // 카드 등장
  const cardLayer = layer({
    nm: "session-card",
    ind: 10,
    ip: tCard - 20,
    op: OP,
    p: st([CX, CY, 0]),
    s: an([
      kf(tCard - 20, [0, 0, 100], EASE_OUT), kf(tCard - 8, [107, 107, 100], EASE_OUT), kf(tCard, [100, 100, 100], EASE_BOTH),
      // 도킹 완료 후 잔잔한 펄스
      kf(tCard + 60, [100, 100, 100], EASE_BOTH), kf(tCard + 80, [103, 103, 100], EASE_BOTH), kf(tCard + 100, [100, 100, 100]),
    ]),
    o: an([kf(tCard - 20, 0, EASE_OUT), kf(tCard - 8, 100, EASE_BOTH), kf(OP - 26, 100, EASE_BOTH), kf(OP - 8, 0)]),
    shapes: [
      // 코드 라인 느낌의 흰 바
      group([rect(150, 9, 4.5), fill(C.white, 85)], { x: -40, y: -28 }),
      group([rect(210, 9, 4.5), fill(C.white, 45)], { x: -10, y: -4 }),
      group([rect(120, 9, 4.5), fill(C.white, 45)], { x: -55, y: 20 }),
      // 도킹된 모델을 뜻하는 컬러 도트 5개
      ...chips.map((b, i) =>
        group([ellipse(14), fill(b.c)], { x: -56 + i * 28, y: 48 }, fadeIn(tCard + 14 + i * 5, 8))
      ),
      group([rect(310, 150, 26), fill(C.card)]),
      group([rect(310, 150, 26), strokeShape(C.slate, 2, 40)]),
    ],
  });

  writeFileSync(join(OUT, "hero-abstraction.json"), JSON.stringify(doc("hero-abstraction", W, H, OP, [...chipLayers, cardLayer])));
  console.log("✓ hero-abstraction.json");
}

/* ════════════════════════════════════════════════════════
 * 2. pcc-privacy — 기기 ↔ 클라우드 펄스 + 자물쇠
 * 640 x 300, 300f (5s)
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 300;
  const DX = 130, DY = 150;   // 기기
  const KX = 490, KY = 138;   // 클라우드

  const device = layer({
    nm: "device",
    ind: 1,
    ip: 0, op: OP,
    p: st([DX, DY, 0]),
    s: popIn(0),
    shapes: [
      // 화면 안 콘텐츠 바 — 응답 도착 시 초록 바가 켜짐
      group([rect(56, 8, 4), fill(C.slate, 55)], { y: -34 }),
      group([rect(56, 8, 4), fill(C.slate, 35)], { y: -16 }),
      group([rect(56, 8, 4), fill(C.green)], { y: 2 }, fadeIn(232, 10)),
      group([rect(84, 148, 20), strokeShape(C.slate, 3, 70)]),
      group([rect(84, 148, 20), fill(C.card)]),
    ],
  });

  const cloud = layer({
    nm: "cloud",
    ind: 2,
    ip: 0, op: OP,
    p: st([KX, KY, 0]),
    s: an([
      kf(0, [0, 0, 100], EASE_OUT), kf(9, [110, 110, 100], EASE_OUT), kf(15, [100, 100, 100], EASE_BOTH),
      // 요청 도착 펄스
      kf(150, [100, 100, 100], EASE_BOTH), kf(162, [106, 106, 100], EASE_BOTH), kf(176, [100, 100, 100]),
    ]),
    shapes: [
      group([ellipse(74), fill(C.blue)], { x: -38, y: 8 }),
      group([ellipse(96), fill(C.blue)], { x: 8, y: -12 }),
      group([ellipse(64), fill(C.blue)], { x: 48, y: 12 }),
      group([rect(150, 44, 22), fill(C.blue)], { y: 24 }),
    ],
  });

  // 자물쇠 배지 — 요청 도착 시 팝
  const lock = layer({
    nm: "lock",
    ind: 3,
    ip: 140, op: OP,
    p: st([KX + 6, KY + 12, 0]),
    s: popIn(150, 16, 118),
    o: an([kf(150, 0, EASE_OUT), kf(158, 100, EASE_BOTH), kf(OP - 20, 100, EASE_BOTH), kf(OP - 6, 0)]),
    shapes: [
      // 고리(shackle)
      group([ellipse(26), strokeShape(C.white, 5, 95)], { y: -16 }),
      group([rect(34, 12, 6), fill(C.blue)], { y: -6 }),   // 고리 아래 가림
      // 몸통 + 열쇠구멍
      group([rect(40, 32, 9), fill(C.white, 95)], { y: 4 }),
      group([ellipse(9), fill(C.blue)], { y: 2 }),
      group([rect(4, 10, 2), fill(C.blue)], { y: 9 }),
    ],
  });

  // 프라이버시 링 — 클라우드 주변 펄스 링
  const ring = layer({
    nm: "ring",
    ind: 4,
    ip: 150, op: OP,
    p: st([KX, KY + 6, 0]),
    s: an([kf(154, [70, 70, 100], EASE_OUT), kf(210, [120, 120, 100])]),
    o: an([kf(154, 0, EASE_OUT), kf(168, 55, EASE_BOTH), kf(210, 0)]),
    shapes: [group([ellipse(210, 150), strokeShape(C.teal, 4, 80)])],
  });

  // 요청 펄스 3개 (기기→클라우드), 응답 펄스 1개 (초록, 반대로)
  const pulse = (ind, t0, from, to, color, dur = 46) =>
    layer({
      nm: `pulse-${ind}`,
      ind,
      ip: t0, op: t0 + dur + 8,
      p: an([
        kf(t0, [from[0], from[1], 0], EASE_BOTH),
        kf(t0 + dur / 2, [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 42, 0], EASE_BOTH),
        kf(t0 + dur, [to[0], to[1], 0]),
      ]),
      o: an([kf(t0, 0, EASE_OUT), kf(t0 + 6, 100, EASE_BOTH), kf(t0 + dur - 6, 100, EASE_BOTH), kf(t0 + dur, 0)]),
      shapes: [group([ellipse(13), fill(color)])],
    });

  const pulses = [
    pulse(5, 96,  [DX + 52, DY - 20], [KX - 70, KY + 6], C.teal),
    pulse(6, 112, [DX + 52, DY],      [KX - 70, KY + 16], C.teal),
    pulse(7, 128, [DX + 52, DY + 20], [KX - 70, KY + 26], C.teal),
    pulse(8, 190, [KX - 70, KY + 16], [DX + 52, DY], C.green, 40),
  ];

  writeFileSync(join(OUT, "pcc-privacy.json"), JSON.stringify(doc("pcc-privacy", W, H, OP, [device, cloud, lock, ring, ...pulses])));
  console.log("✓ pcc-privacy.json");
}

/* ════════════════════════════════════════════════════════
 * 3. profile-switch — 지시문·도구·모델 배지가 상태를 오가는 세션 카드
 * 640 x 300, 380f (6.3s) — A(분석·온디바이스) ↔ B(브레인스토밍·PCC)
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 380;
  const CX = 320, CY = 150;

  // 전환 타이밍: A 표시 20–150, 전환 150–180, B 표시 180–330, 복귀 330–360
  const swap = (showT, hideT, fromX, toX) => ({
    p: an([
      kf(showT - 14, [fromX, 0, 0], EASE_OUT), kf(showT, [0, 0, 0], EASE_BOTH),
      kf(hideT, [0, 0, 0], EASE_BOTH), kf(hideT + 14, [toX, 0, 0]),
    ]),
    o: an([
      kf(showT - 14, 0, EASE_OUT), kf(showT, 100, EASE_BOTH),
      kf(hideT, 100, EASE_BOTH), kf(hideT + 12, 0),
    ]),
  });

  const card = layer({
    nm: "card",
    ind: 1,
    ip: 0, op: OP,
    p: st([CX, CY, 0]),
    s: popIn(0, 16),
    shapes: [
      group([rect(360, 200, 28), fill(C.card)]),
      group([rect(360, 200, 28), strokeShape(C.slate, 2, 40)]),
    ],
  });

  // 상태 A — 파란 지시문 바 + 도구 칩 2개 + 기기 배지
  const aMove = swap(20, 150, -70, -70);
  const stateA = layer({
    nm: "state-a",
    ind: 2,
    ip: 0, op: 170,
    a: [0, 0, 0],
    p: an(aMove.p.k.map((f) => ({ ...f, s: [f.s[0] + CX, f.s[1] + CY - 10, 0] }))),
    o: aMove.o,
    shapes: [
      group([rect(200, 14, 7), fill(C.blue)], { x: -60, y: -62 }),
      group([rect(250, 9, 4.5), fill(C.white, 40)], { x: -35, y: -34 }),
      group([rect(160, 9, 4.5), fill(C.white, 28)], { x: -80, y: -12 }),
      // 도구 칩 2개
      group([rect(96, 30, 15), fill(C.teal, 90)], { x: -102, y: 26 }),
      group([rect(96, 30, 15), fill(C.green, 90)], { x: 6, y: 26 }),
      // 기기 배지 (칩 아이콘)
      group([rect(40, 40, 11), fill(C.blue)], { x: 130, y: 56 }),
      group([rect(17, 17, 5), fill(C.white, 90)], { x: 130, y: 56 }),
    ],
  });

  // 상태 B — 보라 지시문 바 + 넓은 도구 칩 + 클라우드 배지 + deep 추론 바
  const bMove = swap(180, 330, 70, 70);
  const stateB = layer({
    nm: "state-b",
    ind: 3,
    ip: 160, op: 350,
    p: an(bMove.p.k.map((f) => ({ ...f, s: [f.s[0] + CX, f.s[1] + CY - 10, 0] }))),
    o: bMove.o,
    shapes: [
      group([rect(200, 14, 7), fill(C.purple)], { x: -60, y: -62 }),
      group([rect(250, 9, 4.5), fill(C.white, 40)], { x: -35, y: -34 }),
      group([rect(160, 9, 4.5), fill(C.white, 28)], { x: -80, y: -12 }),
      // 넓은 도구 칩
      group([rect(200, 30, 15), fill(C.pink, 90)], { x: -50, y: 26 }),
      // 클라우드 배지
      group([ellipse(22), fill(C.purple)], { x: 118, y: 58 }),
      group([ellipse(30), fill(C.purple)], { x: 132, y: 52 }),
      group([ellipse(20), fill(C.purple)], { x: 146, y: 60 }),
      group([rect(46, 14, 7), fill(C.purple)], { x: 132, y: 64 }),
      // deep 추론 게이지 3칸
      group([rect(10, 6, 3), fill(C.white, 90)], { x: 120, y: 78 }),
      group([rect(10, 6, 3), fill(C.white, 90)], { x: 133, y: 78 }),
      group([rect(10, 6, 3), fill(C.white, 90)], { x: 146, y: 78 }),
    ],
  });

  writeFileSync(join(OUT, "profile-switch.json"), JSON.stringify(doc("profile-switch", W, H, OP, [card, stateA, stateB])));
  console.log("✓ profile-switch.json");
}

console.log("완료 — assets/lottie/");
