// Dashboard Page - Trang tổng quan
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../components';
import WeatherWidget from '../components/Weather/WeatherWidget';
import { getAllVendors } from '../../backend/services/vendorService';
import { getAllGuides } from '../../backend/services/guideService';
import logoCsg from '../../image/logocsg.png';

const StatCard = ({ title, value, onClick, index = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const springProps = useSpring({
    transform: hovered && onClick ? 'translateY(-4px)' : 'translateY(0px)',
    boxShadow: hovered && onClick 
      ? '0 8px 24px rgba(255, 215, 0, 0.15)' 
      : '0 0px 0px rgba(255, 215, 0, 0)',
    config: { tension: 300, friction: 20 }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1]
      }}
      style={{ height: '100%' }}
    >
      <animated.div style={springProps}>
        <Card
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          component={motion.div}
          whileTap={onClick ? { scale: 0.98 } : {}}
          sx={{
            cursor: onClick ? 'pointer' : 'default',
            background: hovered && onClick ? '#1f1f1f' : '#1a1a1a',
            border: '1px solid',
            borderColor: hovered && onClick ? '#FFD700' : '#333333',
            borderRadius: 2,
            height: '100%',
            transition: 'background 0.3s ease, border-color 0.3s ease'
          }}
        >
    <CardContent sx={{ p: 3.5 }}>
      <Box>
        <Typography
          variant="body2"
          sx={{ 
            color: '#B3B3B3', 
            mb: 1.5, 
            fontWeight: 500, 
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: '#FFFFFF',
            fontSize: { xs: '1.875rem', sm: '2.25rem' },
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
      </animated.div>
    </motion.div>
  );
};

const QuickActionCard = ({ title, description, onClick, index = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const springProps = useSpring({
    transform: hovered ? 'translateY(-6px)' : 'translateY(0px)',
    boxShadow: hovered 
      ? '0 12px 32px rgba(255, 215, 0, 0.2)' 
      : '0 0px 0px rgba(255, 215, 0, 0)',
    config: { tension: 300, friction: 20 }
  });

  const arrowSpring = useSpring({
    transform: hovered ? 'translateX(6px)' : 'translateX(0px)',
    color: hovered ? '#FFD700' : '#999',
    config: { tension: 300, friction: 20 }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1]
      }}
      style={{ height: '100%' }}
    >
      <animated.div style={springProps}>
        <Card
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          component={motion.div}
          whileTap={{ scale: 0.98 }}
          sx={{
            cursor: 'pointer',
            background: hovered ? '#1f1f1f' : '#1a1a1a',
            border: '1px solid',
            borderColor: hovered ? '#FFD700' : '#333333',
            borderRadius: 2,
            height: '100%',
            transition: 'background 0.3s ease, border-color 0.3s ease'
          }}
        >
    <CardContent sx={{ p: 3.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography
          variant="body1"
          sx={{ 
            fontWeight: 600, 
            color: '#FFFFFF', 
            fontSize: '1.1rem',
            letterSpacing: '0.2px',
            flex: 1
          }}
        >
          {title}
        </Typography>
        <animated.div style={arrowSpring}>
          <ArrowForwardIcon 
            className="arrow-icon"
            sx={{ fontSize: 20, ml: 1 }} 
          />
        </animated.div>
      </Box>
      <Typography
        variant="body2"
        sx={{ 
          color: '#B3B3B3', 
          fontSize: '0.875rem',
          lineHeight: 1.5
        }}
      >
        {description}
      </Typography>
    </CardContent>
  </Card>
      </animated.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    vendors: 0,
    guides: 0
  });

  const mergeVendors = (vendorList) => {
    const merged = {};
    vendorList.forEach(vendor => {
      const normalizedName = (vendor.name || '').toLowerCase().trim();
      const normalizedContact = (vendor.contact || '').toLowerCase().trim();
      const normalizedBuyDetail = (vendor.buyDetail || '').toLowerCase().trim();
      const key = `${normalizedName}_${normalizedContact}_${normalizedBuyDetail}`;
      if (!merged[key]) {
        merged[key] = vendor;
      }
    });
    return Object.values(merged);
  };

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const [vendors, guides] = await Promise.all([
        getAllVendors().catch(() => []),
        getAllGuides().catch(() => [])
      ]);
      
      const mergedVendors = mergeVendors(vendors);
      
      setStats({
        vendors: mergedVendors.length,
        guides: guides.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return <Loading message="Đang tải dữ liệu..." />;
  }

  return (
    <Box>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Box
          sx={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 2,
            p: { xs: 3, md: 4 },
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Box
              component="img"
              src={logoCsg}
              alt="Cóc Sài Gòn Logo"
              sx={{
                height: { xs: 36, sm: 44 },
                width: 'auto'
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#fff',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Event Department
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: '#666', maxWidth: 500, fontSize: '0.9rem' }}
          >
            Hệ thống quản lý thông tin Ban Event - CLB Truyền thông Cóc Sài Gòn
          </Typography>
        </Box>
      </motion.div>

      {/* Statistics */}
      <Typography
        variant="body2"
        sx={{ 
          color: '#B3B3B3', 
          mb: 3, 
          fontWeight: 600, 
          textTransform: 'uppercase', 
          letterSpacing: 1.5,
          fontSize: '0.8rem'
        }}
      >
        Thống kê
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Vendor"
            value={stats.vendors}
            onClick={() => navigate('/vendors')}
            index={0}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Nhân sự"
            value="103"
            onClick={() => navigate('/event-guide')}
            index={1}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Số dự án còn lại trong kỳ"
            value="0"
            index={2}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Contact"
            value="Minh Đức"
            onClick={() => window.open('https://www.facebook.com/minh.uc.287528', '_blank')}
            index={3}
          />
        </Grid>
      </Grid>

      {/* Weather Widget */}
      <Box sx={{ mb: 4 }}>
        <WeatherWidget />
      </Box>

      {/* Quick Actions */}
      <Typography
        variant="body2"
        sx={{ 
          color: '#B3B3B3', 
          mb: 3, 
          fontWeight: 600, 
          textTransform: 'uppercase', 
          letterSpacing: 1.5,
          fontSize: '0.8rem'
        }}
      >
        Truy cập nhanh
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Danh sách Vendor"
            description="Quản lý thông tin vendor"
            onClick={() => navigate('/vendors')}
            index={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Event Guide"
            description="Hướng dẫn tổ chức sự kiện"
            onClick={() => navigate('/event-guide')}
            index={1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Tra cứu MST"
            description="Tra cứu mã số thuế doanh nghiệp"
            onClick={() => navigate('/tax-lookup')}
            index={2}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
