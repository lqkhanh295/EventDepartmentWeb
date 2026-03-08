// SceneManager — Save/Load scene dialog
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Box,
    Skeleton,
    Snackbar,
    Alert,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { lightingService } from '../../../services/services/lightingService';

const SceneManager = ({ open, onClose, onLoadScene }) => {
    const [scenes, setScenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Load scenes when dialog opens
    useEffect(() => {
        if (open) {
            loadScenes();
        }
    }, [open]);

    const loadScenes = async () => {
        setLoading(true);
        try {
            const data = await lightingService.getScenes();
            setScenes(data);
        } catch (err) {
            console.error('Error loading scenes:', err);
            setError('Không thể tải danh sách scenes');
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = (scene) => {
        onLoadScene(scene);
        onClose();
    };

    const handleDelete = async (sceneId) => {
        try {
            await lightingService.deleteScene(sceneId);
            setScenes((prev) => prev.filter((s) => s.id !== sceneId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting scene:', err);
            setError('Không thể xóa scene');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const dialogPaperSx = {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: 500,
        maxHeight: '70vh',
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} PaperProps={{ sx: dialogPaperSx }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        📂 Saved Scenes
                    </Typography>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#888' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {loading && (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {[1, 2, 3].map((i) => (
                                <Skeleton
                                    key={i}
                                    variant="rectangular"
                                    height={56}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}
                                />
                            ))}
                        </Box>
                    )}

                    {!loading && scenes.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                                Chưa có scene nào được lưu
                            </Typography>
                        </Box>
                    )}

                    {!loading && scenes.length > 0 && (
                        <List disablePadding>
                            {scenes.map((scene) => (
                                <ListItem
                                    key={scene.id}
                                    disablePadding
                                    sx={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <ListItemButton
                                        onClick={() => handleLoad(scene)}
                                        sx={{
                                            py: 1.5,
                                            px: 2.5,
                                            '&:hover': { background: 'rgba(255,255,255,0.05)' },
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ color: '#ddd', fontWeight: 500 }}>
                                                        {scene.name || 'Untitled'}
                                                    </Typography>
                                                    {scene.fixtures && (
                                                        <Chip
                                                            label={`${scene.fixtures.length} fixtures`}
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '0.65rem',
                                                                bgcolor: 'rgba(255,107,53,0.15)',
                                                                color: '#FF6B35',
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                                                    {scene.description ? `${scene.description.substring(0, 60)}... · ` : ''}
                                                    {formatDate(scene.updatedAt || scene.createdAt)}
                                                </Typography>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLoad(scene);
                                                }}
                                                sx={{ color: '#888', mr: 0.5 }}
                                            >
                                                <OpenInNewIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm(scene.id);
                                                }}
                                                sx={{ color: '#e57373' }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} sx={{ color: '#999', textTransform: 'none' }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                PaperProps={{
                    sx: {
                        background: '#1a1a2e',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            >
                <DialogTitle sx={{ fontSize: '1rem' }}>Xóa scene?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                        Hành động này không thể hoàn tác.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)} sx={{ color: '#999', textTransform: 'none' }}>
                        Hủy
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => handleDelete(deleteConfirm)}
                        sx={{ textTransform: 'none' }}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError('')} variant="filled">
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SceneManager;
