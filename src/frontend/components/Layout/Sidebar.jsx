// Sidebar Component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

const DRAWER_WIDTH = 240;

const menuItems = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: <GridViewOutlinedIcon />,
    path: '/'
  },
  {
    id: 'vendors',
    label: 'Vendor',
    icon: <StorefrontOutlinedIcon />,
    path: '/vendors'
  },
  {
    id: 'event-guide',
    label: 'Event Guide',
    icon: <AutoStoriesOutlinedIcon />,
    path: '/event-guide'
  },
  {
    id: 'tax-lookup',
    label: 'Tra cứu MST',
    icon: <SearchOutlinedIcon />,
    path: '/tax-lookup'
  },
  {
    id: 'paperwork',
    label: 'Hợp đồng',
    icon: <DescriptionOutlinedIcon />,
    path: '/paperwork'
  }
];

const Sidebar = ({ open, onClose }) => {
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

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#121212'
      }}
    >
      {/* Spacer for AppBar */}
      <Box sx={{ height: 64 }} />
      
      {/* Menu Label */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#666',
            fontWeight: 500,
            letterSpacing: 1,
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
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1.25,
                  px: 2,
                  background: isActive ? '#1a1a1a' : 'transparent',
                  '&:hover': {
                    background: '#1a1a1a'
                  },
                  transition: 'background 0.15s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#FFD700' : '#666',
                    minWidth: 36
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#fff' : '#999',
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ color: '#444', fontSize: '0.75rem' }}>
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
              background: '#121212',
              borderRight: '1px solid #2a2a2a'
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
              background: '#121212',
              borderRight: '1px solid #2a2a2a'
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
