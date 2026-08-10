# AppleIntelligence27-web

**3세대 Apple Foundation Models 기술 리포트** — WWDC26에서 발표된 iOS 27 / macOS 27 세대 Apple Intelligence 개발자 기술을 출처와 함께 정리한 비공식 기술 문서.

🔗 **Live**: https://jsonpassion.github.io/AppleIntelligence27-web/

## 구성

- 12개 챕터 — 모델 아키텍처(IFP·PT-MoE), LanguageModel 프로토콜, Private Cloud Compute, Vision 멀티모달, Dynamic Profiles, 컨텍스트 엔지니어링, Core AI, Evaluations, fm CLI/Python SDK, 시스템 통합, 개발자 체크리스트
- 본문 위첨자 각주 → 참고 자료 27건 (Apple ML Research · WWDC26 세션 17개 · Newsroom · 공식 GitHub · 커뮤니티 분석)
- 2026. 8. 10 베타 현황 반영 — Anthropic `ClaudeForFoundationModels` 출시, Gemini는 Firebase AI Logic 프리뷰, PCC entitlement 조건, 오픈소스 공개 현황
- 일러스트 애니메이션 6종은 전부 자체 제작 Lottie (`tools/generate-lottie.mjs`로 프로그래밍 생성, 외부 에셋 없음) — 모델 추상화 · IFP expert 스왑 · PCC 프라이버시 · Vision 첨부 · 프로필 전환 · 컨텍스트 압축

## 기술

- 순수 정적 사이트 (`index.html` + `style.css` + `script.js`) — 빌드 불필요
- 에디토리얼 UI (ai-literacy-guide 디자인 시스템 계승): 좌측 고정 목차 + 스크롤 스파이, 제목 Pretendard·본문 Source Serif 4/Noto Serif KR, 헤어라인 구분선, 코드박스 복사 버튼
- 라이트 기본 + 다크 토글, `prefers-reduced-motion` 대응 (Lottie 정지 프레임 폴백)
- 로컬 미리보기: `python3 -m http.server 8476` → http://localhost:8476
- Lottie 재생성: `node tools/generate-lottie.mjs`

짝을 이루는 샘플 앱: `AppleIntelligence27` (멀티플랫폼, Xcode 27 beta 필요)
