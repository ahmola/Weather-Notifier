/**
 * 앱 엔트리 포인트.
 * React DOM에 App 컴포넌트를 마운트한다.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
