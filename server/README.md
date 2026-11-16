# Server for Weather Data Collection

기상청 API로 날씨 데이터를 수집해 제공하는 Go 백엔드 서버입니다.
현재는 서버 실행과 CI 기반만 갖춘 상태이며, 헬스체크 엔드포인트만 제공합니다.

## 구조

```
server/
├── cmd/server/main.go   # 서버 진입점 (GET /healthz)
├── go.mod               # Go 모듈 정의 (Go 버전 포함)
├── .golangci.yml        # 린트 / 포맷 / 복잡도 기준
├── Dockerfile           # 멀티스테이지 빌드
└── .dockerignore
```

## 실행

```bash
# 로컬 실행 (기본 포트 8080, PORT 환경변수로 변경 가능)
go run ./cmd/server
curl http://localhost:8080/healthz    # {"status":"ok"}

# Docker
docker build -t weather-server .
docker run -p 8080:8080 weather-server

# compose (프로젝트 루트에서, DB와 함께 실행. 호스트 포트는 8081)
docker compose --profile backend up --build
```

## 정적 검사

CI(`.github/workflows/server.yaml`)와 같은 검사를 로컬에서 실행할 수 있습니다.
[golangci-lint](https://golangci-lint.run) v2가 필요합니다.

```bash
golangci-lint run          # 린트
golangci-lint fmt --diff   # 포맷 검사 (자동 정리: golangci-lint fmt)
golangci-lint run --enable-only gocyclo,gocognit,nestif,funlen   # 코드 복잡도
go build ./... && go vet ./...   # 타입 검사
go mod tidy -diff          # go.mod / go.sum 정리 상태 확인
```

| 복잡도 항목 | 상한 |
| ----------- | ---- |
| 순환 복잡도 (gocyclo)  | 10 |
| 인지 복잡도 (gocognit) | 15 |
| if 중첩 복잡도 (nestif) | 4 |
| 함수 길이 (funlen)     | 80줄 / 50문장 |

## REST API

| 메서드 | 경로       | 설명                         |
| ------ | ---------- | ---------------------------- |
| GET    | `/healthz` | 서버 상태 확인 (`{"status":"ok"}`) |

## GraphQL

(구현 예정)
