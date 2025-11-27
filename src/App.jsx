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
import { Dashboard, VendorsPage, GuidesPage, EventGuidePage, TaxLookupPage, PaperworkPage, LoginPage } from './frontend/pages';

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
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="/tax-lookup" element={<TaxLookupPage />} />
                <Route path="/paperwork" element={<PaperworkPage />} />
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
