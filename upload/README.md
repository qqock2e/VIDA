# VIDA POKER — Local Setup Guide

## 파일 구조 / File Structure

```
vida-poker/
├── index.html   ← HTML shell + CSS (UI only, no logic)
├── game.js      ← 게임 로직 (순수 JS, DOM 없음 / Pure game logic, zero DOM)
├── main.js      ← 프론트엔드 렌더링 + 이벤트 (UI rendering & events)
└── README.md    ← 이 파일
```

---

## VS Code에서 실행하기 / Running in VS Code

### 방법 1 — Live Server 확장 (추천 / Recommended)

1. VS Code 확장 마켓에서 **"Live Server"** (Ritwick Dey) 설치
2. `index.html` 파일을 열고
3. 우측 하단 **"Go Live"** 버튼 클릭
4. 브라우저가 자동으로 열립니다 (`http://127.0.0.1:5500`)

> **왜 Live Server가 필요한가?**  
> `game.js`와 `main.js`를 `<script src="...">` 태그로 불러올 때,  
> 브라우저가 `file://` 프로토콜에서 로컬 스크립트 로딩을 차단하는 경우가 있습니다.  
> Live Server는 `http://` 서버를 띄워 이 문제를 해결합니다.

### 방법 2 — Python 내장 서버

터미널에서 프로젝트 폴더로 이동 후:

```bash
# Python 3
python -m http.server 8080

# 브라우저에서 열기
open http://localhost:8080        # macOS
start http://localhost:8080       # Windows
```

### 방법 3 — Node.js + npx serve

```bash
npx serve .
```

---

## 구조 설명 / Architecture

### `game.js` — 백엔드 로직 (Backend Logic)

DOM을 전혀 사용하지 않는 순수 JS입니다.  
`window.VidaGame` 글로벌 객체로 노출됩니다.

```js
// 게임 초기화
const G = VidaGame.initGame({ difficulty: 'normal', lang: 'en' });

// 라운드 시작
VidaGame.dealRound(G);

// 필드 카드 공개
VidaGame.revealNext(G);  // G.roundCost가 올라감 (폴드 압박)

// 베팅
const result = VidaGame.placeBet(G);
// result: { type, handKey, mult, lifeGain, lifeCost, netGain, pointsEarned, ... }

// 폴드
const result = VidaGame.fold(G);

// 라운드 종료 후 다음으로
const shopPoints = VidaGame.advanceRound(G);

// 패시브 구매
VidaGame.buyPassive(G, 'betBoost');

// 아이템 사용 (targetIdx = 손패 인덱스)
VidaGame.useItem(G, 'rankUp', 0);

// 예상 수익 계산 (UI 미리보기용, 상태 변경 없음)
const preview = VidaGame.computeReturn(G);

// 게임 오버 여부
VidaGame.isGameOver(G); // boolean
```

### `main.js` — 프론트엔드 (Frontend)

모든 DOM 조작, 렌더링, 이벤트 핸들러가 여기 있습니다.  
`game.js`의 `VidaGame.*` 함수만 호출합니다. 자체 게임 로직은 없습니다.

### `index.html`

HTML 구조 + CSS만 포함합니다.  
맨 아래 `<script>` 태그 순서가 중요합니다: `game.js` → `main.js`

---

## 난이도 설계 / Difficulty Design

| 항목              | EASY  | NORMAL | HARD  | INSANE |
|------------------|-------|--------|-------|--------|
| 시작 라이프       | 20    | 20     | 20    | 20     |
| 기본 베팅 배율    | ×2.5  | ×2.0   | ×1.7  | ×1.5   |
| 기본 라운드 차감  | 0.30  | 0.50   | 0.70  | 1.00   |
| 공개 페널티/장    | +0.10 | +0.20  | +0.30 | +0.45  |
| 라운드당 증가     | 0.15  | 0.25   | 0.35  | 0.50   |
| 포인트 배율       | ×0.8  | ×1.0   | ×1.4  | ×2.0   |

**공개 페널티(revealPenalty)**:  
필드 카드를 1장 공개할 때마다 `roundCost`가 증가합니다.  
초기 2장은 무료이며, 3번째부터 페널티가 붙습니다.  
이것이 폴드에 의미를 부여합니다 — 더 많이 볼수록 더 비싸집니다.

---

## 게임 확장 가이드 / Extension Guide

### 새 아이템 추가 (`game.js`)

`ITEM_DEFS` 배열에 항목 추가:

```js
{
  id: 'myItem',
  nameI18n:  { en: 'My Item', ko: '나의 아이템' },
  descI18n:  { en: 'Does something cool', ko: '멋진 일을 함' },
  targetPool: 'hand',   // 'hand' | 'field_open' | null
  action: 'my_action',
},
```

그 다음 `useItem()` 함수 내 `switch` 문에 케이스 추가:

```js
case 'my_action': {
  // G.handCards[targetIdx] 등 조작
  detail = { ... };
  break;
}
```

### 새 패시브 추가 (`game.js`)

`PASSIVE_DEFS` 배열에 항목 추가:

```js
{
  id: 'myPassive', maxLv: 2,
  costs: [5, 10],
  nameI18n: { en: 'My Passive', ko: '나의 패시브' },
  descI18n: {
    en: ['Level 1 effect', 'Level 2 effect'],
    ko: ['1레벨 효과', '2레벨 효과'],
  },
  effect: (lv) => ({ myEffect: lv * 0.1 }),
},
```

그 다음 `computeReturn()` 또는 `computeRoundCost()`에서 `passive.myEffect`를 사용.

### 언어 추가 (`main.js`)

`UI_STRINGS` 객체에 새 언어 키 추가하고,  
`game.js`의 `HAND_NAMES_I18N`, `PASSIVE_DEFS.nameI18n/descI18n`, `ITEM_DEFS.nameI18n/descI18n`에도 추가.  
`index.html`의 lang 버튼도 추가:

```html
<button class="lang-btn" data-lang="ja" onclick="setLang('ja')">日本語</button>
```

---

## 라이선스 / License

개인 프로젝트용. 자유롭게 수정하세요.
