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

const Header = ({ onMenuClick, isAdmin }) => {
  const { user, logout, isAdmin: hasAdminPermission, isAdminMode, toggleAdminMode } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: isAdmin ? 'linear-gradient(135deg, #2a2a0a 0%, #1a1a05 100%)' : '#121212',
        borderBottom: isAdmin ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid #2a2a2a'
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={logoCsg}
              alt="CSG Logo"
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                objectFit: 'contain'
              }}
            />
            
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: isAdmin ? '#FFD700' : '#fff',
                fontSize: '0.95rem'
              }}
            >
              CSG Event {isAdmin && '(Admin)'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Switch Admin/Member - chỉ hiển thị nếu có quyền admin */}
          {hasAdminPermission && (
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
                      <PersonIcon sx={{ fontSize: 16, color: '#666' }} />
                      <Typography sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
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
              color: '#666',
              display: { xs: 'none', md: 'block' },
              fontSize: '0.85rem'
            }}
          >
            Xin chào, {user?.displayName || 'Guest'}
          </Typography>
          <Tooltip title="Đăng xuất">
            <IconButton
              onClick={logout}
              sx={{ 
                color: '#666',
                '&:hover': { color: '#fff' }
              }}
            >
              <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
