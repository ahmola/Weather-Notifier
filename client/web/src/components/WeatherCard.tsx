/**
 * 현재 날씨 카드 컴포넌트.
 * 기온, 하늘상태, 습도, 풍속, 강수 정보를 시각적으로 표시한다.
 * 글래스모피즘 스타일의 카드 디자인을 사용한다.
 */

import type { CurrentWeather } from '../types/weather';
import WeatherIcon, { getWeatherLabel } from './WeatherIcon';

interface WeatherCardProps {
  /** 현재 날씨 데이터 */
  weather: CurrentWeather | null;
  /** 선택된 지역 이름 */
  locationName: string;
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 새로고침 콜백 */
  onRefresh: () => void;
}

export default function WeatherCard({
  weather,
  locationName,
  loading,
  error,
  onRefresh,
}: WeatherCardProps) {
  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-xl text-center" data-testid="weather-card-loading">
        <div className="animate-pulse">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-white/70 text-lg">날씨 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-red-500/20 backdrop-blur-lg rounded-3xl p-8 shadow-xl text-center" data-testid="weather-card-error">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-white text-lg mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 데이터 없음
  if (!weather) return null;

  /** 강수형태 텍스트 */
  const precipLabel = getWeatherLabel(undefined, weather.precipitationType);

  return (
    <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-xl" data-testid="weather-card">
      {/* 상단: 지역명 + 새로고침 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">{locationName}</h2>
        <button
          onClick={onRefresh}
          className="text-white/60 hover:text-white transition-colors text-xl"
          aria-label="새로고침"
        >
          🔄
        </button>
      </div>

      {/* 중앙: 기온 + 날씨 아이콘 */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <WeatherIcon
          precipitationType={weather.precipitationType}
          size="text-7xl"
        />
        <div>
          <p className="text-7xl font-bold text-white" data-testid="temperature">
            {weather.temperature}°
          </p>
          <p className="text-white/70 text-lg">{precipLabel}</p>
        </div>
      </div>

      {/* 하단: 상세 정보 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        <InfoItem icon="💧" label="습도" value={`${weather.humidity}%`} />
        <InfoItem icon="💨" label="풍속" value={`${weather.windSpeed}m/s`} />
        <InfoItem icon="🌧️" label="강수" value={weather.precipitation} />
      </div>
    </div>
  );
}

/** 상세 정보 아이템 (습도, 풍속, 강수) */
function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-white/60 text-xs">{label}</p>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}
