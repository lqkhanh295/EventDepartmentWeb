// Sidebar Component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
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
import ImageIcon from '@mui/icons-material/Image';
import InventoryIcon from '@mui/icons-material/Inventory2';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

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
    label: 'Tạo mã QR',
    icon: QrCode2Icon,
    path: '/qr-generator'
  },
  {
    id: 'agenda-formatter',
    label: 'Format Kịch bản',
    icon: AutoFixHighIcon,
    path: '/agenda-formatter'
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
    id: 'remove-bg',
    label: 'Xóa Background',
    icon: ImageIcon,
    path: '/remove-bg'
  }
];

// Inject Inventory menu item (after vendors)
menuItems.splice(2, 0, {
  id: 'inventory',
  label: 'Kho vật phẩm',
  icon: InventoryIcon,
  path: '/inventory'
});

const Sidebar = ({ open, onClose, isAdmin: isAdminProp }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  // Lấy isAdmin từ context - đây là nguồn chính xác nhất
  const { isAdmin: userIsAdmin, loading: authLoading } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  // Dùng userIsAdmin từ context thay vì props
  // Sidebar màu đen (#121212) cho member, vàng (#1a1a0a) cho admin
  const bgColor = userIsAdmin ? '#1a1a0a' : '#121212'; // Đen đậm cho member
  const borderColor = userIsAdmin ? 'rgba(255, 215, 0, 0.2)' : '#2a2a2a'; // Border đen cho member

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: { xs: 1, sm: 2 },
        pb: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2 },
        fontSize: { xs: '0.95rem', sm: '1rem' },
        width: { xs: '100vw', sm: DRAWER_WIDTH },
        minWidth: { xs: '60vw', sm: DRAWER_WIDTH },
        maxWidth: DRAWER_WIDTH,
        boxSizing: 'border-box',
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
        {menuItems
          .filter(item => {
            // ẨN HOÀN TOÀN menu "Members" nếu không phải admin
            if (item.id === 'members') {
              // Luôn ẩn khi đang loading auth (chưa xác định được quyền)
              if (authLoading === true) {
                return false;
              }
              // CHẶN CHẶT: Chỉ hiển thị nếu userIsAdmin === true (chắc chắn là admin)
              // Nếu userIsAdmin là false, undefined, null, hoặc bất kỳ giá trị nào khác → ẨN
              const shouldShow = userIsAdmin === true;
              if (!shouldShow) {
                return false; // Ẩn menu Members
              }
              return true; // Chỉ hiển thị khi chắc chắn là admin
            }
            return true; // Các menu khác hiển thị bình thường
          })
          .map((item, idx) => {
            const isActive = location.pathname === item.path ||
              (item.id === 'members' && location.pathname.startsWith('/members'));
            const Icon = item.icon;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.75, px: 1 }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.04,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  style={{ width: '100%' }}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: '100%' }}
                  >
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
                          borderColor: isActive ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)'
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
                          letterSpacing: '0.3px',
                          noWrap: true,
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }}
                      />
                    </ListItemButton>
                  </motion.div>
                </motion.div>
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
          v2.0 · Spring 2026
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
