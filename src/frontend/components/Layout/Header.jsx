// Header Component
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { Switch, FormControlLabel } from '@mui/material';
import logoCsg from '../../../image/logocsg.png';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user, logout, isAdmin, isAdminMode, toggleAdminMode } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: isAdminMode ? '#1a1a0a' : '#121212',
        borderBottom: isAdminMode ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid #2a2a2a',
        height: { xs: 56, sm: 64 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 }, px: { xs: 0.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={onMenuClick}
              sx={{ color: '#fff', fontSize: { xs: 22, sm: 26 } }}
            >
              <MenuOutlinedIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Box
              component="img"
              src={logoCsg}
              onClick={() => window.location.href = 'https://www.facebook.com/cocsaigonfuhcm'}
              style={{ cursor: 'pointer' }}
              alt="CSG Logo"
              sx={{
                width: { xs: 28, sm: 36 },
                height: { xs: 28, sm: 36 },
                borderRadius: 1,
                objectFit: 'contain',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: isAdminMode ? '#FFD700' : '#FFFFFF',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                letterSpacing: '0.3px',
                fontStyle: 'bold',
              }}
            >
              CSG Event {isAdminMode && '(Admin)'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* Switch Admin/Member - chỉ hiển thị nếu có quyền admin */}
          {isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={isAdminMode}
                  onChange={toggleAdminMode}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#FFD700',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#FFD700',
                    },
                    '& .MuiSwitch-switchBase': {
                      color: '#999',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: '#333',
                    },
                  }}
                />
              }
              label={<AdminPanelSettingsIcon sx={{ color: isAdminMode ? '#FFD700' : '#fff', fontSize: { xs: 16, sm: 18 }, ml: 1 }} />}
              sx={{ ml: 1 }}
            />
          )}
          <Tooltip title={user?.displayName || 'Thành viên'}>
            <IconButton sx={{ color: '#fff', fontSize: { xs: 20, sm: 24 } }}>
              <PersonIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Đăng xuất">
            <IconButton sx={{ color: '#fff', fontSize: { xs: 20, sm: 24 } }} onClick={logout}>
              <LogoutOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
