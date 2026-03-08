// FixturePalette — Left sidebar with draggable fixture types
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Badge,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { FIXTURE_TYPES, CATEGORIES } from './fixtureConfig';

// Simple SVG icon for each category
const FixtureIcon = ({ type, color, size = 28 }) => {
    const config = FIXTURE_TYPES[type];
    if (!config) return null;

    const category = config.category;

    if (category === 'moving-head') {
        return (
            <svg width={size} height={size} viewBox="0 0 28 28">
                <polygon points="14,2 26,24 2,24" fill={color} opacity="0.9" />
                <circle cx="14" cy="17" r="3" fill="#fff" opacity="0.8" />
            </svg>
        );
    }
    if (category === 'strobe') {
        return (
            <svg width={size} height={size} viewBox="0 0 28 28">
                <polygon points="14,2 24,8 24,20 14,26 4,20 4,8" fill={color} opacity="0.9" />
                <circle cx="14" cy="14" r="3" fill="#fff" opacity="0.8" />
            </svg>
        );
    }
    // wash, blinder, atmosphere → circle
    return (
        <svg width={size} height={size} viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12" fill={color} opacity="0.9" />
            <circle cx="14" cy="14" r="3" fill="#fff" opacity="0.8" />
        </svg>
    );
};

const FixturePalette = ({ fixtures, onClearAll }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Count fixtures on canvas by type
    const getCount = (type) => fixtures.filter((f) => f.type === type).length;

    // Drag start handler
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('fixtureType', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Group fixtures by category
    const grouped = {};
    Object.entries(FIXTURE_TYPES).forEach(([key, config]) => {
        const cat = config.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ key, ...config });
    });

    return (
        <Box
            sx={{
                width: 220,
                minWidth: 220,
                background: '#12121f',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, letterSpacing: 0.5 }}>
                    💡 Fixture Palette
                </Typography>
                <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
                    Kéo thả vào sân khấu
                </Typography>
            </Box>

            {/* Fixture groups */}
            <Box sx={{ flex: 1, p: 1.5 }}>
                {Object.entries(grouped).map(([category, items]) => (
                    <Box key={category} sx={{ mb: 2 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#666',
                                fontWeight: 600,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                                fontSize: '0.65rem',
                                px: 0.5,
                                mb: 0.5,
                                display: 'block',
                            }}
                        >
                            {CATEGORIES[category] || category}
                        </Typography>

                        {items.map((item) => {
                            const count = getCount(item.key);
                            return (
                                <Tooltip key={item.key} title={`${item.name} — ${item.dmxChannels} DMX channels`} placement="right" arrow>
                                    <Paper
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item.key)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1,
                                            mb: 0.75,
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 1,
                                            cursor: 'grab',
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                background: 'rgba(255,255,255,0.08)',
                                                borderColor: item.color,
                                                transform: 'translateX(2px)',
                                            },
                                            '&:active': {
                                                cursor: 'grabbing',
                                                opacity: 0.7,
                                            },
                                        }}
                                        elevation={0}
                                    >
                                        <FixtureIcon type={item.key} color={item.color} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: '#ddd', fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.2 }}
                                            >
                                                {item.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>
                                                {item.dmxChannels}ch DMX
                                            </Typography>
                                        </Box>
                                        {count > 0 && (
                                            <Badge
                                                badgeContent={count}
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        background: item.color,
                                                        color: '#000',
                                                        fontWeight: 700,
                                                        fontSize: '0.65rem',
                                                        minWidth: 18,
                                                        height: 18,
                                                    },
                                                }}
                                            />
                                        )}
                                    </Paper>
                                </Tooltip>
                            );
                        })}
                    </Box>
                ))}
            </Box>

            {/* Clear All button */}
            {fixtures.length > 0 && (
                <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteSweepIcon />}
                        onClick={() => setConfirmOpen(true)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                        Clear All ({fixtures.length})
                    </Button>
                </Box>
            )}

            {/* Confirm dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Xóa tất cả fixtures?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn sẽ xóa {fixtures.length} fixture khỏi sân khấu. Hành động này không thể hoàn tác.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            onClearAll();
                            setConfirmOpen(false);
                        }}
                    >
                        Xóa tất cả
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FixturePalette;
