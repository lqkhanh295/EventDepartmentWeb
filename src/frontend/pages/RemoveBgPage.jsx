// Remove Background Page - Xóa background từ ảnh sử dụng remove.bg API
import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { PageHeader } from '../components';
import { removeBackground, downloadImage, blobToUrl } from '../../backend/services/removeBgService';

const RemoveBgPage = () => {
  const [apiKey, setApiKey] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Lấy API key từ localStorage nếu có
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('removebg_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Lưu API key vào localStorage
  const handleApiKeyChange = (value) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem('removebg_api_key', value);
    } else {
      localStorage.removeItem('removebg_api_key');
    }
  };

  // Xử lý chọn file
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ định dạng: JPEG, PNG, WebP');
      return;
    }

    // Kiểm tra kích thước (12MB)
    const maxSize = 12 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Kích thước file không được vượt quá 12MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    setSuccess('');
    setResultBlob(null);
    setResultUrl(null);

    // Tạo preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý xóa background
  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    if (!apiKey) {
      setError('Vui lòng nhập API key từ remove.bg');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const blob = await removeBackground(selectedFile, apiKey, {
        size: 'auto',
        format: 'png'
      });

      setResultBlob(blob);
      const url = blobToUrl(blob);
      setResultUrl(url);
      setSuccess('Xóa background thành công!');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa background');
      setResultBlob(null);
      setResultUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // Tải ảnh về
  const handleDownload = () => {
    if (resultBlob) {
      const filename = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'removed-background';
      downloadImage(resultBlob, `${filename}_no_bg.png`);
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setResultUrl(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <PageHeader
        title="Xóa Background Ảnh"
        subtitle="Sử dụng API remove.bg để xóa background tự động"
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Xóa Background' }
        ]}
      />

      <Stack spacing={3} sx={{ mt: 3 }}>
        {/* API Key Input */}
        <Paper sx={{ p: 3, background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 600 }}>
            Cấu hình API Key
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Remove.bg API Key"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Nhập API key từ remove.bg"
            helperText="Lấy API key miễn phí tại: https://www.remove.bg/api"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: '#121212',
                borderRadius: 1,
                '& fieldset': { borderColor: '#333333' },
                '&:hover fieldset': { borderColor: '#FFD700' },
                '&.Mui-focused fieldset': { borderColor: '#FFD700' }
              },
              '& .MuiInputLabel-root': { color: '#B3B3B3' },
              '& .MuiInputBase-input': { color: '#FFFFFF' },
              '& .MuiFormHelperText-root': { color: '#888' }
            }}
          />
        </Paper>

        {/* Upload Section */}
        <Paper sx={{ p: 3, background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2, fontWeight: 600 }}>
            Upload Ảnh
          </Typography>

          {!previewUrl ? (
            <Box
              sx={{
                border: '2px dashed #333333',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#FFD700',
                  background: 'rgba(255, 215, 0, 0.05)'
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <ImageIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
              <Typography sx={{ color: '#B3B3B3', mb: 1 }}>
                Click để chọn ảnh hoặc kéo thả vào đây
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Hỗ trợ: JPEG, PNG, WebP (tối đa 12MB)
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Card sx={{ flex: 1, background: '#121212', border: '1px solid #333333' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                      Ảnh gốc
                    </Typography>
                    <Box
                      component="img"
                      src={previewUrl}
                      alt="Preview"
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'contain',
                        borderRadius: 1
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
                      {selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  </CardContent>
                </Card>

                {resultUrl && (
                  <>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: '#333333' }} />
                    <Card sx={{ flex: 1, background: '#121212', border: '1px solid #333333' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ color: '#4ECDC4', mb: 1 }}>
                          Ảnh đã xóa background
                        </Typography>
                        <Box
                          component="img"
                          src={resultUrl}
                          alt="Result"
                          sx={{
                            width: '100%',
                            maxHeight: 300,
                            objectFit: 'contain',
                            borderRadius: 1,
                            background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #2a2a2a 0% 50%) 50% / 20px 20px'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                  onClick={handleRemoveBackground}
                  disabled={loading || !apiKey}
                  sx={{
                    background: '#FFD700',
                    color: '#000',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { background: '#FFC700' },
                    '&:disabled': { background: '#666', color: '#999' }
                  }}
                >
                  {loading ? 'Đang xử lý...' : 'Xóa Background'}
                </Button>

                {resultBlob && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{
                      borderColor: '#4ECDC4',
                      color: '#4ECDC4',
                      textTransform: 'none',
                      '&:hover': { borderColor: '#4ECDC4', background: 'rgba(78, 205, 196, 0.1)' }
                    }}
                  >
                    Tải về
                  </Button>
                )}

                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleReset}
                  sx={{
                    borderColor: '#666',
                    color: '#B3B3B3',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#999', background: 'rgba(255, 255, 255, 0.05)' }
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Messages */}
        {error && (
          <Alert severity="error" sx={{ background: '#5f2120', color: '#fff', border: '1px solid #f44336' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ background: '#1e4620', color: '#fff', border: '1px solid #4caf50' }}>
            {success}
          </Alert>
        )}

        {/* Info Card */}
        <Paper sx={{ p: 3, background: '#1a1a0a', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFD700', mb: 1, fontWeight: 600 }}>
            💡 Hướng dẫn
          </Typography>
          <Typography variant="body2" sx={{ color: '#B3B3B3', lineHeight: 1.8 }}>
            1. Lấy API key miễn phí tại{' '}
            <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
              remove.bg/api
            </a>
            <br />
            2. Nhập API key vào ô trên
            <br />
            3. Upload ảnh cần xóa background (JPEG, PNG, WebP - tối đa 12MB)
            <br />
            4. Click "Xóa Background" và đợi kết quả
            <br />
            5. Tải ảnh đã xóa background về máy
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default RemoveBgPage;

