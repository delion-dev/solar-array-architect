# 프로젝트 디렉토리 구조

이 문서는 **Solar Array Architect** 프로젝트의 파일 및 디렉토리 구조에 대한 개요를 제공합니다.

## 루트 디렉토리 (Root Directory)

| 파일/디렉토리 | 설명 |
| :--- | :--- |
| `components/` | 애플리케이션에서 사용되는 모든 React UI 컴포넌트가 포함되어 있습니다. |
| `components/forms/` | 입력 폼 관련 컴포넌트 (SystemConfig, EconomicConfig, Selectors 등)가 위치합니다. |
| `components/dashboard/` | 대시보드 시각화 컴포넌트 (KPICard, SafetyGauge 등)가 위치합니다. |
| `components/results/` | 결과 표시용 뷰 컴포넌트 (EngineeringView, EconomicsView 등)가 위치합니다. |
| `components/ui/` | 재사용 가능한 공통 UI 컴포넌트 (Card, Button, InputGroup 등)가 위치합니다. |
| `utils/` | 유틸리티 함수 및 핵심 계산 로직(엔지니어링 및 경제성 분석)이 포함되어 있습니다. |
| `docs/` | 프로젝트 문서 (아키텍처, 기능 명세서, 설치 가이드 등)가 위치합니다. |
| `App.tsx` | 레이아웃과 섹션을 조율하는 메인 애플리케이션 컴포넌트입니다. |
| `store.ts` | **Zustand**를 사용한 전역 상태 관리 파일입니다. 데이터 영속성 및 재계산 로직을 처리합니다. |
| `types.ts` | 도메인 모델(PV 모듈, 인버터, 설정, 결과 등)에 대한 TypeScript 타입 정의 파일입니다. |
| `constants.ts` | 애플리케이션 전반에서 사용되는 기본값 및 상수입니다. |
| `index.css` | 전역 CSS 스타일 및 Tailwind CSS 지시어입니다. |
| `main.tsx` | React 애플리케이션의 진입점(Entry point)입니다. |
| `vite.config.ts` | Vite 빌드 도구 설정 파일입니다. |
| `tailwind.config.js` | Tailwind CSS 설정 파일입니다. |
| `tsconfig.json` | TypeScript 컴파일러 설정 파일입니다. |
| `package.json` | 프로젝트 메타데이터, 스크립트 및 의존성 목록입니다. |

## `components/` 디렉토리

이 디렉토리는 애플리케이션의 기능적 UI 블록들을 포함하며, 유지보수성을 위해 세분화되었습니다.

*   **forms/**: 사용자 입력을 처리하는 폼 컴포넌트들입니다.
    *   `SystemConfigForm.tsx`: 시스템 설계 변수 입력.
    *   `EconomicConfigForm.tsx`: 경제성 분석 변수 입력.
    *   `ModuleSelector.tsx`, `InverterSelector.tsx`: 기자재 선택.
*   **dashboard/**: 대시보드의 시각적 요소들입니다.
    *   `KPICard.tsx`: 주요 지표 카드.
    *   `SafetyGauge.tsx`: 안전성 검토 게이지.
*   **results/**: 탭별 결과 화면을 구성하는 뷰 컴포넌트들입니다.
    *   `EngineeringView.tsx`, `EconomicsView.tsx`, `DetailedGenView.tsx`.
*   **ui/**: 범용 UI 컴포넌트 (버튼, 카드, 모달 등).
*   **InputSection.tsx**: 입력 폼들을 통합하는 컨테이너.
*   **ResultSection.tsx**: 결과 뷰들을 통합하는 컨테이너.
*   **ReportSection.tsx**: PDF 리포트 생성 및 미리보기.

## `utils/` 디렉토리

UI와 독립적인 비즈니스 로직을 포함합니다.

*   **solarCalculator.ts**: 핵심 엔진으로서 다음 기능을 수행합니다:
    *   **엔지니어링 계산**: 전압 체크, 스트링 사이징, 인버터 매칭.
    *   **경제성 분석**: 현금 흐름(Cash Flow) 생성, NPV, ROI, 회수 기간 계산.
    *   **시뮬레이션**: 환경 요인에 따른 발전량 시뮬레이션.
*   **pdfGenerator.ts**: HTML 요소를 캡처하여 PDF로 변환하는 유틸리티.

## 주요 파일 (Key Files)

### `store.ts`
프론트엔드 애플리케이션의 중추적인 역할을 합니다. **Zustand**를 사용하여 다음을 수행합니다:
1.  모듈, 인버터, 시스템 설정, 경제성 설정의 현재 상태를 저장합니다.
2.  `localStorage`에 상태를 영구 저장하여 새로고침 시에도 데이터가 유지되도록 합니다.
3.  입력값이 변경될 때마다 `recalculate` 액션을 트리거하여 실시간으로 결과를 업데이트합니다.

### `types.ts`
애플리케이션의 데이터 계약(Contract)을 정의합니다. 주요 인터페이스는 다음과 같습니다:
*   `PVModule`: 태양광 패널 사양.
*   `Inverter`: 인버터 사양.
*   `SystemConfig`: 설계 변수 (케이블 길이, 온도 등).
*   `CalculationResult`: 엔지니어링 계산 결과.
*   `SimulationResult`: 경제성 시뮬레이션 결과.
