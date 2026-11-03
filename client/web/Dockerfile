# ──────────────────────────────────────────────
# Weather Notifier Web Client - 멀티스테이지 Docker 빌드
#
# [빌드 스테이지] Node.js로 React 앱을 빌드한다.
# [실행 스테이지] nginx로 정적 파일을 서빙하고, 기상청 API를 프록시한다.
#
# 사용법:
#   docker build -t weather-web .
#   docker run -p 8080:80 -e API_KEY_DATA_GO_KR=인증키(Encoding) weather-web
#   (또는 프로젝트 루트에서 docker compose up --build)
# ──────────────────────────────────────────────

# ── 빌드 스테이지 ──
FROM node:24-alpine AS build

WORKDIR /app

# 의존성 먼저 설치 (레이어 캐싱 활용)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# ── 실행 스테이지 ──
FROM nginx:1.30-alpine

# 베이스 이미지 발행 이후 나온 OS 패키지 보안 패치를 반영한다 (CI 이미지 취약점 스캔 대응)
RUN apk upgrade --no-cache

# nginx가 컨테이너의 DNS 서버 주소를 NGINX_LOCAL_RESOLVERS로 노출하도록 설정
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

# 프록시 대상 주소 (기본: 기상청 API). CI의 프록시 검증에서는 가짜 서버 주소로 바꿔서 실행한다.
ENV KMA_UPSTREAM=https://apis.data.go.kr

# nginx 설정 템플릿 복사 (환경변수 치환용)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 빌드된 정적 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 헬스체크
# localhost 대신 127.0.0.1을 사용한다: IPv6가 켜진 환경(GitHub Actions 러너 등)에서는
# localhost가 ::1로 먼저 해석되는데, nginx 설정은 IPv4(listen 80)만 열고 있어 실패한다.
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

EXPOSE 80

# nginx 이미지가 /etc/nginx/templates/*.template 파일을
# envsubst로 처리하여 /etc/nginx/conf.d/에 출력한다.
CMD ["nginx", "-g", "daemon off;"]
