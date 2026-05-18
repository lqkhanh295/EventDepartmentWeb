// Dashboard Page - Trang tổng quan
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../components';
import WeatherWidget from '../components/Weather/WeatherWidget';
import StatCard from '../components/Dashboard/StatCard';
import QuickActionCard from '../components/Dashboard/QuickActionCard';
import { getAllVendors } from '../../services/services/vendorService';
import { getAllGuides } from '../../services/services/guideService';
import logoCsg from '../../image/logocsg.png';

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
    <Box sx={{ position: 'relative' }}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Box
          sx={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
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
            value="130"
            index={1}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Số dự án còn lại trong kỳ"
            value="3"
            index={2}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Contact"
            value="Minh Trung"
            onClick={() => window.open('https://www.facebook.com/vmtrung20', '_blank')}
            index={3}
          />
        </Grid>
      </Grid>

      {/* Weather Widget */}
      <Box sx={{ mb: 4, borderRadius: 50 }}>
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
