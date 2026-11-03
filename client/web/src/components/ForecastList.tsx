/**
 * 초단기예보 리스트 컴포넌트.
 * 향후 6시간의 시간별 예보를 가로 스크롤 카드 형태로 표시한다.
 *
 * 가로 스크롤 UX:
 * - 리스트 아래의 스크롤 휠(슬라이더)을 드래그하면 리스트가 가로로 이동한다.
 * - 리스트를 스크롤하면 슬라이더 위치도 함께 움직인다.
 * - 데스크톱에서 마우스 휠(세로)을 굴리면 리스트가 가로로 스크롤된다.
 * - 카드가 모두 화면에 들어와 스크롤할 필요가 없으면 슬라이더를 숨긴다.
 */

import { useEffect, useRef, useState } from 'react';
import type { ForecastItem } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface ForecastListProps {
  /** 예보 아이템 목록 */
  items: ForecastItem[];
}

/** 슬라이더 최대값 (0 ~ SLIDER_MAX 범위를 스크롤 위치 0% ~ 100%에 대응) */
const SLIDER_MAX = 100;

export default function ForecastList({ items }: ForecastListProps) {
  /** 가로 스크롤 컨테이너 */
  const listRef = useRef<HTMLDivElement>(null);
  /** 현재 스크롤 위치 (0 ~ SLIDER_MAX) */
  const [position, setPosition] = useState(0);
  /** 가로로 넘칠 만큼 카드가 많은지 여부 (슬라이더 표시 여부) */
  const [scrollable, setScrollable] = useState(false);

  /** 스크롤 가능한 최대 거리(px) */
  const getMaxScroll = (el: HTMLElement) => el.scrollWidth - el.clientWidth;

  // 리스트 크기/내용이 바뀔 때 스크롤 가능 여부를 다시 계산한다.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    /** 스크롤 가능 여부 갱신 */
    const update = () => setScrollable(getMaxScroll(el) > 0);
    update();

    // ResizeObserver가 없는 환경(구형 브라우저, 테스트)에서는 window resize로 대체
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  // 마우스 휠(세로)을 가로 스크롤로 변환한다.
  // React의 onWheel은 passive라 preventDefault가 안 되므로 직접 리스너를 등록한다.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    /** 휠 이벤트 핸들러 */
    const handleWheel = (e: WheelEvent) => {
      // 트랙패드 가로 스와이프는 브라우저 기본 동작에 맡긴다.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      const max = getMaxScroll(el);
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= max && e.deltaY > 0;
      // 끝에 닿았으면 페이지 세로 스크롤이 자연스럽게 이어지도록 막지 않는다.
      if (max <= 0 || atStart || atEnd) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [items]);

  if (items.length === 0) return null;

  /** 리스트 스크롤 → 슬라이더 위치 동기화 */
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const max = getMaxScroll(el);
    setPosition(max > 0 ? (el.scrollLeft / max) * SLIDER_MAX : 0);
  };

  /** 슬라이더 드래그 → 리스트 스크롤 위치 이동 */
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = listRef.current;
    if (!el) return;
    const value = Number(e.target.value);
    el.scrollLeft = (value / SLIDER_MAX) * getMaxScroll(el);
    setPosition(value);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-3">⏱️ 시간별 예보</h3>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        data-testid="forecast-list"
      >
        {items.map((item) => (
          <ForecastCard key={item.dateTime} item={item} />
        ))}
      </div>

      {/* 가로 스크롤 휠 (스크롤할 내용이 있을 때만 표시) */}
      {scrollable && (
        <input
          type="range"
          min={0}
          max={SLIDER_MAX}
          step={1}
          value={position}
          onChange={handleSliderChange}
          className="forecast-wheel mt-3 w-full"
          aria-label="시간별 예보 스크롤"
          data-testid="forecast-wheel"
        />
      )}
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
