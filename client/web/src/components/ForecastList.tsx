/**
 * 초단기예보 리스트 컴포넌트.
 * 향후 6시간의 시간별 예보를 가로 스크롤 카드 형태로 표시한다.
 */

import type { ForecastItem } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface ForecastListProps {
  /** 예보 아이템 목록 */
  items: ForecastItem[];
}

export default function ForecastList({ items }: ForecastListProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-3">⏱️ 시간별 예보</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" data-testid="forecast-list">
        {items.map((item) => (
          <ForecastCard key={item.dateTime} item={item} />
        ))}
      </div>
    </div>
  );
}

/** 개별 예보 카드 */
function ForecastCard({ item }: { item: ForecastItem }) {
  return (
    <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[100px] text-center">
      {/* 시각 */}
      <p className="text-white/60 text-sm mb-2">{item.displayTime}</p>

      {/* 날씨 아이콘 */}
      <WeatherIcon
        skyCondition={item.skyCondition}
        precipitationType={item.precipitationType}
        size="text-3xl"
      />

      {/* 기온 */}
      <p className="text-white font-bold text-lg mt-2">{item.temperature}°</p>

      {/* 습도 */}
      <p className="text-white/50 text-xs mt-1">💧 {item.humidity}%</p>
    </div>
  );
}
