import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Pages
import { Dashboard, VendorsPage, EventGuidePage, TaxLookupPage, MembersPage, MemberScorePage, ImportMembersPage, RemoveBgPage, LoginPage, InventoryPage, QRGeneratorPage, AgendaFormatterPage } from './frontend/pages';

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
