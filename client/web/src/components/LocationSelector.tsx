/**
 * 지역 선택 드롭다운 컴포넌트.
 * 주요 도시 목록에서 하나를 선택하면 해당 지역의 날씨를 조회한다.
 */

import type { Location } from '../types/weather';
import { LOCATIONS } from '../constants/locations';

interface LocationSelectorProps {
  /** 현재 선택된 지역 */
  selected: Location;
  /** 지역 변경 콜백 */
  onChange: (location: Location) => void;
}

export default function LocationSelector({ selected, onChange }: LocationSelectorProps) {
  /** 드롭다운 값 변경 핸들러 */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const location = LOCATIONS.find((loc) => loc.name === e.target.value);
    if (location) onChange(location);
  };

  return (
    <div className="flex justify-center mb-6">
      <select
        value={selected.name}
        onChange={handleChange}
        className="px-4 py-2 rounded-xl bg-white/20 text-white backdrop-blur-sm
                   border border-white/30 outline-none cursor-pointer
                   hover:bg-white/30 transition-colors text-lg font-medium"
        aria-label="지역 선택"
      >
        {LOCATIONS.map((loc) => (
          <option key={loc.name} value={loc.name} className="text-gray-900">
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
