/**
 * 메인 앱 컴포넌트.
 * Header, LocationSelector, WeatherCard, ForecastList를 조합하여
 * 날씨 대시보드 전체 레이아웃을 구성한다.
 */

import { useState } from 'react';
import type { Location } from './types/weather';
import { DEFAULT_LOCATION } from './constants/locations';
import { useWeather } from './hooks/useWeather';
import Header from './components/Header';
import LocationSelector from './components/LocationSelector';
import WeatherCard from './components/WeatherCard';
import ForecastList from './components/ForecastList';

export default function App() {
  /** 현재 선택된 지역 */
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);

  /** 날씨 데이터 */
  const { currentWeather, forecast, loading, error, refetch } = useWeather(location);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <Header />
        <LocationSelector selected={location} onChange={setLocation} />
        <WeatherCard
          weather={currentWeather}
          locationName={location.name}
          loading={loading}
          error={error}
          onRefresh={refetch}
          skyCondition={forecast[0]?.skyCondition}
        />
        <ForecastList items={forecast} />
      </div>
    </div>
  );
}
