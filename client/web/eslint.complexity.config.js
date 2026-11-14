/**
 * 코드 복잡도 검사용 ESLint 설정.
 *
 * 일반 린트(eslint.config.js)와 분리해서 CI에서 "복잡도" 단계로 따로 실행한다. (npm run complexity)
 * 함수가 너무 복잡해지면(분기·중첩·길이·매개변수 과다) 읽고 테스트하기 어려워지므로 상한을 둔다.
 * 테스트 코드는 describe/it 블록이 길어지는 것이 자연스러우므로 검사 대상에서 제외한다.
 *
 * 기준을 넘으면: 함수를 더 작은 함수로 나누거나 조건을 단순화한다.
 */

import tseslint from 'typescript-eslint';

/** 복잡도 상한값 */
const LIMITS = {
  /** 순환 복잡도: 함수 하나의 분기(if, &&, ||, ?:, case, 반복문 등) 경로 수 */
  cyclomatic: 10,
  /** 블록 중첩 깊이 (if 안의 for 안의 if ...) */
  depth: 4,
  /** 콜백 중첩 깊이 */
  nestedCallbacks: 3,
  /** 함수 매개변수 개수 */
  params: 4,
  /** 함수 길이 (빈 줄·주석 제외) */
  linesPerFunction: 80,
};

export default tseslint.config({
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/__tests__/**'],
  // TypeScript/JSX 구문을 읽기 위한 파서만 지정한다 (다른 린트 규칙은 켜지 않음)
  languageOptions: { parser: tseslint.parser },
  // 일반 린트용 eslint-disable 주석이 "쓰이지 않음"으로 보고되지 않게 한다
  linterOptions: { reportUnusedDisableDirectives: 'off' },
  rules: {
    complexity: ['error', LIMITS.cyclomatic],
    'max-depth': ['error', LIMITS.depth],
    'max-nested-callbacks': ['error', LIMITS.nestedCallbacks],
    'max-params': ['error', LIMITS.params],
    'max-lines-per-function': [
      'error',
      { max: LIMITS.linesPerFunction, skipBlankLines: true, skipComments: true },
    ],
  },
});
