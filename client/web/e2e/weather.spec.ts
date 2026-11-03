/**
 * 날씨 대시보드 E2E 테스트.
 * 실제 브라우저로 화면을 띄우고 사용자가 하는 동작(지역 선택, 새로고침, 예보 스크롤)을 재현한다.
 *
 * 테스트 시나리오:
 * 1. 첫 화면: 서울 현재 날씨와 시간별 예보 6개가 표시되고, 올바른 파라미터로 API를 호출한다
 * 2. 지역 변경: 부산을 선택하면 부산 좌표로 다시 호출하고 화면이 바뀐다
 * 3. 새로고침: 새로고침 버튼을 누르면 API를 다시 호출한다
 * 4. 인증 오류: 오류 원인이 화면에 표시되고, "다시 시도"로 복구된다
 * 5. 예보 휠: 마우스 휠과 슬라이더로 시간별 예보를 가로로 넘길 수 있다
 */

import { test, expect } from '@playwright/test';
import { mockWeatherApi } from './mockApi';

/** 테스트 기준 시각: 2026-11-03 14:50 (KST) → 실황 1400, 예보 1430 발표분을 요청해야 한다 */
const FIXED_NOW = new Date('2026-11-03T14:50:00+09:00');

test.beforeEach(async ({ page }) => {
  // 현재 시각을 고정해 발표 시각 계산과 헤더 시계를 항상 같게 만든다
  await page.clock.setFixedTime(FIXED_NOW);
});

test('첫 화면에 서울 현재 날씨와 시간별 예보가 표시된다', async ({ page }) => {
  const api = await mockWeatherApi(page);
  await page.goto('/');

  const card = page.getByTestId('weather-card');
  await expect(card.getByRole('heading', { name: '서울' })).toBeVisible();
  await expect(page.getByTestId('temperature')).toHaveText('12.3°');
  await expect(card).toContainText('강수없음');
  await expect(page.getByTestId('forecast-list').locator('> div')).toHaveCount(6);
  await expect(page.getByText('2026년 11월 3일 (화) 14:50')).toBeVisible();

  // 발표 시각/격자 좌표 파라미터 검증
  const ncst = api.requests.find((r) => r.endpoint === 'getUltraSrtNcst');
  const fcst = api.requests.find((r) => r.endpoint === 'getUltraSrtFcst');
  expect(ncst?.params.get('base_date')).toBe('20261103');
  expect(ncst?.params.get('base_time')).toBe('1400');
  expect(fcst?.params.get('base_time')).toBe('1430');
  expect(ncst?.params.get('nx')).toBe('60');
  expect(ncst?.params.get('ny')).toBe('127');
  // 인증키는 프록시가 붙이므로 브라우저 요청에는 없어야 한다
  expect(ncst?.params.has('serviceKey')).toBe(false);
});

test('지역을 바꾸면 해당 지역 좌표로 다시 조회한다', async ({ page }) => {
  const api = await mockWeatherApi(page);
  await page.goto('/');
  await expect(page.getByTestId('temperature')).toHaveText('12.3°');

  await page.getByLabel('지역 선택').selectOption('부산');

  await expect(
    page.getByTestId('weather-card').getByRole('heading', { name: '부산' }),
  ).toBeVisible();
  await expect(page.getByTestId('temperature')).toHaveText('18.7°');
  const last = api.requests.filter((r) => r.endpoint === 'getUltraSrtNcst').at(-1);
  expect(last?.params.get('nx')).toBe('98');
  expect(last?.params.get('ny')).toBe('76');
});

test('새로고침 버튼을 누르면 다시 조회한다', async ({ page }) => {
  const api = await mockWeatherApi(page);
  await page.goto('/');
  await expect(page.getByTestId('temperature')).toBeVisible();
  const before = api.requests.length;

  await page.getByRole('button', { name: '새로고침' }).click();

  await expect(page.getByTestId('temperature')).toBeVisible();
  expect(api.requests.length).toBe(before + 2); // 실황 + 예보
});

test('인증 오류가 나면 원인을 보여주고, 다시 시도로 복구된다', async ({ page }) => {
  const api = await mockWeatherApi(page, { failAuth: true });
  await page.goto('/');

  const errorCard = page.getByTestId('weather-card-error');
  await expect(errorCard).toContainText('등록되지 않은 서비스키');
  await expect(errorCard).toContainText('SERVICE_KEY_IS_NOT_REGISTERED_ERROR');

  // 키 문제가 해결된 상황을 가정하고 다시 시도
  api.setOptions({ failAuth: false });
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByTestId('temperature')).toHaveText('12.3°');
});

test('시간별 예보를 휠과 슬라이더로 가로로 넘길 수 있다', async ({ page }) => {
  await mockWeatherApi(page);
  await page.goto('/');

  const list = page.getByTestId('forecast-list');
  const wheel = page.getByRole('slider', { name: '시간별 예보 스크롤' });
  await expect(wheel).toBeVisible();
  await expect(wheel).toHaveValue('0');

  /** 리스트의 현재 가로 스크롤 위치 */
  const scrollLeft = () => list.evaluate((el) => el.scrollLeft);

  // 슬라이더를 끝까지 → 리스트도 끝까지 이동
  await wheel.fill('100');
  await expect.poll(scrollLeft).toBeGreaterThan(0);
  const max = await list.evaluate((el) => el.scrollWidth - el.clientWidth);
  await expect.poll(scrollLeft).toBeGreaterThanOrEqual(max - 1);

  // 슬라이더를 처음으로 되돌린 뒤 마우스 휠(세로) → 가로로 이동, 슬라이더도 따라 움직임
  await wheel.fill('0');
  await expect.poll(scrollLeft).toBe(0);
  await list.hover();
  await page.mouse.wheel(0, 120);
  await expect.poll(scrollLeft).toBeGreaterThan(0);
  await expect(wheel).not.toHaveValue('0');
});
