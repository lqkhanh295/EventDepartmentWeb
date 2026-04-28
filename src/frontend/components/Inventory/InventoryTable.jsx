import React from 'react';
import {
     Box, Typography, CircularProgress, TableContainer, Table,
    TableHead, TableRow, TableCell, TableBody, Checkbox, TextField,
    Chip, IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import { GlassCard } from '../../components';
// Màu cho các loại Type
const getTypeColor = (type) => {
    const typeColors = {
        'Decor': '#FF6B6B',
        'Đồ dùng bếp': '#4ECDC4',
        'Văn phòng phẩm': '#FFD93D',
        'Vật phẩm thường': '#95E1D3',
    };
    return typeColors[type] || '#A0A0A0';
};

const InventoryTable = ({
    isAdmin,
    loading,
    remainingRows,
    rawRows,
    borrowItems,
    handleBorrowToggle,
    editingIndex,
    draftRow,
    setDraftRow,
    handleBorrowQuantityChange,
    saveEdit,
    startEdit,
    removeRow,
    setEditingIndex
}) => {
    return (
        <GlassCard tilt={false} sx={{ flex: 1, p: { xs: 2, sm: 3 }, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#FFD700', fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 600 }}>
                    Danh sách vật phẩm còn lại
                </Typography>
                {loading && (
                    <CircularProgress size={20} sx={{ color: '#FFD700' }} />
                )}
            </Box>
            <TableContainer component={Box} sx={{ flex: 1, overflow: 'auto', width: '100%', borderRadius: 2 }}>
                <Table stickyHeader size="small" sx={{ minWidth: { xs: 600, sm: 800 } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{
                                color: '#FFD700', background: '#1a1a1a',
                                borderBottom: '2px solid rgba(255,215,0,0.3)',
                                fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5, width: 50
                            }} align="center">Mượn</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Type</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Item</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }} align="right">Current Qty</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }} align="right">Total Qty</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Unit</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>P.I.C</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Note</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5, width: 100 }} align="center">Số lượng</TableCell>
                            {isAdmin && (
                                <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }} align="center">Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {remainingRows.map((r, idx) => {
                            const isEditing = isAdmin && editingIndex === idx;
                            const isSelected = borrowItems[idx] !== undefined;
                            const currentQty = Number(String(r['Current Quantity'] ?? '0').replace(/[^\d.-]/g, ''));

                            return (
                                <TableRow
                                    key={idx}
                                    sx={{
                                        '&:nth-of-type(odd)': { backgroundColor: '#1b1b1b' },
                                        '&:hover': { backgroundColor: '#222' },
                                        transition: 'background-color 0.2s',
                                        ...(isSelected && {
                                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                            borderLeft: '3px solid #FFD700'
                                        })
                                    }}
                                >
                                    <TableCell sx={{ color: '#eee', py: 1.5 }} align="center">
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={(e) => handleBorrowToggle(idx, e.target.checked)}
                                            sx={{
                                                color: '#FFD700',
                                                '&.Mui-checked': { color: '#FFD700' }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5 }}>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['Type'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, Type: e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                label={r['Type']}
                                                size="small"
                                                sx={{
                                                    background: `${getTypeColor(r['Type'])}22`,
                                                    color: getTypeColor(r['Type']),
                                                    border: `1px solid ${getTypeColor(r['Type'])}44`,
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem'
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5, fontWeight: 500 }}>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['Item'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, Item: e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : r['Item']}
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5 }} align="right">
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['Current Quantity'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, 'Current Quantity': e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : r['Current Quantity']}
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5 }} align="right">
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['Total Quantity'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, 'Total Quantity': e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : r['Total Quantity']}
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5 }}>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['Unit'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, Unit: e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : r['Unit']}
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5 }}>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['P.I.C'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, 'P.I.C': e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : r['P.I.C']}
                                    </TableCell>
                                    <TableCell sx={{ color: '#ccc', py: 1.5, fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={draftRow?.['Note'] || ''}
                                                onChange={(e) => setDraftRow(prev => ({ ...prev, Note: e.target.value }))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: 'rgba(255,215,0,0.2)' },
                                                        '& input': { color: '#fff', fontSize: '0.85rem' }
                                                    }
                                                }}
                                            />
                                        ) : (r['Note'] || '-')}
                                    </TableCell>
                                    <TableCell sx={{ color: '#eee', py: 1.5 }} align="center">
                                        {isSelected ? (
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={borrowItems[idx] || 1}
                                                onChange={(e) => handleBorrowQuantityChange(idx, e.target.value)}
                                                inputProps={{
                                                    min: 1,
                                                    max: currentQty,
                                                    style: { textAlign: 'center', color: '#fff' }
                                                }}
                                                sx={{
                                                    width: 80,
                                                    '& .MuiOutlinedInput-root': {
                                                        background: '#252525',
                                                        '& fieldset': { borderColor: '#FFD700' },
                                                        '&:hover fieldset': { borderColor: '#FFE44D' },
                                                        '&.Mui-focused fieldset': { borderColor: '#FFE44D' }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#666' }}>-</Typography>
                                        )}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                {isEditing ? (
                                                    <>
                                                        <IconButton
                                                            onClick={saveEdit}
                                                            size="small"
                                                            sx={{ color: '#4CAF50', '&:hover': { background: 'rgba(76, 175, 80, 0.1)' } }}
                                                            title="Lưu"
                                                        >
                                                            <SaveIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => { setEditingIndex(null); setDraftRow(null); }}
                                                            size="small"
                                                            sx={{ color: '#f44336', '&:hover': { background: 'rgba(244, 67, 54, 0.1)' } }}
                                                            title="Hủy"
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton
                                                            onClick={() => startEdit(idx)}
                                                            size="small"
                                                            sx={{ color: '#FFD700', '&:hover': { background: 'rgba(255, 215, 0, 0.1)' } }}
                                                            title="Sửa"
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => removeRow(idx)}
                                                            size="small"
                                                            sx={{ color: '#f44336', '&:hover': { background: 'rgba(244, 67, 54, 0.1)' } }}
                                                            title="Xóa"
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                        {remainingRows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={isAdmin ? 10 : 9}
                                    sx={{ color: '#888', textAlign: 'center', py: 6, fontSize: '0.95rem' }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#666' }}>
                                            Không có dữ liệu hiển thị
                                        </Typography>
                                        {isAdmin && (
                                            <Typography variant="caption" sx={{ color: '#555' }}>
                                                Hãy tải CSV/XLSX tồn kho để bắt đầu
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </GlassCard>
    );
};

export default InventoryTable;
