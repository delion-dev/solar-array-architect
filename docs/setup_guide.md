# 개발 환경 구축 가이드 (Setup Guide)

이 가이드는 **Solar Array Architect** 프로젝트의 개발 환경을 설정하는 방법을 안내합니다.

## 사전 요구사항 (Prerequisites)

시작하기 전에 다음 항목이 설치되어 있는지 확인하세요:

1.  **Node.js**: 버전 18.0.0 이상 권장.
    *   [Node.js 다운로드](https://nodejs.org/)
    *   설치 확인: `node -v`
2.  **패키지 매니저**: `npm` (Node.js에 포함됨) 또는 `yarn`.
    *   npm 확인: `npm -v`

## 설치 (Installation)

1.  **레포지토리 클론** (해당되는 경우) 또는 프로젝트 디렉토리로 이동합니다.
    ```bash
    cd solar-array-architect
    ```

2.  **의존성 설치**
    `package.json`에 정의된 모든 필수 패키지를 설치합니다.
    ```bash
    npm install
    # 또는
    yarn install
    ```

## 애플리케이션 실행 (Running the Application)

### 개발 모드 (Development Mode)
HMR(Hot Module Replacement)이 적용된 로컬 개발 서버를 시작하려면:

```bash
npm run dev
# 또는
yarn dev
```

*   서버는 일반적으로 `http://localhost:5173`에서 시작됩니다.
*   브라우저에서 이 URL을 열어 앱을 확인하세요.
*   소스 코드를 수정하면 브라우저가 자동으로 업데이트됩니다.

### 프로덕션 빌드 (Production Build)
배포를 위해 애플리케이션을 빌드하려면:

```bash
npm run build
# 또는
yarn build
```

*   TypeScript를 컴파일하고 Vite를 사용하여 자산을 번들링합니다.
*   결과 파일은 `dist/` 디렉토리에 생성됩니다.

### 빌드 미리보기 (Preview Production Build)
프로덕션 빌드를 로컬에서 미리 보려면:

```bash
npm run preview
# 또는
yarn preview
```

## 프로젝트 설정 (Project Configuration)

### 환경 변수 (Environment Variables)
이 프로젝트는 Vite의 환경 변수 시스템을 사용합니다.
*   루트 디렉토리에 `.env` 파일을 생성하여 사용자 정의 환경 변수를 설정할 수 있습니다.
*   클라이언트에 노출하려면 변수 앞에 `VITE_` 접두사를 붙여야 합니다.
    *   예: `VITE_API_URL=https://api.example.com`

### Tailwind CSS
Tailwind는 `tailwind.config.js`에서 구성됩니다. 테마, 색상, 폰트를 여기서 사용자 정의할 수 있습니다.
*   메인 CSS 파일은 루트 디렉토리의 `index.css`입니다.

### TypeScript
TypeScript 설정은 `tsconfig.json`에 위치합니다.
*   더 나은 타입 안전성을 위해 기본적으로 엄격 모드(Strict mode)가 활성화되어 있습니다.

## 문제 해결 (Troubleshooting)

*   **"Module not found" 오류**: `npm install`을 실행했는지 확인하세요.
*   **포트가 이미 사용 중임**: Vite는 자동으로 다음 사용 가능한 포트(예: 5174)를 시도합니다. 터미널 출력에서 올바른 URL을 확인하세요.
*   **빌드 오류**: 터미널에서 TypeScript 타입 오류를 확인하세요. `tsc`를 수동으로 실행하여 상세한 타입 검사 결과를 볼 수 있습니다.
