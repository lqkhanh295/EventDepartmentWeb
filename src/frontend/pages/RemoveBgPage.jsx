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
import SaveIcon from '@mui/icons-material/Save';
import { PageHeader } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { removeBackground, downloadImage, blobToUrl } from '../../backend/services/removeBgService';
import { getRemoveBgApiKey, setRemoveBgApiKey } from '../../backend/services/configService';

const RemoveBgPage = () => {
  const { isAdmin } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(''); // Input riêng cho admin
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Tự động lấy API key từ Firebase khi load trang
  React.useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      setLoadingApiKey(true);
      const key = await getRemoveBgApiKey();
      if (key && key.trim() !== '') {
        setApiKey(key.trim());
        if (isAdmin) {
          setApiKeyInput(key.trim()); // Hiển thị cho admin để chỉnh sửa
        }
      } else {
        // Không có API key
        setApiKey('');
        if (isAdmin) {
          setApiKeyInput('');
        }
      }
    } catch (err) {
      console.error('Error loading API key:', err);
      setApiKey('');
      if (isAdmin) {
        setApiKeyInput('');
      }
    } finally {
      setLoadingApiKey(false);
    }
  };

  // Lưu API key vào Firebase (chỉ admin)
  const handleSaveApiKey = async () => {
    const trimmedKey = apiKeyInput.trim();
    
    if (!trimmedKey) {
      setError('Vui lòng nhập API key');
      return;
    }

    // Validate API key format (remove.bg API keys thường bắt đầu bằng chữ cái và có độ dài > 20)
    if (trimmedKey.length < 20) {
      setError('API key không hợp lệ. Vui lòng kiểm tra lại API key từ remove.bg');
      return;
    }

    try {
      setSavingApiKey(true);
      setError('');
      setSuccess('');
      
      await setRemoveBgApiKey(trimmedKey);
      setApiKey(trimmedKey);
      setSuccess('Lưu API key thành công! Vui lòng thử lại chức năng xóa background.');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error saving API key:', err);
      setError(err.message || 'Lỗi khi lưu API key. Vui lòng thử lại.');
    } finally {
      setSavingApiKey(false);
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

  // Xử lý xóa background - tự động dùng API key từ Firebase
  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Không cần kiểm tra apiKey nữa vì service sẽ tự động lấy từ Firebase
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Không truyền apiKey, service sẽ tự động lấy từ Firebase
      const blob = await removeBackground(selectedFile, null, {
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
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Xóa Background' }
        ]}
      />

      <Stack spacing={3} sx={{ mt: 3 }}>
        {/* API Key Input - Chỉ hiển thị cho admin */}
        {isAdmin && (
          <Paper sx={{ p: 3, background: '#1a1a0a', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, fontWeight: 600 }}>
              Cấu hình API Key (Chỉ Admin)
            </Typography>
            {loadingApiKey ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} sx={{ color: '#FFD700' }} />
                <Typography sx={{ color: '#B3B3B3' }}>Đang tải cấu hình...</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  type="password"
                  label="Remove.bg API Key"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
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
                <Button
                  variant="contained"
                  startIcon={savingApiKey ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveApiKey}
                  disabled={savingApiKey || !apiKeyInput.trim()}
                  sx={{
                    background: '#FFD700',
                    color: '#000',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { background: '#FFC700' },
                    '&:disabled': { background: '#666', color: '#999' }
                  }}
                >
                  {savingApiKey ? 'Đang lưu...' : 'Lưu API Key'}
                </Button>
                {apiKey ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 500 }}>
                      ✓ API key đã được cấu hình ({apiKey.substring(0, 10)}...)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', fontSize: '0.75rem' }}>
                      - Tất cả users có thể sử dụng
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: '#f44336' }}>
                    ⚠ Chưa có API key. Vui lòng nhập và lưu API key ở trên.
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>
        )}

        {/* Thông báo nếu chưa có API key */}
        {!loadingApiKey && !apiKey && (
          <Alert severity="warning" sx={{ background: '#5f2120', color: '#fff', border: '1px solid #f44336' }}>
            {isAdmin 
              ? 'Chưa có API key. Vui lòng cấu hình API key ở trên để sử dụng chức năng này.'
              : 'Chức năng này chưa được cấu hình. Vui lòng liên hệ admin.'}
          </Alert>
        )}

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
        <Paper sx={{ p: 3, background: '#1a1a0a', border: '1px solid rgba(12, 12, 12, 0.2)', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFD700', mb: 1, fontWeight: 600 }}>
            Hướng dẫn
          </Typography>
          <Typography variant="body2" sx={{ color: '#B3B3B3', lineHeight: 1.8 }}>
            {isAdmin ? (
              <>
                1. (Admin) Lấy API key miễn phí tại{' '}
                <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
                  remove.bg/api
                </a>
                <br />
                2. (Admin) Nhập và lưu API key ở phần cấu hình trên
                <br />
                3. Upload ảnh cần xóa background (JPEG, PNG, WebP - tối đa 12MB)
                <br />
                4. Click "Xóa Background" và đợi kết quả
                <br />
                5. Tải ảnh đã xóa background về máy
              </>
            ) : (
              <>
                1. Upload ảnh cần xóa background (JPEG, PNG, WebP - tối đa 12MB)
                <br />
                2. Click "Xóa Background" và đợi kết quả
                <br />
                3. Tải ảnh đã xóa background về máy
                <br />
              </>
            )}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default RemoveBgPage;

