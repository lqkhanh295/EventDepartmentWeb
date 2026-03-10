// FixtureProperties — Right sidebar for editing selected fixture
import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { FIXTURE_TYPES } from './fixtureConfig';

const FixtureProperties = ({ selectedFixture, onFixtureUpdate, onFixtureDelete }) => {
    if (!selectedFixture) {
        return (
            <Box
                sx={{
                    width: 280,
                    minWidth: 280,
                    background: '#12121f',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                }}
            >
                <Typography variant="body2" sx={{ color: '#555', textAlign: 'center' }}>
                    Click vào fixture trên sân khấu để chỉnh sửa thuộc tính
                </Typography>
            </Box>
        );
    }

    const config = FIXTURE_TYPES[selectedFixture.type];
    const isMovingHead = config?.category === 'moving-head';

    const handleChange = (field, value) => {
        onFixtureUpdate(selectedFixture.id, { [field]: value });
    };

    const inputSx = {
        '& .MuiInputBase-root': {
            color: '#ddd',
            fontSize: '0.85rem',
        },
        '& .MuiInputLabel-root': {
            color: '#888',
            fontSize: '0.85rem',
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.1)',
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.25)',
        },
    };

    return (
        <Box
            sx={{
                width: 280,
                minWidth: 280,
                background: '#12121f',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: config?.color || '#666',
                            boxShadow: `0 0 8px ${config?.color || '#666'}50`,
                        }}
                    />
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                        {config?.name || 'Unknown'}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                    {config?.dmxChannels}ch DMX · {config?.category}
                </Typography>
            </Box>

            {/* Properties form */}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Label */}
                <TextField
                    label="Label"
                    size="small"
                    fullWidth
                    value={selectedFixture.label || ''}
                    onChange={(e) => handleChange('label', e.target.value)}
                    sx={inputSx}
                />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* Position */}
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    Position
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        label="X"
                        type="number"
                        size="small"
                        value={selectedFixture.x || 0}
                        onChange={(e) => handleChange('x', Number(e.target.value))}
                        sx={{ ...inputSx, flex: 1 }}
                    />
                    <TextField
                        label="Y"
                        type="number"
                        size="small"
                        value={selectedFixture.y || 0}
                        onChange={(e) => handleChange('y', Number(e.target.value))}
                        sx={{ ...inputSx, flex: 1 }}
                    />
                </Box>
                <TextField
                    label="Z – Height (m)"
                    type="number"
                    size="small"
                    fullWidth
                    value={selectedFixture.posZ !== undefined ? selectedFixture.posZ : ((selectedFixture.type === 'parcob' || selectedFixture.type === 'parled') ? 0 : 5)}
                    onChange={(e) => handleChange('posZ', Number(e.target.value))}
                    inputProps={{ step: 0.5 }}
                    sx={inputSx}
                    helperText="Chiều cao trong 3D (mét)"
                    FormHelperTextProps={{ sx: { color: '#555', fontSize: '0.65rem', mt: 0.3 } }}
                />

                {/* 2D Rotation */}
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    Rotation 2D: {selectedFixture.rotation || 0}°
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
                    <Slider
                        value={selectedFixture.rotation || 0}
                        onChange={(_, val) => handleChange('rotation', val)}
                        min={0}
                        max={360}
                        size="small"
                        sx={{
                            flex: 1,
                            color: config?.color || '#666',
                            '& .MuiSlider-thumb': { width: 14, height: 14 },
                        }}
                    />
                    <TextField
                        type="number"
                        size="small"
                        value={selectedFixture.rotation || 0}
                        onChange={(e) => handleChange('rotation', Math.max(0, Math.min(360, Number(e.target.value))))}
                        sx={{ ...inputSx, width: 70 }}
                        inputProps={{ min: 0, max: 360 }}
                    />
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* 3D Rotation X/Y/Z */}
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    Rotation 3D
                </Typography>
                {[['rot3dX', 'X (Tilt)'], ['rot3dY', 'Y (Pan)'], ['rot3dZ', 'Z (Roll)']].map(([field, label]) => (
                    <Box key={field} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#aaa', width: 58, flexShrink: 0, fontSize: '0.72rem' }}>{label}</Typography>
                        <Slider
                            value={selectedFixture[field] || 0}
                            onChange={(_, val) => handleChange(field, val)}
                            min={-180}
                            max={180}
                            size="small"
                            sx={{
                                flex: 1,
                                color: config?.color || '#666',
                                '& .MuiSlider-thumb': { width: 13, height: 13 },
                            }}
                        />
                        <TextField
                            type="number"
                            size="small"
                            value={selectedFixture[field] || 0}
                            onChange={(e) => handleChange(field, Math.max(-180, Math.min(180, Number(e.target.value))))}
                            sx={{ ...inputSx, width: 60 }}
                            inputProps={{ min: -180, max: 180 }}
                        />
                    </Box>
                ))}

                {/* Pan/Tilt (moving-head only) */}
                {isMovingHead && (
                    <>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                        <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Pan / Tilt
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Pan"
                                type="number"
                                size="small"
                                value={selectedFixture.panAngle || 0}
                                onChange={(e) => handleChange('panAngle', Number(e.target.value))}
                                sx={{ ...inputSx, flex: 1 }}
                                inputProps={{ min: -180, max: 180 }}
                            />
                            <TextField
                                label="Tilt"
                                type="number"
                                size="small"
                                value={selectedFixture.tiltAngle || 0}
                                onChange={(e) => handleChange('tiltAngle', Number(e.target.value))}
                                sx={{ ...inputSx, flex: 1 }}
                                inputProps={{ min: -90, max: 90 }}
                            />
                        </Box>
                    </>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* DMX */}
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    DMX
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel sx={{ color: '#888', fontSize: '0.85rem' }}>Universe</InputLabel>
                        <Select
                            value={selectedFixture.universe || 1}
                            onChange={(e) => handleChange('universe', e.target.value)}
                            label="Universe"
                            sx={{
                                color: '#ddd',
                                fontSize: '0.85rem',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                                '& .MuiSvgIcon-root': { color: '#888' },
                            }}
                        >
                            {[1, 2, 3, 4].map((u) => (
                                <MenuItem key={u} value={u}>Universe {u}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Address"
                        type="number"
                        size="small"
                        value={selectedFixture.dmxAddress || 1}
                        onChange={(e) => handleChange('dmxAddress', Math.max(1, Math.min(512, Number(e.target.value))))}
                        sx={{ ...inputSx, flex: 1 }}
                        inputProps={{ min: 1, max: 512 }}
                    />
                </Box>

                {/* Group */}
                <TextField
                    label="Group"
                    size="small"
                    fullWidth
                    value={selectedFixture.group || ''}
                    onChange={(e) => handleChange('group', e.target.value)}
                    sx={inputSx}
                />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* Delete button */}
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => onFixtureDelete(selectedFixture.id)}
                    sx={{
                        textTransform: 'none',
                        mt: 1,
                        fontSize: '0.8rem',
                    }}
                >
                    Xóa fixture
                </Button>
            </Box>
        </Box>
    );
};

export default FixtureProperties;
