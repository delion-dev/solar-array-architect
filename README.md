# Solar Array Architect

전문가용 태양광 발전 시스템 설계 및 경제성 분석 솔루션입니다.

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

3. **프로덕션 빌드**
   ```bash
   npm run build
   ```
   빌드된 파일은 `dist` 폴더에 생성됩니다.

4. **빌드 미리보기**
   ```bash
   npm run preview
   ```
   
5. **실행 예**
   브라우저에서 `https://poetic-choux-ba19e4.netlify.app/`으로 접속하세요.
## 🛠️ 주요 기능

- **기술적 검토 (Engineering)**: 태양광 어레이 직/병렬 계산, 인버터 매칭, 전압 강하 분석
- **경제성 분석 (Economics)**: 20년 현금흐름(CF), ROI, NPV, 민감도 분석
- **상세 발전량 분석**: TMY 기상 데이터 기반 시간별 발전량 시뮬레이션
- **도면 및 리포트**: 단선 결선도(SLD) 시각화 및 PDF 보고서 생성
- **사업 절차 가이드**: 인허가 및 공사 단계별 가이드라인 제공

## 📁 프로젝트 구조

- `components/`: UI 컴포넌트
- `utils/`: 핵심 계산 로직 (Engineering/Financial Calculator)
- `store.ts`: 전역 상태 관리 (Zustand)
- `types.ts`: TypeScript 데이터 모델 정의
