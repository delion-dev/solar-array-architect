# 구현 계획서 - Solar Array Architect 고도화 및 리팩토링 (2025-12-22)

본 계획서는 Clean Architecture 및 SOLID 원칙 준수, 계산 로직 정밀화, UI/UX 현대화, 그리고 "Contact Us" 모달 강화를 통해 Solar Array Architect 애플리케이션을 개선하기 위한 단계별 계획을 담고 있습니다.

## 사용자 검토 필요 사항

> [!IMPORTANT]
> **기술적 리팩토링**: 유지보수성과 테스트 가능성을 높이기 위해 `solarCalculator.ts`를 여러 모듈로 분리할 예정입니다. 이는 중요한 아키텍처 변경 사항입니다.
> **로직 변경**: 설정 가능한 과설계 손실(Clipping Loss) 기능을 도입하고, 전압 강하 계산 방식을 정밀화할 예정입니다.

## 제안된 변경 사항

### 1. 기술적 리팩토링 (Clean Architecture & SOLID)

`utils/solarCalculator.ts`를 다음과 같이 분리합니다:
- `utils/solar/engineering.ts`: 핵심 엔지니어링 계산 (Voc, Vmp, 스트링 구성).
- `utils/solar/economics.ts`: 경제성 시뮬레이션 로직 (NPV, ROI, LCOE).
- `utils/solar/parsers.ts`: TMY 데이터 등 외부 파일 파서.
- `utils/solar/constants.ts`: 물리 및 경제적 상수.

#### [NEW] [engineering.ts](file:///d:/solar-array-architect/utils/solar/engineering.ts)
- 엔지니어링 계산 모듈 구현.
- 재질 및 온도를 고려한 `calculateVoltageDrop` 고도화.

#### [NEW] [economics.ts](file:///d:/solar-array-architect/utils/solar/economics.ts)
- 경제성 시뮬레이션 모듈 구현.
- 설정 가능한 과설계 손실(Clipping Loss) 지원 추가.

#### [MODIFY] [solarCalculator.ts](file:///d:/solar-array-architect/utils/solarCalculator.ts)
- 새로운 모듈들로 로직을 위임하는 퍼사드(Facade) 패턴으로 리팩토링.

---

### 2. 로직 정밀화 및 수익성 분석 강화

#### [MODIFY] [types.ts](file:///d:/solar-array-architect/types.ts)
- `EconomicConfig`에 `clippingLoss` 및 `discountRate` 추가.
- `SystemConfig`에 정밀한 전압 강하 계산을 위한 케이블 재질 및 온도 필드 추가.

#### [MODIFY] [solarCalculator.ts](file:///d:/solar-array-architect/utils/solarCalculator.ts)
- 새로운 `clippingLoss` 설정을 사용하도록 `calculateEconomics` 업데이트.
- 사용자 정의 할인율을 통한 NPV 계산 개선.

---

### 3. UI/UX 현대화 및 대시보드 재설계

#### [MODIFY] [index.css](file:///d:/solar-array-architect/index.css)
- 현대적인 디자인 토큰(그라데이션, Glassmorphism 유틸리티) 추가.

#### [MODIFY] [ResultSection.tsx](file:///d:/solar-array-architect/components/ResultSection.tsx)
- 프리미엄 느낌을 위한 레이아웃 및 간격 조정.
- 부드러운 등장 애니메이션 추가.

#### [MODIFY] [EconomicsView.tsx](file:///d:/solar-array-architect/components/results/EconomicsView.tsx)
- 차트 색상을 현대적인 팔레트로 업데이트.
- 아이콘 및 타이포그래피가 개선된 KPI 카드 강화.

---

### 4. "Contact Us" 모달 강화

#### [MODIFY] [App.tsx](file:///d:/solar-array-architect/App.tsx)
- `isContactOpen` 모달 내용 업데이트.
- 회사명 추가: **주식회사 댈리온 (Delion Co., Ltd.)**
- 이메일 추가: **cso@delion.kr**
- 컨설팅 설명 추가:
    - "태양광 발전 사업의 기획부터 시공, 운영까지 전 과정에 걸친 전문 컨설팅을 제공합니다."
    - "최적의 수익성 확보를 위한 정밀 분석과 맞춤형 솔루션을 경험해보세요."

---

### 5. 문서화 및 한글 주석 작업

- **코드 주석**: 리팩토링된 모든 모듈과 UI 컴포넌트에 상세한 한글 주석 추가.
- **한글 문서화**: `README.md` 업데이트 및 한글 기반의 아키텍처/개발 가이드 작성.
- **로컬 검증 가이드**: 사용자가 로컬에서 프로젝트를 검증할 수 있는 명확한 가이드 제공.

## 검증 계획

### 자동화 테스트
- `npm test`: 엔지니어링 및 경제성 로직에 대한 Vitest 단위 테스트 실행.

### 수동 검증
- `npm run dev` 실행 후 브라우저에서 UI 변경 사항 확인.
- "Contact Us" 모달 내용 확인.
- 다양한 입력값(케이블 재질, 과설계 손실 등)에 따른 계산 결과값의 정확성 확인.
