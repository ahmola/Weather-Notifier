/**
 * 날씨 상태에 따른 아이콘(이모지)을 반환하는 컴포넌트.
 * 하늘상태(SKY)와 강수형태(PTY) 코드 조합으로 적절한 이모지를 선택한다.
 */

import type { SkyCondition, PrecipitationType } from '../types/weather';

interface WeatherIconProps {
  /** 하늘상태 코드 */
  skyCondition?: SkyCondition;
  /** 강수형태 코드 */
  precipitationType?: PrecipitationType;
  /** 아이콘 크기 CSS 클래스 */
  size?: string;
}

/**
 * 날씨 상태에 맞는 이모지를 반환한다.
 */
function getWeatherEmoji(sky?: SkyCondition, pty?: PrecipitationType): string {
  // 강수형태가 있으면 우선 적용
  if (pty && pty > 0) {
    switch (pty) {
      case 1:
        return '🌧️'; // 비
      case 2:
        return '🌨️'; // 비/눈
      case 3:
        return '❄️'; // 눈
      case 4:
        return '🌦️'; // 소나기
    }
  }

  // 하늘상태에 따라 아이콘 결정
  switch (sky) {
    case 1:
      return '☀️'; // 맑음
    case 3:
      return '⛅'; // 구름많음
    case 4:
      return '☁️'; // 흐림
    default:
      return '🌤️'; // 기본
  }
}

/**
 * 날씨 상태 텍스트를 반환한다.
 */
export function getWeatherLabel(sky?: SkyCondition, pty?: PrecipitationType): string {
  if (pty && pty > 0) {
    switch (pty) {
      case 1:
        return '비';
      case 2:
        return '비/눈';
      case 3:
        return '눈';
      case 4:
        return '소나기';
    }
  }
  switch (sky) {
    case 1:
      return '맑음';
    case 3:
      return '구름많음';
    case 4:
      return '흐림';
    default:
      return '맑음';
  }
}

export default function WeatherIcon({
  skyCondition,
  precipitationType,
  size = 'text-4xl',
}: WeatherIconProps) {
  const emoji = getWeatherEmoji(skyCondition, precipitationType);

  return (
    <span className={size} role="img" aria-label={getWeatherLabel(skyCondition, precipitationType)}>
      {emoji}
    </span>
  );
}
