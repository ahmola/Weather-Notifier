# Weather Notifier - Web Dashboard

기상청 공공데이터 API를 연동하여 실시간 날씨 정보를 시각적으로 보여주는 웹 대시보드입니다.

## 주요 기능

- 🌡️ **실시간 날씨 조회**: 초단기실황 API로 현재 기온, 습도, 풍속, 강수 정보 표시
- ⏱️ **시간별 예보**: 초단기예보 API로 향후 6시간 시간별 날씨 예보 제공
- 📍 **18개 주요 도시 지원**: 서울, 부산, 제주 등 전국 주요 도시 날씨 조회
- 🔄 **자동 갱신**: 10분마다 최신 데이터 자동 업데이트
- 📱 **반응형 디자인**: 모바일/데스크톱 모두 지원

## 기술 스택

| 항목       | 기술                     |
| ---------- | ------------------------ |
| 프레임워크 | React 18 + TypeScript    |
| 빌드 도구  | Vite 5                   |
| 스타일링   | Tailwind CSS 3           |
| 테스트     | Vitest + Testing Library |
| 컨테이너   | Docker (Caddy / nginx)   |

## 프로젝트 구조

```
client/web/
├── public/                  # 정적 파일 (favicon 등)
├── src/
│   ├── api/                 # 기상청 API 호출 모듈
│   │   └── weatherApi.ts    # API 호출 + 응답 파싱
│   ├── components/          # React UI 컴포넌트
│   │   ├── Header.tsx       # 앱 헤더
│   │   ├── LocationSelector.tsx  # 지역 선택 드롭다운
│   │   ├── WeatherCard.tsx  # 현재 날씨 카드
│   │   ├── ForecastList.tsx # 시간별 예보 리스트
│   │   └── WeatherIcon.tsx  # 날씨 이모지 아이콘
│   ├── hooks/               # 커스텀 React 훅
│   │   └── useWeather.ts    # 날씨 데이터 조회 훅
│   ├── types/               # TypeScript 타입 정의
│   │   └── weather.ts       # 기상청 API 타입
│   ├── utils/               # 유틸리티 함수
│   │   └── gridConverter.ts # GPS → 격자 좌표 변환
│   ├── constants/           # 상수 데이터
│   │   └── locations.ts     # 도시 격자 좌표 목록
│   ├── __tests__/           # 테스트 파일
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── main.tsx             # 엔트리 포인트
│   └── index.css            # 전역 스타일
├── Dockerfile               # 컨테이너 빌드 설정 (nginx)
├── Dockerfile.caddy         # 컨테이너 빌드 설정 (Caddy, compose 기본값)
├── Caddyfile                # Caddy 프록시 설정
├── nginx.conf.template      # nginx 프록시 설정
├── vite.config.ts           # Vite 빌드 + 프록시 설정
└── package.json
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm (또는 npm)
- 기상청 공공데이터 API 키 ([data.go.kr](https://www.data.go.kr/data/15084084/openapi.do)에서 발급)

### 로컬 개발

```bash
# 1. 프로젝트 루트의 .env 파일에 API 키 설정
echo "API_KEY_DATA_GO_KR=발급받은_인증키" > ../../.env

# 2. 의존성 설치
pnpm install

# 3. 개발 서버 시작 (http://localhost:3000)
pnpm dev

# 4. 테스트 실행
pnpm test:run
```

> **참고**: 개발 서버의 Vite 프록시가 `/api/*` 요청을 기상청 API로 자동 전달하며, API 키를 주입합니다. CORS 문제 없이 바로 사용할 수 있습니다.

### Docker로 실행

```bash
# (프로젝트 루트에서) 1. API 키 설정 — 공공데이터포털의 "Encoding" 인증키를 사용
cp client/web/.env.example .env   # 파일을 열어 API_KEY_DATA_GO_KR 값 입력

# 2. 빌드 + 실행
docker compose up --build

# 3. 브라우저에서 http://localhost:8080 접속
```

웹 서버는 기본으로 **Caddy**(`Caddyfile`, `Dockerfile.caddy`)를 사용합니다.
nginx 버전(`nginx.conf.template`, `Dockerfile`)으로 띄우려면:

```bash
WEB_DOCKERFILE=Dockerfile docker compose up --build
```

단독 이미지로 실행하려면:

```bash
# Caddy
docker build -f client/web/Dockerfile.caddy -t weather-web-caddy client/web
docker run -p 8080:80 -e API_KEY_DATA_GO_KR=발급받은_Encoding_인증키 weather-web-caddy

# nginx
docker build -t weather-web client/web
docker run -p 8080:80 -e API_KEY_DATA_GO_KR=발급받은_Encoding_인증키 weather-web
```

> **인증키 주의**: nginx/Vite 프록시는 키를 쿼리스트링에 그대로 붙이므로 **Encoding 키**를 넣어야 합니다.
> Decoding 키를 넣으면 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`가 발생할 수 있습니다.
> 발급 직후에는 키가 활성화되기까지 1~2시간 정도 걸릴 수 있습니다.

## 테스트 / 코드 검사

```bash
# 단위 테스트 (Vitest)
npm run test:run        # 한 번 실행
npm test                # 감시 모드 (파일 변경 시 자동 재실행)

# 린트 / 포맷
npm run lint            # ESLint
npm run format:check    # Prettier 포맷 검사
npm run format          # Prettier로 자동 정리

# E2E 테스트 (Playwright, 실제 브라우저)
npx playwright install chromium   # 최초 1회: 브라우저 설치
npm run build && npm run test:e2e
```

### 단위 테스트 범위

| 영역               | 테스트 내용                                                 |
| ------------------ | ----------------------------------------------------------- |
| `gridConverter`    | GPS 위경도 → 격자 좌표 변환 정확성 (서울, 부산, 제주, 강릉) |
| `weatherApi`       | 발표 일시 계산 로직, API 응답 파싱, 오류 메시지 추출        |
| `WeatherCard`      | 로딩/에러/정상 상태 렌더링, 새로고침 버튼 동작              |
| `LocationSelector` | 도시 목록 렌더링, 선택 변경 콜백                            |
| `ForecastList`     | 예보 카드 렌더링, 가로 스크롤 휠(슬라이더/마우스 휠) 동작   |

### E2E 테스트 (`e2e/`)

기상청 API는 가짜 응답으로 대체하고 시각(2026-11-03 14:50 KST)을 고정해 항상 같은 결과가 나오게 한다.
desktop / mobile(Pixel 7) 두 화면 크기에서 실행한다.

| 시나리오  | 확인 내용                                                        |
| --------- | ---------------------------------------------------------------- |
| 첫 화면   | 서울 현재 날씨·예보 6개 표시, base_date/base_time/nx/ny 파라미터 |
| 지역 변경 | 부산 선택 시 부산 좌표로 재조회, 화면 갱신                       |
| 새로고침  | 새로고침 버튼으로 재조회                                         |
| 인증 오류 | 오류 원인 표시, "다시 시도"로 복구                               |
| 예보 휠   | 슬라이더·마우스 휠로 가로 스크롤                                 |

### 프록시 동작 검증 (`scripts/verify-proxy.py`)

Caddy / nginx 컨테이너가 `/api/*` 요청을 기상청 API 형식으로 올바르게 바꿔 전달하는지 확인한다.
실제 기상청 대신 스크립트가 띄우는 가짜 업스트림을 사용하므로 인증키·외부 네트워크가 필요 없다.

```bash
# 1. 컨테이너를 가짜 업스트림(호스트 9000 포트)에 연결해서 실행
GW=$(docker network inspect bridge -f '{{(index .IPAM.Config 0).Gateway}}')
docker run -d --name proxy-test -p 8080:80 \
  -e API_KEY_DATA_GO_KR='test%2Bkey%3D%3D' -e KMA_UPSTREAM="http://$GW:9000" weather-web-caddy

# 2. 검증 실행
python3 scripts/verify-proxy.py --proxy http://localhost:8080 --port 9000 --key 'test%2Bkey%3D%3D'
```

CI(`.github/workflows/integration.yaml`)에서는 위 검사들과 함께 Docker 헬스체크, 이미지 취약점 스캔(Trivy)까지 자동으로 실행한다.

## 기상청 API 연동

이 프로젝트는 **기상청_단기예보 조회서비스** API 하나만 사용합니다.

| API                            | 용도                 | 갱신 주기 |
| ------------------------------ | -------------------- | --------- |
| 초단기실황 (`getUltraSrtNcst`) | 현재 날씨 표시       | 매시 40분 |
| 초단기예보 (`getUltraSrtFcst`) | 향후 6시간 예보      | 매시 30분 |
| 단기예보 (`getVilageFcst`)     | 3일 예보 (향후 확장) | 1일 8회   |

자세한 API 스펙은 [docs/api/README.md](../../docs/api/README.md)를 참조하세요.
