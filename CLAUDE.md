# ElementLab — 프로젝트 규칙 (CLAUDE.md)

118개 원소 전체를 다루는 **주기율표 학습 웹앱**. 세 가지 모드: 기본(분류 보기) · 퍼즐 · 플래시카드.
**이 문서의 규칙은 모든 작업에서 엄격히 따른다.** 규칙을 바꿔야 할 때는 먼저 이 파일을 수정한 뒤 코드를 바꾼다.

---

## 1. Tech Stack (고정)

| 영역 | 사용 기술 |
|---|---|
| 빌드/프레임워크 | Vite + React + TypeScript (strict) |
| 스타일 | Tailwind CSS (v4, `@tailwindcss/vite` 플러그인) |
| 아이콘 | `lucide-react` |
| 애니메이션 | `framer-motion` |
| 드래그 앤 드롭 | `@dnd-kit/core` |

- 위 목록 외의 UI/상태관리/스타일 라이브러리를 임의로 추가하지 않는다. (3D 기능을 없애면서 three 계열은 제거했다.)
- 아이콘은 반드시 `lucide-react`만 사용한다 (이모지·다른 아이콘 팩 금지).
- 애니메이션은 `framer-motion`으로, 드래그는 `@dnd-kit/core`로 통일한다.

## 2. State & Storage

- **백엔드 없음.** 영속 데이터는 브라우저 `localStorage`에 저장한다.
- 저장 키는 **`element_lab_save_v2` 하나**만 쓴다. 키 상수와 `localStorage` 호출은 `src/lib/storage.ts`에만 둔다.
- 앱 시작 시 이전 키 `element_lab_save_v1`이 있으면 마이그레이션(v1에서 틀린 적 있는 원소 → `reviewElements`)한 뒤 v1 키를 지운다.
- 저장 데이터 형태 (`src/types/save.ts`):

```ts
export interface SaveData {
  version: 2;
  reviewElements: number[];                 // 플래시카드 '오답 플래시'(나중에 다시 볼 원소) 원자 번호
  puzzleRange: { from: number; to: number }; // 마지막으로 고른 퍼즐 범위 (1~118)
}
```

- 읽기 시 JSON 파싱 실패/필드 누락에 대비해 기본값과 병합한다 (`normalizeSave`).
- 컴포넌트는 `useSaveData()` 훅(`SaveProvider` 컨텍스트)으로만 저장 데이터를 읽고 쓴다.
- 스키마가 바뀌면 키 버전을 올리고 마이그레이션 함수를 작성한다.

## 3. Element Data Schema (`src/types/chemistry.ts`)

```ts
export interface ChemicalElement {
  atomicNumber: number; symbol: string; nameKo: string; nameEn: string; atomicMass: number;
  period: number;            // 1~7
  group: number | null;      // 1~18, 란타넘족/악티늄족은 null
  isFBlock: boolean;         // 란타넘족/악티늄족 플래그
  gridRow: number;           // 표 렌더링 좌표 (1~7 본표, f-블록은 9~10)
  gridCol: number;           // 표 렌더링 좌표 (1~18)
  category: ElementCategory; // alkali-metal | alkaline-earth | transition-metal | post-transition | metalloid | reactive-nonmetal | halogen | noble-gas | lanthanide | actinide
  phaseAtSTP: Phase;         // solid | liquid | gas
  electronegativity: number | null; // 폴링 척도 (118개 전체, 값이 없는 원소는 null)
  oxidationStates: number[]; valenceElectrons: number; electronConfig: string;
  flameColor: string | null; trivia: string[];
}
```

- 원소 데이터는 `src/data/elements.ts`에 정적으로 둔다.
  - 118개 기본 정보(번호/기호/이름/원자량)는 `BASE` 표, 주기·족·좌표·카테고리·상태는 원자 번호로부터 계산한다.
  - 전기음성도는 `PAULING_EN` 표(118개)로 채운다. He·Ne·Ar과 104번 이후는 null.
  - 상세 데이터(산화수·전자 배치·불꽃색·trivia)는 `DETAILS`에 있는 원소만 있고, 원소 상세 창에서 있을 때만 보여 준다.
- **모든 모드는 118개 원소 전체를 쓴다.** 해금(잠금) 개념은 없다.
- 화학적 수치는 정확성을 우선한다. 불확실하면 `null` 처리 또는 주석으로 표시한다.

## 4. UI / UX

- **라이트 모드가 기본.** 밝은 배경(slate-50), 흰 카드, slate 계열 글자. 다크 모드는 만들지 않는다.
- **원소 칸 표기**: 원자 번호(작게) → 원소 기호 → 그 아래 **한글 이름**. 공통 컴포넌트 `ElementTile`을 쓴다.
- 카테고리 → 색상 매핑은 `src/theme/categoryColors.ts` 한 곳에서만 정의한다 (하드코딩 금지).
- 분류 보기 색(전형/전이, 금속/비금속/준금속, 전기음성도 단계)은 `src/theme/vizColors.ts` 한 곳에서만 정의한다.
  - 범주 색은 dataviz 기준 팔레트 1~3번 슬롯(파랑 `#2a78d6`, 주황 `#eb6834`, 청록 `#1baf7a`)을 고정 순서로 쓴다(검증 스크립트로 CVD 통과 확인).
  - 청록은 흰 배경 대비 3:1 미만이라, 범례에 **글자 라벨과 개수**를 항상 함께 표시한다(색만으로 구분 금지).
  - 전기음성도는 파랑 단일 색상 밝음→진함 단계, 값이 없으면 회색 + "—".
- 한국어 UI를 기본으로 하되 원소 기호/영문명은 병기한다.
- 반응형(모바일 ~ 데스크톱, 표는 가로 스크롤) 및 키보드 접근성을 고려한다.

## 5. 디렉토리 구조

```
src/
  types/        # chemistry.ts, save.ts
  data/         # elements.ts (원소 데이터)
  lib/          # storage.ts, classify.ts(전형/전이·금속/비금속·전기음성도 단계), puzzle.ts, random.ts, format.ts, phase.ts — 순수 함수
  theme/        # categoryColors.ts, vizColors.ts
  hooks/        # useSaveData, useGameSession, useToasts
  components/   # AppHeader, ElementTile, ElementDetailModal, Modal, ToastStack, PeriodicGrid 등 재사용 UI
  features/
    table/      # 기본 모드 (분류 보기)
    puzzle/     # 퍼즐 모드 (범위 설정 → 드래그/타이핑)
    flashcards/ # 플래시카드 모드 (물음표 칸 뒤집기, 오답 플래시)
```

## 5-1. 모드별 규칙

- **공통 표**: 모든 모드는 `PeriodicGrid`(18족×7주기 + f-블록 2줄, `gridRow/gridCol` 사용) 위에 칸 렌더링만 바꿔 구현한다.
- **기본 모드**: [전형/전이] [금속/비금속] [전기음성도] 버튼은 한 번에 하나만 켜진다(다시 누르면 끔). 분류 판정은 `src/lib/classify.ts`에만 둔다.
  - 전형 = 1·2·13~18족, 전이 = 3~12족 + 란타넘족·악티늄족.
  - 금속/비금속/준금속은 `category`로 판정(준금속 B·Si·Ge·As·Sb·Te).
  - 칸을 누르면 원소 상세 창을 연다.
- **퍼즐 모드**: 먼저 원자 번호 범위(from~to)와 방식(드래그/타이핑)을 고른 뒤 시작한다. 범위는 `puzzleRange`로 저장한다.
  - 드래그는 `DndContext` + `DragOverlay`. 정답 칸 위에서는 `dropAnimation={null}`(스냅), 그 외엔 덱으로 복귀. 스크린 리더 안내는 한국어.
  - 힌트·정답 판정·콤보 점수는 `src/lib/puzzle.ts`의 순수 함수에만 둔다. 점수/콤보/타이머는 `useGameSession`, 알림은 `useToasts` + `ToastStack`.
- **플래시카드 모드**: 모든 칸이 "?"이고 클릭(또는 Enter/Space)하면 뒤집혀 원소가 보인다.
  - **Alt+X**: 마지막으로 누르거나 포커스한 원소를 '오답 플래시'(`reviewElements`)에 넣고 빼기(토글). 키 판정은 `event.code === 'KeyX'`(한글 자판에서도 동작). 같은 기능의 버튼도 둔다(모바일).
  - [오답만 복습]을 켜면 오답 플래시 원소만 "?"로 남기고 나머지는 흐리게 한다.

## 5-2. 배포

- `main`에 push하면 `.github/workflows/deploy.yml`이 lint·build 후 GitHub Pages에 게시한다(`BASE_PATH=/<저장소 이름>/`). 로컬·Vercel은 `/`. 경로를 하드코딩하지 말고 Vite `base`를 따른다.

## 6. 코딩 규칙

- TypeScript `strict` 유지, `any` 사용 금지 (불가피하면 사유 주석).
- 함수형 컴포넌트 + 훅만 사용한다.
- 판정·계산 로직은 UI와 분리된 순수 함수로 `src/lib/`에 둔다.
- 컴포넌트 파일에서는 컴포넌트만 export한다(상수·함수는 별도 `.ts` 파일, fast refresh 규칙).
- 커밋 전 `npm run build`(타입체크 포함)와 `npm run lint`(oxlint)가 통과해야 한다.

## 7. 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드
npm run lint     # oxlint
npm run preview  # 빌드 결과 미리보기
```
