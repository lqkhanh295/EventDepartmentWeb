// MemberScorePage - Trang chấm điểm Members theo kỳ
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '../components';
import {
  getAllMembers,
  getAllProjects,
  addMember,
  updateMemberScore,
  deleteMember,
  addProject,
  deleteProject
} from '../../services/services/memberService';
import {
  MemberDialog,
  ProjectDialog,
  DeleteDialog,
  MemberScoreTable
} from '../components/MemberScore';

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
              onClick={() => navigate(`/members/import?semester=${semester}`)}
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

      {/* Table Component */}
      <MemberScoreTable
        members={members}
        projects={projects}
        loading={loading}
        semester={semester}
        currentSemester={currentSemester}
        pagination={pagination}
        setPagination={setPagination}
        sortMode={sortMode}
        editingCell={editingCell}
        editValue={editValue}
        setEditValue={setEditValue}
        handleEditScore={handleEditScore}
        handleSaveScore={handleSaveScore}
        handleCancelEdit={handleCancelEdit}
        setDeleteDialog={setDeleteDialog}
        setMemberDialog={setMemberDialog}
      />

      {/* Add Member Dialog */}
      <MemberDialog
        open={memberDialog.open}
        onClose={() => setMemberDialog({ open: false, data: null })}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        onAdd={handleAddMember}
        semesterColor={currentSemester.color}
      />

      {/* Add Project Dialog */}
      <ProjectDialog
        open={projectDialog.open}
        onClose={() => setProjectDialog({ open: false })}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        onAdd={handleAddProject}
        semesterName={currentSemester.name}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, type: '', item: null })}
        deleteType={deleteDialog.type}
        deleteItem={deleteDialog.item}
        onDelete={handleDelete}
      />

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
