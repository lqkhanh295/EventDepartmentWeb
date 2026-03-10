// LightingDesignerPage — Main page assembling all components
// State is managed here and passed down as props to children
import React, { useState, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsIcon from '@mui/icons-material/Settings';
import RouterIcon from '@mui/icons-material/Router';

import StageCanvas from './StageCanvas';
import FixturePalette from './FixturePalette';
import FixtureProperties from './FixtureProperties';
import AIPanel from './AIPanel';
import VenueSettings from './VenueSettings';
import SceneManager from './SceneManager';
import Stage3DPreview from './Stage3DPreview'; // Added 3D view
import MagicQPushDialog from './MagicQPushDialog';
import { exportMagicQCSV } from './ExportUtils';
import { FIXTURE_TYPES, DEFAULT_FIXTURE } from './fixtureConfig';
import { lightingService } from '../../../services/services/lightingService';

// Generate unique ID
const uid = () => `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const LightingDesignerPage = () => {
    // --- Core state ---
    const [fixtures, setFixtures] = useState([]);
    const [selectedFixtureId, setSelectedFixtureId] = useState(null);
    const [sceneName, setSceneName] = useState('Untitled Scene');
    const [sceneId, setSceneId] = useState(null);

    // --- UI state ---
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [venueSettingsOpen, setVenueSettingsOpen] = useState(false);
    const [sceneManagerOpen, setSceneManagerOpen] = useState(false);
    const [show3DPreview, setShow3DPreview] = useState(false);
    const [magicqPushOpen, setMagicqPushOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // --- Venue settings ---
    const [venueSettings, setVenueSettings] = useState({
        venueName: '',
        venueWidth: 20,
        venueHeight: 15,
        venueBackground: '',
        showGrid: true,
    });

    // Selected fixture object
    const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId) || null;

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // --- Fixture operations (passed as props) ---

    const handleFixtureAdd = useCallback((type, x, y) => {
        const config = FIXTURE_TYPES[type];
        if (!config) return;

        // Count existing fixtures of this type for auto-label
        const existingCount = fixtures.filter((f) => f.type === type).length;

        const newFixture = {
            id: uid(),
            type,
            x: x || 100,
            y: y || 100,
            label: `${config.name} ${existingCount + 1}`,
            ...DEFAULT_FIXTURE,
        };

        setFixtures((prev) => [...prev, newFixture]);
        setSelectedFixtureId(newFixture.id);
    }, [fixtures]);

    const handleFixtureSelect = useCallback((fixtureId) => {
        setSelectedFixtureId(fixtureId);
    }, []);

    const handleFixtureUpdate = useCallback((fixtureId, updates) => {
        setFixtures((prev) =>
            prev.map((f) => (f.id === fixtureId ? { ...f, ...updates } : f))
        );
    }, []);

    const handleFixtureDrag = useCallback((fixtureId, x, y) => {
        setFixtures((prev) =>
            prev.map((f) => (f.id === fixtureId ? { ...f, x, y } : f))
        );
    }, []);

    const handleFixtureDelete = useCallback((fixtureId) => {
        setFixtures((prev) => prev.filter((f) => f.id !== fixtureId));
        if (selectedFixtureId === fixtureId) {
            setSelectedFixtureId(null);
        }
    }, [selectedFixtureId]);

    const handleFixtureDuplicate = useCallback((fixtureId) => {
        setFixtures((prev) => {
            const original = prev.find((f) => f.id === fixtureId);
            if (!original) return prev;

            const duplicate = {
                ...original,
                id: uid(),
                x: original.x + 50,
                y: original.y + 50,
                label: `${original.label} (copy)`,
            };
            return [...prev, duplicate];
        });
    }, []);

    const handleClearAll = useCallback(() => {
        setFixtures([]);
        setSelectedFixtureId(null);
    }, []);

    // --- Scene operations ---

    const handleSaveScene = async () => {
        try {
            const sceneData = {
                name: sceneName,
                fixtures,
                venueBackground: venueSettings.venueBackground || null,
                description: '',
            };

            if (sceneId) {
                await lightingService.updateScene(sceneId, sceneData);
            } else {
                const result = await lightingService.saveScene(sceneData);
                setSceneId(result.id);
            }
            showSnackbar('Đã lưu scene thành công!');
        } catch (err) {
            console.error('Save error:', err);
            showSnackbar('Lỗi khi lưu scene', 'error');
        }
    };

    const handleLoadScene = (scene) => {
        setFixtures(scene.fixtures || []);
        setSceneName(scene.name || 'Untitled Scene');
        setSceneId(scene.id);
        setSelectedFixtureId(null);
        if (scene.venueBackground) {
            setVenueSettings((prev) => ({
                ...prev,
                venueBackground: scene.venueBackground,
            }));
        }
        showSnackbar(`Đã tải scene "${scene.name}"`);
    };

    const handleExportCSV = () => {
        if (fixtures.length === 0) {
            showSnackbar('Không có fixture nào để export', 'warning');
            return;
        }
        const success = exportMagicQCSV(fixtures);
        if (success) {
            showSnackbar('Đã export file magicq_patch.csv');
        }
    };

    // --- AI operations ---

    const handleAIApplyLayout = (aiFixtures) => {
        // Add unique IDs to AI-generated fixtures
        const withIds = aiFixtures.map((f) => ({
            ...DEFAULT_FIXTURE,
            ...f,
            id: f.id || uid(),
        }));
        setFixtures(withIds);
        setSelectedFixtureId(null);
        showSnackbar(`Đã áp dụng ${withIds.length} fixtures từ AI`);
    };

    const handleAISaveScene = async (name, aiFixtures, description) => {
        try {
            const withIds = aiFixtures.map((f) => ({
                ...DEFAULT_FIXTURE,
                ...f,
                id: f.id || uid(),
            }));
            await lightingService.saveScene({
                name,
                fixtures: withIds,
                description,
                venueBackground: null,
            });
            showSnackbar(`Đã lưu AI scene "${name}"`);
        } catch (err) {
            console.error('AI save error:', err);
            showSnackbar('Lỗi khi lưu AI scene', 'error');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {/* Top Toolbar */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    background: '#0f0f1e',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                }}
            >
                <Typography variant="subtitle2" sx={{ color: '#666', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                    💡
                </Typography>
                <TextField
                    size="small"
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    sx={{
                        width: 200,
                        '& .MuiInputBase-root': { color: '#ddd', fontSize: '0.85rem', height: 34 },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    }}
                />

                <Tooltip title="Save Scene">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveScene}
                        sx={{
                            textTransform: 'none',
                            borderColor: 'rgba(255,255,255,0.15)',
                            color: '#ccc',
                            fontSize: '0.8rem',
                            height: 34,
                            '&:hover': { borderColor: '#FF6B35' },
                        }}
                    >
                        Save
                    </Button>
                </Tooltip>

                <Tooltip title="Load Scene">
                    <IconButton
                        size="small"
                        onClick={() => setSceneManagerOpen(true)}
                        sx={{ color: '#999' }}
                    >
                        <FolderOpenIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Export MagicQ CSV (tải về máy)">
                    <IconButton
                        size="small"
                        onClick={handleExportCSV}
                        sx={{ color: '#999' }}
                    >
                        <FileDownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Push sang MagicQ qua LAN">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RouterIcon />}
                        onClick={() => setMagicqPushOpen(true)}
                        sx={{
                            textTransform: 'none',
                            borderColor: 'rgba(78,205,196,0.4)',
                            color: '#4ECDC4',
                            fontSize: '0.8rem',
                            height: 34,
                            '&:hover': { borderColor: '#4ECDC4', background: 'rgba(78,205,196,0.08)' },
                        }}
                    >
                        Push LAN
                    </Button>
                </Tooltip>

                <Tooltip title={show3DPreview ? "Back to 2D Plan" : "3D Preview"}>
                    <Button
                        size="small"
                        variant={show3DPreview ? "contained" : "outlined"}
                        onClick={() => setShow3DPreview(!show3DPreview)}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            height: 34,
                            borderColor: show3DPreview ? 'transparent' : 'rgba(255,255,255,0.15)',
                            background: show3DPreview ? '#FF6B35' : 'transparent',
                            color: show3DPreview ? '#fff' : '#ccc',
                            '&:hover': { background: show3DPreview ? '#e55a2b' : 'rgba(255,255,255,0.05)', borderColor: '#FF6B35' },
                        }}
                    >
                        {show3DPreview ? "2D Plan" : "3D Preview"}
                    </Button>
                </Tooltip>

                <Box sx={{ flex: 1 }} />

                <Tooltip title="AI Generate">
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AutoFixHighIcon />}
                        onClick={() => setAiPanelOpen(true)}
                        sx={{
                            textTransform: 'none',
                            background: '#FF6B35',
                            fontSize: '0.8rem',
                            height: 34,
                            '&:hover': { background: '#e55a2b' },
                        }}
                    >
                        AI Generate
                    </Button>
                </Tooltip>

                <Tooltip title="Venue Settings">
                    <IconButton
                        size="small"
                        onClick={() => setVenueSettingsOpen(true)}
                        sx={{ color: '#999' }}
                    >
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Main content: Left sidebar | Canvas | Right sidebar */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left sidebar — Fixture Palette */}
                <FixturePalette
                    fixtures={fixtures}
                    onFixtureAdd={handleFixtureAdd}
                    onClearAll={handleClearAll}
                />

                {/* Canvas or 3D Preview */}
                {show3DPreview ? (
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <Stage3DPreview
                            fixtures={fixtures}
                            venueSettings={venueSettings}
                            selectedFixtureId={selectedFixtureId}
                            onFixtureSelect={handleFixtureSelect}
                        />
                    </Box>
                ) : (
                    <StageCanvas
                        fixtures={fixtures}
                        selectedFixtureId={selectedFixtureId}
                        onFixtureSelect={handleFixtureSelect}
                        onFixtureDrag={handleFixtureDrag}
                        onFixtureAdd={handleFixtureAdd}
                        onFixtureUpdate={handleFixtureUpdate}
                        onFixtureDelete={handleFixtureDelete}
                        onFixtureDuplicate={handleFixtureDuplicate}
                        venueBackground={venueSettings.venueBackground}
                        showGrid={venueSettings.showGrid}
                    />
                )}

                {/* Right sidebar — Properties */}
                <FixtureProperties
                    selectedFixture={selectedFixture}
                    onFixtureUpdate={handleFixtureUpdate}
                    onFixtureDelete={handleFixtureDelete}
                />
            </Box>

            {/* AI Panel Drawer */}
            <AIPanel
                open={aiPanelOpen}
                onClose={() => setAiPanelOpen(false)}
                onApplyLayout={handleAIApplyLayout}
                onSaveScene={handleAISaveScene}
            />

            {/* Venue Settings Dialog */}
            <VenueSettings
                open={venueSettingsOpen}
                onClose={() => setVenueSettingsOpen(false)}
                settings={venueSettings}
                onSettingsChange={setVenueSettings}
            />

            {/* Scene Manager Dialog */}
            <SceneManager
                open={sceneManagerOpen}
                onClose={() => setSceneManagerOpen(false)}
                onLoadScene={handleLoadScene}
            />

            {/* MagicQ LAN Push Dialog */}
            <MagicQPushDialog
                open={magicqPushOpen}
                onClose={() => setMagicqPushOpen(false)}
                fixtures={fixtures}
            />

            {/* Snackbar notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LightingDesignerPage;
