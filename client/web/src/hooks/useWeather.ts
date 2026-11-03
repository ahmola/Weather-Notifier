/**
 * 날씨 데이터를 가져오는 커스텀 React 훅.
 * 선택된 지역의 현재 날씨와 예보를 가져와서 상태로 관리한다.
 * 10분마다 자동으로 데이터를 갱신한다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Location, CurrentWeather, ForecastItem } from '../types/weather';
import { fetchCurrentWeather, fetchForecast } from '../api/weatherApi';

/** 자동 갱신 주기 (밀리초): 10분 */
const REFRESH_INTERVAL = 10 * 60 * 1000;

/** 훅 반환 타입 */
export interface UseWeatherResult {
  /** 현재 날씨 데이터 */
  currentWeather: CurrentWeather | null;
  /** 초단기예보 목록 */
  forecast: ForecastItem[];
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 수동 새로고침 함수 */
  refetch: () => void;
}

/**
 * 지역 날씨 데이터를 가져오는 훅.
 * @param location - 조회할 지역 정보 (nx, ny 좌표 포함)
 */
export function useWeather(location: Location): UseWeatherResult {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** 가장 최근 요청 번호 (지역을 빠르게 바꿀 때 이전 응답이 덮어쓰지 않도록) */
  const requestIdRef = useRef(0);

  /** 날씨 데이터 조회 */
  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // 현재 날씨와 예보를 동시에 요청
      const [weather, fcst] = await Promise.all([
        fetchCurrentWeather(location.nx, location.ny),
        fetchForecast(location.nx, location.ny),
      ]);
      if (requestId !== requestIdRef.current) return;

      setCurrentWeather(weather);
      setForecast(fcst);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : '날씨 데이터를 가져오는데 실패했습니다.';
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [location.nx, location.ny]);

  // 지역 변경 시 데이터 재조회
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 자동 갱신 (10분마다)
  useEffect(() => {
    const timer = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  return { currentWeather, forecast, loading, error, refetch: fetchData };
}
