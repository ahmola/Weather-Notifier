/**
 * LocationSelector 컴포넌트 테스트.
 *
 * 테스트 시나리오:
 * 1. 모든 도시 옵션이 렌더링된다
 * 2. 현재 선택된 도시가 표시된다
 * 3. 도시를 변경하면 onChange 콜백이 올바른 Location 객체와 함께 호출된다
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationSelector from '../../components/LocationSelector';
import { LOCATIONS } from '../../constants/locations';

describe('LocationSelector', () => {
  it('모든 도시 옵션이 렌더링된다', () => {
    render(<LocationSelector selected={LOCATIONS[0]} onChange={() => {}} />);

    const select = screen.getByLabelText('지역 선택') as HTMLSelectElement;
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(LOCATIONS.length);
    LOCATIONS.forEach((loc) => {
      expect(screen.getByText(loc.name)).toBeInTheDocument();
    });
  });

  it('현재 선택된 도시가 표시된다', () => {
    const busan = LOCATIONS.find((l) => l.name === '부산')!;
    render(<LocationSelector selected={busan} onChange={() => {}} />);

    const select = screen.getByLabelText('지역 선택') as HTMLSelectElement;
    expect(select.value).toBe('부산');
  });

  it('도시를 변경하면 onChange가 올바른 Location과 함께 호출된다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<LocationSelector selected={LOCATIONS[0]} onChange={onChange} />);

    const select = screen.getByLabelText('지역 선택');
    await user.selectOptions(select, '부산');

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: '부산', nx: 98, ny: 76 }),
    );
  });
});
