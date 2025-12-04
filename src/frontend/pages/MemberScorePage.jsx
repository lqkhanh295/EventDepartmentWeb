// MemberScorePage - Trang chấm điểm Members theo kỳ
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Table, Input } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import { PageHeader, Loading, EmptyState } from '../components';
import {
  getAllMembers,
  getAllProjects,
  addMember,
  updateMemberScore,
  deleteMember,
  addProject,
  deleteProject
} from '../../backend/services/memberService';

const semesterInfo = {
  spring: { name: 'Spring', color: '#4CAF50' },
  summer: { name: 'Summer', color: '#FF9800' },
  fall: { name: 'Fall', color: '#2196F3' },
  year: { name: 'Cả năm', nameVi: 'Tổng hợp', color: '#FFD700' }
};

const MemberScorePage = () => {
  const { semester } = useParams();
  const navigate = useNavigate();
  
  const currentSemester = semesterInfo[semester] || semesterInfo.fall;
  const currentYear = new Date().getFullYear();
  
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Dialogs
  const [memberDialog, setMemberDialog] = useState({ open: false, data: null });
  const [projectDialog, setProjectDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', item: null });
  
  // Form data
  const [memberForm, setMemberForm] = useState({ mssv: '', name: '', isBDH: false, note: '' });
  const [projectForm, setProjectForm] = useState({ Name: '', key: '', order: 1 });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [sortMode, setSortMode] = useState('default'); // 'default' | 'rank'

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (semester === 'year') {
        // Load tất cả projects từ 3 kỳ
        const [membersData, springProjects, summerProjects, fallProjects] = await Promise.all([
          getAllMembers(),
          getAllProjects('spring'),
          getAllProjects('summer'),
          getAllProjects('fall')
        ]);
        setMembers(membersData);
        // Gộp tất cả projects với prefix kỳ
        const allProjects = [
          ...springProjects.map(p => ({ ...p, semester: 'spring', displayName: `[Sp] ${p.Name || p.key}` })),
          ...summerProjects.map(p => ({ ...p, semester: 'summer', displayName: `[Su] ${p.Name || p.key}` })),
          ...fallProjects.map(p => ({ ...p, semester: 'fall', displayName: `[Fa] ${p.Name || p.key}` }))
        ];
        setProjects(allProjects);
      } else {
        const [membersData, projectsData] = await Promise.all([
          getAllMembers(),
          getAllProjects(semester)
        ]);
        setMembers(membersData);
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải dữ liệu', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [semester]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Lấy điểm của member theo semester hiện tại
  const getScoresBySemester = (member, sem = semester) => {
    return member.scores?.[sem] || {};
  };

  // Lấy điểm của project (hỗ trợ cả năm)
  const getProjectScore = (member, project) => {
    if (semester === 'year') {
      const scores = getScoresBySemester(member, project.semester);
      return scores[project.key] || 0;
    }
    const scores = getScoresBySemester(member);
    return scores[project.key] || 0;
  };

  // Tính số project tham gia (có điểm > 0)
  const countProjects = (member) => {
    return projects.filter(p => getProjectScore(member, p) > 0).length;
  };

  // Tính điểm trung bình
  const calculateAverage = (member) => {
    const validScores = projects.map(p => getProjectScore(member, p)).filter(s => s > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  };

  // Tính tổng điểm
  const calculateTotal = (member) => {
    return projects.reduce((sum, p) => sum + getProjectScore(member, p), 0);
  };

  // Handle edit score
  const handleEditScore = (memberId, projectKey, currentValue, projectSemester = semester) => {
    setEditingCell({ memberId, projectKey, projectSemester });
    setEditValue(currentValue?.toString() || '0');
  };

  const handleSaveScore = async () => {
    if (!editingCell) return;
    
    try {
      const score = parseInt(editValue) || 0;
      const targetSemester = editingCell.projectSemester || semester;
      await updateMemberScore(editingCell.memberId, editingCell.projectKey, score, targetSemester);
      
      setMembers(prev => prev.map(m => {
        if (m.id === editingCell.memberId) {
          return {
            ...m,
            scores: {
              ...m.scores,
              [targetSemester]: {
                ...(m.scores?.[targetSemester] || {}),
                [editingCell.projectKey]: score
              }
            }
          };
        }
        return m;
      }));
      
      setEditingCell(null);
      showSnackbar('Cập nhật điểm thành công!', 'success');
    } catch (error) {
      showSnackbar('Lỗi khi cập nhật điểm', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle add member
  const handleAddMember = async () => {
    if (!memberForm.mssv || !memberForm.name) {
      showSnackbar('Vui lòng nhập MSSV và Tên', 'warning');
      return;
    }

    try {
      // Khởi tạo scores cho semester hiện tại
      const initialScores = { [semester]: {} };
      projects.forEach(p => {
        initialScores[semester][p.key] = 0;
      });

      await addMember({
        ...memberForm,
        scores: initialScores
      });
      
      showSnackbar('Thêm member thành công!', 'success');
      setMemberDialog({ open: false, data: null });
      setMemberForm({ mssv: '', name: '', isBDH: false, note: '' });
      loadData();
    } catch (error) {
      showSnackbar('Lỗi khi thêm member', 'error');
    }
  };

  // Handle add project
  const handleAddProject = async () => {
    if (!projectForm.Name || !projectForm.key) {
      showSnackbar('Vui lòng nhập tên và key project', 'warning');
      return;
    }

    try {
      await addProject(projectForm, semester);
      showSnackbar('Thêm project thành công!', 'success');
      setProjectDialog({ open: false });
      setProjectForm({ Name: '', key: '', order: projects.length + 1 });
      loadData();
    } catch (error) {
      showSnackbar('Lỗi khi thêm project', 'error');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'member') {
        await deleteMember(deleteDialog.item.id);
        showSnackbar('Xóa member thành công!', 'success');
      } else if (deleteDialog.type === 'project') {
        await deleteProject(deleteDialog.item.id, semester);
        showSnackbar('Xóa project thành công!', 'success');
      }
      setDeleteDialog({ open: false, type: '', item: null });
      loadData();
    } catch (error) {
      showSnackbar('Lỗi khi xóa', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Build columns
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      fixed: 'left',
      render: (_, __, index) => (
        <Typography sx={{ color: '#FFD700', fontWeight: 600 }}>
          {(pagination.current - 1) * pagination.pageSize + index + 1}
        </Typography>
      )
    },
    {
      title: 'MSSV',
      dataIndex: 'mssv',
      key: 'mssv',
      width: 100,
      fixed: 'left',
      render: (text) => (
        <Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>{text || '#N/A'}</Typography>
      )
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      fixed: 'left',
      render: (text, record) => (
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 500 }}>{text}</Typography>
          {record.isBDH && (
            <Chip label="BĐH" size="small" sx={{ 
              height: 18, fontSize: '0.65rem', 
              background: 'rgba(255, 215, 0, 0.2)', 
              color: '#FFD700',
              mt: 0.5
            }} />
          )}
        </Box>
      )
    },
    {
      title: 'Số Project',
      key: 'soProject',
      width: 90,
      align: 'center',
      sorter: (a, b) => countProjects(b) - countProjects(a),
      defaultSortOrder: 'ascend',
      render: (_, record) => (
        <Typography sx={{ color: '#4ECDC4', fontWeight: 600 }}>
          {countProjects(record)}
        </Typography>
      )
    },
    {
      title: 'Trung bình',
      key: 'average',
      width: 90,
      align: 'center',
      sorter: (a, b) => calculateAverage(a) - calculateAverage(b),
      render: (_, record) => (
        <Typography sx={{ color: '#FF6B6B', fontWeight: 600 }}>
          {calculateAverage(record)}
        </Typography>
      )
    },
    // Dynamic project columns
    ...projects.map(project => ({
      title: (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          whiteSpace: 'nowrap'
        }}>
          <span>
            {project.displayName || project.Name || project.key}
          </span>
          {semester !== 'year' && (
            <IconButton 
              size="small" 
              onClick={() => setDeleteDialog({ open: true, type: 'project', item: project })}
              sx={{ color: '#f44336', p: 0.25, flexShrink: 0 }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      ),
      key: `${project.semester || semester}_${project.key}`,
      width: 'auto',
      align: 'center',
      render: (_, record) => {
        const score = getProjectScore(record, project);
        const isEditing = editingCell?.memberId === record.id && editingCell?.projectKey === project.key && editingCell?.projectSemester === (project.semester || semester);
        
        if (isEditing) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Input
                size="small"
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onPressEnter={handleSaveScore}
                style={{ width: 50, textAlign: 'center' }}
                autoFocus
              />
              <IconButton size="small" onClick={handleSaveScore} sx={{ color: '#4CAF50', p: 0.25 }}>
                <SaveIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={handleCancelEdit} sx={{ color: '#f44336', p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          );
        }

        return (
          <Box
            onClick={() => handleEditScore(record.id, project.key, score, project.semester || semester)}
            sx={{
              cursor: 'pointer',
              p: 0.75,
              borderRadius: 1,
              background: score > 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.1)',
              color: score > 0 ? '#4CAF50' : '#999',
              fontWeight: 600,
              minWidth: 50,
              width: '100%',
              display: 'block',
              textAlign: 'center',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              '&:hover': { 
                background: 'rgba(255, 215, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)'
              }
            }}
          >
            {score}
          </Box>
        );
      }
    })),
    {
      title: 'Tổng điểm',
      key: 'total',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Typography sx={{ color: '#FFD700', fontWeight: 700 }}>
          {calculateTotal(record)}
        </Typography>
      )
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      render: (text) => (
        <Typography sx={{ color: '#888', fontSize: '0.85rem', fontStyle: 'italic' }}>
          {text || '-'}
        </Typography>
      )
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      fixed: 'right',
      render: (_, record) => (
        <IconButton
          size="small"
          onClick={() => setDeleteDialog({ open: true, type: 'member', item: record })}
          sx={{ color: '#f44336' }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  return (
    <Box>
      <PageHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/eventleader')} sx={{ color: '#888' }}>
              <ArrowBackIcon />
            </IconButton>
            <span>Members - {currentSemester.name} {currentYear}</span>
          </Box>
        }
        subtitle={`${members.length} thành viên · ${projects.length} projects`}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Event Leader', path: '/eventleader' },
          { label: `${currentSemester.name} ${currentYear}` }
        ]}
        actionText="Thêm Member"
        actionIcon={AddIcon}
        onAction={() => setMemberDialog({ open: true, data: null })}
      />

      {/* Semester Tabs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(semesterInfo).map(([key, info]) => (
          <Chip
            key={key}
            label={key === 'year' ? `🏆 ${info.name}` : info.name}
            onClick={() => navigate(`/members/${key}`)}
            sx={{
              background: semester === key ? `${info.color}20` : 'transparent',
              color: semester === key ? info.color : '#B3B3B3',
              border: `1px solid ${semester === key ? info.color : '#333333'}`,
              borderRadius: 1,
              fontWeight: semester === key ? 600 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              px: 2,
              py: 0.75,
              '&:hover': {
                background: `${info.color}15`,
                borderColor: info.color
              }
            }}
          />
        ))}
      </Box>

{/* Admin Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant={sortMode === 'rank' ? 'contained' : 'outlined'}
          onClick={() => setSortMode(sortMode === 'rank' ? 'default' : 'rank')}
          sx={{
            borderColor: sortMode === 'rank' ? '#FF6B6B' : '#333333',
            color: sortMode === 'rank' ? '#FFFFFF' : '#FF6B6B',
            background: sortMode === 'rank' ? '#FF6B6B' : 'transparent',
            borderRadius: 1,
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            '&:hover': { 
              borderColor: '#FF6B6B', 
              background: sortMode === 'rank' ? '#FF5252' : 'rgba(255, 107, 107, 0.1)' 
            }
          }}
        >
          Xếp hạng
        </Button>
        
        {semester !== 'year' && (
          <>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setProjectDialog({ open: true })}
              sx={{
                borderColor: '#333333',
                color: '#4ECDC4',
                borderRadius: 1,
                textTransform: 'none',
                '&:hover': { borderColor: '#4ECDC4', background: 'rgba(78, 205, 196, 0.1)' }
              }}
            >
              Thêm Project
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(`/eventleader/import?semester=${semester}`)}
              sx={{
                borderColor: '#333333',
                color: '#FFD700',
                borderRadius: 1,
                textTransform: 'none',
                '&:hover': { borderColor: '#FFD700', background: 'rgba(255, 215, 0, 0.1)' }
              }}
            >
              Import Excel
            </Button>
          </>
        )}
      </Box>

      {/* Table */}
      {loading ? (
        <Loading message="Đang tải dữ liệu..." />
      ) : members.length === 0 ? (
        <EmptyState
          icon={PeopleIcon}
          title="Chưa có member nào"
          description={`Thêm member đầu tiên cho kỳ ${currentSemester.name}`}
          actionText="Thêm Member"
          onAction={() => setMemberDialog({ open: true, data: null })}
        />
      ) : (
        <Paper sx={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={
               sortMode === 'rank'
                 ? [...members]
                     .sort((a, b) => {
                       // Sort by số project (cao -> thấp), sau đó theo điểm TB (cao -> thấp)
                       const projectDiff = countProjects(b) - countProjects(a);
                       if (projectDiff !== 0) return projectDiff;
                       return calculateAverage(b) - calculateAverage(a);
                     })
                     .map((m, idx) => ({ ...m, key: m.id || idx }))
                 : members.map((m, idx) => ({ ...m, key: m.id || idx }))
             }
            pagination={{ 
              current: pagination.current,
              pageSize: pagination.pageSize, 
              showSizeChanger: true, 
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => setPagination({ current: page, pageSize })
            }}
            scroll={{ x: 'max-content', y: 'calc(100vh - 400px)' }}
            size="small"
            style={{ 
              background: '#1a1a1a'
            }}
            components={{
              body: {
                cell: (props) => {
                  const isFixed = props.className && (
                    props.className.includes('ant-table-cell-fix-left') || 
                    props.className.includes('ant-table-cell-fix-right')
                  );
                  return (
                    <td {...props} style={{ 
                      ...props.style, 
                      position: isFixed ? 'sticky' : 'relative',
                      zIndex: isFixed ? 10 : 1,
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      overflow: 'visible',
                      whiteSpace: 'nowrap'
                    }} />
                  );
                }
              }
            }}
          />
        </Paper>
      )}

      {/* Add Member Dialog */}
      <Dialog
        open={memberDialog.open}
        onClose={() => setMemberDialog({ open: false, data: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, pb: 1 }}>Thêm Member mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="MSSV"
              value={memberForm.mssv}
              onChange={(e) => setMemberForm({ ...memberForm, mssv: e.target.value })}
              placeholder="VD: SE171224"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#121212',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#B3B3B3' },
                '& .MuiInputBase-input': { color: '#FFFFFF' }
              }}
            />
            <TextField
              label="Họ và Tên"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder="VD: Nguyễn Văn A"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#121212',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#B3B3B3' },
                '& .MuiInputBase-input': { color: '#FFFFFF' }
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={memberForm.isBDH}
                  onChange={(e) => setMemberForm({ ...memberForm, isBDH: e.target.checked })}
                  sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                />
              }
              label={<Typography sx={{ color: '#b3b3b3' }}>Ban Điều Hành (BĐH)</Typography>}
            />
            <TextField
              label="Ghi chú"
              value={memberForm.note}
              onChange={(e) => setMemberForm({ ...memberForm, note: e.target.value })}
              multiline
              rows={2}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#121212',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#B3B3B3' },
                '& .MuiInputBase-input': { color: '#FFFFFF' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setMemberDialog({ open: false, data: null })} 
            sx={{ color: '#B3B3B3', borderRadius: 1, textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleAddMember} 
            variant="contained" 
            sx={{ 
              background: currentSemester.color, 
              color: '#FFFFFF',
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: currentSemester.color, opacity: 0.9 }
            }}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog
        open={projectDialog.open}
        onClose={() => setProjectDialog({ open: false })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, pb: 1 }}>Thêm Project - {currentSemester.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Tên Project"
              value={projectForm.Name}
              onChange={(e) => setProjectForm({ ...projectForm, Name: e.target.value })}
              placeholder="VD: Hội Xuân Làng Cóc"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#121212',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#B3B3B3' },
                '& .MuiInputBase-input': { color: '#FFFFFF' }
              }}
            />
            <TextField
              label="Key (viết tắt, không dấu)"
              value={projectForm.key}
              onChange={(e) => setProjectForm({ ...projectForm, key: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="VD: HXLC"
              helperText="Key dùng để lưu điểm, nên ngắn gọn"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#121212',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#B3B3B3' },
                '& .MuiInputBase-input': { color: '#FFFFFF' }
              }}
            />
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={projectForm.order}
              onChange={(e) => setProjectForm({ ...projectForm, order: parseInt(e.target.value) || 1 })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#121212',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputLabel-root': { color: '#B3B3B3' },
                '& .MuiInputBase-input': { color: '#FFFFFF' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setProjectDialog({ open: false })} 
            sx={{ color: '#B3B3B3', borderRadius: 1, textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleAddProject} 
            variant="contained" 
            sx={{ 
              background: '#4ECDC4', 
              color: '#000000',
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: '#4ECDC4', opacity: 0.9 }
            }}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: '', item: null })}
        PaperProps={{ sx: { background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, pb: 1 }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#b3b3b3' }}>
            Bạn có chắc muốn xóa {deleteDialog.type === 'member' ? 'member' : 'project'} "
            {deleteDialog.item?.name || deleteDialog.item?.Name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, type: '', item: null })} 
            sx={{ color: '#B3B3B3', borderRadius: 1, textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleDelete} 
            sx={{ 
              color: '#f44336',
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: 'rgba(244, 67, 54, 0.1)' }
            }}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default MemberScorePage;
