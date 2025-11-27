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
import logoCsg from '../../../image/logocsg.png';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: '#121212',
        borderBottom: '1px solid #2a2a2a'
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
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              CSG Event
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
