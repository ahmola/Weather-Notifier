/**
 * ForecastList 컴포넌트 테스트.
 * 시간별 예보 카드 렌더링과 가로 스크롤 휠(슬라이더) 동작을 검증한다.
 *
 * jsdom은 레이아웃을 계산하지 않으므로 scrollWidth/clientWidth를 직접 지정해
 * "카드가 넘치는 상황"과 "다 들어가는 상황"을 흉내 낸다.
 *
 * 테스트 시나리오:
 * 1. 예보가 없으면 아무것도 렌더링하지 않는다
 * 2. 스크롤할 내용이 없으면 휠을 숨긴다
 * 3. 스크롤할 내용이 있으면 휠을 표시한다
 * 4. 휠을 움직이면 리스트가 해당 위치로 스크롤된다
 * 5. 리스트를 스크롤하면 휠 위치가 따라 움직인다
 * 6. 마우스 휠(세로)을 굴리면 리스트가 가로로 스크롤된다
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ForecastList from '../../components/ForecastList';
import type { ForecastItem } from '../../types/weather';

/** 테스트용 예보 6개 */
const ITEMS: ForecastItem[] = Array.from({ length: 6 }, (_, i) => ({
  dateTime: `20261103 ${String(10 + i).padStart(2, '0')}00`,
  displayTime: `${10 + i}:00`,
  temperature: 15 + i,
  skyCondition: 1,
  precipitationType: 0,
  humidity: 50,
}));

/** 원래 속성 설명자 (테스트 후 복원용) */
const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

/** 모든 요소의 scrollWidth/clientWidth를 지정한 값으로 고정한다 */
function mockLayout(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => scrollWidth });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => clientWidth });
}

afterEach(() => {
  if (originalScrollWidth) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
  if (originalClientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
});

describe('ForecastList', () => {
  it('예보가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ForecastList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('스크롤할 내용이 없으면 휠을 숨긴다', () => {
    mockLayout(400, 400);
    render(<ForecastList items={ITEMS} />);
    expect(screen.queryByTestId('forecast-wheel')).not.toBeInTheDocument();
  });

  it('스크롤할 내용이 있으면 휠을 표시한다', () => {
    mockLayout(700, 400);
    render(<ForecastList items={ITEMS} />);
    expect(screen.getByRole('slider', { name: '시간별 예보 스크롤' })).toBeInTheDocument();
  });

  it('휠을 움직이면 리스트가 해당 위치로 스크롤된다', () => {
    mockLayout(700, 400); // 최대 스크롤 300px
    render(<ForecastList items={ITEMS} />);

    fireEvent.change(screen.getByTestId('forecast-wheel'), { target: { value: '50' } });
    expect(screen.getByTestId('forecast-list').scrollLeft).toBe(150);
  });

  it('리스트를 스크롤하면 휠 위치가 따라 움직인다', () => {
    mockLayout(700, 400);
    render(<ForecastList items={ITEMS} />);
    const list = screen.getByTestId('forecast-list');

    list.scrollLeft = 300;
    fireEvent.scroll(list);
    expect(screen.getByTestId('forecast-wheel')).toHaveValue('100');
  });

  it('마우스 휠(세로)을 굴리면 리스트가 가로로 스크롤된다', () => {
    mockLayout(700, 400);
    render(<ForecastList items={ITEMS} />);
    const list = screen.getByTestId('forecast-list');

    fireEvent.wheel(list, { deltaY: 100, deltaX: 0 });
    expect(list.scrollLeft).toBe(100);
  });
});
