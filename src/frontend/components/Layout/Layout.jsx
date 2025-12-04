// Main Layout Component
import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 260;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdminMode } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Admin mode: màu vàng
  const bgColor = isAdminMode ? '#1a1a0a' : '#121212';
  const mainBgColor = isAdminMode ? '#1a1a0a' : '#121212';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: bgColor }}>
      <Header onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          mt: { xs: '56px', sm: '64px' },
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          p: { xs: 1, sm: 2, md: 3, lg: 4 },
          background: mainBgColor,
          transition: 'all 0.2s',
          overflowX: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

