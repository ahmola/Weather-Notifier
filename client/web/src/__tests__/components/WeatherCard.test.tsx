/**
 * WeatherCard 컴포넌트 테스트.
 *
 * 테스트 시나리오:
 * 1. 로딩 상태에서 로딩 UI를 표시한다
 * 2. 에러 상태에서 에러 메시지와 재시도 버튼을 표시한다
 * 3. 날씨 데이터가 있으면 기온, 습도, 풍속, 강수를 올바르게 표시한다
 * 4. 데이터가 null이면 아무것도 렌더링하지 않는다
 * 5. 새로고침 버튼 클릭 시 onRefresh 콜백이 호출된다
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherCard from '../../components/WeatherCard';
import type { CurrentWeather } from '../../types/weather';

/** 테스트용 날씨 데이터 */
const mockWeather: CurrentWeather = {
  temperature: 15.2,
  humidity: 65,
  precipitationType: 0,
  precipitation: '0',
  windSpeed: 3.4,
};

describe('WeatherCard', () => {
  it('로딩 상태에서 로딩 UI를 표시한다', () => {
    render(
      <WeatherCard
        weather={null}
        locationName="서울"
        loading={true}
        error={null}
        onRefresh={() => {}}
      />,
    );

    expect(screen.getByTestId('weather-card-loading')).toBeInTheDocument();
    expect(screen.getByText('날씨 정보를 불러오는 중...')).toBeInTheDocument();
  });

  it('에러 상태에서 에러 메시지를 표시한다', () => {
    render(
      <WeatherCard
        weather={null}
        locationName="서울"
        loading={false}
        error="API 요청 실패"
        onRefresh={() => {}}
      />,
    );

    expect(screen.getByTestId('weather-card-error')).toBeInTheDocument();
    expect(screen.getByText('API 요청 실패')).toBeInTheDocument();
    expect(screen.getByText('다시 시도')).toBeInTheDocument();
  });

  it('날씨 데이터를 올바르게 표시한다', () => {
    render(
      <WeatherCard
        weather={mockWeather}
        locationName="서울"
        loading={false}
        error={null}
        onRefresh={() => {}}
      />,
    );

    const card = screen.getByTestId('weather-card');
    expect(card).toBeInTheDocument();

    // 기온 표시
    expect(screen.getByTestId('temperature')).toHaveTextContent('15.2°');
    // 지역명 표시
    expect(screen.getByText('서울')).toBeInTheDocument();
    // 상세 정보 표시
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('3.4m/s')).toBeInTheDocument();
  });

  it('데이터가 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <WeatherCard
        weather={null}
        locationName="서울"
        loading={false}
        error={null}
        onRefresh={() => {}}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('새로고침 버튼 클릭 시 onRefresh가 호출된다', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <WeatherCard
        weather={mockWeather}
        locationName="서울"
        loading={false}
        error={null}
        onRefresh={onRefresh}
      />,
    );

    await user.click(screen.getByLabelText('새로고침'));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
