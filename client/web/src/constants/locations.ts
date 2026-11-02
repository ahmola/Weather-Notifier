/**
 * 주요 도시의 기상청 격자 좌표 목록.
 * 사용자가 드롭다운에서 도시를 선택하면 해당 nx, ny 좌표로 날씨를 조회한다.
 * 좌표 값은 기상청 공식 격자 좌표표 기준이다.
 */

import type { Location } from '../types/weather';

/** 주요 도시 격자 좌표 목록 */
export const LOCATIONS: Location[] = [
  { name: '서울', nx: 60, ny: 127 },
  { name: '부산', nx: 98, ny: 76 },
  { name: '대구', nx: 89, ny: 90 },
  { name: '인천', nx: 55, ny: 124 },
  { name: '광주', nx: 58, ny: 74 },
  { name: '대전', nx: 67, ny: 100 },
  { name: '울산', nx: 102, ny: 84 },
  { name: '세종', nx: 66, ny: 103 },
  { name: '수원', nx: 60, ny: 121 },
  { name: '춘천', nx: 73, ny: 134 },
  { name: '제주', nx: 52, ny: 38 },
  { name: '전주', nx: 63, ny: 89 },
  { name: '청주', nx: 69, ny: 107 },
  { name: '창원', nx: 90, ny: 77 },
  { name: '포항', nx: 102, ny: 94 },
  { name: '강릉', nx: 92, ny: 131 },
  { name: '목포', nx: 50, ny: 67 },
  { name: '여수', nx: 73, ny: 66 },
];

/** 기본 선택 도시 (서울) */
export const DEFAULT_LOCATION = LOCATIONS[0];
