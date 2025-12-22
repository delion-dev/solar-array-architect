# 시스템 아키텍처 (System Architecture)

## 개요 (Overview)

**Solar Array Architect**는 태양광 발전 시스템의 복잡한 엔지니어링 및 경제성 계산을 수행하기 위해 구축된 클라이언트 사이드 SPA(Single Page Application)입니다. 이 시스템은 **Clean Architecture** 및 **SOLID** 원칙을 준수하여 설계되었으며, 유지보수성과 확장성이 뛰어납니다.

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
    Store -- 재계산 트리거 --> Facade[solarCalculator.ts (Facade)]
    
    subgraph "핵심 로직 (utils/solar/)"
        Facade --> Eng[engineering.ts]
        Facade --> Econ[economics.ts]
        Facade --> Parsers[parsers.ts]
        Eng --> Const[constants.ts]
        Econ --> Const
    end

    Eng -- 결과 반환 --> Store
    Econ -- 결과 반환 --> Store

    Store -- 뷰 업데이트 --> UI
    Store -- 영구 저장 --> LocalStorage[브라우저 LocalStorage]
```

## 데이터 흐름 (Data Flow)

1.  **입력 (Input)**: 사용자가 `InputSection`에서 매개변수를 수정합니다 (예: 모듈 선택 변경, 목표 용량 수정).
2.  **상태 업데이트 (State Update)**: 컴포넌트가 **Zustand Store**의 액션(예: `setModule`)을 호출합니다.
3.  **재계산 (Recalculation)**: 스토어는 즉시 `store.ts`에 정의된 `recalculate` 함수를 트리거합니다.
    *   이 함수는 `utils/solarCalculator.ts` (Facade)를 통해 내부 모듈들을 호출합니다.
4.  **결과 업데이트 (Result Update)**: 계산 결과(`CalculationResult`, `SimulationResult`)가 스토어에 업데이트됩니다.
5.  **렌더링 (Rendering)**: `ResultSection` 하위의 `EngineeringView`, `EconomicsView` 등이 스토어 변경 사항을 감지하여 새로운 차트와 지표를 표시합니다.
6.  **영속성 (Persistence)**: Zustand의 `persist` 미들웨어는 업데이트된 상태를 브라우저의 `localStorage`에 자동으로 저장합니다.

## 주요 모듈 (Key Modules)

### 1. 상태 관리 (`store.ts`)
*   단일 진실 공급원(Single Source of Truth) 역할을 합니다.
*   UI와 비즈니스 로직을 분리합니다.
*   이전 세션을 복원하기 위한 "Hydration"을 처리합니다.

### 2. 엔지니어링 엔진 (`utils/solar/engineering.ts`)
*   **입력**: 모듈 스펙, 인버터 스펙, 온도 데이터, 케이블 정보.
*   **처리**:
    *   온도 보정 전압 계산 (Voc, Vmp).
    *   최적 스트링 크기(직렬) 및 스트링 수(병렬) 결정.
    *   안전성 검토 수행 (전압 제한, 전류 제한, 기동 전압).
    *   케이블 재질(구리/알루미늄) 및 동작 온도를 고려한 전압 강하 계산.
*   **출력**: 어레이 구성, 안전성 검토 플래그, BOM(자재명세서).

### 3. 경제성 엔진 (`utils/solar/economics.ts`)
*   **입력**: 시스템 용량, SMP/REC 가격, 비용 요소(CAPEX/OPEX), 금융 조건(대출), 과설계 손실(Clipping Loss), 할인율.
*   **처리**:
    *   20년 현금 흐름 모델 생성.
    *   효율 감소율 및 물가상승률 적용.
    *   세금, 대출 상환금, 감가상각비 계산.
    *   민감도 분석 (SMP/REC 변동 시나리오).
*   **출력**: NPV, ROI, LCOE, 회수 기간, 연도별 현금 흐름표.

## 설계 원칙 (Design Principles)

*   **Clean Architecture**: 비즈니스 로직(`utils/solar/`)이 외부 프레임워크나 UI에 의존하지 않도록 분리했습니다.
*   **Facade Pattern**: `solarCalculator.ts`를 통해 복잡한 내부 서브시스템에 대한 단순화된 인터페이스를 제공합니다.
*   **Single Responsibility (SOLID)**: 엔지니어링, 경제성, 데이터 파싱 로직을 각각의 파일로 분리하여 책임 소재를 명확히 했습니다.
*   **즉각적인 피드백**: 모든 계산이 클라이언트 측에서 즉시 수행되어 최상의 사용자 경험을 제공합니다.
