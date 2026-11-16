// Weather Notifier 백엔드 서버의 진입점.
//
// 현재는 서버가 떠 있는지 확인하는 헬스체크 엔드포인트(GET /healthz)만 제공한다.
// 기상청 API 수집, DB 저장, GraphQL 등의 기능은 이후 단계에서 추가한다.
//
// 환경변수:
//   - PORT: 서버가 대기할 포트 (기본값 8080)
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const (
	// defaultPort 는 PORT 환경변수가 없을 때 사용하는 포트다.
	defaultPort = "8080"
	// readHeaderTimeout 은 요청 헤더를 읽는 최대 시간이다. (느린 요청으로 연결을 붙잡는 공격 방지)
	readHeaderTimeout = 5 * time.Second
	// shutdownTimeout 은 종료 신호를 받은 뒤 처리 중인 요청을 기다리는 최대 시간이다.
	shutdownTimeout = 10 * time.Second
)

func main() {
	if err := run(); err != nil {
		slog.Error("서버가 오류로 종료되었습니다", "error", err)
		os.Exit(1)
	}
}

// run 은 HTTP 서버를 띄우고, 종료 신호(SIGINT/SIGTERM)를 받으면 안전하게 종료한다.
func run() error {
	// ctx 는 종료 신호를 받으면 취소된다.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	server := &http.Server{
		Addr:              ":" + port(),
		Handler:           newRouter(),
		ReadHeaderTimeout: readHeaderTimeout,
	}

	// serveErr 는 서버가 예기치 않게 멈췄을 때의 오류를 전달한다.
	serveErr := make(chan error, 1)
	go func() {
		slog.Info("서버를 시작합니다", "addr", server.Addr)
		serveErr <- server.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
		slog.Info("종료 신호를 받았습니다. 서버를 종료합니다")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// port 는 서버가 대기할 포트를 반환한다. (PORT 환경변수, 없으면 기본값)
func port() string {
	if value := os.Getenv("PORT"); value != "" {
		return value
	}
	return defaultPort
}

// newRouter 는 URL 경로별 핸들러를 등록한 라우터를 만든다.
func newRouter() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealth)
	return mux
}

// handleHealth 는 서버가 요청을 받을 수 있는 상태임을 알린다. (Docker HEALTHCHECK, CI에서 사용)
func handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte(`{"status":"ok"}`)); err != nil {
		slog.Warn("헬스체크 응답 전송에 실패했습니다", "error", err)
	}
}
