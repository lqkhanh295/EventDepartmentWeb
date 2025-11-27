// GuidesPage - Trang Event Guide
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import { Upload, message } from 'antd';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { PageHeader, Loading, EmptyState } from '../components';
import {
  getAllGuides,
  uploadGuideFile,
  deleteGuide,
  getGuideContent
} from '../../backend/services/guideService';

const GuidesPage = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [guideContent, setGuideContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    order: 0
  });
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const data = await getAllGuides();
      setGuides(data);
    } catch (error) {
      console.error('Error loading guides:', error);
      showSnackbar('Lỗi khi tải danh sách guide', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      showSnackbar('Vui lòng chọn file để upload', 'warning');
      return;
    }

    if (!uploadData.title.trim()) {
      showSnackbar('Vui lòng nhập tiêu đề', 'warning');
      return;
    }

    try {
      setUploading(true);
      const file = fileList[0].originFileObj || fileList[0];
      
      await uploadGuideFile(file, {
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category,
        order: uploadData.order
      });

      showSnackbar('Upload guide thành công!', 'success');
      setUploadOpen(false);
      setUploadData({ title: '', description: '', category: '', order: 0 });
      setFileList([]);
      loadGuides();
    } catch (error) {
      console.error('Error uploading:', error);
      showSnackbar('Lỗi khi upload guide', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleViewGuide = async (guide) => {
    setSelectedGuide(guide);
    setViewerOpen(true);
    setContentLoading(true);
    
    try {
      const content = await getGuideContent(guide.downloadURL, guide.fileType);
      setGuideContent(content);
    } catch (error) {
      console.error('Error loading guide content:', error);
      setGuideContent('<p>Không thể tải nội dung. Vui lòng tải file về để xem.</p>');
    } finally {
      setContentLoading(false);
    }
  };

  const handleDeleteGuide = async (guide) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${guide.title}"?`)) {
      try {
        await deleteGuide(guide.id, guide.fileName);
        showSnackbar('Xóa guide thành công!', 'success');
        loadGuides();
      } catch (error) {
        console.error('Error deleting guide:', error);
        showSnackbar('Lỗi khi xóa guide', 'error');
      }
    }
  };

  const handleDownload = (guide) => {
    window.open(guide.downloadURL, '_blank');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    fileList,
    accept: '.doc,.docx,.pdf,.txt,.md',
    maxCount: 1
  };

  return (
    <Box>
      <PageHeader
        title="Event Guide"
        subtitle="Hướng dẫn tổ chức sự kiện của Ban Event"
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Event Guide', path: '/guides' }
        ]}
        actionText="Upload Guide"
        actionIcon={CloudUploadIcon}
        onAction={() => setUploadOpen(true)}
      />

      {/* Guide List */}
      {loading ? (
        <Loading message="Đang tải danh sách guide..." />
      ) : guides.length === 0 ? (
        <EmptyState
          icon={MenuBookIcon}
          title="Chưa có guide nào"
          description="Upload file hướng dẫn để chia sẻ kiến thức với team"
          actionText="Upload Guide"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <Grid container spacing={3}>
          {guides.map((guide) => (
            <Grid item xs={12} sm={6} lg={4} key={guide.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#1e1e1e',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(255, 215, 0, 0.15)'
                  }
                }}
              >
                <CardContent sx={{ flex: 1, p: 3 }}>
                  {/* Icon & Category */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: 'rgba(255, 215, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <DescriptionIcon sx={{ color: '#FFD700', fontSize: 24 }} />
                    </Box>
                    {guide.category && (
                      <Chip
                        label={guide.category}
                        size="small"
                        sx={{
                          background: 'rgba(78, 205, 196, 0.15)',
                          color: '#4ECDC4',
                          border: '1px solid rgba(78, 205, 196, 0.3)'
                        }}
                      />
                    )}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#fff',
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {guide.title}
                  </Typography>

                  {/* Description */}
                  {guide.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#888',
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {guide.description}
                    </Typography>
                  )}

                  {/* File Info */}
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {guide.originalName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                      {formatFileSize(guide.fileSize)}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    px: 2,
                    pb: 2
                  }}
                >
                  <Tooltip title="Xem nội dung">
                    <IconButton
                      size="small"
                      onClick={() => handleViewGuide(guide)}
                      sx={{
                        color: '#888',
                        '&:hover': { color: '#FFD700', background: 'rgba(255, 215, 0, 0.1)' }
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Tải xuống">
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(guide)}
                      sx={{
                        color: '#888',
                        '&:hover': { color: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)' }
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteGuide(guide)}
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
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#1e1e1e',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 215, 0, 0.1)'
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Upload Event Guide
          </Typography>
          <IconButton onClick={() => setUploadOpen(false)} sx={{ color: '#888' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* File Upload */}
            <Box>
              <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                Chọn file (DOCX, PDF, TXT, MD)
              </Typography>
              <Upload.Dragger {...uploadProps}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#FFD700', mb: 1 }} />
                  <Typography sx={{ color: '#fff' }}>
                    Kéo thả file vào đây hoặc click để chọn
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Hỗ trợ: .docx, .doc, .pdf, .txt, .md
                  </Typography>
                </Box>
              </Upload.Dragger>
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              label="Tiêu đề *"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              placeholder="Nhập tiêu đề guide"
            />

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Mô tả"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              placeholder="Mô tả ngắn về guide"
            />

            {/* Category */}
            <TextField
              fullWidth
              label="Danh mục"
              value={uploadData.category}
              onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
              placeholder="VD: Quy trình, Checklist, Template..."
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 215, 0, 0.1)' }}>
          <Button onClick={() => setUploadOpen(false)} sx={{ color: '#888' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #CCB000 100%)',
              color: '#1a1a1a',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFE44D 0%, #FFD700 100%)'
              }
            }}
          >
            {uploading ? 'Đang upload...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: '#1e1e1e',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: 3,
            height: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 215, 0, 0.1)'
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#FFD700'
            }}
          >
            {selectedGuide?.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(selectedGuide)}
              sx={{ color: '#FFD700' }}
            >
              Tải xuống
            </Button>
            <IconButton onClick={() => setViewerOpen(false)} sx={{ color: '#888' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {contentLoading ? (
            <Loading message="Đang tải nội dung..." />
          ) : (
            <Box
              className="guide-content"
              sx={{
                color: '#fff',
                lineHeight: 1.8,
                '& h1, & h2, & h3': {
                  color: '#FFD700',
                  mt: 3,
                  mb: 2
                },
                '& p': { mb: 2 },
                '& ul, & ol': { ml: 3, mb: 2 },
                '& li': { mb: 1 },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  my: 2
                },
                '& th, & td': {
                  p: 1.5,
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  textAlign: 'left'
                },
                '& th': {
                  background: '#252525',
                  color: '#FFD700'
                }
              }}
              dangerouslySetInnerHTML={{ __html: guideContent }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            background: snackbar.severity === 'success' ? '#1e4620' : 
                       snackbar.severity === 'warning' ? '#5c4813' : '#5f2120',
            color: '#fff'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GuidesPage;

