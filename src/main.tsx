import {createRoot} from 'react-dom/client';
import { authReady } from './services';
import App from './App.tsx';
import './index.css';

// 로그인 상태를 먼저 확인하고 그린다 (새로고침 때 게스트 화면이 잠깐 보이지 않게)
authReady.then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
