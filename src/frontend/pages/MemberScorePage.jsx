// MemberScorePage - Trang chấm điểm Members theo kỳ
import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
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
  spring: { name: 'Spring', nameVi: 'Xuân', color: '#4CAF50' },
  summer: { name: 'Summer', nameVi: 'Hè', color: '#FF9800' },
  fall: { name: 'Fall', nameVi: 'Thu', color: '#2196F3' }
};

const MemberScorePage = () => {
  const { semester } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
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

  useEffect(() => {
    loadData();
  }, [semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, projectsData] = await Promise.all([
        getAllMembers(),
        getAllProjects(semester)
      ]);
      setMembers(membersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lấy điểm của member theo semester hiện tại
  const getScoresBySemester = (member) => {
    return member.scores?.[semester] || {};
  };

  // Tính số project tham gia (có điểm > 0) trong semester
  const countProjects = (member) => {
    const scores = getScoresBySemester(member);
    return Object.values(scores).filter(s => s > 0).length;
  };

  // Tính điểm trung bình trong semester
  const calculateAverage = (member) => {
    const scores = getScoresBySemester(member);
    const validScores = Object.values(scores).filter(s => s > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  };

  // Tính tổng điểm trong semester
  const calculateTotal = (member) => {
    const scores = getScoresBySemester(member);
    return Object.values(scores).reduce((a, b) => a + b, 0);
  };

  // Handle edit score
  const handleEditScore = (memberId, projectKey, currentValue) => {
    if (!isAdmin) return;
    setEditingCell({ memberId, projectKey });
    setEditValue(currentValue?.toString() || '0');
  };

  const handleSaveScore = async () => {
    if (!editingCell) return;
    
    try {
      const score = parseInt(editValue) || 0;
      await updateMemberScore(editingCell.memberId, editingCell.projectKey, score, semester);
      
      setMembers(prev => prev.map(m => {
        if (m.id === editingCell.memberId) {
          return {
            ...m,
            scores: {
              ...m.scores,
              [semester]: {
                ...(m.scores?.[semester] || {}),
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
        <Typography sx={{ color: '#FFD700', fontWeight: 600 }}>{index + 1}</Typography>
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
      render: (_, record) => (
        <Typography sx={{ color: '#FF6B6B', fontWeight: 600 }}>
          {calculateAverage(record)}
        </Typography>
      )
    },
    // Dynamic project columns
    ...projects.map(project => ({
      title: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>{project.Name || project.key}</span>
          {isAdmin && (
            <IconButton 
              size="small" 
              onClick={() => setDeleteDialog({ open: true, type: 'project', item: project })}
              sx={{ color: '#f44336', p: 0.25 }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      ),
      key: project.key,
      width: 100,
      align: 'center',
      render: (_, record) => {
        const scores = getScoresBySemester(record);
        const score = scores[project.key] || 0;
        const isEditing = editingCell?.memberId === record.id && editingCell?.projectKey === project.key;
        
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
            onClick={() => handleEditScore(record.id, project.key, score)}
            sx={{
              cursor: isAdmin ? 'pointer' : 'default',
              p: 0.5,
              borderRadius: 1,
              background: score > 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.1)',
              color: score > 0 ? '#4CAF50' : '#666',
              fontWeight: 500,
              '&:hover': isAdmin ? { background: 'rgba(255, 215, 0, 0.2)' } : {}
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
    ...(isAdmin ? [{
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
    }] : [])
  ];

  return (
    <Box>
      <PageHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/members')} sx={{ color: '#888' }}>
              <ArrowBackIcon />
            </IconButton>
            <span>Members - {currentSemester.name} {currentYear}</span>
          </Box>
        }
        subtitle={`${members.length} thành viên · ${projects.length} projects`}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Members', path: '/members' },
          { label: `${currentSemester.name} ${currentYear}` }
        ]}
        actionText={isAdmin ? "Thêm Member" : undefined}
        actionIcon={isAdmin ? AddIcon : undefined}
        onAction={isAdmin ? () => setMemberDialog({ open: true, data: null }) : undefined}
      />

      {/* Semester Tabs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
        {Object.entries(semesterInfo).map(([key, info]) => (
          <Chip
            key={key}
            label={`${info.name} - ${info.nameVi}`}
            onClick={() => navigate(`/members/${key}`)}
            sx={{
              background: semester === key ? `${info.color}30` : 'transparent',
              color: semester === key ? info.color : '#666',
              border: `1px solid ${semester === key ? info.color : '#333'}`,
              fontWeight: semester === key ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: `${info.color}20`,
                borderColor: info.color
              }
            }}
          />
        ))}
      </Box>

      {/* Admin Actions */}
      {isAdmin && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setProjectDialog({ open: true })}
            sx={{
              borderColor: 'rgba(78, 205, 196, 0.5)',
              color: '#4ECDC4',
              '&:hover': { borderColor: '#4ECDC4', background: 'rgba(78, 205, 196, 0.1)' }
            }}
          >
            Thêm Project
          </Button>
        </Box>
      )}

      {/* Table */}
      {loading ? (
        <Loading message="Đang tải dữ liệu..." />
      ) : members.length === 0 ? (
        <EmptyState
          icon={PeopleIcon}
          title="Chưa có member nào"
          description={`Thêm member đầu tiên cho kỳ ${currentSemester.name}`}
          actionText={isAdmin ? "Thêm Member" : undefined}
          onAction={isAdmin ? () => setMemberDialog({ open: true, data: null }) : undefined}
        />
      ) : (
        <Paper sx={{ background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={members.map((m, idx) => ({ ...m, key: m.id || idx }))}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </Paper>
      )}

      {/* Add Member Dialog */}
      <Dialog
        open={memberDialog.open}
        onClose={() => setMemberDialog({ open: false, data: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)' } }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>Thêm Member mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="MSSV"
              value={memberForm.mssv}
              onChange={(e) => setMemberForm({ ...memberForm, mssv: e.target.value })}
              placeholder="VD: SE171224"
              fullWidth
            />
            <TextField
              label="Họ và Tên"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder="VD: Nguyễn Văn A"
              fullWidth
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
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMemberDialog({ open: false, data: null })} sx={{ color: '#888' }}>Hủy</Button>
          <Button onClick={handleAddMember} variant="contained" sx={{ background: currentSemester.color, color: '#fff' }}>
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
        PaperProps={{ sx: { background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)' } }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>Thêm Project - {currentSemester.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Tên Project"
              value={projectForm.Name}
              onChange={(e) => setProjectForm({ ...projectForm, Name: e.target.value })}
              placeholder="VD: Hội Xuân Làng Cóc"
              fullWidth
            />
            <TextField
              label="Key (viết tắt, không dấu)"
              value={projectForm.key}
              onChange={(e) => setProjectForm({ ...projectForm, key: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="VD: HXLC"
              helperText="Key dùng để lưu điểm, nên ngắn gọn"
              fullWidth
            />
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={projectForm.order}
              onChange={(e) => setProjectForm({ ...projectForm, order: parseInt(e.target.value) || 1 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setProjectDialog({ open: false })} sx={{ color: '#888' }}>Hủy</Button>
          <Button onClick={handleAddProject} variant="contained" sx={{ background: '#4ECDC4', color: '#1a1a1a' }}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: '', item: null })}
        PaperProps={{ sx: { background: '#1e1e1e', border: '1px solid rgba(255, 215, 0, 0.2)' } }}
      >
        <DialogTitle sx={{ color: '#f44336' }}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#b3b3b3' }}>
            Bạn có chắc muốn xóa {deleteDialog.type === 'member' ? 'member' : 'project'} "
            {deleteDialog.item?.name || deleteDialog.item?.Name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: '', item: null })} sx={{ color: '#888' }}>Hủy</Button>
          <Button onClick={handleDelete} sx={{ color: '#f44336' }}>Xóa</Button>
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
