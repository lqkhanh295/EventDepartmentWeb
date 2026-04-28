import React from 'react';
import {
    Box, Typography, CircularProgress, TableContainer,
    Table, TableHead, TableRow, TableCell, TableBody, Chip, Button
} from '@mui/material';
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';

import { GlassCard } from '../../components';
const BorrowedItemsTable = ({
    borrowedItemsList,
    borrowedItemsLoading,
    handleReturnItem
}) => {
    return (
        <GlassCard tilt={false} sx={{ flex: 1, p: { xs: 2, sm: 3 }, background: '#1e1e1e', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#FFD700', fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 600 }}>
                    Danh sách vật phẩm đã mượn
                </Typography>
                {borrowedItemsLoading && (
                    <CircularProgress size={20} sx={{ color: '#FFD700' }} />
                )}
            </Box>
            <TableContainer component={Box} sx={{ flex: 1, overflow: 'auto', width: '100%', borderRadius: 2 }}>
                <Table stickyHeader size="small" sx={{ minWidth: { xs: 600, sm: 800 } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Vật phẩm</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Loại</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }} align="right">Số lượng</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Người mượn</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }}>Ngày mượn</TableCell>
                            <TableCell sx={{ color: '#FFD700', background: '#1a1a1a', borderBottom: '2px solid rgba(255,215,0,0.3)', fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 600, py: 1.5 }} align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {borrowedItemsList.map((item) => (
                            <TableRow
                                key={item.id}
                                sx={{
                                    '&:nth-of-type(odd)': { backgroundColor: '#1b1b1b' },
                                    '&:hover': { backgroundColor: '#222' },
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <TableCell sx={{ color: '#eee', py: 1.5, fontWeight: 500 }}>{item.item}</TableCell>
                                <TableCell sx={{ color: '#eee', py: 1.5 }}>
                                    <Chip
                                        label={item.type || 'N/A'}
                                        size="small"
                                        sx={{
                                            background: 'rgba(255, 215, 0, 0.2)',
                                            color: '#FFD700',
                                            border: '1px solid rgba(255, 215, 0, 0.3)',
                                            fontWeight: 600,
                                            fontSize: '0.8rem'
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ color: '#eee', py: 1.5 }} align="right">
                                    <strong style={{ color: '#FFD700' }}>{item.quantity}</strong> {item.unit}
                                </TableCell>
                                <TableCell sx={{ color: '#ccc', py: 1.5, fontSize: '0.85rem' }}>{item.borrowedBy || 'N/A'}</TableCell>
                                <TableCell sx={{ color: '#ccc', py: 1.5, fontSize: '0.85rem' }}>
                                    {item.borrowedAt ? new Date(item.borrowedAt).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'N/A'}
                                </TableCell>
                                <TableCell align="center" sx={{ py: 1.5 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<AssignmentReturnedIcon />}
                                        onClick={() => handleReturnItem(item)}
                                        disabled={borrowedItemsLoading}
                                        sx={{
                                            background: '#FFD700',
                                            color: '#1a1a1a',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            fontSize: '0.8rem',
                                            '&:hover': { background: '#FFE44D' },
                                            '&.Mui-disabled': {
                                                background: '#333',
                                                color: '#666'
                                            }
                                        }}
                                    >
                                        Trả lại
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {borrowedItemsList.length === 0 && !borrowedItemsLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    sx={{
                                        color: '#888',
                                        textAlign: 'center',
                                        py: 6,
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#666' }}>
                                            Chưa có vật phẩm nào được mượn
                                        </Typography>
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

export default BorrowedItemsTable;
