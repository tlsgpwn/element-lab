# ElementLab

화학 원소 주기율표 학습 + 가상 화학 결합 + 3D VSEPR 분자 구조 시뮬레이션 웹앱

- **오늘의 원소**: 하루 목표만큼 원소를 학습하고 해금
- **플래시카드**: 간격 반복(어려운 원소일수록 자주 출제) 퀴즈
- **주기율표 퍼즐**: 탐색 / 드래그 퍼즐 / 하드코어 타이핑
- **가상 실험실**: 실제 반응 사전 50개 + 전기음성도·산화수 기반 결합 계산
- **3D 분자 도감**: VSEPR 입체 구조 자동 계산, 비공유 전자쌍 시각화
- **오비탈**: s·p·d·f 오비탈 3D 모양(경계면·전자 구름·단면), 원소별 전자 배치 상자

## 바로 써 보기 (설치 없이)

**https://tlsgpwn.github.io/element-lab/** — `main` 브랜치에 올라간 최신 버전이 자동으로 게시됩니다.

## 내 컴퓨터에서 실행하기 (개발용)

1. [Node.js](https://nodejs.org) LTS 버전을 설치합니다.
2. 이 폴더에서 터미널을 열고 필요한 부품을 받습니다 (처음 한 번만).

   ```bash
   npm install
   ```

3. 개발 서버를 켭니다.

   ```bash
   npm run dev
   ```

4. 브라우저에서 터미널에 나온 주소(보통 http://localhost:5173)를 엽니다. 끌 때는 터미널에서 `Ctrl + C`.

## 기타 명령

```bash
npm run build    # 타입 검사 + 배포용 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
npm run lint     # 코드 검사 (oxlint)
```

학습 진행 상황은 브라우저 `localStorage`(`element_lab_save_v1`)에 저장됩니다.

## 배포

- **GitHub Pages**: `main`에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 빌드·게시합니다. 처음 한 번만 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 바꿔 주세요.
- **Vercel**(선택): vercel.com에 GitHub로 로그인 → **Add New → Project** → `element-lab` **Import** → **Deploy**. 설정은 기본값 그대로 두면 됩니다.
