// Sidebar Component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
// Minimal icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';

const DRAWER_WIDTH = 240;

const menuItems = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: DashboardIcon,
    path: '/'
  },
  {
    id: 'vendors',
    label: 'Vendor',
    icon: StoreIcon,
    path: '/vendors'
  },
  {
    id: 'members',
    label: 'Members',
    icon: PeopleIcon,
    path: '/members'
  },
  {
    id: 'event-guide',
    label: 'Event Guide',
    icon: MenuBookIcon,
    path: '/event-guide'
  },
  {
    id: 'tax-lookup',
    label: 'Tra cứu MST',
    icon: SearchIcon,
    path: '/tax-lookup'
  },
  {
    id: 'paperwork',
    label: 'Hợp đồng',
    icon: DescriptionIcon,
    path: '/paperwork'
  }
];

const Sidebar = ({ open, onClose, isAdmin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const bgColor = isAdmin ? '#1a1a0a' : '#121212';
  const borderColor = isAdmin ? 'rgba(255, 215, 0, 0.2)' : '#2a2a2a';

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: bgColor
      }}
    >
      {/* Spacer for AppBar */}
      <Box sx={{ height: 64 }} />
      
      {/* Menu Label */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontWeight: 600,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            fontSize: '0.7rem'
          }}
        >
          Menu
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.75, px: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1,
                  py: 1.5,
                  px: 2,
                  background: isActive 
                    ? 'rgba(255, 215, 0, 0.1)' 
                    : 'transparent',
                  border: isActive ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    background: isActive 
                      ? 'rgba(255, 215, 0, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderColor: isActive ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateX(4px)'
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#FFD700' : '#999',
                    minWidth: 32,
                    '& svg': {
                      fontSize: 18
                    }
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FFFFFF' : '#B3B3B3',
                    fontSize: '0.9rem',
                    letterSpacing: '0.3px'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 3, pt: 2 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#666', 
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}
        >
          v1.0 · Fall 2025
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              background: bgColor,
              borderRight: `1px solid ${borderColor}`
            }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Drawer */
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              background: bgColor,
              borderRight: `1px solid ${borderColor}`
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
