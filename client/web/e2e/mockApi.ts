/**
 * E2E 테스트용 기상청 API 가짜 응답 모듈.
 *
 * 브라우저의 /api/* 요청을 가로채서(page.route) 미리 만든 응답을 돌려준다.
 * - 격자 좌표(nx)마다 다른 기온을 돌려줘서 "지역 변경 → 데이터 변경"을 확인할 수 있다.
 * - 받은 요청을 기록해 두어 base_date/base_time/nx/ny 파라미터를 검증할 수 있다.
 * - failAuth 옵션으로 인증키 오류 응답을 흉내 낼 수 있다.
 */

import type { Page } from '@playwright/test';

/** 기록된 API 요청 */
export interface RecordedRequest {
  /** 엔드포인트 이름 (getUltraSrtNcst 등) */
  endpoint: string;
  /** 쿼리 파라미터 */
  params: URLSearchParams;
}

/** 가짜 API 설정 */
export interface MockApiOptions {
  /** true면 인증키 오류(SERVICE_KEY_IS_NOT_REGISTERED_ERROR)를 돌려준다 */
  failAuth?: boolean;
}

/** 격자 X 좌표 → 현재 기온 (지역별로 다른 값을 주기 위함) */
const TEMPERATURE_BY_NX: Record<string, string> = {
  '60': '12.3', // 서울
  '98': '18.7', // 부산
};

/** data.go.kr 정상 응답 형태로 감싼다 */
function wrap(item: unknown[]) {
  return JSON.stringify({
    response: {
      header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
      body: {
        dataType: 'JSON',
        items: { item },
        pageNo: 1,
        numOfRows: item.length,
        totalCount: item.length,
      },
    },
  });
}

/** 초단기실황 가짜 데이터 */
function ncstItems(nx: string) {
  const values: Record<string, string> = {
    T1H: TEMPERATURE_BY_NX[nx] ?? '10.0',
    REH: '60',
    PTY: '0',
    RN1: '0',
    WSD: '2.1',
  };
  return Object.entries(values).map(([category, obsrValue]) => ({ category, obsrValue }));
}

/** 초단기예보 가짜 데이터 (15시~20시, 6시간) */
function fcstItems() {
  const items = [];
  for (let hour = 15; hour <= 20; hour++) {
    const fcstTime = `${hour}00`;
    const values: Record<string, string> = {
      T1H: String(hour - 3),
      SKY: hour % 2 ? '3' : '1',
      PTY: hour === 18 ? '1' : '0',
      REH: '55',
    };
    for (const [category, fcstValue] of Object.entries(values)) {
      items.push({ category, fcstDate: '20261103', fcstTime, fcstValue });
    }
  }
  return items;
}

/** 인증키 오류 응답 (data.go.kr이 실제로 주는 형태) */
const AUTH_ERROR_BODY = JSON.stringify({
  OpenAPI_ServiceResponse: {
    cmmMsgHeader: {
      errMsg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
      returnAuthMsg: '등록되지 않은 서비스키',
      returnReasonCode: '30',
    },
  },
});

/**
 * 페이지에 가짜 API를 연결한다.
 * @returns 받은 요청 목록과, 실행 중에 옵션을 바꾸는 함수
 */
export async function mockWeatherApi(page: Page, options: MockApiOptions = {}) {
  /** 받은 요청 기록 */
  const requests: RecordedRequest[] = [];
  /** 현재 설정 (테스트 도중 변경 가능) */
  const state = { ...options };

  await page.route('**/api/*', async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split('/').pop() ?? '';
    requests.push({ endpoint, params: url.searchParams });

    if (state.failAuth) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: AUTH_ERROR_BODY });
      return;
    }

    const nx = url.searchParams.get('nx') ?? '';
    const body = endpoint === 'getUltraSrtNcst' ? wrap(ncstItems(nx)) : wrap(fcstItems());
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  return {
    requests,
    /** 테스트 도중 설정을 바꾼다 (예: 오류 → 정상 복구) */
    setOptions: (next: MockApiOptions) => Object.assign(state, next),
  };
}
