/**
 * weatherApi 모듈 테스트.
 * 발표 일시 계산 로직과 응답 파싱 함수의 정확성을 검증한다.
 *
 * 테스트 시나리오:
 * 1. 초단기실황 base_time 계산: 45분 미만이면 이전 시간 사용
 * 2. 초단기실황 base_time 계산: 45분 이상이면 현재 시간 사용
 * 3. 단기예보 base_time 계산: 적절한 발표 시각 선택
 * 4. 단기예보: 자정 직후에는 전날 2300 사용
 * 5. 초단기실황 응답 파싱: 카테고리별 값 정확히 매핑
 * 6. 초단기예보 응답 파싱: 시간대별 데이터 올바르게 그룹핑
 * 7. formatDate: YYYYMMDD 형식 출력
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getNcstBaseDateTime,
  getUltraSrtFcstBaseDateTime,
  getVilageFcstBaseDateTime,
  parseCurrentWeather,
  parseForecastItems,
} from '../../api/weatherApi';
import type { NcstItem, FcstItem } from '../../types/weather';

describe('formatDate', () => {
  it('Date 객체를 YYYYMMDD 형식으로 변환한다', () => {
    const date = new Date(2026, 10, 2); // 2026-11-02 (month는 0부터)
    expect(formatDate(date)).toBe('20261102');
  });

  it('월/일이 한 자리일 때 0을 채운다', () => {
    const date = new Date(2026, 0, 5); // 2026-01-05
    expect(formatDate(date)).toBe('20260105');
  });
});

describe('getNcstBaseDateTime', () => {
  it('45분 이상이면 현재 시간의 HH00을 반환한다', () => {
    const now = new Date(2026, 10, 2, 14, 50); // 14:50
    const result = getNcstBaseDateTime(now);
    expect(result.baseTime).toBe('1400');
    expect(result.baseDate).toBe('20261102');
  });

  it('45분 미만이면 이전 시간의 HH00을 반환한다', () => {
    const now = new Date(2026, 10, 2, 14, 30); // 14:30
    const result = getNcstBaseDateTime(now);
    expect(result.baseTime).toBe('1300');
    expect(result.baseDate).toBe('20261102');
  });

  it('0시 30분이면 전날 23시를 반환한다', () => {
    const now = new Date(2026, 10, 2, 0, 30); // 0:30
    const result = getNcstBaseDateTime(now);
    expect(result.baseTime).toBe('2300');
    expect(result.baseDate).toBe('20261101');
  });
});

describe('getUltraSrtFcstBaseDateTime', () => {
  it('45분 이상이면 현재 시간의 HH30을 반환한다', () => {
    const now = new Date(2026, 10, 2, 14, 50);
    const result = getUltraSrtFcstBaseDateTime(now);
    expect(result.baseTime).toBe('1430');
  });

  it('45분 미만이면 이전 시간의 HH30을 반환한다', () => {
    const now = new Date(2026, 10, 2, 14, 20);
    const result = getUltraSrtFcstBaseDateTime(now);
    expect(result.baseTime).toBe('1330');
  });
});

describe('getVilageFcstBaseDateTime', () => {
  it('08:15에는 0800을 반환한다', () => {
    const now = new Date(2026, 10, 2, 8, 15);
    const result = getVilageFcstBaseDateTime(now);
    expect(result.baseTime).toBe('0800');
    expect(result.baseDate).toBe('20261102');
  });

  it('11:05에는 0800을 반환한다 (1110분 전이므로)', () => {
    const now = new Date(2026, 10, 2, 11, 5);
    const result = getVilageFcstBaseDateTime(now);
    expect(result.baseTime).toBe('0800');
  });

  it('11:15에는 1100을 반환한다', () => {
    const now = new Date(2026, 10, 2, 11, 15);
    const result = getVilageFcstBaseDateTime(now);
    expect(result.baseTime).toBe('1100');
  });

  it('01:00에는 전날 2300을 반환한다', () => {
    const now = new Date(2026, 10, 2, 1, 0);
    const result = getVilageFcstBaseDateTime(now);
    expect(result.baseTime).toBe('2300');
    expect(result.baseDate).toBe('20261101');
  });
});

describe('parseCurrentWeather', () => {
  it('초단기실황 응답 아이템을 CurrentWeather로 정확히 파싱한다', () => {
    const items: NcstItem[] = [
      { baseDate: '20261102', baseTime: '1400', category: 'T1H', obsrValue: '15.2', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1400', category: 'REH', obsrValue: '65', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1400', category: 'PTY', obsrValue: '0', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1400', category: 'RN1', obsrValue: '0', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1400', category: 'WSD', obsrValue: '3.4', nx: 60, ny: 127 },
    ];

    const result = parseCurrentWeather(items);

    expect(result.temperature).toBe(15.2);
    expect(result.humidity).toBe(65);
    expect(result.precipitationType).toBe(0);
    expect(result.precipitation).toBe('0');
    expect(result.windSpeed).toBe(3.4);
  });

  it('누락된 카테고리는 기본값으로 처리한다', () => {
    const items: NcstItem[] = [
      { baseDate: '20261102', baseTime: '1400', category: 'T1H', obsrValue: '10', nx: 60, ny: 127 },
    ];

    const result = parseCurrentWeather(items);

    expect(result.temperature).toBe(10);
    expect(result.humidity).toBe(0);
    expect(result.precipitation).toBe('강수없음');
  });
});

describe('parseForecastItems', () => {
  it('초단기예보 응답을 시간대별로 그룹핑하여 파싱한다', () => {
    const items: FcstItem[] = [
      { baseDate: '20261102', baseTime: '1430', category: 'T1H', fcstDate: '20261102', fcstTime: '1500', fcstValue: '14', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'SKY', fcstDate: '20261102', fcstTime: '1500', fcstValue: '1', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'PTY', fcstDate: '20261102', fcstTime: '1500', fcstValue: '0', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'REH', fcstDate: '20261102', fcstTime: '1500', fcstValue: '55', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'T1H', fcstDate: '20261102', fcstTime: '1600', fcstValue: '13', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'SKY', fcstDate: '20261102', fcstTime: '1600', fcstValue: '3', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'PTY', fcstDate: '20261102', fcstTime: '1600', fcstValue: '1', nx: 60, ny: 127 },
      { baseDate: '20261102', baseTime: '1430', category: 'REH', fcstDate: '20261102', fcstTime: '1600', fcstValue: '70', nx: 60, ny: 127 },
    ];

    const result = parseForecastItems(items);

    expect(result).toHaveLength(2);

    // 첫 번째 시간대 (15:00)
    expect(result[0].displayTime).toBe('15:00');
    expect(result[0].temperature).toBe(14);
    expect(result[0].skyCondition).toBe(1);
    expect(result[0].precipitationType).toBe(0);
    expect(result[0].humidity).toBe(55);

    // 두 번째 시간대 (16:00)
    expect(result[1].displayTime).toBe('16:00');
    expect(result[1].temperature).toBe(13);
    expect(result[1].skyCondition).toBe(3);
    expect(result[1].precipitationType).toBe(1);
    expect(result[1].humidity).toBe(70);
  });

  it('빈 배열이면 빈 결과를 반환한다', () => {
    const result = parseForecastItems([]);
    expect(result).toHaveLength(0);
  });
});
