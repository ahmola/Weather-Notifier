/**
 * 기상청 공공데이터 API 호출 및 응답 파싱 모듈.
 *
 * 3가지 API를 호출한다:
 * - 초단기실황 (getUltraSrtNcst): 현재 실시간 날씨
 * - 초단기예보 (getUltraSrtFcst): 향후 6시간 상세 예보
 * - 단기예보 (getVilageFcst): 오늘/내일/모레 3일간 예보
 *
 * 프록시 서버(/api)를 통해 API를 호출하므로
 * serviceKey는 프록시 레이어에서 자동으로 주입된다.
 */

import type {
  NcstApiResponse,
  FcstApiResponse,
  NcstItem,
  FcstItem,
  CurrentWeather,
  ForecastItem,
  PrecipitationType,
  SkyCondition,
} from '../types/weather';

/** API 프록시 기본 경로 */
const BASE_URL = '/api';

// ──────────────────────────────────────────────
// 날짜/시각 계산 유틸리티
// ──────────────────────────────────────────────

/** 날짜를 YYYYMMDD 형식 문자열로 변환 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 초단기실황 API용 발표 일시를 계산한다.
 * 매시 40분에 데이터 생성 → 45분 미만이면 이전 시간 사용
 */
export function getNcstBaseDateTime(now: Date = new Date()): {
  baseDate: string;
  baseTime: string;
} {
  const adjusted = new Date(now);
  if (adjusted.getMinutes() < 45) {
    adjusted.setHours(adjusted.getHours() - 1);
  }
  return {
    baseDate: formatDate(adjusted),
    baseTime: String(adjusted.getHours()).padStart(2, '0') + '00',
  };
}

/**
 * 초단기예보 API용 발표 일시를 계산한다.
 * 매시 30분에 발표 → 45분 미만이면 이전 시간 사용
 */
export function getUltraSrtFcstBaseDateTime(now: Date = new Date()): {
  baseDate: string;
  baseTime: string;
} {
  const adjusted = new Date(now);
  if (adjusted.getMinutes() < 45) {
    adjusted.setHours(adjusted.getHours() - 1);
  }
  return {
    baseDate: formatDate(adjusted),
    baseTime: String(adjusted.getHours()).padStart(2, '0') + '30',
  };
}

/**
 * 단기예보 API용 발표 일시를 계산한다.
 * 하루 8회 발표: 02, 05, 08, 11, 14, 17, 20, 23시 (발표 후 10분 뒤 사용 가능)
 */
export function getVilageFcstBaseDateTime(now: Date = new Date()): {
  baseDate: string;
  baseTime: string;
} {
  const adjusted = new Date(now);
  const totalMinutes = adjusted.getHours() * 60 + adjusted.getMinutes();

  // 발표 시각과 사용 가능 시각 (발표 후 10분)
  const schedule = [
    { baseTime: '2300', available: 23 * 60 + 10 },
    { baseTime: '2000', available: 20 * 60 + 10 },
    { baseTime: '1700', available: 17 * 60 + 10 },
    { baseTime: '1400', available: 14 * 60 + 10 },
    { baseTime: '1100', available: 11 * 60 + 10 },
    { baseTime: '0800', available: 8 * 60 + 10 },
    { baseTime: '0500', available: 5 * 60 + 10 },
    { baseTime: '0200', available: 2 * 60 + 10 },
  ];

  for (const { baseTime, available } of schedule) {
    if (totalMinutes >= available) {
      return { baseDate: formatDate(adjusted), baseTime };
    }
  }

  // 02:10 이전이면 전날 23:00 데이터 사용
  adjusted.setDate(adjusted.getDate() - 1);
  return { baseDate: formatDate(adjusted), baseTime: '2300' };
}

// ──────────────────────────────────────────────
// API 호출 함수
// ──────────────────────────────────────────────

/**
 * API 공통 파라미터를 쿼리스트링으로 변환한다.
 */
function buildQuery(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * 초단기실황 데이터를 가져온다 (현재 날씨).
 */
export async function fetchCurrentWeather(
  nx: number,
  ny: number,
): Promise<CurrentWeather> {
  const { baseDate, baseTime } = getNcstBaseDateTime();
  const query = buildQuery({
    pageNo: 1,
    numOfRows: 10,
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  });

  const res = await fetch(`${BASE_URL}/getUltraSrtNcst?${query}`);
  if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);

  const data: NcstApiResponse = await res.json();
  if (data.response.header.resultCode !== '00') {
    throw new Error(`API 오류: ${data.response.header.resultMsg}`);
  }

  return parseCurrentWeather(data.response.body.items.item);
}

/**
 * 초단기예보 데이터를 가져온다 (향후 6시간 예보).
 */
export async function fetchForecast(
  nx: number,
  ny: number,
): Promise<ForecastItem[]> {
  const { baseDate, baseTime } = getUltraSrtFcstBaseDateTime();
  const query = buildQuery({
    pageNo: 1,
    numOfRows: 60,
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  });

  const res = await fetch(`${BASE_URL}/getUltraSrtFcst?${query}`);
  if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);

  const data: FcstApiResponse = await res.json();
  if (data.response.header.resultCode !== '00') {
    throw new Error(`API 오류: ${data.response.header.resultMsg}`);
  }

  return parseForecastItems(data.response.body.items.item);
}

// ──────────────────────────────────────────────
// 응답 파싱 함수
// ──────────────────────────────────────────────

/**
 * 초단기실황 응답 아이템 배열을 CurrentWeather 객체로 파싱한다.
 */
export function parseCurrentWeather(items: NcstItem[]): CurrentWeather {
  /** 카테고리별 값 맵 */
  const map = new Map<string, string>();
  for (const item of items) {
    map.set(item.category, item.obsrValue);
  }

  return {
    temperature: parseFloat(map.get('T1H') ?? '0'),
    humidity: parseInt(map.get('REH') ?? '0', 10),
    precipitationType: parseInt(map.get('PTY') ?? '0', 10) as PrecipitationType,
    precipitation: map.get('RN1') ?? '강수없음',
    windSpeed: parseFloat(map.get('WSD') ?? '0'),
  };
}

/**
 * 초단기예보 응답 아이템 배열을 ForecastItem 배열로 파싱한다.
 * 같은 시간대의 여러 카테고리 데이터를 하나의 ForecastItem으로 합친다.
 */
export function parseForecastItems(items: FcstItem[]): ForecastItem[] {
  /** 시간대별 카테고리 값을 임시 저장 */
  const timeMap = new Map<string, Map<string, string>>();

  for (const item of items) {
    const key = `${item.fcstDate} ${item.fcstTime}`;
    if (!timeMap.has(key)) {
      timeMap.set(key, new Map());
    }
    timeMap.get(key)!.set(item.category, item.fcstValue);
  }

  /** 시간순 정렬된 예보 목록 */
  const forecasts: ForecastItem[] = [];
  const sortedKeys = Array.from(timeMap.keys()).sort();

  for (const key of sortedKeys) {
    const values = timeMap.get(key)!;
    const hour = key.slice(9, 11);
    const minute = key.slice(11, 13);

    forecasts.push({
      dateTime: key,
      displayTime: `${hour}:${minute}`,
      temperature: parseFloat(values.get('T1H') ?? '0'),
      skyCondition: (parseInt(values.get('SKY') ?? '1', 10) as SkyCondition),
      precipitationType: parseInt(values.get('PTY') ?? '0', 10) as PrecipitationType,
      humidity: parseInt(values.get('REH') ?? '0', 10),
    });
  }

  return forecasts;
}
