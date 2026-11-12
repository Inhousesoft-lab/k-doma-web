/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireLogin from './components/common/RequireLogin';

// 페이지 목록
import TodayPage from './pages/TodayPage';
import RecipesPage from './pages/RecipesPage';
import LikesPage from './pages/LikesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CartPage from './pages/CartPage';
import RecordsPage from './pages/RecordsPage';
import FridgePage from './pages/FridgePage';
import MyPage from './pages/MyPage';
import HouseholdPage from './pages/HouseholdPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        {/* 로그인이 필요한 화면: 주소를 직접 열었는데 비로그인이면 Today 로 (RequireLogin) */}
        <Routes>
          {/* 1. Today (첫 화면) */}
          <Route path="/" element={<TodayPage />} />

          {/* 2. 요리 목록 */}
          <Route path="/recipes" element={<RecipesPage />} />

          {/* 3. 찜한 요리 */}
          <Route path="/recipes/likes" element={<RequireLogin><LikesPage /></RequireLogin>} />

          {/* 4. 요리 상세 */}
          <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />

          {/* 5. 장바구니 */}
          <Route path="/cart" element={<RequireLogin allowGuestView><CartPage /></RequireLogin>} />

          {/* 6. 기록 */}
          <Route path="/records" element={<RequireLogin allowGuestView><RecordsPage /></RequireLogin>} />

          {/* 7. 냉장고 */}
          <Route path="/fridge" element={<RequireLogin allowGuestView><FridgePage /></RequireLogin>} />

          {/* 8. 마이 */}
          <Route path="/my" element={<MyPage />} />

          {/* 9. 우리 집 */}
          <Route path="/my/home" element={<RequireLogin><HouseholdPage /></RequireLogin>} />

          {/* 10. 로그인 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 예외 처리: 기본 홈으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
