# Solar Array Architect (태양광 어레이 아키텍트)

전문가용 태양광 발전 시스템 설계 및 경제성 분석 솔루션입니다. Clean Architecture와 SOLID 원칙을 준수하여 고도화된 계산 로직과 현대적인 UI/UX를 제공합니다.

## 🚀 시작하기 (Getting Started)

이 프로젝트는 React, TypeScript, Vite, Tailwind CSS로 구축되었습니다.

### 사전 요구사항
- Node.js (v18 이상 권장)
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:5173`으로 접속하세요.

3. **단위 테스트 실행 (Vitest)**
   ```bash
   npm test
   ```
   핵심 엔지니어링 및 경제성 로직의 정확성을 검증합니다.

4. **프로덕션 빌드**
   ```bash
   npm run build
   ```
   빌드된 파일은 `dist` 폴더에 생성됩니다.

## 🛠️ 주요 기능 및 고도화 사항 (World-Class Features)

- **정밀 엔지니어링 (Advanced Engineering)**: 
    - 태양광 어레이 직/병렬 최적화 및 인버터 매칭 검토
    - 케이블 재질 및 온도를 고려한 정밀 전압 강하 분석
    - **[New]** 입사각 수정 계수(IAM) 및 지면 반사율(Albedo) 기반 양면 이득 계산
- **경제성 시뮬레이션 (Economics)**: 
    - 20년 장기 현금흐름(Cash Flow) 시뮬레이션 (ROI, NPV, LCOE)
    - **[New]** BESS(배터리 저장 장치) 통합 시뮬레이션 및 편익 분석
    - **[New]** 글로벌 재무 모델: PPA(전력판매계약), ITC(투자세액공제) 반영
    - 민감도 분석 (비관적/기준/낙관적 시나리오)
- **데이터 시각화 (Visualization)**: 
    - **[New]** 시스템 손실 Waterfall 차트
    - 반응형 대시보드 및 인터랙티브 현금흐름 차트
- **현대적 UI/UX**: Glassmorphism 및 프리미엄 디자인 시스템 적용
- **전문 컨설팅 연계**: 주식회사 댈리온(Delion Co., Ltd.) 전문 컨설팅 모달 통합

## 📁 프로젝트 구조 (Clean Architecture)

- `utils/solar/`: 핵심 도메인 로직 분리
    - `engineering.ts`: 설계 및 기술 검토 로직
    - `economics.ts`: 경제성 시뮬레이션 로직
    - `parsers.ts`: 기상 데이터 등 외부 파일 파서
    - `constants.ts`: 물리 및 경제적 상수
- `components/`: 관심사 분리에 기반한 UI 컴포넌트
- `store.ts`: Zustand를 이용한 중앙 집중식 상태 관리
- `types.ts`: 엄격한 타입을 위한 인터페이스 정의

## 🔍 로컬 환경 검증 가이드

1. **UI 검증**: `npm run dev` 실행 후 대시보드의 각 탭(기술적 검토, 수익성 분석 등)이 정상적으로 렌더링되는지 확인합니다.
2. **로직 검증**: `utils/solar/*.test.ts` 파일들을 통해 계산 로직의 정확성을 확인합니다. (`npm test`)
3. **입력값 테스트**: 설정 패널에서 케이블 재질을 변경하거나, 경제성 설정에서 할인율/과설계 손실을 조정하여 결과값이 실시간으로 반영되는지 확인합니다.
4. **컨설팅 모달**: 우측 상단의 'Contact Us' 버튼을 클릭하여 주식회사 댈리온의 정보가 정확히 표시되는지 확인합니다.
