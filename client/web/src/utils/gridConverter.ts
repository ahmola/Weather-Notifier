/**
 * GPS 위경도 좌표를 기상청 격자(nx, ny) 좌표로 변환하는 유틸리티.
 * Lambert Conformal Conic(LCC) 투영 공식을 사용한다.
 * 기상청에서 공개한 변환 공식 및 파라미터를 그대로 적용하였다.
 */

import type { GpsCoord, GridCoord } from '../types/weather';

// ──────────────────────────────────────────────
// LCC 투영 파라미터 (기상청 공식 값)
// ──────────────────────────────────────────────

/** 지구 반경 (km) */
const RE = 6371.00877;
/** 격자 간격 (km) */
const GRID = 5.0;
/** 투영 위도 1 (degree) */
const SLAT1 = 30.0;
/** 투영 위도 2 (degree) */
const SLAT2 = 60.0;
/** 기준점 경도 (degree) */
const OLON = 126.0;
/** 기준점 위도 (degree) */
const OLAT = 38.0;
/** 기준점 X 좌표 */
const XO = 43;
/** 기준점 Y 좌표 */
const YO = 136;

/** 도 → 라디안 변환 상수 */
const DEGRAD = Math.PI / 180.0;

/**
 * GPS 위경도 좌표를 기상청 격자 좌표로 변환한다.
 * @param gps - GPS 위경도 좌표 { lat, lng }
 * @returns 격자 좌표 { nx, ny }
 */
export function gpsToGrid(gps: GpsCoord): GridCoord {
  const { lat, lng } = gps;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  // sn: 투영 원뿔의 경사율
  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  // sf: 투영 스케일 팩터
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  // ro: 기준점의 투영 반경
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  // ra: 대상 위치의 투영 반경
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  // theta: 대상 위치의 투영 각도
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  // 격자 좌표 계산 (반올림)
  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}
