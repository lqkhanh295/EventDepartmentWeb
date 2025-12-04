// Main App Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { ConfigProvider } from 'antd';
import CssBaseline from '@mui/material/CssBaseline';

// Theme
import { muiTheme, antTheme } from './frontend/theme/theme';

// Styles
import './frontend/styles/global.css';

// Auth
import { AuthProvider, useAuth } from './frontend/contexts/AuthContext';

// Layout
import { Layout } from './frontend/components/Layout';

// Pages
import { Dashboard, VendorsPage, EventGuidePage, TaxLookupPage, MembersPage, MemberScorePage, ImportMembersPage, RemoveBgPage, LoginPage, InventoryPage } from './frontend/pages';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Hoặc loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  // Đợi auth load xong
  if (loading) {
    return null; // Hoặc loading spinner
  }

  // Kiểm tra user đã đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền admin - CHẶN NẾU KHÔNG PHẢI ADMIN
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Admin Route Component - Chỉ admin mới được truy cập
// const AdminRoute = ({ children }) => {
//   const { user, isAdmin, loading } = useAuth();
//
//   if (loading) {
//     return null; // Hoặc loading spinner
//   }
//
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }
//
//   if (!isAdmin) {
//     return <Navigate to="/" replace />;
//   }
//
//   return children;
// };

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vendors" element={<VendorsPage />} />
                <Route path="/event-guide" element={<EventGuidePage />} />
                <Route path="/tax-lookup" element={<TaxLookupPage />} />
                <Route path="/remove-bg" element={<RemoveBgPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route 
                  path="/members" 
                  element={
                    <AdminProtectedRoute>
                      <MembersPage />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/members/import" 
                  element={
                    <AdminProtectedRoute>
                      <ImportMembersPage />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/members/:semester" 
                  element={
                    <AdminProtectedRoute>
                      <MemberScorePage />
                    </AdminProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <ConfigProvider theme={antTheme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
