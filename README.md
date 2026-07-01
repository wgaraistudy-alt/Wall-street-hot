# 월스트리트 핫! 대본 웹앱 (Mac 불필요 버전)

브라우저에서 GitHub에 파일을 올리고, Vercel에 연결만 하면 배포됩니다.
**터미널·Xcode·Mac 전부 필요 없습니다.** 아이폰이나 윈도우 PC로도 배포 가능합니다.

## 이 방식이 안전한 이유

- API 키(Claude·Gemini)는 **Vercel 서버의 환경변수**에만 저장됩니다.
- 브라우저(당신 아이폰)는 `/api/draft`, `/api/factcheck`, `/api/revise` 세 개의
  자기 서버 주소만 호출하고, 그 안에서 서버가 대신 Claude/Gemini를 부릅니다.
- 그래서 아이폰 화면이나 페이지 소스를 봐도 키가 절대 노출되지 않습니다.

```
아이폰 브라우저 → 내 Vercel 서버(/api/…) → Claude / Gemini API
                     ↑ 키는 여기만 존재
```

## 배포 단계 (전부 브라우저에서)

### 1) GitHub 계정 만들기 (이미 있으면 생략)
https://github.com/signup 에서 무료 가입

### 2) 새 저장소(repository) 만들고 파일 업로드
1. https://github.com/new 접속
2. Repository name: `wallstreet-hot-script` (원하는 이름 아무거나)
3. **Create repository** 클릭
4. 만들어진 빈 저장소 페이지에서 **uploading an existing file** 링크 클릭
5. 이 폴더 안의 파일들을 **폴더 구조 그대로** 드래그해서 업로드:
   - `index.html`
   - `package.json`
   - `api/draft.js`
   - `api/factcheck.js`
   - `api/revise.js`
   - `README.md` (선택)

   > ⚠️ `api` 폴더 안에 파일 3개가 들어가 있어야 합니다.
   > 브라우저 업로드 창에 `api/draft.js`처럼 폴더째로 드래그하면
   > GitHub가 자동으로 폴더를 만들어줍니다.
6. 하단 **Commit changes** 클릭

### 3) Vercel 계정 만들고 이 저장소 연결
1. https://vercel.com/signup 접속 → **Continue with GitHub**으로 가입 (가장 간단)
2. 가입 후 **Add New → Project**
3. 방금 만든 `wallstreet-hot-script` 저장소 선택 → **Import**
4. Framework Preset은 **Other**로 두고 그대로 진행 (별도 빌드 설정 불필요)
5. **Environment Variables**(환경변수) 섹션에서 아래 2개를 추가:

   | Name | Value |
   |------|-------|
   | `ANTHROPIC_API_KEY` | `sk-ant-…` (Claude 키) |
   | `GEMINI_API_KEY` | `AIza…` (Gemini 키) |

6. **Deploy** 클릭 → 1~2분 후 완료
7. 배포되면 `https://wallstreet-hot-script-xxxx.vercel.app` 같은 주소가 생깁니다

### 4) 아이폰에서 앱처럼 쓰기
1. 아이폰 **사파리**에서 위 Vercel 주소 접속
2. 공유 버튼(⬆️) → **홈 화면에 추가**
3. 홈 화면에 아이콘 생김 → 탭하면 브라우저 주소창 없이 전체화면으로 열림 (사실상 앱처럼 사용)

## API 키 발급

| 서비스 | 발급처 |
|--------|--------|
| Claude | https://console.anthropic.com/ (Settings → API Keys) |
| Gemini | https://aistudio.google.com/apikey |

## 사용법

1. 페이지 열고 입력창에 **오늘 다룰 이슈 + 확정 수치** 붙여넣기
2. **대본 생성** 탭
3. ①→②→③ 순서로 진행되고, 완료되면 카드 3개 표시:
   - ✅ 최종 대본 (기본 펼침)
   - 🔎 Gemini 팩트체크 리포트
   - 📝 Claude 초안 (검증 전)
4. 각 카드 우측 **복사** 버튼으로 대본 가져가기

## 나중에 대본 프롬프트를 수정하고 싶다면

GitHub 저장소에서 `api/draft.js`, `api/factcheck.js`, `api/revise.js` 안의
`system` 문자열을 브라우저에서 직접 수정하고 Commit하면, Vercel이 자동으로
몇 초 안에 재배포합니다. 터미널 필요 없습니다.

## 비용

- Vercel: 개인 사용 무료 티어로 충분
- Claude 웹 검색: 검색 1,000건당 약 $10 + 토큰 비용
- 매일 1회 실행 기준 월 몇 달러 수준 (사용량 따라 변동)

## 한계 (반드시 인지)

1. **발표 직후 수치는 못 잡을 수 있음** — 검색 엔진에 아직 안 걸린 데이터는
   두 모델 다 확인 불가. 그래서 확정 데이터를 직접 입력하는 게 중요합니다.
2. **상관된 오류** — 두 모델이 같은 틀린 소스를 물면 똑같이 틀립니다.
3. **최종 확인은 사람** — [방송 전 확인] 항목은 원본 소스(ISM, BLS, 거래소)에서
   직접 재확인하세요.
4. Vercel 무료 티어는 함수 실행시간 제한(보통 10~60초)이 있습니다. 검색을
   많이 도는 요청은 시간 초과가 날 수 있으니, 그럴 경우 `max_uses` 값을
   `api/draft.js`, `api/revise.js`에서 줄이세요.
