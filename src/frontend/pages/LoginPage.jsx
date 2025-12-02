// Trang đăng nhập
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import logoCsg from '../../image/logocsg.png';

const LoginPage = () => {
  const { user, loading, error, loginWithGoogle, loginWithMock } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await loginWithGoogle();
    setIsLoggingIn(false);
  };

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
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          background: '#121212',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 2,
          p: 4
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src={logoCsg}
          alt="CSG Logo"
          sx={{ 
            width: 80,
            height: 'auto',
            mb: 4
          }}
        />

        {/* Title */}
        <Typography variant="h6" sx={{ color: '#fff', mb: 0.5, fontWeight: 500 }}>
          Event Department
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
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

        {/* Google Login Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={isLoggingIn ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          sx={{
            py: 1.5,
            background: '#fff',
            color: '#121212',
            fontWeight: 500,
            fontSize: '0.9rem',
            textTransform: 'none',
            borderRadius: 1.5,
            boxShadow: 'none',
            mb: 2,
            '&:hover': {
              background: '#f5f5f5',
              boxShadow: 'none'
            },
            '&.Mui-disabled': {
              background: '#2a2a2a',
              color: '#666'
            }
          }}
        >
          {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
        </Button>

        {/* Divider */}
        <Divider sx={{ my: 3, borderColor: '#333' }}>
          <Typography variant="caption" sx={{ color: '#666', px: 2 }}>
            HOẶC
          </Typography>
        </Divider>

        {/* Mock Login Buttons */}
        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2, textAlign: 'left' }}>
          Mock Login (Development):
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="medium"
            onClick={() => handleMockLogin('admin')}
            disabled={isLoggingIn}
            sx={{
              py: 1.2,
              borderColor: '#FFD700',
              color: '#FFD700',
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              borderRadius: 1.5,
              '&:hover': {
                borderColor: '#FFC700',
                background: 'rgba(255, 215, 0, 0.1)'
              },
              '&.Mui-disabled': {
                borderColor: '#2a2a2a',
                color: '#666'
              }
            }}
          >
            Mock Admin
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="medium"
            onClick={() => handleMockLogin('member')}
            disabled={isLoggingIn}
            sx={{
              py: 1.2,
              borderColor: '#4ECDC4',
              color: '#4ECDC4',
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              borderRadius: 1.5,
              '&:hover': {
                borderColor: '#4ECDC4',
                background: 'rgba(78, 205, 196, 0.1)'
              },
              '&.Mui-disabled': {
                borderColor: '#2a2a2a',
                color: '#666'
              }
            }}
          >
            Mock Member
          </Button>
        </Box>

        {/* Footer */}
        <Typography variant="caption" sx={{ color: '#444', display: 'block', mt: 4 }}>
          Chỉ thành viên Ban Event có quyền truy cập
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
