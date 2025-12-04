// VendorCard Component
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';

const VendorCard = ({ vendor, onEdit, onDelete }) => {
  const {
    name,
    category,
    description,
    phone,
    email,
    address,
    services = [],
    rating,
    priceRange
  } = vendor;

  const getCategoryColor = (cat) => {
    const colors = {
      'Âm thanh': '#FF6B6B',
      'Ánh sáng': '#4ECDC4',
      'Sân khấu': '#45B7D1',
      'Trang trí': '#96CEB4',
      'Catering': '#FFEAA7',
      'Photo/Video': '#DDA0DD',
      'MC': '#98D8C8',
      'default': '#FFD700'
    };
    return colors[cat] || colors.default;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e',
        border: '1px solid rgba(255, 215, 0, 0.1)',
        borderRadius: 2,
        transition: 'all 0.15s ease',
        '&:hover': {
          border: '1px solid rgba(255, 215, 0, 0.3)',
          boxShadow: 'none'
        }
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#fff',
                mb: 0.5,
                fontSize: '1.1rem'
              }}
            >
              {name}
            </Typography>
            <Chip
              label={category}
              size="small"
              sx={{
                background: `${getCategoryColor(category)}20`,
                color: getCategoryColor(category),
                border: `1px solid ${getCategoryColor(category)}40`,
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            />
          </Box>
          
          {rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ color: '#FFD700', fontSize: 18 }} />
              <Typography
                variant="body2"
                sx={{ color: '#FFD700', fontWeight: 600 }}
              >
                {rating}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            sx={{
              color: '#b3b3b3',
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {description}
          </Typography>
        )}

        {/* Services */}
        {services.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: '#888', fontWeight: 600, mb: 1, display: 'block' }}
            >
              Dịch vụ:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {services.slice(0, 3).map((service, idx) => (
                <Chip
                  key={idx}
                  label={service}
                  size="small"
                  sx={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    color: '#FFD700',
                    fontSize: '0.65rem',
                    height: 22
                  }}
                />
              ))}
              {services.length > 3 && (
                <Chip
                  label={`+${services.length - 3}`}
                  size="small"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#888',
                    fontSize: '0.65rem',
                    height: 22
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Contact Info */}
        <Box sx={{ mt: 'auto' }}>
          {phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <PhoneIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
              <Typography variant="body2" sx={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                {phone}
              </Typography>
            </Box>
          )}
          
          {email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <EmailIcon sx={{ color: '#2196F3', fontSize: 16 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#b3b3b3', 
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {email}
              </Typography>
            </Box>
          )}
          
          {address && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LocationOnIcon sx={{ color: '#FF9800', fontSize: 16, mt: 0.2 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#b3b3b3', 
                  fontSize: '0.85rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {address}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price Range */}
        {priceRange && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid rgba(255, 215, 0, 0.1)'
            }}
          >
            <Typography variant="caption" sx={{ color: '#888' }}>
              Mức giá: 
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#FFD700', fontWeight: 600, display: 'inline', ml: 0.5 }}
            >
              {priceRange}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          px: 2,
          pb: 2,
          pt: 0
        }}
      >
        <Tooltip title="Chỉnh sửa">
          <IconButton
            size="small"
            onClick={() => onEdit(vendor)}
            sx={{
              color: '#888',
              '&:hover': { color: '#FFD700', background: 'rgba(255, 215, 0, 0.1)' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa">
          <IconButton
            size="small"
            onClick={() => onDelete(vendor)}
            sx={{
              color: '#888',
              '&:hover': { color: '#f44336', background: 'rgba(244, 67, 54, 0.1)' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

export default VendorCard;

