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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          p: { xs: 2, sm: 3, md: 4 },
          background: mainBgColor
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

