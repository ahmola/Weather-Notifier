/**
 * Playwright E2E 테스트 설정.
 *
 * - 기본: `vite preview`로 빌드 결과물(dist)을 띄우고 테스트한다. (먼저 npm run build 필요)
 * - E2E_BASE_URL 환경변수를 주면 이미 떠 있는 서버(예: Docker 컨테이너)를 대상으로 테스트한다.
 * - 기상청 API는 테스트 안에서 가짜 응답으로 대체하므로 인증키/네트워크가 필요 없다.
 * - 날짜 계산이 한국 시간 기준이므로 브라우저 시간대를 Asia/Seoul로 고정한다.
 */

import { defineConfig, devices } from '@playwright/test';

/** CI 환경 여부 */
const isCI = !!process.env.CI;
/** 외부에서 지정한 테스트 대상 주소 (없으면 vite preview 사용) */
const externalBaseURL = process.env.E2E_BASE_URL;
/** vite preview 포트 */
const PREVIEW_PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  // CI에서 test.only가 남아 있으면 실패 처리
  forbidOnly: isCI,
  // CI에서는 일시적인 실패를 한 번 재시도
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: externalBaseURL ?? `http://localhost:${PREVIEW_PORT}`,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    // 실패한 테스트만 trace를 남긴다 (playwright-report에서 단계별 화면 확인 가능)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // 데스크톱 + 모바일 화면 크기에서 각각 실행
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
        url: `http://localhost:${PREVIEW_PORT}`,
        reuseExistingServer: !isCI,
        timeout: 30_000,
      },
});
