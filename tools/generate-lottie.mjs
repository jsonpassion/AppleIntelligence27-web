/*
 * AppleIntelligence27 — 자체 제작 Lottie 생성 스크립트
 * 애니메이션 JSON을 프로그래밍 방식으로 생성합니다 (외부 에셋 없음, 저작권 100% 자체 보유).
 *
 *   1. hero-abstraction.json   : 다섯 개의 모델 칩이 하나의 세션 카드로 합쳐지는 모션 (모델 추상화 레이어)
 *   2. ifp-experts.json        : 플래시 그리드에서 선택된 expert만 RAM 카드로 스왑되는 모션 (IFP, §2)
 *   3. pcc-privacy.json        : 기기에서 클라우드로 요청 펄스가 오가고 자물쇠가 잠기는 모션 (PCC, §4)
 *   4. vision-attach.json      : 사진이 프롬프트에 첨부되어 모델로 가고 답변이 나오는 모션 (Vision, §5)
 *   5. profile-switch.json     : 세션 카드의 지시문·도구·모델 배지가 두 상태를 오가는 모션 (Dynamic Profiles, §6)
 *   6. context-compaction.json : 오래된 대화 항목들이 요약 블록으로 압축되는 모션 (컨텍스트 관리, §7)
 *
 * ⚠ 레이어 순서 규칙: Lottie(=AE)는 layers 배열의 앞쪽이 화면 최상위다.
 *   오버레이(펄스·배지·움직이는 조각)를 앞에, 배경 카드를 마지막에 둘 것.
 *
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
  slate: hex("#8E8E93"), card: hex("#3A3A3F"), dim: hex("#2A2A2E"),
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
 * 760 x 340, 380f (6.3s) · 칩(위) → 카드(아래) 순서 유지
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
    const t0 = b.d;
    const tc = 90 + b.d;
    const tcEnd = tc + 48;
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
        group([rect(26, 26, 7), fill(C.white, 90)]),
        group([rect(46, 5, 2.5), fill(C.white, 45)], { y: 24 }),
        group([rect(46, 5, 2.5), fill(C.white, 45)], { y: -24 }),
        group([rect(64, 64, 16), fill(b.c)]),
      ],
    });
  });

  const tCard = 150;
  const cardLayer = layer({
    nm: "session-card",
    ind: 10,
    ip: tCard - 20,
    op: OP,
    p: st([CX, CY, 0]),
    s: an([
      kf(tCard - 20, [0, 0, 100], EASE_OUT), kf(tCard - 8, [107, 107, 100], EASE_OUT), kf(tCard, [100, 100, 100], EASE_BOTH),
      kf(tCard + 60, [100, 100, 100], EASE_BOTH), kf(tCard + 80, [103, 103, 100], EASE_BOTH), kf(tCard + 100, [100, 100, 100]),
    ]),
    o: an([kf(tCard - 20, 0, EASE_OUT), kf(tCard - 8, 100, EASE_BOTH), kf(OP - 26, 100, EASE_BOTH), kf(OP - 8, 0)]),
    shapes: [
      group([rect(150, 9, 4.5), fill(C.white, 85)], { x: -40, y: -28 }),
      group([rect(210, 9, 4.5), fill(C.white, 45)], { x: -10, y: -4 }),
      group([rect(120, 9, 4.5), fill(C.white, 45)], { x: -55, y: 20 }),
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
 * 2. ifp-experts — Instruction-Following Pruning (§2)
 * 640 x 300, 360f · NAND 그리드에서 expert 3개만 DRAM 카드로 스왑
 * 레이어: 프롬프트 도트 · 이동 expert(위) → 그리드·카드(아래)
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 360;
  // NAND 그리드: 3 x 4, 좌측
  const G0X = 90, G0Y = 76, GP = 50;
  const gpos = (c, rw) => [G0X + c * GP, G0Y + rw * GP];
  // DRAM 카드: 우측
  const KX = 470, KY = 150;
  // 슬롯(카드 내부, 카드 중심 기준 상대 → 절대 좌표)
  const slots = [[KX - 44, KY + 8], [KX + 2, KY + 8], [KX + 48, KY + 8]];
  // 선택되는 expert 3개 (그리드 셀 인덱스)
  const chosen = [
    { c: 1, rw: 0, col: C.teal },
    { c: 3, rw: 1, col: C.orange },
    { c: 0, rw: 2, col: C.pink },
  ];

  // 프롬프트 도트 — 위에서 그리드로 낙하
  const prompt = layer({
    nm: "prompt",
    ind: 1,
    ip: 30, op: 96,
    p: an([kf(36, [G0X + GP, -14, 0], EASE_BOTH), kf(64, [G0X + GP, G0Y + GP, 0])]),
    o: an([kf(36, 0, EASE_OUT), kf(44, 100, EASE_BOTH), kf(80, 100, EASE_BOTH), kf(92, 0)]),
    shapes: [group([ellipse(14), fill(C.blue)])],
  });

  // 이동하는 expert 3개 — 그리드 → 슬롯 → 그리드
  const movers = chosen.map((e, i) => {
    const [sx, sy] = gpos(e.c, e.rw);
    const [dx, dy] = slots[i];
    const tSel = 80 + i * 8;        // 하이라이트
    const tGo = 110 + i * 10;       // 출발
    const tArr = tGo + 40;          // 도착
    const tBack = 250 + i * 10;     // 복귀 출발
    const tHome = tBack + 36;
    return layer({
      nm: `expert-${i + 1}`,
      ind: 2 + i,
      ip: tSel - 10, op: tHome + 6,
      p: an([
        kf(tGo, [sx, sy, 0], EASE_BOTH), kf(tArr, [dx, dy, 0], EASE_BOTH),
        kf(tBack, [dx, dy, 0], EASE_BOTH), kf(tHome, [sx, sy, 0]),
      ]),
      s: an([
        kf(tSel, [100, 100, 100], EASE_OUT), kf(tSel + 8, [124, 124, 100], EASE_OUT), kf(tSel + 16, [110, 110, 100], EASE_BOTH),
        kf(tArr, [92, 92, 100], EASE_BOTH), kf(tBack, [92, 92, 100], EASE_BOTH), kf(tHome, [100, 100, 100]),
      ]),
      o: an([kf(tSel - 8, 0, EASE_OUT), kf(tSel, 100, EASE_BOTH), kf(tHome - 4, 100, EASE_BOTH), kf(tHome + 4, 0)]),
      shapes: [group([rect(34, 34, 9), fill(e.col)])],
    });
  });

  // NAND 그리드 (항상 어둡게 — 저장소)
  const gridCells = [];
  for (let rw = 0; rw < 3; rw++) {
    for (let c = 0; c < 4; c++) {
      const [x, y] = gpos(c, rw);
      gridCells.push(group([rect(34, 34, 9), fill(C.dim)], { x, y }));
      gridCells.push(group([rect(34, 34, 9), strokeShape(C.slate, 1.5, 30)], { x, y }));
    }
  }
  const grid = layer({
    nm: "nand-grid",
    ind: 6,
    ip: 0, op: OP,
    s: popIn(0),
    a: [G0X + 1.5 * GP, G0Y + GP, 0],
    p: st([G0X + 1.5 * GP, G0Y + GP, 0]),
    shapes: gridCells,
    o: an([kf(0, 0, EASE_OUT), kf(10, 100, EASE_BOTH), kf(OP - 20, 100, EASE_BOTH), kf(OP - 6, 0)]),
  });

  // DRAM 카드: shared expert(항상 활성, green) + 빈 슬롯 3개
  const card = layer({
    nm: "dram-card",
    ind: 7,
    ip: 0, op: OP,
    p: st([KX, KY, 0]),
    s: an([
      kf(6, [0, 0, 100], EASE_OUT), kf(15, [108, 108, 100], EASE_OUT), kf(22, [100, 100, 100], EASE_BOTH),
      kf(160, [100, 100, 100], EASE_BOTH), kf(172, [104, 104, 100], EASE_BOTH), kf(186, [100, 100, 100]), // 연산 펄스
    ]),
    o: an([kf(6, 0, EASE_OUT), kf(16, 100, EASE_BOTH), kf(OP - 20, 100, EASE_BOTH), kf(OP - 6, 0)]),
    shapes: [
      // shared expert — 항상 켜져 있는 넓은 블록
      group([rect(136, 30, 9), fill(C.green, 92)], { y: -34 }),
      group([rect(60, 6, 3), fill(C.white, 60)], { y: -34 }),
      // 빈 슬롯 3개 (점선 느낌의 옅은 외곽선)
      ...slots.map(([sx, sy]) => group([rect(38, 38, 10), strokeShape(C.slate, 2, 45)], { x: sx - KX, y: sy - KY })),
      group([rect(190, 130, 22), fill(C.card)]),
      group([rect(190, 130, 22), strokeShape(C.slate, 2, 40)]),
    ],
  });

  writeFileSync(join(OUT, "ifp-experts.json"), JSON.stringify(doc("ifp-experts", W, H, OP, [prompt, ...movers, grid, card])));
  console.log("✓ ifp-experts.json");
}

/* ════════════════════════════════════════════════════════
 * 3. pcc-privacy — 기기 ↔ 클라우드 펄스 + 자물쇠 (§4)
 * 640 x 300, 300f · 펄스·자물쇠·링(위) → 기기·클라우드(아래)
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 300;
  const DX = 130, DY = 150;
  const KX = 490, KY = 138;

  const device = layer({
    nm: "device",
    ind: 10,
    ip: 0, op: OP,
    p: st([DX, DY, 0]),
    s: popIn(0),
    shapes: [
      group([rect(56, 8, 4), fill(C.slate, 55)], { y: -34 }),
      group([rect(56, 8, 4), fill(C.slate, 35)], { y: -16 }),
      group([rect(56, 8, 4), fill(C.green)], { y: 2 }, fadeIn(232, 10)),
      group([rect(84, 148, 20), strokeShape(C.slate, 3, 70)]),
      group([rect(84, 148, 20), fill(C.card)]),
    ],
  });

  const cloud = layer({
    nm: "cloud",
    ind: 11,
    ip: 0, op: OP,
    p: st([KX, KY, 0]),
    s: an([
      kf(0, [0, 0, 100], EASE_OUT), kf(9, [110, 110, 100], EASE_OUT), kf(15, [100, 100, 100], EASE_BOTH),
      kf(150, [100, 100, 100], EASE_BOTH), kf(162, [106, 106, 100], EASE_BOTH), kf(176, [100, 100, 100]),
    ]),
    shapes: [
      group([ellipse(74), fill(C.blue)], { x: -38, y: 8 }),
      group([ellipse(96), fill(C.blue)], { x: 8, y: -12 }),
      group([ellipse(64), fill(C.blue)], { x: 48, y: 12 }),
      group([rect(150, 44, 22), fill(C.blue)], { y: 24 }),
    ],
  });

  const lock = layer({
    nm: "lock",
    ind: 1,
    ip: 140, op: OP,
    p: st([KX + 6, KY + 12, 0]),
    s: popIn(150, 16, 118),
    o: an([kf(150, 0, EASE_OUT), kf(158, 100, EASE_BOTH), kf(OP - 20, 100, EASE_BOTH), kf(OP - 6, 0)]),
    shapes: [
      group([ellipse(26), strokeShape(C.white, 5, 95)], { y: -16 }),
      group([rect(34, 12, 6), fill(C.blue)], { y: -6 }),
      group([rect(40, 32, 9), fill(C.white, 95)], { y: 4 }),
      group([ellipse(9), fill(C.blue)], { y: 2 }),
      group([rect(4, 10, 2), fill(C.blue)], { y: 9 }),
    ],
  });

  const ring = layer({
    nm: "ring",
    ind: 2,
    ip: 150, op: OP,
    p: st([KX, KY + 6, 0]),
    s: an([kf(154, [70, 70, 100], EASE_OUT), kf(210, [120, 120, 100])]),
    o: an([kf(154, 0, EASE_OUT), kf(168, 55, EASE_BOTH), kf(210, 0)]),
    shapes: [group([ellipse(210, 150), strokeShape(C.teal, 4, 80)])],
  });

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
    pulse(3, 96,  [DX + 52, DY - 20], [KX - 70, KY + 6], C.teal),
    pulse(4, 112, [DX + 52, DY],      [KX - 70, KY + 16], C.teal),
    pulse(5, 128, [DX + 52, DY + 20], [KX - 70, KY + 26], C.teal),
    pulse(6, 190, [KX - 70, KY + 16], [DX + 52, DY], C.green, 40),
  ];

  // 펄스·자물쇠·링이 위, 기기·클라우드가 아래
  writeFileSync(join(OUT, "pcc-privacy.json"), JSON.stringify(doc("pcc-privacy", W, H, OP, [lock, ring, ...pulses, device, cloud])));
  console.log("✓ pcc-privacy.json");
}

/* ════════════════════════════════════════════════════════
 * 4. vision-attach — 사진 첨부 → 모델 → 답변 (§5)
 * 640 x 300, 360f
 * 레이어: 사진 썸네일(위) → 프롬프트 바 → 답변 버블 → 모델 칩(아래)
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 360;
  const PX = 150, PY = 185;   // 프롬프트 바
  const TX = 140, TY = 92;    // 썸네일 시작 위치
  const MX = 360, MY = 150;   // 모델 칩
  const AX = 520, AY = 116;   // 답변 버블

  // 사진 썸네일: 산 + 해 아이콘, 프롬프트 바 오른쪽 끝으로 첨부됨
  const thumb = layer({
    nm: "photo-thumb",
    ind: 1,
    ip: 14, op: 210,
    p: an([kf(70, [TX, TY, 0], EASE_BOTH), kf(100, [PX + 74, PY, 0])]),
    s: an([
      kf(14, [0, 0, 100], EASE_OUT), kf(23, [112, 112, 100], EASE_OUT), kf(30, [100, 100, 100], EASE_BOTH),
      kf(70, [100, 100, 100], EASE_BOTH), kf(100, [52, 52, 100]),
    ]),
    o: an([kf(14, 0, EASE_OUT), kf(22, 100, EASE_BOTH), kf(196, 100, EASE_BOTH), kf(208, 0)]),
    shapes: [
      group([ellipse(14), fill(C.orange)], { x: 14, y: -12 }),                      // 해
      group([path([[-26, 16], [-6, -10], [8, 6], [18, -4], [30, 16]]), strokeShape(C.white, 5, 90)], { y: 2 }), // 산 능선
      group([rect(72, 56, 12), fill(C.teal)]),
      group([rect(72, 56, 12), strokeShape(C.white, 2.5, 50)]),
    ],
  });

  // 프롬프트 바 — 썸네일이 붙으면 살짝 넓어짐
  const promptBar = layer({
    nm: "prompt-bar",
    ind: 2,
    ip: 0, op: 216,
    p: an([kf(120, [PX, PY, 0], EASE_BOTH), kf(160, [MX - 90, MY + 40, 0], EASE_BOTH), kf(190, [MX, MY, 0])]),
    s: an([
      kf(0, [0, 0, 100], EASE_OUT), kf(10, [107, 107, 100], EASE_OUT), kf(16, [100, 100, 100], EASE_BOTH),
      kf(160, [100, 100, 100], EASE_BOTH), kf(190, [30, 30, 100]),
    ]),
    o: an([kf(0, 0, EASE_OUT), kf(10, 100, EASE_BOTH), kf(178, 100, EASE_BOTH), kf(190, 0)]),
    shapes: [
      group([rect(120, 8, 4), fill(C.white, 80)], { x: -28 }),
      group([rect(200, 44, 22), fill(C.card)]),
      group([rect(200, 44, 22), strokeShape(C.slate, 2, 45)]),
    ],
  });

  // 모델 칩 — 프롬프트 도착 시 펄스
  const chip = layer({
    nm: "model-chip",
    ind: 4,
    ip: 0, op: OP,
    p: st([MX, MY, 0]),
    s: an([
      kf(0, [0, 0, 100], EASE_OUT), kf(11, [110, 110, 100], EASE_OUT), kf(18, [100, 100, 100], EASE_BOTH),
      kf(190, [100, 100, 100], EASE_BOTH), kf(202, [112, 112, 100], EASE_BOTH), kf(216, [100, 100, 100]),
    ]),
    o: an([kf(0, 0, EASE_OUT), kf(10, 100, EASE_BOTH), kf(OP - 20, 100, EASE_BOTH), kf(OP - 6, 0)]),
    shapes: [
      group([rect(26, 26, 7), fill(C.white, 90)]),
      group([rect(46, 5, 2.5), fill(C.white, 45)], { y: 24 }),
      group([rect(46, 5, 2.5), fill(C.white, 45)], { y: -24 }),
      group([rect(64, 64, 16), fill(C.blue)]),
    ],
  });

  // 답변 버블 — 텍스트 바 3개가 타자 치듯 나타남
  const answer = layer({
    nm: "answer",
    ind: 3,
    ip: 216, op: OP,
    p: st([AX, AY, 0]),
    s: popIn(222, 14),
    o: an([kf(222, 0, EASE_OUT), kf(230, 100, EASE_BOTH), kf(OP - 20, 100, EASE_BOTH), kf(OP - 6, 0)]),
    shapes: [
      group([rect(120, 8, 4), fill(C.white, 85)], { x: -8, y: -22 }, fadeIn(238, 8)),
      group([rect(150, 8, 4), fill(C.white, 50)], { x: 7, y: 0 }, fadeIn(250, 8)),
      group([rect(96, 8, 4), fill(C.white, 50)], { x: -20, y: 22 }, fadeIn(262, 8)),
      group([rect(190, 84, 20), fill(C.green, 26)]),
      group([rect(190, 84, 20), strokeShape(C.green, 2.5, 70)]),
    ],
  });

  writeFileSync(join(OUT, "vision-attach.json"), JSON.stringify(doc("vision-attach", W, H, OP, [thumb, promptBar, answer, chip])));
  console.log("✓ vision-attach.json");
}

/* ════════════════════════════════════════════════════════
 * 5. profile-switch — 지시문·도구·모델 배지 상태 전환 (§6)
 * 640 x 300, 380f · 상태 콘텐츠(위) → 카드(아래)  ← 위계 버그 수정
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 380;
  const CX = 320, CY = 150;

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
    ind: 10,
    ip: 0, op: OP,
    p: st([CX, CY, 0]),
    s: popIn(0, 16),
    shapes: [
      group([rect(360, 200, 28), fill(C.card)]),
      group([rect(360, 200, 28), strokeShape(C.slate, 2, 40)]),
    ],
  });

  const aMove = swap(20, 150, -70, -70);
  const stateA = layer({
    nm: "state-a",
    ind: 1,
    ip: 0, op: 170,
    p: an(aMove.p.k.map((f) => ({ ...f, s: [f.s[0] + CX, f.s[1] + CY - 10, 0] }))),
    o: aMove.o,
    shapes: [
      group([rect(200, 14, 7), fill(C.blue)], { x: -60, y: -62 }),
      group([rect(250, 9, 4.5), fill(C.white, 40)], { x: -35, y: -34 }),
      group([rect(160, 9, 4.5), fill(C.white, 28)], { x: -80, y: -12 }),
      group([rect(96, 30, 15), fill(C.teal, 90)], { x: -102, y: 26 }),
      group([rect(96, 30, 15), fill(C.green, 90)], { x: 6, y: 26 }),
      group([rect(40, 40, 11), fill(C.blue)], { x: 130, y: 56 }),
      group([rect(17, 17, 5), fill(C.white, 90)], { x: 130, y: 56 }),
    ],
  });

  const bMove = swap(180, 330, 70, 70);
  const stateB = layer({
    nm: "state-b",
    ind: 2,
    ip: 160, op: 350,
    p: an(bMove.p.k.map((f) => ({ ...f, s: [f.s[0] + CX, f.s[1] + CY - 10, 0] }))),
    o: bMove.o,
    shapes: [
      group([rect(200, 14, 7), fill(C.purple)], { x: -60, y: -62 }),
      group([rect(250, 9, 4.5), fill(C.white, 40)], { x: -35, y: -34 }),
      group([rect(160, 9, 4.5), fill(C.white, 28)], { x: -80, y: -12 }),
      group([rect(200, 30, 15), fill(C.pink, 90)], { x: -50, y: 26 }),
      group([ellipse(22), fill(C.purple)], { x: 118, y: 58 }),
      group([ellipse(30), fill(C.purple)], { x: 132, y: 52 }),
      group([ellipse(20), fill(C.purple)], { x: 146, y: 60 }),
      group([rect(46, 14, 7), fill(C.purple)], { x: 132, y: 64 }),
      group([rect(10, 6, 3), fill(C.white, 90)], { x: 120, y: 78 }),
      group([rect(10, 6, 3), fill(C.white, 90)], { x: 133, y: 78 }),
      group([rect(10, 6, 3), fill(C.white, 90)], { x: 146, y: 78 }),
    ],
  });

  // ⚠ 상태 레이어를 앞에(위), 카드를 마지막에(아래)
  writeFileSync(join(OUT, "profile-switch.json"), JSON.stringify(doc("profile-switch", W, H, OP, [stateA, stateB, card])));
  console.log("✓ profile-switch.json");
}

/* ════════════════════════════════════════════════════════
 * 6. context-compaction — 오래된 이력 → 요약 블록 압축 (§7)
 * 640 x 300, 380f
 * 레이어: 이동/압축되는 바(위) → 요약 블록 → 고정 프레임(아래)
 * ════════════════════════════════════════════════════════ */
{
  const W = 640, H = 300, OP = 380;
  const CX = 320;
  const rowY = (i) => 52 + i * 34;         // 트랜스크립트 행 y
  const SUMY = rowY(0);                    // 요약 블록 위치

  // 대화 바 7개: 사용자(오른쪽, blue) / 모델(왼쪽, slate) 교대
  const bars = Array.from({ length: 7 }, (_, i) => ({
    user: i % 2 === 0,
    w: 150 + ((i * 53) % 90),
    y: rowY(i),
  }));

  // 오래된 4개 → 요약으로 흡수, 최근 3개 → 위로 슬라이드
  const tPop = (i) => 10 + i * 8;          // 등장
  const T_SQ = 120;                        // 압축 시작
  const T_SQE = 160;                       // 압축 끝
  const T_SL = 175, T_SLE = 205;           // 최근 바 슬라이드
  const T_NEW = 230;                       // 새 바 등장

  const barLayers = bars.map((b, i) => {
    const x = b.user ? CX + 90 : CX - 90;
    const color = b.user ? C.blue : C.slate;
    const old = i < 4;
    const pFrames = old
      ? [kf(T_SQ + i * 4, [x, b.y, 0], EASE_BOTH), kf(T_SQE + i * 4, [CX, SUMY, 0])]
      : [kf(T_SL, [x, b.y, 0], EASE_BOTH), kf(T_SLE, [x, b.y - 3 * 34, 0])];
    const oFrames = old
      ? [kf(tPop(i), 0, EASE_OUT), kf(tPop(i) + 8, 100, EASE_BOTH), kf(T_SQ + i * 4 + 20, 100, EASE_BOTH), kf(T_SQE + i * 4 - 6, 0)]
      : [kf(tPop(i), 0, EASE_OUT), kf(tPop(i) + 8, 100, EASE_BOTH), kf(OP - 24, 100, EASE_BOTH), kf(OP - 8, 0)];
    return layer({
      nm: `bar-${i + 1}`,
      ind: 1 + i,
      ip: 0, op: old ? T_SQE + i * 4 + 2 : OP,
      p: an(pFrames),
      s: old
        ? an([kf(T_SQ + i * 4, [100, 100, 100], EASE_BOTH), kf(T_SQE + i * 4, [40, 30, 100])])
        : st([100, 100, 100]),
      o: an(oFrames),
      shapes: [
        group([rect(b.w * 0.62, 7, 3.5), fill(C.white, 55)]),
        group([rect(b.w, 24, 12), fill(color, b.user ? 90 : 55)]),
      ],
    });
  });

  // 새로 追加되는 바 2개 (하단)
  const newBars = [0, 1].map((i) => {
    const user = i === 0;
    const x = user ? CX + 90 : CX - 90;
    const t0 = T_NEW + i * 34;
    return layer({
      nm: `new-bar-${i + 1}`,
      ind: 8 + i,
      ip: t0 - 6, op: OP,
      p: st([x, rowY(4 + i), 0]),
      s: popIn(t0, 12),
      o: an([kf(t0, 0, EASE_OUT), kf(t0 + 8, 100, EASE_BOTH), kf(OP - 24, 100, EASE_BOTH), kf(OP - 8, 0)]),
      shapes: [
        group([rect(110, 7, 3.5), fill(C.white, 55)]),
        group([rect(170, 24, 12), fill(user ? C.blue : C.slate, user ? 90 : 55)]),
      ],
    });
  });

  // 요약 블록 — 압축 완료 시 등장, 살짝 펄스
  const summary = layer({
    nm: "summary",
    ind: 12,
    ip: T_SQ + 20, op: OP,
    p: st([CX, SUMY, 0]),
    s: an([
      kf(T_SQ + 24, [0, 0, 100], EASE_OUT), kf(T_SQ + 36, [110, 110, 100], EASE_OUT), kf(T_SQ + 46, [100, 100, 100], EASE_BOTH),
      kf(T_SQE + 20, [100, 100, 100], EASE_BOTH), kf(T_SQE + 32, [104, 104, 100], EASE_BOTH), kf(T_SQE + 44, [100, 100, 100]),
    ]),
    o: an([kf(T_SQ + 24, 0, EASE_OUT), kf(T_SQ + 36, 100, EASE_BOTH), kf(OP - 24, 100, EASE_BOTH), kf(OP - 8, 0)]),
    shapes: [
      group([rect(48, 7, 3.5), fill(C.white, 85)], { x: -84 }),
      group([rect(150, 7, 3.5), fill(C.white, 50)], { x: 32 }),
      group([rect(280, 28, 14), fill(C.purple, 88)]),
    ],
  });

  writeFileSync(join(OUT, "context-compaction.json"), JSON.stringify(doc("context-compaction", W, H, OP, [...barLayers, ...newBars, summary])));
  console.log("✓ context-compaction.json");
}

console.log("완료 — assets/lottie/ (6종)");
