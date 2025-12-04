// EmptyState Component
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const EmptyState = ({ 
  icon: Icon = InboxIcon,
  title = 'Không có dữ liệu',
  description = 'Chưa có dữ liệu nào được thêm.',
  actionText,
  onAction
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        textAlign: 'center',
        p: 4
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3
        }}
      >
        <Icon sx={{ fontSize: 48, color: '#FFD700', opacity: 0.7 }} />
      </Box>
      
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: '#fff',
          mb: 1
        }}
      >
        {title}
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          color: '#888',
          maxWidth: 400,
          mb: 3
        }}
      >
        {description}
      </Typography>
      
      {actionText && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            background: '#FFD700',
            color: '#1a1a1a',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            '&:hover': {
              background: '#FFE44D'
            }
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;

