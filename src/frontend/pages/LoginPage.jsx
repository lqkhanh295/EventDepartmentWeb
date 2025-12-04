// Trang đăng nhập
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import logoCsg from '../../image/logocsg.png';

const LoginPage = () => {
  const { user, loading, error, loginWithMock } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleMockLogin = (userType) => {
    setIsLoggingIn(true);
    loginWithMock(userType);
    setTimeout(() => {
      setIsLoggingIn(false);
    }, 300);
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0a0a'
      }}>
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        p: 3
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          background: '#121212',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 3,
          p: 5,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src={logoCsg}
          alt="CSG Logo"
          sx={{ 
            width: 100,
            height: 'auto',
            mb: 3
          }}
        />

        {/* Title */}
        <Typography 
          variant="h5" 
          sx={{ 
            color: '#fff', 
            mb: 1, 
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Event Department
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#888', 
            mb: 4,
            fontSize: '0.9rem'
          }}
        >
          Đăng nhập để tiếp tục
        </Typography>

        {/* Error */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '& .MuiAlert-icon': { color: '#ef4444' },
              textAlign: 'left',
              whiteSpace: 'nowrap'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Login Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => handleMockLogin('admin')}
            disabled={isLoggingIn}
            sx={{
              py: 1.8,
              borderColor: '#FFD700',
              borderWidth: 2,
              color: '#fff',
              background: '#121212',
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#FFD700',
                borderWidth: 2,
                background: 'rgba(255, 215, 0, 0.1)',
                boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
              },
              '&.Mui-disabled': {
                borderColor: '#2a2a2a',
                color: '#666',
                background: '#121212'
              }
            }}
          >
            Admin
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => handleMockLogin('member')}
            disabled={isLoggingIn}
            sx={{
              py: 1.8,
              borderColor: '#FFD700',
              borderWidth: 2,
              color: '#fff',
              background: '#121212',
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#FFD700',
                borderWidth: 2,
                background: 'rgba(255, 215, 0, 0.1)',
                boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
              },
              '&.Mui-disabled': {
                borderColor: '#2a2a2a',
                color: '#666',
                background: '#121212'
              }
            }}
          >
            Member
          </Button>
        </Box>

       
      </Box>
    </Box>
  );
};

export default LoginPage;
