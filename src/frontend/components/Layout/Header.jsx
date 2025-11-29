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
        borderBottom: isAdminMode ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid #2a2a2a'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={onMenuClick}
              sx={{ color: '#fff' }}
            >
              <MenuOutlinedIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={logoCsg}
              alt="CSG Logo"
              sx={{
                width: 36,
                height: 36,
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
                fontSize: '1rem',
                letterSpacing: '0.3px'
              }}
            >
              CSG Event {isAdminMode && '(Admin)'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isAdminMode ? (
                    <>
                      <AdminPanelSettingsIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                      <Typography sx={{ color: '#FFD700', fontSize: '0.75rem', fontWeight: 500 }}>
                        Admin
                      </Typography>
                    </>
                  ) : (
                    <>
                      <PersonIcon sx={{ fontSize: 16, color: '#B3B3B3' }} />
                      <Typography sx={{ color: '#B3B3B3', fontSize: '0.75rem', fontWeight: 500 }}>
                        Member
                      </Typography>
                    </>
                  )}
                </Box>
              }
              sx={{ 
                m: 0,
                '& .MuiFormControlLabel-label': { ml: 0.5 }
              }}
            />
          )}
          
          <Typography
            variant="body2"
            sx={{
              color: '#B3B3B3',
              display: { xs: 'none', md: 'block' },
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            Xin chào, {user?.displayName || 'Guest'}
          </Typography>
          <Tooltip title="Đăng xuất">
            <IconButton
              onClick={logout}
              sx={{ 
                color: '#999',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  color: '#FFD700',
                  background: 'rgba(255, 215, 0, 0.1)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
