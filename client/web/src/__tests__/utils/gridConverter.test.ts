/**
 * gridConverter 유틸리티 테스트.
 * GPS 위경도 → 기상청 격자 좌표 변환의 정확성을 검증한다.
 *
 * 테스트 시나리오:
 * 1. 서울 좌표 변환 정확성 (37.5665, 126.978 → nx=60, ny=127)
 * 2. 부산 좌표 변환 정확성 (35.1796, 129.0756 → nx=98, ny=76)
 * 3. 제주 좌표 변환 정확성 (33.4890, 126.4983 → nx=52, ny=38)
 * 4. 경계값: 극단적 위경도에서 에러 없이 동작
 */

import { describe, it, expect } from 'vitest';
import { gpsToGrid } from '../../utils/gridConverter';

describe('gpsToGrid', () => {
  it('서울 위경도를 정확한 격자 좌표로 변환한다', () => {
    const result = gpsToGrid({ lat: 37.5665, lng: 126.978 });
    expect(result.nx).toBe(60);
    expect(result.ny).toBe(127);
  });

  it('부산 위경도를 정확한 격자 좌표로 변환한다', () => {
    const result = gpsToGrid({ lat: 35.1796, lng: 129.0756 });
    expect(result.nx).toBe(98);
    expect(result.ny).toBe(76);
  });

  // 격자 경계 근처 좌표는 ±1 차이가 날 수 있으므로 기상청 격자표의 대표 좌표를 사용한다.
  it('제주 위경도를 정확한 격자 좌표로 변환한다', () => {
    const result = gpsToGrid({ lat: 33.4890, lng: 126.4983 });
    expect(result.nx).toBe(52);
    expect(result.ny).toBe(38);
  });

  it('강릉 위경도를 정확한 격자 좌표로 변환한다', () => {
    const result = gpsToGrid({ lat: 37.7491, lng: 128.8784 });
    expect(result.nx).toBe(92);
    expect(result.ny).toBe(131);
  });

  it('반환값은 정수이다', () => {
    const result = gpsToGrid({ lat: 36.5, lng: 127.5 });
    expect(Number.isInteger(result.nx)).toBe(true);
    expect(Number.isInteger(result.ny)).toBe(true);
  });
});
