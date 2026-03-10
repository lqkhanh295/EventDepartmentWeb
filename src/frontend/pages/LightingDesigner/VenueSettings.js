// VenueSettings — Dialog for venue configuration
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';

const VenueSettings = ({ open, onClose, settings, onSettingsChange }) => {
    const [local, setLocal] = useState({
        venueName: settings?.venueName || '',
        venueWidth: settings?.venueWidth || 20,
        venueHeight: settings?.venueHeight || 15,
        venueBackground: settings?.venueBackground || '',
        showGrid: settings?.showGrid !== false,
    });

    const handleSave = () => {
        onSettingsChange(local);
        onClose();
    };

    const handleReset = () => {
        const defaults = {
            venueName: '',
            venueWidth: 20,
            venueHeight: 15,
            venueBackground: '',
            showGrid: true,
        };
        setLocal(defaults);
    };

    const dialogPaperSx = {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: 420,
    };

    const inputSx = {
        '& .MuiInputBase-root': { color: '#ddd', fontSize: '0.85rem' },
        '& .MuiInputLabel-root': { color: '#888', fontSize: '0.85rem' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: dialogPaperSx }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    🏟️ Venue Settings
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: '#888' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    {/* Venue name */}
                    <TextField
                        label="Tên venue"
                        size="small"
                        fullWidth
                        value={local.venueName}
                        onChange={(e) => setLocal({ ...local, venueName: e.target.value })}
                        sx={inputSx}
                    />

                    {/* Dimensions */}
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Kích thước (mét)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label="Rộng (m)"
                            type="number"
                            size="small"
                            value={local.venueWidth}
                            onChange={(e) => setLocal({ ...local, venueWidth: Number(e.target.value) })}
                            sx={{ ...inputSx, flex: 1 }}
                        />
                        <TextField
                            label="Dài (m)"
                            type="number"
                            size="small"
                            value={local.venueHeight}
                            onChange={(e) => setLocal({ ...local, venueHeight: Number(e.target.value) })}
                            sx={{ ...inputSx, flex: 1 }}
                        />
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                    {/* Background image URL (Cloudinary) */}
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        Background Image (Cloudinary URL)
                    </Typography>
                    <TextField
                        label="URL hình nền"
                        size="small"
                        fullWidth
                        placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                        value={local.venueBackground}
                        onChange={(e) => setLocal({ ...local, venueBackground: e.target.value })}
                        sx={inputSx}
                        helperText="Paste URL từ Cloudinary hoặc để trống để dùng grid mặc định"
                        FormHelperTextProps={{ sx: { color: '#555', fontSize: '0.7rem' } }}
                    />

                    {local.venueBackground && (
                        <Box
                            sx={{
                                width: '100%',
                                height: 120,
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <img
                                src={local.venueBackground}
                                alt="Venue preview"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </Box>
                    )}

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                    {/* Grid toggle */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={local.showGrid}
                                onChange={(e) => setLocal({ ...local, showGrid: e.target.checked })}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF6B35' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FF6B35' },
                                }}
                            />
                        }
                        label={<Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.85rem' }}>Hiển thị lưới</Typography>}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleReset}
                    startIcon={<RestoreIcon />}
                    sx={{ color: '#999', textTransform: 'none', mr: 'auto' }}
                >
                    Reset
                </Button>
                <Button onClick={onClose} sx={{ color: '#999', textTransform: 'none' }}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        background: '#FF6B35',
                        textTransform: 'none',
                        '&:hover': { background: '#e55a2b' },
                    }}
                >
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VenueSettings;
