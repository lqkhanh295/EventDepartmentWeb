// ImportMembersPage - Import members từ Excel
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Snackbar,
  LinearProgress,
  Chip,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { Upload, Table } from 'antd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import { PageHeader } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { addMember, getAllMembers, updateMember, getAllProjects, addProject, deleteAllProjects, clearAllScores } from '../../backend/services/memberService';

const ImportMembersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [projectColumns, setProjectColumns] = useState([]); // Các cột điểm project
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [semester, setSemester] = useState(searchParams.get('semester') || 'fall'); // Lấy semester từ URL
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [clearing, setClearing] = useState(false);

  // Xóa toàn bộ data của semester
  const handleClearData = async () => {
    if (!window.confirm(`Bạn có chắc muốn XÓA TOÀN BỘ dữ liệu điểm và projects của kỳ ${semester.toUpperCase()}?\n\nHành động này KHÔNG THỂ hoàn tác!`)) {
      return;
    }

    setClearing(true);
    try {
      const [projectsDeleted, membersCleared] = await Promise.all([
        deleteAllProjects(semester),
        clearAllScores(semester)
      ]);
      
      showSnackbar(`Đã xóa ${projectsDeleted} projects và điểm của ${membersCleared} members`, 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showSnackbar('Lỗi khi xóa dữ liệu: ' + error.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  // Đọc file Excel theo cấu trúc:
  // Row 1: "THÔNG TIN" header (merged cells)
  // Row 2: STT | MSSV | TÊN | BĐH | SỐ PROJECT | Trung bình | Web | NOTE | HỘI XUÂN LÀNG CÓC | TẾT TY TÁCH | ...
  // Row 3+: Data
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 3) {
          showSnackbar('File Excel trống hoặc không có dữ liệu', 'error');
          return;
        }

        // Row 1 (index 1) chứa header columns
        // Cấu trúc: STT(0) | MSSV(1) | TÊN(2) | BĐH(3) | SỐ PROJECT(4) | Trung bình(5) | Web(6) | NOTE(7) | Projects(8+)
        const headerRow = jsonData[1];
        
        // Tìm các cột project từ cột I (index 8) trở đi
        const projectCols = [];
        for (let i = 8; i < headerRow.length; i++) {
          const headerValue = headerRow[i];
          if (headerValue && headerValue.toString().trim()) {
            const name = headerValue.toString().trim();
            // Giữ nguyên tên làm key (thay thế ký tự đặc biệt bằng _)
            const key = name.replace(/[\/\\.\#\$\[\]]/g, '_');
            projectCols.push({
              index: i,
              name: name,
              key: key
            });
          }
        }
        setProjectColumns(projectCols);

        // Map columns cho preview table
        const cols = [
          { title: 'MSSV', dataIndex: 'mssv', key: 'mssv', width: 100, render: (t) => <Typography sx={{ color: '#fff' }}>{t}</Typography> },
          { title: 'Tên', dataIndex: 'name', key: 'name', width: 180, render: (t) => <Typography sx={{ color: '#fff' }}>{t}</Typography> },
          { title: 'BĐH', dataIndex: 'isBDH', key: 'isBDH', width: 80, render: (v) => <Typography sx={{ color: v ? '#FFD700' : '#666' }}>{v ? '✓' : ''}</Typography> },
          { title: 'Note', dataIndex: 'note', key: 'note', width: 150, render: (t) => <Typography sx={{ color: '#888' }}>{t || '-'}</Typography> },
          ...projectCols.map(p => ({
            title: p.name,
            dataIndex: `score_${p.key}`,
            key: p.key,
            width: 120,
            render: (v) => <Typography sx={{ color: v > 0 ? '#4CAF50' : '#666' }}>{v || 0}</Typography>
          }))
        ];
        setColumns(cols);

        // Map data rows (bắt đầu từ row 2 - index 2)
        const rows = jsonData.slice(2).map((row, rowIndex) => {
          // Bỏ qua row trống (không có tên)
          if (!row[2] || !String(row[2]).trim()) return null;

          const rowData = {
            key: rowIndex,
            mssv: String(row[1] || '').trim() || '#N/A',
            name: String(row[2] || '').trim(),
            isBDH: String(row[3] || '').toUpperCase() === 'TRUE',
            note: String(row[7] || '').trim(),
            scores: {}
          };

          // Lấy điểm các project
          projectCols.forEach(p => {
            const rawValue = row[p.index];
            const score = parseFloat(rawValue) || 0;
            rowData[`score_${p.key}`] = score;
            rowData.scores[p.key] = score;
          });

          return rowData;
        }).filter(Boolean);

        setData(rows);
        showSnackbar(`Đọc được ${rows.length} members, ${projectCols.length} projects từ file`, 'success');
        
        console.log('Projects found:', projectCols.map(p => p.name));
        console.log('Sample data:', rows.slice(0, 3));
      } catch (error) {
        console.error('Error reading Excel:', error);
        showSnackbar('Lỗi khi đọc file Excel: ' + error.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  // Import vào Firebase
  const handleImport = async () => {
    if (data.length === 0) {
      showSnackbar('Không có dữ liệu để import', 'warning');
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      // 1. Tạo các project chưa tồn tại
      const existingProjects = await getAllProjects(semester);
      const existingProjectKeys = new Set(existingProjects.map(p => p.key));
      
      let projectsCreated = 0;
      for (let i = 0; i < projectColumns.length; i++) {
        const proj = projectColumns[i];
        if (!existingProjectKeys.has(proj.key)) {
          await addProject({
            Name: proj.name,
            key: proj.key,
            order: existingProjects.length + i + 1
          }, semester);
          projectsCreated++;
        }
      }
      
      if (projectsCreated > 0) {
        console.log(`Created ${projectsCreated} new projects`);
      }

      // 2. Import members
      const existingMembers = await getAllMembers();
      const existingMap = new Map();
      existingMembers.forEach(m => {
        if (m.mssv && m.mssv !== '#N/A') existingMap.set(m.mssv.toLowerCase(), m);
        if (m.name) existingMap.set(m.name.toLowerCase(), m);
      });

      let imported = 0;
      let updated = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Tìm member đã tồn tại (theo MSSV hoặc tên)
        const existingByMssv = row.mssv !== '#N/A' ? existingMap.get(row.mssv.toLowerCase()) : null;
        const existingByName = existingMap.get(row.name.toLowerCase());
        const existing = existingByMssv || existingByName;

        if (existing) {
          // Update điểm cho member đã tồn tại
          const newScores = {
            ...existing.scores,
            [semester]: {
              ...(existing.scores?.[semester] || {}),
              ...row.scores
            }
          };
          await updateMember(existing.id, {
            ...existing,
            mssv: row.mssv !== '#N/A' ? row.mssv : existing.mssv,
            isBDH: row.isBDH || existing.isBDH,
            note: row.note || existing.note,
            scores: newScores
          });
          updated++;
        } else {
          // Thêm member mới
          await addMember({
            mssv: row.mssv,
            name: row.name,
            isBDH: row.isBDH,
            note: row.note,
            scores: { [semester]: row.scores }
          });
          imported++;
        }

        setProgress(((i + 1) / data.length) * 100);
      }

      showSnackbar(`Hoàn tất! Members: +${imported} mới, ${updated} cập nhật. Projects: +${projectsCreated} mới`, 'success');
      setData([]);
    } catch (error) {
      console.error('Error importing:', error);
      showSnackbar('Lỗi khi import: ' + error.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  if (!isAdmin) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography sx={{ color: '#f44336' }}>Bạn không có quyền truy cập trang này</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button onClick={() => navigate('/members')} sx={{ color: '#888', minWidth: 'auto' }}>
              <ArrowBackIcon />
            </Button>
            <span>Import Members từ Excel</span>
          </Box>
        }
        subtitle="Upload file Excel để import hàng loạt members và điểm"
      />

      {/* Hướng dẫn */}
      <Paper sx={{ p: 3, mb: 3, background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>📋 Định dạng file Excel của bạn</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label="A: STT" size="small" sx={{ background: '#333', color: '#666' }} />
          <Chip label="B: MSSV" size="small" sx={{ background: '#4CAF5030', color: '#4CAF50' }} />
          <Chip label="C: TÊN" size="small" sx={{ background: '#4CAF5030', color: '#4CAF50' }} />
          <Chip label="D: BĐH" size="small" sx={{ background: '#FF980030', color: '#FF9800' }} />
          <Chip label="E-G: (bỏ qua)" size="small" sx={{ background: '#333', color: '#666' }} />
          <Chip label="H: NOTE" size="small" sx={{ background: '#FF980030', color: '#FF9800' }} />
          <Chip label="I+: Điểm Projects" size="small" sx={{ background: '#2196F330', color: '#2196F3' }} />
        </Box>
        <Typography variant="caption" sx={{ color: '#888' }}>
          Hệ thống sẽ tự động đọc tên project từ header và import điểm tương ứng.
        </Typography>
      </Paper>

      {/* Chọn kỳ để import điểm */}
      <Paper sx={{ p: 3, mb: 3, background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ color: '#b3b3b3' }}>Chọn kỳ để import điểm:</Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClearData}
            disabled={clearing}
            sx={{ 
              borderColor: '#f44336', 
              color: '#f44336',
              '&:hover': { background: 'rgba(244, 67, 54, 0.1)' }
            }}
          >
            {clearing ? 'Đang xóa...' : `🗑️ Xóa data ${semester.toUpperCase()}`}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['spring', 'summer', 'fall'].map((s) => (
            <Chip
              key={s}
              label={s === 'spring' ? 'Spring - Xuân' : s === 'summer' ? 'Summer - Hè' : 'Fall - Thu'}
              onClick={() => setSemester(s)}
              sx={{
                background: semester === s ? (s === 'spring' ? '#4CAF5030' : s === 'summer' ? '#FF980030' : '#2196F330') : 'transparent',
                color: semester === s ? (s === 'spring' ? '#4CAF50' : s === 'summer' ? '#FF9800' : '#2196F3') : '#666',
                border: `1px solid ${semester === s ? (s === 'spring' ? '#4CAF50' : s === 'summer' ? '#FF9800' : '#2196F3') : '#333'}`,
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Upload Area */}
      <Paper sx={{ p: 3, mb: 3, background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={handleFileUpload}
          showUploadList={false}
          disabled={importing}
        >
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CloudUploadIcon sx={{ fontSize: 64, color: '#FFD700', mb: 2 }} />
            <Typography sx={{ color: '#fff', mb: 1 }}>
              Kéo thả file Excel vào đây hoặc click để chọn
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Hỗ trợ: .xlsx, .xls
            </Typography>
          </Box>
        </Upload.Dragger>
      </Paper>

      {/* Preview Table */}
      {data.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#FFD700' }}>
              Preview: {data.length} members
            </Typography>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={importing}
              startIcon={importing ? null : <CheckCircleIcon />}
              sx={{
                background: '#4CAF50',
                '&:hover': { background: '#45a049' },
                '&.Mui-disabled': { background: '#333' }
              }}
            >
              {importing ? 'Đang import...' : 'Import tất cả'}
            </Button>
          </Box>

          {importing && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  background: '#333',
                  '& .MuiLinearProgress-bar': { background: '#4CAF50' }
                }} 
              />
              <Typography variant="caption" sx={{ color: '#888', mt: 0.5, display: 'block' }}>
                {Math.round(progress)}% hoàn thành
              </Typography>
            </Box>
          )}

          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ background: snackbar.severity === 'success' ? '#1e4620' : '#5f2120', color: '#fff' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportMembersPage;

