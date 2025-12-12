# 시스템 아키텍처 (System Architecture)

## 개요 (Overview)

**Solar Array Architect**는 태양광 발전 시스템의 복잡한 엔지니어링 및 경제성 계산을 수행하기 위해 구축된 클라이언트 사이드 SPA(Single Page Application)입니다. 이 시스템은 빠르고 반응성이 뛰어나며, 무거운 백엔드 없이 브라우저에서 직접 전문가 수준의 보고서를 생성하도록 설계되었습니다.

## 기술 스택 (Technology Stack)

*   **프레임워크**: [React](https://react.dev/) (v18)
*   **언어**: [TypeScript](https://www.typescriptlang.org/)
*   **빌드 도구**: [Vite](https://vitejs.dev/)
*   **스타일링**: [Tailwind CSS](https://tailwindcss.com/)
*   **상태 관리**: [Zustand](https://github.com/pmndrs/zustand)
*   **시각화**: [Recharts](https://recharts.org/)
*   **PDF 생성**: [html2canvas](https://html2canvas.hertzen.com/) + [jspdf](https://github.com/parallax/jsPDF)

## 아키텍처 다이어그램 (Architecture Diagram)

```mermaid
graph TD
    User[사용자 상호작용] --> UI[React 컴포넌트]
    UI --> Input[InputSection (Container)]
    Input --> Forms[Forms (System, Econ, Selectors)]
    UI --> Result[ResultSection (Container)]
    Result --> Dashboard[Dashboard (KPIs, Gauges)]
    Result --> Views[Views (Eng, Econ, Gen)]
    UI --> Report[ReportSection]

    Input -- 상태 업데이트 --> Store[Zustand Store]
    Store -- 재계산 트리거 --> Logic[비즈니스 로직 (utils)]
    
    subgraph "핵심 로직 (utils/solarCalculator)"
        Eng[엔지니어링 계산기]
        Econ[경제성 계산기]
        Sim[발전량 시뮬레이터]
    end

    Logic --> Eng
    Logic --> Econ
    Logic --> Sim

    Eng -- 결과 반환 --> Store
    Econ -- 결과 반환 --> Store
    Sim -- 결과 반환 --> Store

    Store -- 뷰 업데이트 --> UI
    Store -- 영구 저장 --> LocalStorage[브라우저 LocalStorage]
```

## 데이터 흐름 (Data Flow)

1.  **입력 (Input)**: 사용자가 `InputSection`에서 매개변수를 수정합니다 (예: 모듈 선택 변경, 목표 용량 수정).
2.  **상태 업데이트 (State Update)**: 컴포넌트가 **Zustand Store**의 액션(예: `setModule`)을 호출합니다.
3.  **재계산 (Recalculation)**: 스토어는 즉시 `store.ts`에 정의된 `recalculate` 함수를 트리거합니다.
    *   이 함수는 `utils/solarCalculator`의 `calculateSolarSystem` 및 `calculateEconomics`를 호출합니다.
4.  **결과 업데이트 (Result Update)**: 계산 결과(`CalculationResult`, `SimulationResult`)가 스토어에 업데이트됩니다.
5.  **렌더링 (Rendering)**: `ResultSection` 하위의 `EngineeringView`, `EconomicsView` 등이 스토어 변경 사항을 감지하여 새로운 차트와 지표를 표시합니다.
6.  **영속성 (Persistence)**: Zustand의 `persist` 미들웨어는 업데이트된 상태를 브라우저의 `localStorage`에 자동으로 저장합니다.

## 주요 모듈 (Key Modules)

### 1. 상태 관리 (`store.ts`)
*   단일 진실 공급원(Single Source of Truth) 역할을 합니다.
*   UI와 비즈니스 로직을 분리합니다.
*   이전 세션을 복원하기 위한 "Hydration"을 처리합니다.

### 2. 엔지니어링 엔진 (`utils/`)
*   **입력**: 모듈 스펙, 인버터 스펙, 온도 데이터, 케이블 정보.
*   **처리**:
    *   온도 보정 전압 계산 (Voc, Vmp).
    *   최적 스트링 크기(직렬) 및 스트링 수(병렬) 결정.
    *   안전성 검토 수행 (전압 제한, 전류 제한, 기동 전압).
    *   케이블 스펙에 따른 전압 강하 계산.
*   **출력**: 어레이 구성, 안전성 검토 플래그, BOM(자재명세서).

### 3. 경제성 엔진 (`utils/`)
*   **입력**: 시스템 용량, SMP/REC 가격, 비용 요소(CAPEX/OPEX), 금융 조건(대출).
*   **처리**:
    *   20년 현금 흐름 모델 생성.
    *   효율 감소율 및 물가상승률 적용.
    *   세금, 대출 상환금, 감가상각비 계산.
*   **출력**: NPV, ROI, LCOE, 회수 기간, 연도별 현금 흐름표.

## 설계 원칙 (Design Principles)

*   **즉각적인 피드백**: 입력이 변경됨에 따라 클라이언트 측에서 계산이 즉시 수행됩니다.
*   **타입 안전성**: 엄격한 TypeScript 인터페이스(`types.ts`)가 앱 전반의 데이터 일관성을 보장합니다.
*   **모듈화**: 로직이 UI와 분리되어 있어 계산 엔진을 테스트하거나 교체하기 쉽습니다.
*   **오프라인 기능**: 클라이언트 사이드 앱이므로 로드된 후에는 인터넷 연결 없이도 기능할 수 있습니다 (폰트 등 외부 자산 제외).
