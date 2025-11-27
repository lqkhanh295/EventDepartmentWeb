// PageHeader Component
import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actionText,
  actionIcon: ActionIcon,
  onAction
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#666' }} />}
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, idx) => (
            idx === breadcrumbs.length - 1 ? (
              <Typography
                key={idx}
                variant="body2"
                sx={{ color: '#FFD700' }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={idx}
                component="button"
                variant="body2"
                onClick={() => navigate(crumb.path)}
                sx={{
                  color: '#888',
                  textDecoration: 'none',
                  '&:hover': { color: '#FFD700' }
                }}
              >
                {crumb.label}
              </Link>
            )
          ))}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{ color: '#888' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actionText && onAction && (
          <Button
            variant="contained"
            onClick={onAction}
            startIcon={ActionIcon && <ActionIcon />}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #CCB000 100%)',
              color: '#1a1a1a',
              fontWeight: 600,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFE44D 0%, #FFD700 100%)',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)'
              }
            }}
          >
            {actionText}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;

