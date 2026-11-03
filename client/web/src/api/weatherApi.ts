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
 * 오류 응답 본문에서 사람이 읽을 수 있는 메시지를 뽑아낸다.
 * data.go.kr은 XML(returnAuthMsg/errMsg), JSON, 평문(Forbidden 등) 등 다양한 형태로 오류를 준다.
 */
export function extractErrorDetail(body: string): string {
  const xmlMsg =
    body.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)?.[1] ??
    body.match(/<errMsg>(.*?)<\/errMsg>/)?.[1];
  if (xmlMsg) return xmlMsg;
  try {
    const json = JSON.parse(body);
    const msg = json?.response?.header?.resultMsg ?? json?.message ?? json?.error;
    if (typeof msg === 'string') return msg;
  } catch {
    /* JSON 아님 */
  }
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

/**
 * 프록시를 통해 기상청 API를 호출하고 JSON 응답을 반환한다.
 * 인증키 오류 등은 JSON이 아닌 XML(OpenAPI_ServiceResponse)로 내려오므로
 * 본문을 먼저 텍스트로 읽은 뒤 파싱하여 원인을 에러 메시지에 담는다.
 */
async function requestApi<T extends { response: { header: { resultCode: string; resultMsg: string } } }>(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  const res = await fetch(`${BASE_URL}/${endpoint}?${buildQuery(params)}`);
  const text = await res.text();
  if (!res.ok) {
    // 원인 파악을 위해 응답 본문(인증 오류 메시지 등)을 에러에 포함한다.
    const detail = extractErrorDetail(text);
    throw new Error(`API 요청 실패: ${res.status}${detail ? ` - ${detail}` : ''}`);
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    const reason = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)?.[1];
    throw new Error(
      reason
        ? `API 인증 오류: ${reason} (인증키를 확인하세요)`
        : `API 응답을 해석할 수 없습니다: ${extractErrorDetail(text)}`,
    );
  }

  if (data.response.header.resultCode !== '00') {
    throw new Error(`API 오류: ${data.response.header.resultMsg}`);
  }
  return data;
}

/**
 * 초단기실황 데이터를 가져온다 (현재 날씨).
 */
export async function fetchCurrentWeather(
  nx: number,
  ny: number,
): Promise<CurrentWeather> {
  const { baseDate, baseTime } = getNcstBaseDateTime();
  const data = await requestApi<NcstApiResponse>('getUltraSrtNcst', {
    pageNo: 1,
    numOfRows: 10,
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  });

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
  const data = await requestApi<FcstApiResponse>('getUltraSrtFcst', {
    pageNo: 1,
    numOfRows: 60,
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  });

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
    precipitation: formatRainfall(map.get('RN1')),
    windSpeed: parseFloat(map.get('WSD') ?? '0'),
  };
}

/**
 * 1시간 강수량(RN1) 값을 표시용 문자열로 변환한다.
 * 실황 API는 숫자 문자열("0", "1.5")을 주지만 "강수없음" 등의 문자열이 올 수도 있다.
 */
export function formatRainfall(value: string | undefined): string {
  if (value === undefined || value === '') return '강수없음';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num <= 0 ? '강수없음' : `${num}mm`;
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
