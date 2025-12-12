# 클라우드 배포 가이드 (Cloud Deployment Guide)

이 문서는 **Solar Array Architect** 애플리케이션을 클라우드 환경에 배포하는 방법을 안내합니다. 이 프로젝트는 정적 웹 애플리케이션(Static Web Application)이므로 다양한 방법으로 쉽게 배포할 수 있습니다.

## 배포 옵션 요약

| 옵션 | 설명 | 추천 대상 | 비용 |
| :--- | :--- | :--- | :--- |
| **1. 정적 호스팅 (추천)** | Vercel, Netlify, AWS S3 + CloudFront 등 | 대부분의 사용자 | 무료 또는 저렴 |
| **2. 컨테이너 (Docker)** | AWS ECS, Google Cloud Run, Kubernetes | 기업 환경, 보안 규정 준수 필요 시 | 중간 ~ 높음 |
| **3. 전통적 서버** | AWS EC2, Nginx 직접 설치 | 레거시 인프라 통합 시 | 중간 |

---

## 옵션 1: 정적 호스팅 (Static Hosting) - 가장 쉬운 방법

이 프로젝트는 빌드 후 `dist/` 폴더에 정적 파일(HTML, CSS, JS)만 생성되므로, 별도의 백엔드 서버 없이 정적 호스팅 서비스에 배포하는 것이 가장 효율적입니다.

### Vercel / Netlify 사용 시
1.  GitHub/GitLab에 코드를 푸시합니다.
2.  Vercel 또는 Netlify에 로그인하여 "Add New Project"를 클릭합니다.
3.  레포지토리를 선택합니다.
4.  Build Settings가 자동으로 감지됩니다 (Framework: Vite).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  "Deploy"를 클릭하면 몇 분 안에 배포가 완료됩니다.

### AWS S3 + CloudFront 사용 시
1.  프로젝트를 빌드합니다: `npm run build`
2.  AWS S3 버킷을 생성하고 `dist/` 폴더의 모든 내용을 업로드합니다.
3.  S3 버킷 속성에서 "Static website hosting"을 활성화합니다.
4.  (선택 사항) CloudFront를 설정하여 HTTPS 및 CDN 가속을 적용합니다.

---

## 옵션 2: Docker 컨테이너 (Containerization)

기업 환경이나 특정 클라우드 인프라(AWS ECS, Google Cloud Run 등)를 사용해야 하는 경우, 제공된 `Dockerfile`을 사용하여 이미지를 빌드하고 배포할 수 있습니다.

### 1. Docker 이미지 빌드
프로젝트 루트에서 다음 명령어를 실행합니다:

```bash
docker build -t solar-array-architect:latest .
```

### 2. 로컬에서 실행 테스트
```bash
docker run -d -p 8080:80 solar-array-architect:latest
```
브라우저에서 `http://localhost:8080`으로 접속하여 확인합니다.

### 3. 클라우드 레지스트리 업로드 (예: AWS ECR)
```bash
# 태그 지정
docker tag solar-array-architect:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/solar-array-architect:latest

# 로그인 및 푸시
aws ecr get-login-password | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/solar-array-architect:latest
```

### 4. 클라우드 서비스 배포
*   **AWS ECS / Fargate**: 업로드한 이미지를 사용하여 태스크 정의(Task Definition)를 생성하고 서비스를 실행합니다.
*   **Google Cloud Run**: 이미지를 선택하여 바로 서비스를 생성할 수 있습니다. (서버리스 컨테이너)

---

## 환경 변수 설정 (Environment Variables)

배포 시 환경 변수가 필요한 경우 (예: API 엔드포인트 변경):

1.  **빌드 타임 변수**: Vite는 빌드 시점에 환경 변수를 주입합니다.
    *   CI/CD 파이프라인(GitHub Actions 등)에서 `VITE_`로 시작하는 환경 변수를 설정하고 빌드해야 합니다.
    *   예: `VITE_API_URL=https://prod-api.example.com npm run build`

2.  **런타임 변수 (Docker)**: 정적 앱이므로 Docker 실행 시 환경 변수를 주입해도 브라우저 코드에는 반영되지 **않습니다**.
    *   런타임 설정이 필요한 경우, `public/config.js`와 같은 별도 설정 파일을 만들고 `window.CONFIG` 객체를 통해 로드하는 방식을 고려해야 합니다.

---

## 빌드 및 배포 체크리스트

- [ ] `npm run build` 명령어가 로컬에서 오류 없이 실행되는지 확인했나요?
- [ ] `dist/index.html` 파일이 생성되었나요?
- [ ] (Docker 사용 시) `.dockerignore` 파일에 `node_modules`가 포함되어 있나요?
- [ ] 프로덕션 환경에 맞는 환경 변수(`.env.production`)가 설정되었나요?
