import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';

const DeleteDialog = ({ open, onClose, deleteType, deleteItem, onDelete }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 } }}
        >
            <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, pb: 1 }}>Xác nhận xóa</DialogTitle>
            <DialogContent>
                <Typography sx={{ color: '#b3b3b3' }}>
                    Bạn có chắc muốn xóa {deleteType === 'member' ? 'member' : 'project'} "
                    {deleteItem?.name || deleteItem?.Name}"?
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    sx={{ color: '#B3B3B3', borderRadius: 1, textTransform: 'none' }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={onDelete}
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
    );
};

export default DeleteDialog;
