# GitHub 코드 업로드 가이드 (GitHub Upload Guide)

이 문서는 로컬 프로젝트 코드를 GitHub 레포지토리에 업로드하는 방법을 단계별로 안내합니다.

## 1. 사전 준비 (Prerequisites)

1.  **Git 설치**: 컴퓨터에 Git이 설치되어 있어야 합니다.
    *   **설치 방법 (Windows)**: 터미널에 다음 명령어를 입력하여 설치할 수 있습니다.
        ```bash
        winget install --id Git.Git -e --source winget
        ```
    *   설치 후 터미널을 **재시작**해야 할 수 있습니다.
    *   확인: `git --version` 입력
2.  **GitHub 계정**: GitHub 계정이 있어야 합니다.
3.  **VS Code (권장)**: 터미널 사용이 익숙하지 않다면 VS Code의 소스 제어 기능을 사용할 수 있습니다.

## 2. GitHub 레포지토리 생성

1.  [GitHub](https://github.com/)에 로그인합니다.
2.  우측 상단의 **+** 아이콘을 클릭하고 **New repository**를 선택합니다.
3.  **Repository name**에 프로젝트 이름(예: `solar-array-architect`)을 입력합니다.
4.  **Public** (공개) 또는 **Private** (비공개)를 선택합니다.
5.  **Initialize this repository with:** 섹션의 항목들은 **체크하지 않고 비워둡니다**. (이미 로컬에 코드가 있기 때문입니다)
6.  **Create repository** 버튼을 클릭합니다.
7.  생성 후 화면에 표시되는 **HTTPS 주소** (예: `https://github.com/username/solar-array-architect.git`)를 복사해 둡니다.

## 3. 로컬 프로젝트 업로드 (터미널 사용)

VS Code 터미널(`Ctrl + \``)을 열고 다음 명령어들을 순서대로 입력하세요.

### 1단계: Git 초기화
```bash
git init
```
*   프로젝트 폴더에 `.git` 폴더가 생성됩니다.

### 2단계: 파일 스테이징 (Staging)
```bash
git add .
```
*   모든 변경 사항을 업로드 대기 상태로 만듭니다.
*   **[참고] CRLF 경고**: `warning: CRLF will be replaced by LF` 메시지는 Windows와 Linux/Mac 간의 줄바꿈 방식 차이로 발생하는 정상적인 경고입니다. 무시하고 진행하셔도 무방합니다.
*   *참고: `.gitignore` 파일에 의해 `node_modules` 등 불필요한 파일은 자동으로 제외됩니다.*

### 3단계: 커밋 (Commit)
```bash
git commit -m "Initial commit: Solar Array Architect v1.0"
```
*   현재 상태를 저장합니다. 메시지(`"..."`)는 원하는 대로 수정 가능합니다.

### 4단계: 원격 저장소 연결
위에서 복사한 GitHub 주소를 사용하세요.
```bash
git remote add origin https://github.com/YOUR_USERNAME/solar-array-architect.git
```

### 5단계: 브랜치 설정 및 푸시 (Push)
```bash
git branch -M main
git push -u origin main
```
*   `main` 브랜치로 코드를 업로드합니다.
*   로그인 창이 뜨면 GitHub 계정으로 로그인하세요.

---

## 4. 이후 업데이트 방법

코드를 수정한 후에는 다음 세 단계만 반복하면 됩니다:

1.  `git add .` (변경사항 담기)
2.  `git commit -m "수정 내용 메모"` (저장하기)
3.  `git push` (GitHub에 올리기)

## 문제 해결

*   **"remote origin already exists" 오류**:
    *   `git remote remove origin` 입력 후 다시 연결 명령어를 실행하세요.
*   **로그인 실패**:
    *   GitHub 자격 증명 관리자 창이 뜨면 브라우저를 통해 로그인하세요.
*   **Windows에서 `rm -rf` 오류**:
    *   Windows PowerShell에서는 `rm -rf` 대신 다음 명령어를 사용하세요:
    ```powershell
    Remove-Item -Recurse -Force node_modules, package-lock.json
    ```
*   **`PermissionDenied` 또는 '액세스가 거부되었습니다' 오류**:
    *   현재 `npm run dev` (Vite 서버)가 실행 중이기 때문에 파일이 잠겨 있는 상태입니다.
    *   **해결 방법**: 터미널에서 `Ctrl + C`를 눌러 서버를 중단한 후 다시 삭제 명령어를 실행하세요.
