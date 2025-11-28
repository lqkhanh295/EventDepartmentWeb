// WeatherWidget - Hiển thị thời tiết 7 ngày tiếp theo
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import BlurOnIcon from '@mui/icons-material/BlurOn';

// Map 7Timer weather type to icon
const getWeatherIcon = (weatherType) => {
  const weather = weatherType?.toLowerCase() || '';
  if (weather.includes('clear')) return <WbSunnyIcon sx={{ fontSize: 20, color: '#FFD700' }} />;
  if (weather.includes('pcloudy')) return <CloudIcon sx={{ fontSize: 20, color: '#888' }} />;
  if (weather.includes('mcloudy') || weather.includes('cloudy')) return <CloudIcon sx={{ fontSize: 20, color: '#666' }} />;
  if (weather.includes('humid') || weather.includes('fog')) return <BlurOnIcon sx={{ fontSize: 20, color: '#666' }} />;
  if (weather.includes('lightrain') || weather.includes('oshower') || weather.includes('ishower')) return <WaterDropIcon sx={{ fontSize: 20, color: '#2196F3' }} />;
  if (weather.includes('rain')) return <WaterDropIcon sx={{ fontSize: 20, color: '#1976D2' }} />;
  if (weather.includes('snow') || weather.includes('rainsnow')) return <AcUnitIcon sx={{ fontSize: 20, color: '#E0E0E0' }} />;
  if (weather.includes('ts') || weather.includes('tstorm')) return <ThunderstormIcon sx={{ fontSize: 20, color: '#9C27B0' }} />;
  return <WbSunnyIcon sx={{ fontSize: 20, color: '#FFD700' }} />;
};

// Map 7Timer weather type to Vietnamese description
const getWeatherDescription = (weatherType) => {
  const weather = weatherType?.toLowerCase() || '';
  if (weather.includes('clear')) return 'Trời nắng';
  if (weather.includes('pcloudy')) return 'Ít mây';
  if (weather.includes('mcloudy')) return 'Nhiều mây';
  if (weather.includes('cloudy')) return 'Có mây';
  if (weather.includes('humid') || weather.includes('fog')) return 'Sương mù';
  if (weather.includes('lightrain')) return 'Mưa nhẹ';
  if (weather.includes('oshower')) return 'Mưa rào';
  if (weather.includes('ishower')) return 'Mưa rải rác';
  if (weather.includes('rain')) return 'Mưa';
  if (weather.includes('snow')) return 'Tuyết';
  if (weather.includes('ts') || weather.includes('tstorm')) return 'Dông';
  return 'Nắng';
};

// Format date từ timepoint và init time
const formatDate = (timepoint, initTime, index) => {
  let date = new Date();
  
  try {
    if (initTime && typeof initTime === 'string' && initTime.length >= 10) {
      // Parse init time từ format "YYYYMMDDHH" (ví dụ: "2025112812")
      const year = parseInt(initTime.substring(0, 4), 10);
      const month = parseInt(initTime.substring(4, 6), 10) - 1; // month is 0-indexed
      const day = parseInt(initTime.substring(6, 8), 10);
      const hour = parseInt(initTime.substring(8, 10), 10);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour)) {
        date = new Date(year, month, day, hour);
        // Với civillight, mỗi timepoint là số giờ từ init time
        // Nhưng để đảm bảo chính xác, tính theo index (mỗi item = 1 ngày)
        // Hoặc nếu timepoint có giá trị, dùng timepoint / 24 để tính số ngày
        const tp = typeof timepoint === 'number' ? timepoint : parseInt(timepoint, 10) || 0;
        const daysToAdd = tp > 0 ? Math.floor(tp / 24) : (index || 0);
        date.setDate(date.getDate() + daysToAdd);
      } else {
        // Nếu parse initTime thất bại, dùng index
        date.setDate(date.getDate() + (index || 0));
      }
    } else {
      // Fallback: tính từ ngày hiện tại
      // Với civillight, mỗi item trong array là 1 ngày
      date.setDate(date.getDate() + (index || 0));
    }
  } catch (error) {
    // Nếu có lỗi, tính từ ngày hiện tại + index
    date = new Date();
    date.setDate(date.getDate() + (index || 0));
  }
  
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[date.getDay()] || 'CN';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${dayName}, ${day}/${month}`;
};

// Tính phần trăm mưa từ prec_type và prec_amount
const getRainChance = (precType, precAmount) => {
  if (precType === 'none' || !precType) return 0;
  
  // prec_amount: 0=none, 1=0-0.25mm/hr, 2=0.25-1mm/hr, 3=1-4mm/hr, 4=4-10mm/hr, ...
  // Map sang phần trăm: 0=0%, 1-2=20%, 3-4=40%, 5-6=60%, 7-8=80%, 9=100%
  if (precAmount === 0) return 0;
  if (precAmount <= 2) return 20;
  if (precAmount <= 4) return 40;
  if (precAmount <= 6) return 60;
  if (precAmount <= 8) return 80;
  return 100;
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [initTime, setInitTime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Coordinates cho Hồ Chí Minh
  const HCM_LAT = 10.8231;
  const HCM_LON = 106.6297;
  const CITY_NAME = 'Hồ Chí Minh';

  useEffect(() => {
    // Sử dụng 7Timer API (miễn phí, không cần API key)
    // Documentation: https://www.7timer.info/doc.php?lang=en
    // Product: civillight (7-day forecast, day-to-day)
    const API_URL = `http://www.7timer.info/bin/api.pl?lon=${HCM_LON}&lat=${HCM_LAT}&product=civillight&output=json`;

    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then(data => {
        // 7Timer trả về data với structure: { init: "...", dataseries: [...] }
        // dataseries là array các forecast, mỗi item là 1 ngày
        console.log('7Timer API Data:', data); // Debug
        if (data.dataseries && data.dataseries.length > 0) {
          // Lưu init time để tính ngày chính xác
          if (data.init) {
            console.log('Init time:', data.init); // Debug
            setInitTime(data.init);
          } else {
            // Nếu không có init, tính từ ngày hiện tại
            const now = new Date();
            const mockInit = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}`;
            console.log('Using fallback init time:', mockInit); // Debug
            setInitTime(mockInit);
          }
          // Đảm bảo temp2m là số, không phải object
          const processedData = data.dataseries.slice(0, 7).map(day => ({
            ...day,
            temp2m: typeof day.temp2m === 'object' && day.temp2m !== null 
              ? (day.temp2m.max || day.temp2m.min || day.temp2m) 
              : day.temp2m
          }));
          setWeather({ dataseries: processedData });
        } else {
          throw new Error('No data received');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('7Timer API error:', err);
        // Fallback to mock data on error
        const mockData = [];
        for (let i = 0; i < 7; i++) {
          mockData.push({
            timepoint: i * 24,
            cloudcover: i % 3 === 0 ? 1 : i % 3 === 1 ? 4 : 7,
            seeing: 0,
            transparency: 0,
            lifted_index: 2,
            rh2m: 70 + i * 2,
            wind10m: { direction: 'NE', speed: 2 },
            temp2m: 28 + Math.floor(Math.random() * 4),
            prec_type: i % 3 === 2 ? 'rain' : 'none',
            prec_amount: i % 3 === 2 ? (i % 2 === 0 ? 3 : 5) : 0,
            weather: i % 3 === 0 ? 'clearday' : i % 3 === 1 ? 'pcloudyday' : 'lightrainday'
          });
        }
        // Set init time cho mock data (ngày hiện tại)
        const now = new Date();
        const mockInit = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}`;
        setInitTime(mockInit);
        setWeather({ dataseries: mockData });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 2, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ color: '#FFD700' }} />
        </Box>
      </Paper>
    );
  }

  if (!weather || !weather.dataseries) return null;

  return (
    <Paper sx={{ p: 2, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 2 }}>
      <Typography variant="caption" sx={{ color: '#666', mb: 1.5, display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>
        Thời tiết 7 ngày tới - {CITY_NAME}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 } }}>
        {weather.dataseries.map((day, idx) => {
          const rainChance = getRainChance(day.prec_type, day.prec_amount);
          const temp = typeof day.temp2m === 'object' && day.temp2m !== null 
            ? (day.temp2m.max || day.temp2m.min || 0) 
            : (day.temp2m || 0);
          
          return (
            <Box
              key={idx}
              sx={{
                minWidth: 85,
                textAlign: 'center',
                p: 1.5,
                borderRadius: 1.5,
                background: '#121212',
                border: '1px solid #2a2a2a',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#FFD700',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block', mb: 1, fontWeight: 500 }}>
                {formatDate(day.timepoint, initTime, idx)}
              </Typography>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                {getWeatherIcon(day.weather)}
              </Box>
              <Typography variant="caption" sx={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 700, display: 'block', mb: 0.5 }}>
                {temp}°
              </Typography>
              <Typography variant="caption" sx={{ color: '#888', fontSize: '0.65rem', display: 'block', mb: 0.5, lineHeight: 1.2 }}>
                {getWeatherDescription(day.weather)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                <WaterDropIcon sx={{ fontSize: 12, color: rainChance > 0 ? '#2196F3' : '#666' }} />
                <Typography variant="caption" sx={{ color: rainChance > 0 ? '#2196F3' : '#666', fontSize: '0.65rem', fontWeight: 500 }}>
                  {rainChance}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default WeatherWidget;

