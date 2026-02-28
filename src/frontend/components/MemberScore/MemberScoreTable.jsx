import React from 'react';
import {
    Typography,
    Box,
    Chip,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import { Loading, EmptyState } from '../index';
import {
    getProjectScore,
    countProjects,
    calculateAverage,
    calculateTotal
} from './scoreUtils';

const MemberScoreTable = ({
    members,
    projects,
    loading,
    semester,
    currentSemester,
    pagination,
    setPagination,
    sortMode,
    editingCell,
    editValue,
    setEditValue,
    handleEditScore,
    handleSaveScore,
    handleCancelEdit,
    setDeleteDialog,
    setMemberDialog
}) => {
    if (loading) {
        return <Loading message="Đang tải dữ liệu..." />;
    }

    if (members.length === 0) {
        return (
            <EmptyState
                icon={PeopleIcon}
                title="Chưa có member nào"
                description={`Thêm member đầu tiên cho kỳ ${currentSemester.name}`}
                actionText="Thêm Member"
                onAction={() => setMemberDialog({ open: true, data: null })}
            />
        );
    }

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
            sorter: (a, b) => countProjects(b, projects, semester) - countProjects(a, projects, semester),
            defaultSortOrder: 'ascend',
            render: (_, record) => (
                <Typography sx={{ color: '#4ECDC4', fontWeight: 600 }}>
                    {countProjects(record, projects, semester)}
                </Typography>
            )
        },
        {
            title: 'Trung bình',
            key: 'average',
            width: 90,
            align: 'center',
            sorter: (a, b) => calculateAverage(a, projects, semester) - calculateAverage(b, projects, semester),
            render: (_, record) => (
                <Typography sx={{ color: '#FF6B6B', fontWeight: 600 }}>
                    {calculateAverage(record, projects, semester)}
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
                const score = getProjectScore(record, project, semester);
                const isEditing = editingCell?.memberId === record.id && editingCell?.projectKey === project.key && editingCell?.projectSemester === (project.semester || semester);

                if (isEditing) {
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TextField
                                size="small"
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveScore();
                                    }
                                }}
                                inputProps={{ style: { width: 50, textAlign: 'center', padding: '4px' } }}
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
                    {calculateTotal(record, projects, semester)}
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

    const sortedDataSource = sortMode === 'rank'
        ? [...members]
            .sort((a, b) => {
                const projectDiff = countProjects(b, projects, semester) - countProjects(a, projects, semester);
                if (projectDiff !== 0) return projectDiff;
                return calculateAverage(b, projects, semester) - calculateAverage(a, projects, semester);
            })
            .map((m, idx) => ({ ...m, key: m.id || idx }))
        : members.map((m, idx) => ({ ...m, key: m.id || idx }));
    const displayedData = sortedDataSource.slice(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize
    );

    const handleChangePage = (event, newPage) => {
        setPagination((prev) => ({ ...prev, current: newPage + 1 }));
    };

    const handleChangeRowsPerPage = (event) => {
        setPagination({ current: 1, pageSize: parseInt(event.target.value, 10) });
    };

    return (
        <Paper sx={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
                <Table stickyHeader size="small" style={{ background: '#1a1a1a' }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((col, idx) => (
                                <TableCell
                                    key={col.key || idx}
                                    align={col.align || 'left'}
                                    sx={{
                                        backgroundColor: '#000',
                                        color: '#B3B3B3',
                                        fontWeight: 600,
                                        width: col.width,
                                        minWidth: col.width,
                                        whiteSpace: 'nowrap',
                                        position: col.fixed ? 'sticky' : 'static',
                                        left: col.fixed === 'left' ? (idx === 0 ? 0 : idx === 1 ? 60 : idx === 2 ? 160 : 0) : 'auto',
                                        right: col.fixed === 'right' ? 0 : 'auto',
                                        zIndex: col.fixed ? 10 : 1,
                                        boxShadow: col.fixed === 'left' ? '1px 0 0 rgba(255,255,255,0.1)' : (col.fixed === 'right' ? '-1px 0 0 rgba(255,255,255,0.1)' : 'none')
                                    }}
                                >
                                    {col.title}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedData.map((row, index) => (
                            <TableRow key={row.key || index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                {columns.map((col, idx) => (
                                    <TableCell
                                        key={col.key || idx}
                                        align={col.align || 'left'}
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            backgroundColor: '#1a1a1a',
                                            position: col.fixed ? 'sticky' : 'static',
                                            left: col.fixed === 'left' ? (idx === 0 ? 0 : idx === 1 ? 60 : idx === 2 ? 160 : 0) : 'auto',
                                            right: col.fixed === 'right' ? 0 : 'auto',
                                            zIndex: col.fixed ? 5 : 1,
                                            boxShadow: col.fixed === 'left' ? '1px 0 0 rgba(255,255,255,0.1)' : (col.fixed === 'right' ? '-1px 0 0 rgba(255,255,255,0.1)' : 'none')
                                        }}
                                    >
                                        {col.render ? col.render(row[col.dataIndex], row, index) : row[col.dataIndex]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={sortedDataSource.length}
                page={pagination.current - 1}
                onPageChange={handleChangePage}
                rowsPerPage={pagination.pageSize}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Số hàng:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                rowsPerPageOptions={[10, 20, 50, 100]}
                sx={{
                    color: '#B3B3B3',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-select, .MuiTablePagination-displayedRows': {
                        color: '#B3B3B3',
                    },
                    '.MuiTablePagination-actions button': {
                        color: '#FFD700',
                    }
                }}
            />
        </Paper>
    );
};

export default MemberScoreTable;
