/**
 * MagicQPushDialog.jsx
 * Dialog để cấu hình kết nối MagicQ và push patch qua LAN
 */
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Divider,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert,
    Chip,
    Tooltip,
    IconButton,
} from '@mui/material';
import RouterIcon from '@mui/icons-material/Router';
import SendIcon from '@mui/icons-material/Send';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const BACKEND_URL = process.env.REACT_APP_MAGICQ_SERVER || '';

const STORAGE_KEY = 'magicq_push_settings';

const defaultSettings = {
    magicqIp: '192.168.1.100',
    showFolder: 'C:\\Users\\User\\Documents\\MagicQ\\show',
    fileSlot: 1,
    noHeader: false,
};

const darkInput = {
    '& .MuiInputBase-root': { color: '#ddd', fontSize: '0.875rem' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
    '& .MuiInputLabel-root': { color: '#888' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
};

const MagicQPushDialog = ({ open, onClose, fixtures = [] }) => {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings };
        } catch {
            return { ...defaultSettings };
        }
    });

    const [pingStatus, setPingStatus] = useState(null); // null | 'ok' | 'error'
    const [pingLoading, setPingLoading] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushResult, setPushResult] = useState(null); // null | { ok, message, error }

    // Persist settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (_) {}
    }, [settings]);

    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked :
                      field === 'fileSlot' ? parseInt(e.target.value, 10) || 1 :
                      e.target.value;
        setSettings((prev) => ({ ...prev, [field]: value }));
        setPushResult(null);
    };

    // Test UDP connectivity
    const handlePing = async () => {
        setPingLoading(true);
        setPingStatus(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/magicq/ping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ magicqIp: settings.magicqIp, noHeader: settings.noHeader }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                setPingStatus('ok');
            } else {
                setPingStatus('error');
            }
        } catch {
            setPingStatus('error');
        } finally {
            setPingLoading(false);
        }
    };

    // Push patch to MagicQ
    const handlePush = async () => {
        if (!fixtures || fixtures.length === 0) {
            setPushResult({ ok: false, error: 'Chưa có fixture nào trên canvas' });
            return;
        }
        setPushLoading(true);
        setPushResult(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/magicq/push-patch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fixtures,
                    magicqIp: settings.magicqIp,
                    showFolder: settings.showFolder,
                    fileSlot: settings.fileSlot,
                    noHeader: settings.noHeader,
                }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                setPushResult({ ok: true, message: data.message, csvPath: data.csvPath });
            } else {
                setPushResult({ ok: false, error: data.error || 'Lỗi không xác định' });
            }
        } catch (err) {
            setPushResult({ ok: false, error: `Không kết nối được backend: ${err.message}` });
        } finally {
            setPushLoading(false);
        }
    };

    // Fixture summary
    const fixtureSummary = React.useMemo(() => {
        const counts = {};
        (fixtures || []).forEach((f) => {
            counts[f.type] = (counts[f.type] || 0) + 1;
        });
        return Object.entries(counts);
    }, [fixtures]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    background: '#0f0f1e',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: 1,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <RouterIcon sx={{ color: '#4ECDC4' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                    Push sang MagicQ qua LAN
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: '#666' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 0 }}>
                {/* Fixture summary */}
                {fixtureSummary.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
                            Fixtures sẽ được push ({fixtures.length} tổng):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {fixtureSummary.map(([type, count]) => (
                                <Chip
                                    key={type}
                                    label={`${type}: ${count}`}
                                    size="small"
                                    sx={{
                                        background: 'rgba(255,255,255,0.06)',
                                        color: '#ccc',
                                        fontSize: '0.7rem',
                                        height: 22,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                {/* MagicQ IP */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                    <TextField
                        label="IP của máy chạy MagicQ"
                        value={settings.magicqIp}
                        onChange={handleChange('magicqIp')}
                        size="small"
                        fullWidth
                        placeholder="192.168.1.100"
                        sx={darkInput}
                        helperText="Địa chỉ IP trong LAN của máy chạy MagicQ"
                        FormHelperTextProps={{ sx: { color: '#555' } }}
                    />
                    <Tooltip title="Test UDP (fire-and-forget, không có reply từ MagicQ)">
                        <span>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handlePing}
                                disabled={pingLoading}
                                startIcon={
                                    pingLoading ? <CircularProgress size={14} color="inherit" /> :
                                    pingStatus === 'ok' ? <WifiIcon sx={{ color: '#4caf50' }} /> :
                                    pingStatus === 'error' ? <WifiOffIcon sx={{ color: '#f44336' }} /> :
                                    <WifiIcon />
                                }
                                sx={{
                                    mt: 0.25,
                                    height: 40,
                                    whiteSpace: 'nowrap',
                                    minWidth: 80,
                                    borderColor: pingStatus === 'ok' ? '#4caf50' :
                                                 pingStatus === 'error' ? '#f44336' :
                                                 'rgba(255,255,255,0.15)',
                                    color: pingStatus === 'ok' ? '#4caf50' :
                                           pingStatus === 'error' ? '#f44336' : '#aaa',
                                }}
                            >
                                Ping
                            </Button>
                        </span>
                    </Tooltip>
                </Box>

                {/* Show Folder */}
                <TextField
                    label="Thư mục show của MagicQ"
                    value={settings.showFolder}
                    onChange={handleChange('showFolder')}
                    size="small"
                    fullWidth
                    sx={{ ...darkInput, mb: 2 }}
                    placeholder="C:\Users\User\Documents\MagicQ\show"
                    helperText={
                        <span>
                            File <code style={{ color: '#4ECDC4' }}>
                                import{String(settings.fileSlot).padStart(4, '0')}.csv
                            </code> sẽ được ghi vào thư mục này trước khi gửi lệnh UDP.
                            Thư mục này phải truy cập được từ máy chạy backend server.
                        </span>
                    }
                    FormHelperTextProps={{ sx: { color: '#555', lineHeight: 1.4 } }}
                    InputProps={{
                        endAdornment: (
                            <Tooltip title="Thư mục mặc định của MagicQ Windows: C:\Users\<user>\Documents\MagicQ\show">
                                <InfoOutlinedIcon sx={{ color: '#444', fontSize: 18, cursor: 'help' }} />
                            </Tooltip>
                        ),
                    }}
                />

                {/* File Slot */}
                <TextField
                    label="File slot (1–9999)"
                    type="number"
                    value={settings.fileSlot}
                    onChange={handleChange('fileSlot')}
                    size="small"
                    inputProps={{ min: 1, max: 9999 }}
                    sx={{ ...darkInput, mb: 2, width: 160 }}
                    helperText={`import${String(settings.fileSlot).padStart(4, '0')}.csv`}
                    FormHelperTextProps={{ sx: { color: '#555' } }}
                />

                {/* No Header mode */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.noHeader}
                            onChange={handleChange('noHeader')}
                            size="small"
                            sx={{ '& .MuiSwitch-thumb': { backgroundColor: settings.noHeader ? '#4ECDC4' : '#555' } }}
                        />
                    }
                    label={
                        <Typography variant="caption" sx={{ color: '#888' }}>
                            Chế độ "rx no header" — tắt CREP header{' '}
                            <Tooltip title="Bật nếu Setup MagicQ → Network → Ethernet Remote Protocol = ChamSys Rem (rx no header)">
                                <InfoOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'middle', color: '#555' }} />
                            </Tooltip>
                        </Typography>
                    }
                    sx={{ mb: 1 }}
                />

                {/* Requirements note */}
                <Alert
                    severity="info"
                    sx={{
                        background: 'rgba(78,205,196,0.07)',
                        color: '#aaa',
                        border: '1px solid rgba(78,205,196,0.2)',
                        fontSize: '0.75rem',
                        mb: 2,
                        '& .MuiAlert-icon': { color: '#4ECDC4' },
                    }}
                >
                    <strong style={{ color: '#4ECDC4' }}>Yêu cầu MagicQ:</strong>{' '}
                    Setup → View Settings → Network → <em>Ethernet Remote Protocol</em> = <strong>ChamSys Rem rx</strong>.
                    MagicQ PC cần cắm <strong>Wing/Interface</strong> để kích hoạt CREP.
                    Backend server phải chạy cùng mạng LAN với MagicQ.
                </Alert>

                {/* Push result */}
                {pushResult && (
                    <Alert
                        severity={pushResult.ok ? 'success' : 'error'}
                        sx={{ mb: 1, fontSize: '0.8rem' }}
                    >
                        {pushResult.ok ? (
                            <>
                                {pushResult.message}
                                {pushResult.csvPath && (
                                    <Box sx={{ mt: 0.5, opacity: 0.7, fontSize: '0.72rem', wordBreak: 'break-all' }}>
                                        File: {pushResult.csvPath}
                                    </Box>
                                )}
                            </>
                        ) : (
                            pushResult.error
                        )}
                    </Alert>
                )}

                {pingStatus === 'ok' && (
                    <Alert severity="success" sx={{ mb: 1, fontSize: '0.75rem', py: 0 }}>
                        UDP packet gửi thành công tới {settings.magicqIp}:6553
                    </Alert>
                )}
                {pingStatus === 'error' && (
                    <Alert severity="error" sx={{ mb: 1, fontSize: '0.75rem', py: 0 }}>
                        Không gửi được UDP — kiểm tra backend server đang chạy chưa
                    </Alert>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    gap: 1,
                }}
            >
                <Button onClick={onClose} sx={{ color: '#666' }}>
                    Đóng
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                    variant="contained"
                    startIcon={pushLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    onClick={handlePush}
                    disabled={pushLoading || !fixtures || fixtures.length === 0}
                    sx={{
                        background: 'linear-gradient(135deg, #4ECDC4, #2980b9)',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { background: 'linear-gradient(135deg, #3dbdb4, #1e6fa3)' },
                        '&.Mui-disabled': { opacity: 0.4 },
                    }}
                >
                    {pushLoading ? 'Đang push...' : `Push ${fixtures?.length || 0} Fixtures → MagicQ`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MagicQPushDialog;
