/**
 * ImportDialog.jsx
 * Dialog để import file CSV (MagicQ / gMA3) hoặc JSON project vào Lighting Designer
 */
import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    Chip,
    IconButton,
    LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { importFromCSV, importProjectJSON } from './ExportUtils';

const ImportDialog = ({ open, onClose, onImport }) => {
    const [dragOver, setDragOver] = useState(false);
    const [parseResult, setParseResult] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    const reset = () => {
        setParseResult(null);
        setFileName('');
        setDragOver(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const processFile = (file) => {
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            let result;
            if (file.name.endsWith('.json')) {
                result = importProjectJSON(content);
            } else {
                result = importFromCSV(content);
            }
            setParseResult(result);
        };
        reader.readAsText(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        processFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file);
    };

    const handleApply = () => {
        if (parseResult && parseResult.fixtures.length > 0) {
            onImport(parseResult);
            handleClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
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
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    pb: 1,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <CloudUploadIcon sx={{ color: '#FF6B35' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                    Import Fixtures
                </Typography>
                <IconButton size="small" onClick={handleClose} sx={{ color: '#666' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Drop zone */}
                <Box
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        border: `2px dashed ${dragOver ? '#FF6B35' : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: dragOver ? 'rgba(255,107,53,0.06)' : 'rgba(255,255,255,0.02)',
                        '&:hover': {
                            borderColor: '#FF6B35',
                            background: 'rgba(255,107,53,0.04)',
                        },
                        mb: 2,
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {fileName ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <InsertDriveFileIcon sx={{ color: '#FF6B35' }} />
                            <Typography variant="body2" sx={{ color: '#ddd' }}>{fileName}</Typography>
                        </Box>
                    ) : (
                        <>
                            <CloudUploadIcon sx={{ fontSize: 40, color: '#555', mb: 1 }} />
                            <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                Kéo thả file vào đây hoặc click để chọn
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                Hỗ trợ: .csv (MagicQ, grandMA3) · .json (Project)
                            </Typography>
                        </>
                    )}
                </Box>

                {/* Parse result */}
                {parseResult && (
                    <Box>
                        {parseResult.error ? (
                            <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                                {parseResult.error}
                            </Alert>
                        ) : (
                            <>
                                <Alert
                                    severity="success"
                                    icon={<CheckCircleOutlineIcon />}
                                    sx={{
                                        mb: 1.5,
                                        fontSize: '0.8rem',
                                        background: 'rgba(76,175,80,0.08)',
                                        border: '1px solid rgba(76,175,80,0.2)',
                                        color: '#ccc',
                                        '& .MuiAlert-icon': { color: '#4caf50' },
                                    }}
                                >
                                    Đã nhận diện <strong>{parseResult.fixtures.length}</strong> fixtures
                                    {parseResult.format && (
                                        <Chip
                                            label={parseResult.format}
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                height: 20,
                                                fontSize: '0.65rem',
                                                background: 'rgba(255,107,53,0.15)',
                                                color: '#FF6B35',
                                            }}
                                        />
                                    )}
                                </Alert>

                                {/* Fixture preview */}
                                <Box
                                    sx={{
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 1,
                                        p: 1,
                                    }}
                                >
                                    {parseResult.fixtures.slice(0, 20).map((f, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: 'flex',
                                                gap: 1,
                                                alignItems: 'center',
                                                py: 0.5,
                                                px: 1,
                                                borderBottom: i < parseResult.fixtures.length - 1
                                                    ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ color: '#666', width: 24 }}>
                                                {i + 1}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#ddd', flex: 1 }}>
                                                {f.label}
                                            </Typography>
                                            <Chip
                                                label={f.type}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.6rem',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    color: '#aaa',
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#888' }}>
                                                U{f.universe}.{f.dmxAddress}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {parseResult.fixtures.length > 20 && (
                                        <Typography variant="caption" sx={{ color: '#666', p: 1, display: 'block' }}>
                                            ... và {parseResult.fixtures.length - 20} fixtures khác
                                        </Typography>
                                    )}
                                </Box>
                            </>
                        )}
                    </Box>
                )}

                {/* Loading indicator */}
                {fileName && !parseResult && <LinearProgress sx={{ mt: 1 }} />}
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    gap: 1,
                }}
            >
                <Button onClick={handleClose} sx={{ color: '#666' }}>
                    Hủy
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                    variant="contained"
                    onClick={handleApply}
                    disabled={!parseResult || parseResult.error || parseResult.fixtures.length === 0}
                    sx={{
                        background: '#FF6B35',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { background: '#e55a2b' },
                        '&.Mui-disabled': { opacity: 0.4 },
                    }}
                >
                    Import {parseResult?.fixtures?.length || 0} Fixtures
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ImportDialog;
