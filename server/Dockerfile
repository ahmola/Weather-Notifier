# ──────────────────────────────────────────────
# Weather Notifier Server - 멀티스테이지 Docker 빌드
#
# [빌드 스테이지] Go 컴파일러로 실행 파일 하나를 만든다.
# [실행 스테이지] 컴파일러 없이 실행 파일만 담은 작은 이미지로 서버를 띄운다.
#
# 사용법:
#   docker build -t weather-server .
#   docker run -p 8080:8080 weather-server
#   curl http://localhost:8080/healthz
#   (또는 프로젝트 루트에서 docker compose --profile backend up --build)
# ──────────────────────────────────────────────

# ── 빌드 스테이지 ──
# Go 버전은 go.mod의 go 지시어와 같은 마이너 버전(1.27)으로 맞춘다.
FROM golang:1.27-alpine AS build

WORKDIR /src

# 의존성 먼저 내려받기 (레이어 캐싱 활용). 외부 의존성이 생기기 전에는 go.sum이 없을 수 있다.
COPY go.mod go.sum* ./
RUN go mod download

# 소스 복사 및 빌드
# - CGO_ENABLED=0 : C 라이브러리 없이 동작하는 정적 실행 파일 생성
# - -trimpath     : 실행 파일에 빌드 머신의 경로가 남지 않게 함
# - -ldflags "-s -w" : 디버그 정보를 제거해 크기 축소
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ── 실행 스테이지 ──
FROM alpine:3.24

# 베이스 이미지 발행 이후 나온 OS 패키지 보안 패치를 반영하고,
# 외부 HTTPS(기상청 API 등) 호출에 필요한 루트 인증서와 시간대 정보를 설치한다.
RUN apk upgrade --no-cache && apk add --no-cache ca-certificates tzdata

# root가 아닌 전용 계정으로 실행한다.
RUN addgroup -S app && adduser -S -G app app
USER app

COPY --from=build /out/server /usr/local/bin/server

# 서버가 대기할 포트 (cmd/server/main.go의 PORT)
ENV PORT=8080
EXPOSE 8080

# 헬스체크 (localhost는 환경에 따라 IPv6로 해석될 수 있어 127.0.0.1을 사용한다)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/server"]
