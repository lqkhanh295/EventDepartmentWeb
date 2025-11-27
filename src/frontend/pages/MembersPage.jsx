// MembersPage - Trang chọn kỳ học
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import { PageHeader } from '../components';

const semesters = [
  {
    id: 'spring',
    name: 'Spring',
    nameVi: 'Xuân',
    icon: <FilterDramaIcon sx={{ fontSize: 60 }} />,
    color: '#4CAF50',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    description: 'Tháng 1 - 4'
  },
  {
    id: 'summer',
    name: 'Summer',
    nameVi: 'Hè',
    icon: <WbSunnyIcon sx={{ fontSize: 60 }} />,
    color: '#FF9800',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
    description: 'Tháng 5 - 8'
  },
  {
    id: 'fall',
    name: 'Fall',
    nameVi: 'Thu',
    icon: <AcUnitIcon sx={{ fontSize: 60 }} />,
    color: '#2196F3',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
    description: 'Tháng 9 - 12'
  }
];

const MembersPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleSelectSemester = (semesterId) => {
    navigate(`/members/${semesterId}`);
  };

  return (
    <Box>
      <PageHeader
        title="Quản lý Members"
        subtitle="Chọn kỳ học để xem bảng điểm thành viên"
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Members', path: '/members' }
        ]}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {semesters.map((semester) => (
          <Grid item xs={12} sm={6} md={4} key={semester.id}>
            <Paper
              onClick={() => handleSelectSemester(semester.id)}
              sx={{
                p: 4,
                cursor: 'pointer',
                background: '#1e1e1e',
                border: '2px solid transparent',
                borderRadius: 4,
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: `2px solid ${semester.color}`,
                  transform: 'translateY(-8px)',
                  boxShadow: `0 20px 40px ${semester.color}30`
                }
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: semester.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  color: '#fff',
                  boxShadow: `0 8px 24px ${semester.color}40`
                }}
              >
                {semester.icon}
              </Box>

              {/* Name */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: semester.color,
                  mb: 0.5
                }}
              >
                {semester.name}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#888',
                  mb: 1
                }}
              >
                {semester.nameVi} {currentYear}
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  fontSize: '0.9rem'
                }}
              >
                {semester.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Note */}
      <Box
        sx={{
          mt: 4,
          p: 2,
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" sx={{ color: '#666' }}>
          Chọn kỳ học để xem và quản lý điểm của các thành viên trong kỳ đó
        </Typography>
      </Box>
    </Box>
  );
};

export default MembersPage;
