// Trang tra cứu mã số thuế doanh nghiệp
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import { PageHeader } from '../components/Common';

const TaxLookupPage = () => {
  const [taxCode, setTaxCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!taxCode.trim()) {
      setError('Vui lòng nhập mã số thuế');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Sử dụng API tra cứu MST miễn phí
      const response = await fetch(
        `https://api.vietqr.io/v2/business/${taxCode.trim()}`
      );
      
      const data = await response.json();
      
      if (data.code === '00' && data.data) {
        setResult(data.data);
      } else {
        setError('Không tìm thấy thông tin doanh nghiệp với mã số thuế này');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Có lỗi xảy ra khi tra cứu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
      <Box sx={{ color: '#FFD700', mt: 0.3 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
          {value || 'Chưa có thông tin'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Tra cứu Mã số thuế"
        subtitle="Kiểm tra thông tin doanh nghiệp qua mã số thuế"
      />

      {/* Search Box */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: '#1e1e1e',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            label="Nhập mã số thuế"
            placeholder="Ví dụ: 0123456789"
            value={taxCode}
            onChange={(e) => {
              setTaxCode(e.target.value.replace(/[^0-9-]/g, ''));
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{
              flex: 1,
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                background: '#252525',
                '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.3)' },
                '&:hover fieldset': { borderColor: '#FFD700' },
                '&.Mui-focused fieldset': { borderColor: '#FFD700' }
              },
              '& .MuiInputLabel-root': { color: '#888' },
              '& .MuiInputBase-input': { color: '#fff' }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{
              px: 4,
              height: 56,
              background: 'linear-gradient(135deg, #FFD700 0%, #CCB000 100%)',
              color: '#1a1a1a',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFE44D 0%, #FFD700 100%)'
              },
              '&.Mui-disabled': {
                background: '#333',
                color: '#666'
              }
            }}
          >
            {loading ? 'Đang tra...' : 'Tra cứu'}
          </Button>
        </Box>

        {error && (
          <Typography sx={{ color: '#f44336', mt: 2, fontSize: '0.9rem' }}>
            {error}
          </Typography>
        )}
      </Paper>

      {/* Result */}
      {result && (
        <Paper
          sx={{
            p: 3,
            background: '#1e1e1e',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Thông tin doanh nghiệp
            </Typography>
            <Chip
              label="Đã xác thực"
              size="small"
              sx={{
                background: '#4CAF501A',
                color: '#4CAF50',
                fontWeight: 500
              }}
            />
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)', mb: 2 }} />

          <InfoRow
            icon={<BadgeIcon />}
            label="Mã số thuế"
            value={result.id}
          />
          <InfoRow
            icon={<BusinessIcon />}
            label="Tên doanh nghiệp"
            value={result.name}
          />
          <InfoRow
            icon={<BusinessIcon />}
            label="Tên quốc tế"
            value={result.internationalName}
          />
          <InfoRow
            icon={<BusinessIcon />}
            label="Tên viết tắt"
            value={result.shortName}
          />
          <InfoRow
            icon={<LocationOnIcon />}
            label="Địa chỉ"
            value={result.address}
          />

          <Box sx={{ mt: 3, p: 2, background: '#252525', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Lưu ý: Thông tin được tra cứu từ cơ sở dữ liệu công khai. 
              Vui lòng xác minh lại với nhà cung cấp trước khi giao dịch.
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Instructions */}
      {!result && !loading && (
        <Paper
          sx={{
            p: 3,
            background: '#1e1e1e',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: 3
          }}
        >
          <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
            Hướng dẫn sử dụng
          </Typography>
          <Box component="ul" sx={{ color: '#b3b3b3', pl: 2 }}>
            <li>Nhập mã số thuế của doanh nghiệp (10-14 số)</li>
            <li>Nhấn "Tra cứu" hoặc Enter để tìm kiếm</li>
            <li>Kết quả sẽ hiển thị thông tin đăng ký kinh doanh</li>
            <li>Sử dụng để xác minh thông tin nhà cung cấp trước khi hợp tác</li>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TaxLookupPage;

