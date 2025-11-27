// Trang tạo Hợp đồng & Biên bản nghiệm thu tự động
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
  Alert,
  Collapse
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { PageHeader } from '../components/Common';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

// Default fields cho hợp đồng
const DEFAULT_FIELDS = [
  // Thông tin chung
  { key: 'so_hop_dong', label: 'Số hợp đồng', section: 'General', placeholder: 'VD: 01/2025/HĐKT' },
  { key: 'ngay_ky', label: 'Ngày ký', section: 'General', placeholder: 'VD: 15/01/2025' },
  
  // Bên A
  { key: 'ten_ben_a', label: 'Tên Bên A', section: 'PartyA', placeholder: 'VD: Câu lạc bộ Truyền thông Cóc Sài Gòn' },
  { key: 'dai_dien_a', label: 'Đại diện Bên A', section: 'PartyA', placeholder: 'VD: Nguyễn Văn A' },
  { key: 'chuc_vu_a', label: 'Chức vụ', section: 'PartyA', placeholder: 'VD: Chủ nhiệm CLB' },
  { key: 'dia_chi_a', label: 'Địa chỉ Bên A', section: 'PartyA', placeholder: '' },
  
  // Bên B (NCC/Cá nhân)
  { key: 'ten_ben_b', label: 'Tên Bên B / NCC', section: 'PartyB', placeholder: 'VD: Công ty TNHH ABC' },
  { key: 'dai_dien_b', label: 'Đại diện Bên B', section: 'PartyB', placeholder: 'VD: Trần Văn B' },
  { key: 'chuc_vu_b', label: 'Chức vụ', section: 'PartyB', placeholder: 'VD: Giám đốc' },
  { key: 'dia_chi_b', label: 'Địa chỉ Bên B', section: 'PartyB', placeholder: '' },
  { key: 'mst', label: 'Mã số thuế', section: 'PartyB', placeholder: 'VD: 0123456789' },
  { key: 'stk', label: 'Số tài khoản', section: 'PartyB', placeholder: '' },
  { key: 'ngan_hang', label: 'Ngân hàng', section: 'PartyB', placeholder: 'VD: Vietcombank' },
  
  // Công việc
  { key: 'noi_dung', label: 'Nội dung công việc', section: 'Job', placeholder: 'VD: Cung cấp dịch vụ âm thanh, ánh sáng' },
  { key: 'dia_diem', label: 'Địa điểm thực hiện', section: 'Job', placeholder: '' },
  { key: 'thoi_gian_bat_dau', label: 'Thời gian bắt đầu', section: 'Job', placeholder: '' },
  { key: 'thoi_gian_ket_thuc', label: 'Thời gian kết thúc', section: 'Job', placeholder: '' },
  
  // Tài chính
  { key: 'gia_tri', label: 'Giá trị hợp đồng', section: 'Financial', placeholder: 'VD: 5.000.000' },
  { key: 'bang_chu', label: 'Bằng chữ', section: 'Financial', placeholder: 'VD: Năm triệu đồng' },
  { key: 'tam_ung', label: 'Tạm ứng', section: 'Financial', placeholder: 'VD: 2.000.000' },
  { key: 'con_lai', label: 'Còn lại', section: 'Financial', placeholder: 'VD: 3.000.000' },
];

const SECTION_TITLES = {
  General: 'Thông tin chung',
  PartyA: 'Thông tin Bên A (CLB)',
  PartyB: 'Thông tin Bên B (NCC)',
  Job: 'Nội dung công việc',
  Financial: 'Tài chính & Thanh toán'
};

const PaperworkPage = () => {
  const [contractFile, setContractFile] = useState(null);
  const [acceptanceFile, setAcceptanceFile] = useState(null);
  const [fields, setFields] = useState(DEFAULT_FIELDS.map(f => ({ ...f, value: '' })));
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    General: true, PartyA: true, PartyB: true, Job: true, Financial: true
  });

  // Tính tiến độ
  const filledCount = useMemo(() => fields.filter(f => f.value.trim()).length, [fields]);
  const progress = Math.round((filledCount / fields.length) * 100);

  // Group fields theo section
  const groupedFields = useMemo(() => {
    const groups = {};
    fields.forEach(f => {
      if (!groups[f.section]) groups[f.section] = [];
      groups[f.section].push(f);
    });
    return groups;
  }, [fields]);

  // Handle file upload
  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      if (type === 'contract') setContractFile(file);
      else setAcceptanceFile(file);
    }
  };

  // Update field value
  const updateField = (key, value) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Generate document
  const handleGenerate = async (type) => {
    const file = type === 'contract' ? contractFile : acceptanceFile;
    if (!file) return;

    if (filledCount === 0) {
      alert('Vui lòng điền ít nhất một trường thông tin!');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' }
      });

      // Prepare data
      const data = {};
      fields.forEach(f => { data[f.key] = f.value || ''; });

      doc.render(data);

      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const fileName = type === 'contract' 
        ? `HopDong_${data.ten_ben_b || 'NCC'}.docx`
        : `NghiemThu_${data.ten_ben_b || 'NCC'}.docx`;

      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Lỗi khi tạo file. Vui lòng kiểm tra file mẫu!');
    }
  };

  // AI Auto-fill (simple extraction)
  const handleAIExtract = () => {
    if (!aiPrompt.trim()) return;
    
    const text = aiPrompt.toLowerCase();
    const updates = {};
    
    // Simple pattern matching
    const patterns = [
      { key: 'so_hop_dong', regex: /số[:\s]*([^\n,]+)/i },
      { key: 'ngay_ky', regex: /ngày[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i },
      { key: 'ten_ben_b', regex: /(?:công ty|cty|ncc)[:\s]*([^\n,]+)/i },
      { key: 'mst', regex: /(?:mst|mã số thuế)[:\s]*(\d{10,14})/i },
      { key: 'gia_tri', regex: /(?:giá trị|tổng|số tiền)[:\s]*([\d.,]+)/i },
    ];
    
    patterns.forEach(({ key, regex }) => {
      const match = aiPrompt.match(regex);
      if (match) updates[key] = match[1].trim();
    });
    
    if (Object.keys(updates).length > 0) {
      setFields(prev => prev.map(f => updates[f.key] ? { ...f, value: updates[f.key] } : f));
      setShowAI(false);
      setAiPrompt('');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Tạo Hợp đồng & Nghiệm thu"
        subtitle="Công cụ tự động điền thông tin vào file mẫu Paperwork"
      />

      <Grid container spacing={3}>
        {/* Left: Upload & Actions */}
        <Grid item xs={12} lg={4}>
          {/* Upload Files */}
          <Paper sx={{ p: 3, mb: 3, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="1" size="small" sx={{ background: '#333', color: '#FFD700' }} />
              File Mẫu (Template)
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
              Tải lên file .docx có chứa các placeholder như {'{ten_ben_b}'}, {'{gia_tri}'}...
            </Typography>

            {/* Contract Upload */}
            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                accept=".docx"
                id="contract-upload"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'contract')}
              />
              <label htmlFor="contract-upload">
                <Button
                  component="span"
                  fullWidth
                  variant="outlined"
                  startIcon={contractFile ? <DescriptionIcon /> : <UploadFileIcon />}
                  sx={{
                    borderColor: contractFile ? '#4CAF50' : 'rgba(255,215,0,0.3)',
                    color: contractFile ? '#4CAF50' : '#FFD700',
                    py: 1.5,
                    justifyContent: 'flex-start',
                    '&:hover': { borderColor: '#FFD700', background: 'rgba(255,215,0,0.05)' }
                  }}
                >
                  {contractFile ? contractFile.name : 'Mẫu Hợp Đồng'}
                </Button>
              </label>
              {contractFile && (
                <IconButton size="small" onClick={() => setContractFile(null)} sx={{ color: '#f44336', ml: 1 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {/* Acceptance Upload */}
            <Box>
              <input
                type="file"
                accept=".docx"
                id="acceptance-upload"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'acceptance')}
              />
              <label htmlFor="acceptance-upload">
                <Button
                  component="span"
                  fullWidth
                  variant="outlined"
                  startIcon={acceptanceFile ? <DescriptionIcon /> : <UploadFileIcon />}
                  sx={{
                    borderColor: acceptanceFile ? '#4CAF50' : 'rgba(255,215,0,0.3)',
                    color: acceptanceFile ? '#4CAF50' : '#FFD700',
                    py: 1.5,
                    justifyContent: 'flex-start',
                    '&:hover': { borderColor: '#FFD700', background: 'rgba(255,215,0,0.05)' }
                  }}
                >
                  {acceptanceFile ? acceptanceFile.name : 'Mẫu Biên Bản Nghiệm Thu'}
                </Button>
              </label>
              {acceptanceFile && (
                <IconButton size="small" onClick={() => setAcceptanceFile(null)} sx={{ color: '#f44336', ml: 1 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Paper>

          {/* Download Actions */}
          <Paper sx={{ p: 3, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="3" size="small" sx={{ background: '#333', color: '#FFD700' }} />
              Xuất Tài Liệu
            </Typography>

            {/* Progress */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#888' }}>Tiến độ điền</Typography>
                <Typography variant="body2" sx={{ color: progress === 100 ? '#4CAF50' : '#FFD700', fontWeight: 600 }}>
                  {filledCount}/{fields.length} trường
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  background: '#333',
                  '& .MuiLinearProgress-bar': { 
                    background: progress === 100 
                      ? 'linear-gradient(90deg, #4CAF50, #8BC34A)' 
                      : 'linear-gradient(90deg, #FFD700, #FFA000)' 
                  }
                }} 
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleGenerate('contract')}
              disabled={!contractFile || filledCount === 0}
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #FFD700 0%, #CCB000 100%)',
                color: '#1a1a1a',
                fontWeight: 600,
                '&:hover': { background: 'linear-gradient(135deg, #FFE44D 0%, #FFD700 100%)' },
                '&.Mui-disabled': { background: '#333', color: '#666' }
              }}
            >
              Tải Hợp Đồng
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleGenerate('acceptance')}
              disabled={!acceptanceFile || filledCount === 0}
              sx={{
                borderColor: 'rgba(255,215,0,0.3)',
                color: '#FFD700',
                '&:hover': { borderColor: '#FFD700', background: 'rgba(255,215,0,0.05)' },
                '&.Mui-disabled': { borderColor: '#333', color: '#666' }
              }}
            >
              Tải BB Nghiệm Thu
            </Button>
          </Paper>
        </Grid>

        {/* Right: Form Fields */}
        <Grid item xs={12} lg={8}>
          {/* AI Section */}
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon /> AI Tự Động Điền
              </Typography>
              <Button 
                size="small" 
                onClick={() => setShowAI(!showAI)}
                sx={{ color: '#818cf8' }}
              >
                {showAI ? 'Ẩn' : 'Mở công cụ AI'}
              </Button>
            </Box>
            
            <Collapse in={showAI}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#a5b4fc', mb: 2 }}>
                  Dán nội dung mô tả hợp đồng, AI sẽ tự động trích xuất thông tin.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="VD: Hợp đồng số 01/2025 với Công ty ABC, MST 0123456789, giá trị 5.000.000đ..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      background: '#0f172a',
                      '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
                      '&:hover fieldset': { borderColor: '#818cf8' }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAIExtract}
                  disabled={!aiPrompt.trim()}
                  sx={{ background: '#6366f1', '&:hover': { background: '#4f46e5' } }}
                >
                  Trích xuất dữ liệu
                </Button>
              </Box>
            </Collapse>
          </Paper>

          {/* Form Fields */}
          <Paper sx={{ p: 3, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: '#FFD700', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="2" size="small" sx={{ background: '#333', color: '#FFD700' }} />
              Nhập Thông Tin
            </Typography>

            {Object.entries(groupedFields).map(([section, sectionFields]) => (
              <Box key={section} sx={{ mb: 3 }}>
                <Box 
                  onClick={() => toggleSection(section)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 1,
                    borderLeft: '3px solid #FFD700',
                    pl: 2,
                    mb: 2,
                    '&:hover': { background: 'rgba(255,215,0,0.05)' }
                  }}
                >
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                    {SECTION_TITLES[section]}
                  </Typography>
                  {expandedSections[section] ? <ExpandLessIcon sx={{ color: '#888' }} /> : <ExpandMoreIcon sx={{ color: '#888' }} />}
                </Box>
                
                <Collapse in={expandedSections[section]}>
                  <Grid container spacing={2}>
                    {sectionFields.map(field => (
                      <Grid item xs={12} sm={6} key={field.key}>
                        <TextField
                          fullWidth
                          size="small"
                          label={field.label}
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          InputProps={{
                            endAdornment: field.value && (
                              <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              background: '#252525',
                              '& fieldset': { borderColor: field.value ? '#4CAF50' : 'rgba(255,215,0,0.2)' },
                              '&:hover fieldset': { borderColor: '#FFD700' },
                              '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                            },
                            '& .MuiInputLabel-root': { color: '#888' }
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
                
                <Divider sx={{ borderColor: 'rgba(255,215,0,0.1)', mt: 2 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaperworkPage;

