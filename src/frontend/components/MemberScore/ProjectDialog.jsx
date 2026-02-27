import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField
} from '@mui/material';

const ProjectDialog = ({ open, onClose, projectForm, setProjectForm, onAdd, semesterName }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { background: '#1a1a1a', border: '1px solid #333333', borderRadius: 2 } }}
        >
            <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, pb: 1 }}>Thêm Project - {semesterName}</DialogTitle>
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
                    onClick={onClose}
                    sx={{ color: '#B3B3B3', borderRadius: 1, textTransform: 'none' }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={onAdd}
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
    );
};

export default ProjectDialog;
