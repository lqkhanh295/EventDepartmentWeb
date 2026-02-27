import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    FormControlLabel,
    Checkbox,
    Typography
} from '@mui/material';

const MemberDialog = ({ open, onClose, memberForm, setMemberForm, onAdd, semesterColor }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                    onClick={onClose}
                    sx={{ color: '#B3B3B3', borderRadius: 1, textTransform: 'none' }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={onAdd}
                    variant="contained"
                    sx={{
                        background: semesterColor,
                        color: '#FFFFFF',
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { background: semesterColor, opacity: 0.9 }
                    }}
                >
                    Thêm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MemberDialog;
