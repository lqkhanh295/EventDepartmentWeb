// Video Downloader - Tải video từ YouTube & Facebook
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import HdIcon from '@mui/icons-material/Hd';
import { PageHeader } from '../components';

const formatDuration = (secs) => {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

const parseApiPayload = async (resp) => {
  const raw = await resp.text();
  if (!raw) return { data: null, raw: '' };

  const contentType = (resp.headers.get('Content-Type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    try {
      return { data: JSON.parse(raw), raw };
    } catch {
      return { data: null, raw };
    }
  }

  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return { data: null, raw };
  }
};

const getApiErrorMessage = (resp, parsed, fallback) => {
  const bodyError = parsed?.data?.error || parsed?.data?.message;
  if (typeof bodyError === 'string' && bodyError.trim()) return bodyError;

  const raw = (parsed?.raw || '').trim();
  if (/proxy error/i.test(raw)) {
    return 'Không kết nối được backend API. Hãy chạy server bằng "cd server && npm start" rồi thử lại.';
  }

  if (raw) return raw.slice(0, 220);
  return `${fallback} (HTTP ${resp.status})`;
};

const VideoDownloaderPage = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); // 0-100, -1 = unknown size
  const [error, setError] = useState('');
  const [type, setType] = useState('mp4');
  const [quality, setQuality] = useState('best');

  const handleFetchInfo = useCallback(async () => {
    if (!url.trim()) return;
    setError('');
    setVideoInfo(null);
    setLoading(true);
    try {
      const resp = await fetch('/api/video/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const parsed = await parseApiPayload(resp);
      if (!resp.ok) {
        throw new Error(getApiErrorMessage(resp, parsed, 'Không thể lấy thông tin video'));
      }

      const data = parsed.data;
      if (!data || typeof data !== 'object') {
        throw new Error('API trả về dữ liệu không hợp lệ');
      }

      setVideoInfo(data);
      if (data.availableQualities?.length) {
        setQuality(String(data.availableQualities[0]));
      } else {
        setQuality('best');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      setVideoInfo(null);
      setError('');
    } catch {
      // clipboard không được phép
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!videoInfo) return;
    setDownloading(true);
    setDownloadProgress(0);
    setError('');
    try {
      const params = new URLSearchParams({ url: url.trim(), type, quality });
      const resp = await fetch(`/api/video/download?${params}`);
      if (!resp.ok) {
        const parsed = await parseApiPayload(resp);
        throw new Error(getApiErrorMessage(resp, parsed, 'Lỗi tải file từ server'));
      }

      const contentLength = Number(resp.headers.get('Content-Length') || 0);
      const hasLength = contentLength > 0;
      if (!hasLength) setDownloadProgress(-1);

      const reader = resp.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (hasLength) setDownloadProgress(Math.min(99, Math.round((received / contentLength) * 100)));
      }
      setDownloadProgress(100);

      const disposition = resp.headers.get('Content-Disposition') || '';
      const fnMatch = disposition.match(/filename\*=UTF-8''(.+)/i) || disposition.match(/filename="?([^"]+)"?/i);
      const filename = fnMatch ? decodeURIComponent(fnMatch[1]) : `video.${type}`;

      const blob = new Blob(chunks);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      setError('Tải thất bại: ' + e.message);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [url, type, quality, videoInfo]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 680, mx: 'auto' }}>
      <PageHeader
        title="Tải Video"
        subtitle="Tải video/âm thanh từ YouTube và Facebook"
      />

      {/* Single unified card */}
      <Paper sx={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 3, overflow: 'hidden' }}>

        {/* ── URL Input section ── */}
        <Box sx={{ p: 3, borderBottom: videoInfo ? '1px solid #2a2a2a' : 'none' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Dán link YouTube hoặc Facebook vào đây..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); setVideoInfo(null); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchInfo()}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  background: '#1e1e1e',
                  fontSize: 14,
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#4a4a4a' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                },
              }}
            />
            <Tooltip title="Dán từ clipboard">
              <IconButton onClick={handlePaste} sx={{
                color: '#888', bgcolor: '#1e1e1e', border: '1px solid #333', borderRadius: 2,
                '&:hover': { color: '#FFD700', borderColor: '#FFD700', bgcolor: 'rgba(255,215,0,0.06)' },
              }}>
                <ContentPasteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {url && (
              <Tooltip title="Xóa">
                <IconButton onClick={() => { setUrl(''); setVideoInfo(null); setError(''); }} sx={{
                  color: '#888', bgcolor: '#1e1e1e', border: '1px solid #333', borderRadius: 2,
                  '&:hover': { color: '#ff5555', borderColor: '#ff5555', bgcolor: 'rgba(255,85,85,0.06)' },
                }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          <Button
            variant="contained"
            fullWidth
            onClick={handleFetchInfo}
            disabled={!url.trim() || loading}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: '#000' }} /> : <SearchIcon />}
            sx={{
              bgcolor: '#FFD700', color: '#000', fontWeight: 700, fontSize: 15, py: 1.2, borderRadius: 2,
              '&:hover': { bgcolor: '#FFC200' },
              '&:disabled': { bgcolor: '#252525', color: '#555', border: '1px solid #2e2e2e' },
            }}
          >
            {loading ? 'Đang lấy thông tin...' : 'Lấy thông tin'}
          </Button>
          {loading && <LinearProgress sx={{ mt: 1.5, borderRadius: 1, bgcolor: '#252525', '& .MuiLinearProgress-bar': { bgcolor: '#FFD700' } }} />}
        </Box>

        {error && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        )}

        {/* ── Video info section ── */}
        {videoInfo && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0} sx={{ px: 3, pt: 2.5, pb: 2 }}>
              {videoInfo.thumbnail && (
                <Box
                  component="img"
                  src={videoInfo.thumbnail}
                  alt="thumbnail"
                  sx={{
                    width: { xs: '100%', sm: 160 },
                    height: { xs: 160, sm: 100 },
                    objectFit: 'cover',
                    flexShrink: 0,
                    borderRadius: 1.5,
                    mr: { sm: 2.5 },
                    mb: { xs: 2, sm: 0 },
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                >
                  {videoInfo.title}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {videoInfo.uploader && (
                    <Chip icon={<PersonIcon sx={{ fontSize: 13 }} />} label={videoInfo.uploader} size="small"
                      sx={{ bgcolor: '#1e1e1e', color: '#999', fontSize: 11, border: '1px solid #2e2e2e' }} />
                  )}
                  {videoInfo.duration > 0 && (
                    <Chip icon={<AccessTimeIcon sx={{ fontSize: 13 }} />} label={formatDuration(videoInfo.duration)} size="small"
                      sx={{ bgcolor: '#1e1e1e', color: '#999', fontSize: 11, border: '1px solid #2e2e2e' }} />
                  )}
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ borderColor: '#2a2a2a' }} />

            {/* ── Format + Quality + Download ── */}
            <Box sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
                {/* Format toggle */}
                <ToggleButtonGroup
                  value={type}
                  exclusive
                  onChange={(_, v) => { if (v) setType(v); }}
                  sx={{ flex: 1, gap: 1, '& .MuiToggleButtonGroup-grouped': { border: '1px solid #333 !important', borderRadius: '8px !important', mx: 0 } }}
                >
                  <ToggleButton value="mp4" sx={{
                    flex: 1, gap: 1, textTransform: 'none', fontWeight: 600, fontSize: 13, py: 1,
                    color: '#888',
                    '&.Mui-selected': { bgcolor: 'rgba(255,215,0,0.1)', color: '#FFD700', borderColor: '#FFD700 !important' },
                    '&:hover:not(.Mui-selected)': { bgcolor: '#1e1e1e', color: '#ccc' },
                  }}>
                    <VideoFileIcon sx={{ fontSize: 17 }} /> MP4 · Video
                  </ToggleButton>
                  <ToggleButton value="mp3" sx={{
                    flex: 1, gap: 1, textTransform: 'none', fontWeight: 600, fontSize: 13, py: 1,
                    color: '#888',
                    '&.Mui-selected': { bgcolor: 'rgba(255,215,0,0.1)', color: '#FFD700', borderColor: '#FFD700 !important' },
                    '&:hover:not(.Mui-selected)': { bgcolor: '#1e1e1e', color: '#ccc' },
                  }}>
                    <AudioFileIcon sx={{ fontSize: 17 }} /> MP3 · Âm thanh
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Quality selector */}
                {type === 'mp4' && (
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    size="small"
                    displayEmpty
                    startAdornment={<HdIcon sx={{ fontSize: 17, color: '#888', mr: 0.5 }} />}
                    sx={{
                      minWidth: 120, background: '#1e1e1e', borderRadius: 2, fontSize: 13, fontWeight: 600, color: '#ccc',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4a4a4a' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' },
                    }}
                  >
                    <MenuItem value="best">Tốt nhất</MenuItem>
                    {(videoInfo.availableQualities || []).map(q => (
                      <MenuItem key={q} value={String(q)}>{q}p</MenuItem>
                    ))}
                  </Select>
                )}
              </Stack>

              {/* Download button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleDownload}
                disabled={downloading}
                startIcon={downloading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : <DownloadIcon />}
                sx={{
                  bgcolor: '#FFD700', color: '#000', fontWeight: 800, fontSize: 16, py: 1.4, borderRadius: 2,
                  '&:hover': { bgcolor: '#FFC200' },
                  '&:disabled': { bgcolor: '#252525', color: '#555', border: '1px solid #2e2e2e' },
                }}
              >
                {downloading
                  ? (downloadProgress > 0 && downloadProgress < 100 ? `Đang tải... ${downloadProgress}%` : 'Đang xử lý...')
                  : `Tải xuống ${type.toUpperCase()}`}
              </Button>
              {downloading && (
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant={downloadProgress <= 0 ? 'indeterminate' : 'determinate'}
                    value={downloadProgress > 0 ? downloadProgress : 0}
                    sx={{ borderRadius: 1, bgcolor: '#252525', height: 6, '& .MuiLinearProgress-bar': { bgcolor: '#FFD700', borderRadius: 1 } }}
                  />
                  {downloadProgress > 0 && downloadProgress < 100 && (
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>Đừng đóng tab!</Typography>
                      <Typography variant="caption" sx={{ color: '#FFD700', fontSize: 11, fontWeight: 700 }}>{downloadProgress}%</Typography>
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default VideoDownloaderPage;
