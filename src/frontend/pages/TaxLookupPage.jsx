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
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CategoryIcon from '@mui/icons-material/Category';
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
        console.log('API Response:', data.data); // Debug để xem cấu trúc dữ liệu
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
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)', mb: 2 }} />

          {/* Tên công ty */}
          <InfoRow
            icon={<BusinessIcon />}
            label="Tên công ty"
            value={result.name || result.shortName || result.internationalName}
          />

          {/* Xác thực */}
          <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
            <Box sx={{ color: '#FFD700', mt: 0.3 }}><VerifiedIcon /></Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                Xác thực
              </Typography>
              <Chip
                label={result.verified !== false ? "Đã xác thực" : "Chưa xác thực"}
                size="small"
                sx={{
                  background: result.verified !== false ? '#4CAF501A' : '#f443361A',
                  color: result.verified !== false ? '#4CAF50' : '#f44336',
                  fontWeight: 500,
                  mt: 0.5
                }}
              />
            </Box>
          </Box>

          {/* Còn hoạt động hay không */}
          <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
            <Box sx={{ color: '#FFD700', mt: 0.3 }}>
              {result.status === 'active' || result.active !== false ? 
                <CheckCircleIcon sx={{ color: '#4CAF50' }} /> : 
                <CancelIcon sx={{ color: '#f44336' }} />}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                Trạng thái hoạt động
              </Typography>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, mt: 0.5 }}>
                {result.status === 'active' || result.active !== false ? 
                  'Đang hoạt động' : 
                  result.status === 'inactive' || result.active === false ? 
                  'Ngừng hoạt động' : 
                  'Chưa xác định'}
              </Typography>
            </Box>
          </Box>

          {/* Ngành nghề kinh doanh */}
          <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
            <Box sx={{ color: '#FFD700', mt: 0.3 }}><CategoryIcon /></Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
                Ngành nghề kinh doanh
              </Typography>
              {(() => {
                // Kiểm tra nhiều field có thể có từ API
                const businessInfo = result.businessLines || 
                                    result.businessLine || 
                                    result.industries || 
                                    result.industry ||
                                    result.businessType ||
                                    result.businessTypes ||
                                    result.nganhNghe ||
                                    result.businessActivities ||
                                    result.activities ||
                                    result.description;
                
                if (businessInfo) {
                  const linesArray = Array.isArray(businessInfo) ? businessInfo : 
                                   (typeof businessInfo === 'string' ? businessInfo.split(',').map(s => s.trim()) : [businessInfo]);
                  const filteredLines = linesArray.filter(Boolean);
                  
                  if (filteredLines.length > 0) {
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {filteredLines.map((line, idx) => (
                          <Chip
                            key={idx}
                            label={line}
                            size="small"
                            sx={{
                              background: 'rgba(255, 215, 0, 0.1)',
                              color: '#FFD700',
                              border: '1px solid rgba(255, 215, 0, 0.3)',
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    );
                  }
                }
                
                return (
                  <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                    Chưa có thông tin
                  </Typography>
                );
              })()}
            </Box>
          </Box>

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

