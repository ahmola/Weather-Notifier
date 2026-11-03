/**
 * 페이지 상단 헤더 컴포넌트.
 * 앱 제목과 현재 시각을 표시한다.
 */

import { useState, useEffect } from 'react';

export default function Header() {
  /** 현재 시각 문자열 */
  const [time, setTime] = useState(formatTime(new Date()));

  // 매 분마다 시각 갱신
  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="text-center py-6">
      <h1 className="text-3xl font-bold text-white drop-shadow-lg">🌤️ 날씨 대시보드</h1>
      <p className="text-white/70 mt-1 text-sm">{time}</p>
    </header>
  );
}

/** Date 객체를 "YYYY년 MM월 DD일 (요일) HH:MM" 형식으로 변환 */
function formatTime(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}년 ${m}월 ${d}일 (${day}) ${h}:${min}`;
}
