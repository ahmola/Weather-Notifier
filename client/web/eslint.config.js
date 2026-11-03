/**
 * ESLint 설정 (Flat Config).
 * - JavaScript / TypeScript 권장 규칙
 * - React Hooks 규칙 (훅 호출 순서, useEffect 의존성 배열 검사)
 * - 포맷 관련 규칙은 끄고 Prettier에 맡긴다 (eslint-config-prettier)
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // 검사 제외 경로 (빌드 결과물, 테스트 리포트)
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },

  // 앱 소스 + 테스트 (브라우저 환경)
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // 설정 파일 (Node.js 환경)
  {
    files: ['*.config.{js,ts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  // 반드시 마지막: Prettier와 충돌하는 포맷 규칙 비활성화
  prettier,
);
