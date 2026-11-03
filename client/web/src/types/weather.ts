/**
 * 기상청 공공데이터 API 관련 TypeScript 타입 정의.
 * 초단기실황, 초단기예보, 단기예보 API의 요청/응답 구조와
 * 프론트엔드에서 사용하는 파싱된 날씨 데이터 타입을 정의한다.
 */

// ──────────────────────────────────────────────
// 기상청 API 카테고리 코드
// ──────────────────────────────────────────────

/** API 응답 내 category 필드 값 */
export type WeatherCategory =
  | 'T1H'
  | 'TMP' // 기온 (실황: T1H, 예보: TMP)
  | 'TMN'
  | 'TMX' // 아침 최저 / 낮 최고 기온
  | 'POP' // 강수확률 (%)
  | 'PTY' // 강수형태 코드
  | 'SKY' // 하늘상태 코드
  | 'RN1'
  | 'PCP' // 1시간 강수량 (실황: RN1, 예보: PCP)
  | 'REH' // 습도 (%)
  | 'WSD'; // 풍속 (m/s)

/** 강수형태: 0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기 */
export type PrecipitationType = 0 | 1 | 2 | 3 | 4;

/** 하늘상태: 1=맑음, 3=구름많음, 4=흐림 */
export type SkyCondition = 1 | 3 | 4;

// ──────────────────────────────────────────────
// API 응답 구조
// ──────────────────────────────────────────────

/** 초단기실황 응답 아이템 (obsrValue 사용) */
export interface NcstItem {
  baseDate: string;
  baseTime: string;
  category: WeatherCategory;
  obsrValue: string;
  nx: number;
  ny: number;
}

/** 예보 응답 아이템 (fcstValue 사용) */
export interface FcstItem {
  baseDate: string;
  baseTime: string;
  category: WeatherCategory;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

/** API 공통 헤더 */
export interface ApiHeader {
  resultCode: string;
  resultMsg: string;
}

/** 초단기실황 API 전체 응답 */
export interface NcstApiResponse {
  response: {
    header: ApiHeader;
    body: {
      dataType: string;
      items: { item: NcstItem[] };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
}

/** 예보 API 전체 응답 (초단기예보 + 단기예보 공용) */
export interface FcstApiResponse {
  response: {
    header: ApiHeader;
    body: {
      dataType: string;
      items: { item: FcstItem[] };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
}

// ──────────────────────────────────────────────
// 프론트엔드 사용 타입
// ──────────────────────────────────────────────

/** 현재 날씨 데이터 (초단기실황 파싱 결과) */
export interface CurrentWeather {
  /** 기온 (℃) */
  temperature: number;
  /** 습도 (%) */
  humidity: number;
  /** 강수형태 코드 */
  precipitationType: PrecipitationType;
  /** 1시간 강수량 (문자열, "강수없음" 등 포함) */
  precipitation: string;
  /** 풍속 (m/s) */
  windSpeed: number;
}

/** 예보 아이템 (초단기예보 파싱 결과) */
export interface ForecastItem {
  /** 예보 일시 (YYYYMMDD HHmm) */
  dateTime: string;
  /** 예보 시각 표시용 (HH:mm) */
  displayTime: string;
  /** 기온 (℃) */
  temperature: number;
  /** 하늘상태 코드 */
  skyCondition: SkyCondition;
  /** 강수형태 코드 */
  precipitationType: PrecipitationType;
  /** 습도 (%) */
  humidity: number;
}

/** 지역 정보 (격자 좌표 포함) */
export interface Location {
  /** 지역 이름 */
  name: string;
  /** 기상청 격자 X 좌표 */
  nx: number;
  /** 기상청 격자 Y 좌표 */
  ny: number;
}

/** GPS 좌표 (위경도) */
export interface GpsCoord {
  lat: number;
  lng: number;
}

/** 격자 좌표 */
export interface GridCoord {
  nx: number;
  ny: number;
}
