import React from 'react';
import {
    CardHeader,
    CardContent,
    Typography,
    Slider,
    Select,
    MenuItem,
    Switch,
    Tooltip,
    Box,
    TextField
} from '@mui/material';
import { Settings as SettingIcon, Info as InfoIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';



import { GlassCard } from '../../components';
const SettingsPanel = ({ showSettings, settings, setSettings }) => {
    if (!showSettings) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
        >
            <GlassCard tilt={false}
                sx={{
                    background: '#1e1e1e',
                    border: '1px solid #333',
                    mt: 2,
                    borderRadius: 2
                }}
            >
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff' }}>
                            <SettingIcon fontSize="small" />
                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Cài đặt định dạng PDF</Typography>
                        </Box>
                    }
                    sx={{ borderBottom: '1px solid #333', pb: 2 }}
                />
                <CardContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Cỡ chữ: {settings.fontSize}pt
                            </Typography>
                            <Slider
                                min={6}
                                max={14}
                                value={settings.fontSize}
                                onChange={(_, val) => setSettings({ ...settings, fontSize: val })}
                                valueLabelDisplay="auto"
                                sx={{ color: '#FFD700' }}
                            />
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Padding ô: {settings.cellPadding}mm
                            </Typography>
                            <Slider
                                min={0.5}
                                max={5}
                                step={0.5}
                                value={settings.cellPadding}
                                onChange={(_, val) => setSettings({ ...settings, cellPadding: val })}
                                valueLabelDisplay="auto"
                                sx={{ color: '#FFD700' }}
                            />
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Màu header
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <input
                                    type="color"
                                    value={settings.headerColor}
                                    onChange={(e) => setSettings({ ...settings, headerColor: e.target.value })}
                                    style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                />
                                <TextField
                                    size="small"
                                    value={settings.headerColor}
                                    onChange={(e) => setSettings({ ...settings, headerColor: e.target.value })}
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { background: '#2a2a2a', color: '#fff', '& fieldset': { borderColor: '#444' } } }}
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Hướng giấy
                            </Typography>
                            <Select
                                value={settings.orientation}
                                onChange={(e) => setSettings({ ...settings, orientation: e.target.value })}
                                fullWidth
                                size="small"
                                sx={{
                                    background: '#2a2a2a',
                                    color: '#fff',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                                    '& .MuiSvgIcon-root': { color: '#888' }
                                }}
                            >
                                <MenuItem value="landscape">Ngang (Landscape)</MenuItem>
                                <MenuItem value="portrait">Dọc (Portrait)</MenuItem>
                            </Select>
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Khổ giấy
                            </Typography>
                            <Select
                                value={settings.pageSize}
                                onChange={(e) => setSettings({ ...settings, pageSize: e.target.value })}
                                fullWidth
                                size="small"
                                sx={{
                                    background: '#2a2a2a',
                                    color: '#fff',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                                    '& .MuiSvgIcon-root': { color: '#888' }
                                }}
                            >
                                <MenuItem value="a4">A4</MenuItem>
                                <MenuItem value="a3">A3 (Lớn hơn)</MenuItem>
                                <MenuItem value="letter">Letter</MenuItem>
                            </Select>
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'flex', alignItems: 'center', mb: 1, fontSize: '0.9rem' }}>
                                Tự động nhận diện thời gian
                                <Tooltip title="Tự động chuyển đổi giá trị số Excel thành định dạng thời gian HH:mm" placement="top">
                                    <InfoIcon sx={{ ml: 1, color: '#4CAF50', fontSize: 16 }} />
                                </Tooltip>
                            </Typography>
                            <Switch
                                checked={settings.autoDetectTime}
                                onChange={(e) => setSettings({ ...settings, autoDetectTime: e.target.checked })}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#FFD700' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FFD700' }
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'flex', alignItems: 'center', mb: 1, fontSize: '0.9rem' }}>
                                Highlight section headers
                                <Tooltip title="Tự động highlight các dòng như 'PHẦN I', 'BREAK TIME', etc." placement="top">
                                    <InfoIcon sx={{ ml: 1, color: '#4CAF50', fontSize: 16 }} />
                                </Tooltip>
                            </Typography>
                            <Switch
                                checked={settings.highlightSections}
                                onChange={(e) => setSettings({ ...settings, highlightSections: e.target.checked })}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#FFD700' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FFD700' }
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Màu section
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, opacity: settings.highlightSections ? 1 : 0.5, pointerEvents: settings.highlightSections ? 'auto' : 'none' }}>
                                <input
                                    type="color"
                                    value={settings.sectionColor}
                                    onChange={(e) => setSettings({ ...settings, sectionColor: e.target.value })}
                                    style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                    disabled={!settings.highlightSections}
                                />
                                <TextField
                                    size="small"
                                    value={settings.sectionColor}
                                    onChange={(e) => setSettings({ ...settings, sectionColor: e.target.value })}
                                    disabled={!settings.highlightSections}
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { background: '#2a2a2a', color: '#fff', '& fieldset': { borderColor: '#444' } } }}
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={{ color: '#aaa', display: 'block', mb: 1, fontSize: '0.9rem' }}>
                                Hiển thị đường kẻ
                            </Typography>
                            <Switch
                                checked={settings.showGridLines}
                                onChange={(e) => setSettings({ ...settings, showGridLines: e.target.checked })}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#FFD700' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FFD700' }
                                }}
                            />
                        </Box>
                    </Box>
                </CardContent>
            </GlassCard>
        </motion.div>
    );
};

export default SettingsPanel;
