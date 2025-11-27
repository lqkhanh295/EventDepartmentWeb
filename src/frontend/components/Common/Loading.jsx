// Loading Component - Minimalist
import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import logoCsg from '../../../image/logocsg.png';

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Loading = ({ message = 'Đang tải...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 3
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Spinner ring */}
        <Box
          sx={{
            position: 'absolute',
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid #2a2a2a',
            borderTopColor: '#FFD700',
            animation: `${spin} 1s linear infinite`
          }}
        />
        
        {/* Logo */}
        <Box
          component="img"
          src={logoCsg}
          alt="Loading"
          sx={{
            width: 40,
            height: 40,
            objectFit: 'contain',
            animation: `${pulse} 2s ease-in-out infinite`
          }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: '#666',
          fontWeight: 400,
          fontSize: '0.85rem'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
