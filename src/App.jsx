import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Theme
import { muiTheme } from './frontend/theme/theme';

// Styles
import './frontend/styles/global.css';

// Auth
import { AuthProvider, ProtectedRoute, AdminProtectedRoute } from './frontend/contexts/AuthContext';

// Layout
import { Layout } from './frontend/components/Layout';
import { Loading } from './frontend/components';

// Pages (Lazy Load)
const Dashboard = lazy(() => import('./frontend/pages').then(module => ({ default: module.Dashboard })));
const VendorsPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.VendorsPage })));
const EventGuidePage = lazy(() => import('./frontend/pages').then(module => ({ default: module.EventGuidePage })));
const TaxLookupPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.TaxLookupPage })));
const MembersPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.MembersPage })));
const MemberScorePage = lazy(() => import('./frontend/pages').then(module => ({ default: module.MemberScorePage })));
const ImportMembersPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.ImportMembersPage })));
const RemoveBgPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.RemoveBgPage })));
const LoginPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.LoginPage })));
const InventoryPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.InventoryPage })));
const QRGeneratorPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.QRGeneratorPage })));
const AgendaFormatterPage = lazy(() => import('./frontend/pages').then(module => ({ default: module.AgendaFormatterPage })));

// App Routes
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading message="Đang tải trang..." />}>
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
                  <Route path="/qr-generator" element={<QRGeneratorPage />} />
                  <Route path="/agenda-formatter" element={<AgendaFormatterPage />} />
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
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
