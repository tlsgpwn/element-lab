# ElementLab — 프로젝트 규칙 (CLAUDE.md)

화학 원소 주기율표 학습 + 가상 화학 결합 / VSEPR 분자 구조 시뮬레이션 웹앱.
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
| 3D 분자 렌더링 | `three` + `@react-three/fiber` + `@react-three/drei` |

- 위 목록 외의 UI/상태관리/스타일 라이브러리(Redux, styled-components, MUI 등)를 임의로 추가하지 않는다.
- 아이콘은 반드시 `lucide-react`만 사용한다 (이모지·다른 아이콘 팩 금지).
- 애니메이션은 `framer-motion`으로, 드래그는 `@dnd-kit/core`로 통일한다.
- 3D는 `@react-three/fiber`의 `<Canvas>` 안에서 선언형으로 작성하고, 카메라 조작 등은 `drei` 헬퍼(`OrbitControls` 등)를 우선 사용한다.

## 2. State & Storage

- **백엔드 없음.** 모든 영속 데이터는 브라우저 `localStorage`에 저장한다.
- 저장 키는 **반드시 `element_lab_save_v1` 하나**로 통일한다. 다른 키를 만들지 않는다.
- 키 문자열은 상수로 한 곳(`src/lib/storage.ts`)에만 정의하고, 직접 `localStorage`를 호출하는 코드도 이 모듈로 한정한다.
- 저장 데이터 형태 (`src/types/save.ts`):

```ts
export interface ElementProgress {
  weight: number;               // 암기 가중치 (높을수록 더 자주 출제, 기본 1, 0.3~12)
  wrongCount: number;           // 틀린 횟수
  reviewCount: number;          // 복습(퀴즈 응답) 횟수
  lastReviewedAt: number | null; // 마지막 복습 시각 (epoch ms)
}

export interface SaveData {
  version: 1;
  unlockedElements: number[];                       // 해금된 원소 번호(atomicNumber) 배열
  dailyGoal: number;                                // 일일 학습 목표량
  elementProgress: Record<number, ElementProgress>; // atomicNumber → 암기 가중치/틀린 횟수
  discoveredMolecules: string[];                    // 발견한 분자 도감 ID 목록
  dailyLog: { date: string; learned: number[] };    // 오늘(YYYY-MM-DD) 학습한 원소, 날짜가 바뀌면 초기화
}
```

- 읽기 시 JSON 파싱 실패/필드 누락에 대비해 기본값과 병합한다 (앱이 깨지지 않아야 함, `normalizeSave`).
- 컴포넌트는 `useSaveData()` 훅(`SaveProvider` 컨텍스트)으로만 저장 데이터를 읽고 쓴다.
- 간격 반복 가중치 규칙은 `src/lib/spacedRepetition.ts`의 `applyReview`에만 둔다.
- 스키마가 바뀌면 키를 `_v2`로 올리고 마이그레이션 함수를 작성한다.

## 3. Element Data Schema (`src/types/chemistry.ts`)

```ts
export type ElementCategory =
  | 'alkali-metal' | 'alkaline-earth' | 'transition-metal' | 'post-transition'
  | 'metalloid' | 'reactive-nonmetal' | 'halogen' | 'noble-gas'
  | 'lanthanide' | 'actinide';

export type Phase = 'solid' | 'liquid' | 'gas';

export interface ChemicalElement {
  atomicNumber: number;
  symbol: string;
  nameKo: string;
  nameEn: string;
  atomicMass: number;
  period: number;            // 1~7
  group: number | null;      // 1~18, 란타넘족/악티늄족은 null
  isFBlock: boolean;         // 란타넘족/악티늄족 플래그
  gridRow: number;           // 표 렌더링 좌표 (1~7 본표, f-블록은 9~10)
  gridCol: number;           // 표 렌더링 좌표 (1~18)
  category: ElementCategory;
  phaseAtSTP: Phase;
  electronegativity: number | null; // 폴링 척도
  oxidationStates: number[];        // 주요 산화수. 예: O → [-2], N → [-3, 3, 5]
  valenceElectrons: number;         // 원자가 전자 수
  electronConfig: string;           // 예: "1s² 2s² 2p⁴" (위첨자 유니코드 사용)
  flameColor: string | null;        // 불꽃 반응 색상 HEX 또는 이름
  trivia: string[];                 // 과학사/일상 스토리 2~3개 (한국어)
}
```

- 원소 데이터는 `src/data/elements.ts`에 `ChemicalElement[]`로 정적으로 둔다.
  - 118개 전체의 기본 정보(번호/기호/이름/원자량)는 `BASE` 표, 주기·족·좌표·카테고리·상태는 원자 번호로부터 계산한다.
  - 상세 화학 데이터(전기음성도·산화수·전자 배치·불꽃색·trivia)는 `DETAILS`에 입력한다. 미입력 원소는 `trivia: []`이며 `isDetailed()`로 구분한다.
  - 학습/퀴즈 대상은 `LEARNABLE_ELEMENTS`(상세 데이터가 있는 원소)이다. 원소를 추가할 때는 `DETAILS`에 항목만 추가하면 된다.
  - 원자가 전자 수: 주족 원소는 최외각 s+p 전자, 전이 금속은 ns+(n−1)d 전자 수(=족 번호), 비활성 기체는 8(He는 2).
- 란타넘족/악티늄족은 `group: null`, `isFBlock: true`로 표시하고 표 하단 별도 행(`gridRow` 9, 10)에 배치한다.
- `trivia`는 원소당 2~3개, 사실에 기반한 한국어 문장으로 작성한다.
- 화학적 수치(원자량, 전기음성도, 산화수, 전자 배치)는 정확성을 우선한다. 불확실하면 `null` 처리 또는 주석으로 표시한다.

## 4. UI / UX

- **다크 모드가 기본.** 세련된 "과학 실험실" 테마 (짙은 남색/슬레이트 배경, 네온/글래스 느낌의 포인트).
- 각 원소 카드는 **category별 고유 테마 색상**(테두리 + 배경 그라데이션)을 가진다.
  - 카테고리 → 색상 매핑은 `src/theme/categoryColors.ts` 한 곳에서만 정의하고 모든 컴포넌트가 이를 참조한다 (하드코딩 금지).
- 한국어 UI를 기본으로 하되 원소 기호/영문명은 병기한다.
- 반응형(모바일 ~ 데스크톱) 및 키보드 접근성을 고려한다.

## 5. 디렉토리 구조 (기준)

```
src/
  types/        # chemistry.ts, save.ts 등 타입 정의
  data/         # elements.ts, molecules.ts 등 정적 데이터
  lib/          # storage.ts, 간격 반복·퀴즈·퍼즐 등 순수 함수
  utils/        # chemistryEngine.ts(결합 엔진), molecule.ts(루이스 분석), vseprCalculator.ts(3D 좌표), vseprTable.ts, formula.ts — 순수 함수
  theme/        # categoryColors.ts 등 테마 토큰
  hooks/        # 커스텀 훅 (useSaveData 등)
  components/   # 재사용 UI 컴포넌트
  features/     # 기능 단위 화면 (periodic-table, quiz, bond-lab, molecule-viewer ...)
```

## 5-1. 기능별 메모

- **주기율표 퍼즐** (`src/features/puzzle/`): 모든 모드는 공통 `PeriodicGrid`(18족×7주기 + f-블록 2줄, `gridRow/gridCol` 사용) 위에 칸 렌더링만 바꿔 구현한다.
  - 드래그는 `@dnd-kit/core`의 `DndContext` + `DragOverlay`. 정답 칸 위에서는 `dropAnimation={null}`(칸에 스냅), 그 외엔 기본 드롭 애니메이션으로 덱에 복귀한다. 스크린 리더 안내는 한국어로 제공한다.
  - 힌트·정답 판정·콤보 점수는 `src/lib/puzzle.ts`의 순수 함수(`progressiveHint`, `directionHint`, `typingHint`, `isCorrectAnswer`, `scoreFor`)에만 둔다.
  - 점수/콤보/타이머는 `useGameSession`, 알림은 `useToasts` + `ToastStack`을 재사용한다.

- **가상 실험실** (`src/features/lab/`) + **화학 엔진** (`src/utils/`):
  - 반응 판별은 반드시 `analyzeReaction(contents, conditions)` 하나로 한다. Step 1 `src/data/knownReactions.ts` 사전 매칭(조건 충족 시 최우선) → Step 2 알고리즘(비활성 기체 예외 → Δχ 결합 판별 → 산화수 LCM 화학식 → `STABLE_COMPOUNDS`로 안정성 평가).
  - 결합 판별 기준: 금속+비금속 또는 Δχ ≥ 1.7 → 이온 / 비금속끼리 Δχ < 1.7 → 공유(Δχ < 0.4 무극성) / 금속+금속 → 합금. 준금속은 비금속 쪽으로 취급한다.
  - 챔버 화학종 키: 원소 기호(이원자 원소 H·N·O·F·Cl·Br·I는 X₂ 분자 1개 단위) 또는 `src/data/reagents.ts`의 시약 화학식. 한 번에 최대 3종.
  - 반응 사전 `deltaH`는 표준 생성 엔탈피로 계산한 실제 값(kJ, 쓰인 계수 기준). 알고리즘 결과의 ΔH는 폴링 근사 추정치이며 UI에 "추정"으로 표시한다.
  - 공유 결합 분자 생성물은 화학식 문자열(예: `"H2O"`)을 ID로 `discoveredMolecules`에 등록한다(공유 결정 SiO₂ 등은 제외). [3D 분자 도감]은 이 ID를 `analyzeMolecule()`로 해석한다.
- **3D 분자 도감** (`src/features/molecules/`):
  - VSEPR 기하 구조표는 `src/utils/vseprTable.ts` 한 곳에만 둔다(루이스 분석과 3D 계산이 공유).
  - `computeVsepr(formula)`가 B(결합 전자쌍)·E(비공유 전자쌍)·SN과 원자/결합/비공유 전자쌍 3D 좌표, 쌍극자를 계산한다. 지원: ABₙEₘ(SN 2~6), 이원자 분자, 산소산(HₐXOᵦ). SN 7 이상·다중 중심 분자는 null.
  - 비공유 전자쌍이 있는 분자는 표의 대표 결합각 대신 실측값(`EXPERIMENTAL_ANGLE`)이 있으면 그것으로 좌표를 만든다.
  - 원자 색은 `cpk.ts`의 CPK(Jmol) 표준, 구 크기는 공유 결합 반지름에 비례. Three.js 코드는 `@react-three/fiber` 선언형으로만 작성한다.
  - 도감 화면은 `React.lazy`로 지연 로딩한다. three 계열을 수동 청크로 쪼개면 첫 화면에서 preload되므로 쪼개지 않는다(`chunkSizeWarningLimit` 1100).
- **아이콘/이모지**: 기획서의 🔥⚡✨ 같은 이모지는 UI에 쓰지 않고 lucide 아이콘(`Flame`, `Zap`, `Sparkles`)으로 대체한다.

## 6. 코딩 규칙

- TypeScript `strict` 유지, `any` 사용 금지 (불가피하면 사유 주석).
- 함수형 컴포넌트 + 훅만 사용한다.
- 화학 계산 로직(결합 판정, VSEPR 기하 결정 등)은 UI와 분리된 순수 함수로 `src/lib/`에 둔다.
- 커밋 전 `npm run build`(타입체크 포함)와 `npm run lint`(oxlint)가 통과해야 한다.

## 7. 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드
npm run lint     # oxlint
npm run preview  # 빌드 결과 미리보기
```
