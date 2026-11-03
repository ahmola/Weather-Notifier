#!/usr/bin/env python3
"""
웹 서버(Caddy / nginx)의 기상청 API 프록시 동작을 검증하는 스크립트.

실제 기상청 API 대신 이 스크립트가 띄우는 "가짜 업스트림"으로 요청을 받게 해서,
프록시가 요청을 올바르게 바꿔 전달하는지 확인한다. (외부 네트워크/인증키 불필요)

사전 준비:
  웹 서버 컨테이너를 KMA_UPSTREAM=http://<이 스크립트가 도는 호스트 IP>:<포트> 로 띄운다.
    docker run -d -p 8080:80 \
      -e API_KEY_DATA_GO_KR='test%2Bkey%2F%3D%3D' \
      -e KMA_UPSTREAM=http://172.17.0.1:9000 weather-web

사용법:
  python3 scripts/verify-proxy.py --proxy http://localhost:8080 --port 9000 --key 'test%2Bkey%2F%3D%3D'

검증 항목:
  1. /api/<엔드포인트> → /1360000/VilageFcstInfoService_2.0/<엔드포인트> 로 경로가 바뀐다
  2. serviceKey가 붙고, Encoding 키가 다시 인코딩되지 않고 그대로 전달된다
  3. 브라우저가 보낸 쿼리 파라미터가 그대로 유지된다
  4. 쿼리 파라미터가 없는 요청에도 serviceKey가 붙는다
  5. Host 헤더가 apis.data.go.kr 이다
  6. X-Forwarded-For 등 프록시 헤더가 업스트림으로 전달되지 않는다
  7. 업스트림의 정상 응답(200 + 본문)이 그대로 브라우저에 전달된다
  8. 업스트림의 오류 응답(403 + 본문)도 그대로 전달된다 (화면에 오류 원인을 표시하기 위해)
"""

import argparse
import json
import sys
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# 프록시가 붙여야 하는 기상청 API 경로 접두사
EXPECTED_PREFIX = "/1360000/VilageFcstInfoService_2.0/"
# 프록시가 설정해야 하는 Host 헤더
EXPECTED_HOST = "apis.data.go.kr"
# 업스트림으로 전달되면 안 되는 프록시 헤더
FORBIDDEN_HEADERS = ["X-Forwarded-For", "X-Forwarded-Host", "X-Forwarded-Proto", "Via"]
# 가짜 업스트림이 오류(403)를 돌려줄 엔드포인트 이름
FORBIDDEN_ENDPOINT = "forbiddenEndpoint"
# 가짜 업스트림의 정상 응답 본문
OK_BODY = {"response": {"header": {"resultCode": "00", "resultMsg": "NORMAL_SERVICE"}}}
# 가짜 업스트림의 오류 응답 본문
ERROR_BODY = {"OpenAPI_ServiceResponse": {"cmmMsgHeader": {"errMsg": "SERVICE_KEY_IS_NOT_REGISTERED_ERROR"}}}

# 가짜 업스트림이 마지막으로 받은 요청 (path, headers)
last_request: dict = {}


class MockUpstream(BaseHTTPRequestHandler):
    """기상청 API 흉내: 받은 요청을 기록하고 고정된 응답을 돌려준다."""

    def do_GET(self):  # noqa: N802 (BaseHTTPRequestHandler 규칙)
        last_request["path"] = self.path
        last_request["headers"] = dict(self.headers)

        failing = FORBIDDEN_ENDPOINT in self.path
        body = json.dumps(ERROR_BODY if failing else OK_BODY).encode()
        self.send_response(403 if failing else 200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        """기본 접근 로그 출력 끄기 (검증 결과만 보이도록)"""


def call_proxy(url: str) -> tuple[int, str]:
    """프록시에 GET 요청을 보내고 (상태 코드, 본문)을 돌려준다. 4xx/5xx도 예외 없이 돌려준다."""
    last_request.clear()
    try:
        with urllib.request.urlopen(url, timeout=10) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode()


def main() -> int:
    parser = argparse.ArgumentParser(description="기상청 API 프록시 동작 검증")
    parser.add_argument("--proxy", default="http://localhost:8080", help="웹 서버 주소")
    parser.add_argument("--port", type=int, default=9000, help="가짜 업스트림 포트")
    parser.add_argument("--key", required=True, help="컨테이너에 넣은 API_KEY_DATA_GO_KR 값 (Encoding 키)")
    args = parser.parse_args()

    # 가짜 업스트림 실행 (컨테이너에서 접근할 수 있도록 모든 인터페이스에서 대기)
    server = ThreadingHTTPServer(("0.0.0.0", args.port), MockUpstream)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    # 실패한 검증 항목 목록
    failures: list[str] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        """검증 결과를 출력하고 실패를 기록한다."""
        print(f"{'✅' if ok else '❌'} {name}" + (f"\n     → {detail}" if not ok and detail else ""))
        if not ok:
            failures.append(name)

    # ── 1. 일반 요청 ──
    status, body = call_proxy(f"{args.proxy}/api/getUltraSrtNcst?pageNo=1&dataType=JSON&nx=60&ny=127")
    path = last_request.get("path", "")
    headers = {k.lower(): v for k, v in last_request.get("headers", {}).items()}
    route, _, query = path.partition("?")
    print(f"업스트림이 받은 요청: {path or '(요청이 도착하지 않음)'}\n")

    check("업스트림에 요청이 도착한다", bool(path), "KMA_UPSTREAM 주소와 포트를 확인하세요")
    check(
        "경로가 /1360000/VilageFcstInfoService_2.0/getUltraSrtNcst 로 바뀐다",
        route == EXPECTED_PREFIX + "getUltraSrtNcst",
        route,
    )
    check(
        "serviceKey가 붙고 Encoding 키가 그대로 전달된다 (이중 인코딩 없음)",
        f"serviceKey={args.key}" in query.split("&"),
        query,
    )
    check(
        "원래 쿼리 파라미터가 유지된다",
        all(p in query.split("&") for p in ["pageNo=1", "dataType=JSON", "nx=60", "ny=127"]),
        query,
    )
    check("Host 헤더가 apis.data.go.kr 이다", headers.get("host") == EXPECTED_HOST, headers.get("host", ""))
    leaked = [h for h in FORBIDDEN_HEADERS if h.lower() in headers]
    check("프록시 헤더(X-Forwarded-* 등)가 전달되지 않는다", not leaked, ", ".join(leaked))
    check(
        "업스트림 정상 응답(200 + 본문)이 그대로 전달된다",
        status == 200 and '"resultCode": "00"' in body,
        f"status={status} body={body[:200]}",
    )

    # ── 2. 쿼리 파라미터가 없는 요청 ──
    call_proxy(f"{args.proxy}/api/getUltraSrtFcst")
    query = last_request.get("path", "").partition("?")[2]
    check(
        "쿼리 없는 요청에도 serviceKey가 한 번만 붙는다",
        query.split("&").count(f"serviceKey={args.key}") == 1,
        query,
    )

    # ── 3. 업스트림 오류 응답 ──
    status, body = call_proxy(f"{args.proxy}/api/{FORBIDDEN_ENDPOINT}?nx=60")
    check(
        "업스트림 오류 응답(403 + 본문)이 그대로 전달된다",
        status == 403 and "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" in body,
        f"status={status} body={body[:200]}",
    )

    server.shutdown()
    print(f"\n{'모든 검증 통과' if not failures else f'{len(failures)}개 항목 실패'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
