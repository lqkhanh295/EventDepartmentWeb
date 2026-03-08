// StageCanvas — Konva canvas for fixture placement
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Group, RegularPolygon, Text, Circle } from 'react-konva';
import { Box, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import Rotate90DegreesCwIcon from '@mui/icons-material/Rotate90DegreesCw';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FIXTURE_TYPES, CANVAS_DEFAULTS } from './fixtureConfig';

const StageCanvas = ({
    fixtures,
    selectedFixtureId,
    onFixtureSelect,
    onFixtureDrag,
    onFixtureAdd,
    onFixtureUpdate,
    onFixtureDelete,
    onFixtureDuplicate,
    venueBackground,
    showGrid,
}) => {
    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const [stageSize, setStageSize] = useState({ width: CANVAS_DEFAULTS.width, height: CANVAS_DEFAULTS.height });
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [bgImage, setBgImage] = useState(null);
    const [isDraggingStage, setIsDraggingStage] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null);
    const [contextFixtureId, setContextFixtureId] = useState(null);

    // Resize canvas to fit container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setStageSize({
                    width: Math.max(offsetWidth, CANVAS_DEFAULTS.width),
                    height: Math.max(offsetHeight, CANVAS_DEFAULTS.height),
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Load venue background image
    useEffect(() => {
        if (venueBackground) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = venueBackground;
            img.onload = () => setBgImage(img);
            img.onerror = () => setBgImage(null);
        } else {
            setBgImage(null);
        }
    }, [venueBackground]);

    // Zoom with mouse wheel
    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const oldScale = scale;
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const clampedScale = Math.max(0.3, Math.min(3, newScale));

        const pointer = stageRef.current.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - position.x) / oldScale,
            y: (pointer.y - position.y) / oldScale,
        };

        setScale(clampedScale);
        setPosition({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
    }, [scale, position]);

    // Draw grid lines
    const renderGrid = () => {
        if (!showGrid) return null;
        const lines = [];
        const gridSize = CANVAS_DEFAULTS.gridSize;
        const width = CANVAS_DEFAULTS.width;
        const height = CANVAS_DEFAULTS.height;

        for (let i = 0; i <= width / gridSize; i++) {
            lines.push(
                <Line
                    key={`v-${i}`}
                    points={[i * gridSize, 0, i * gridSize, height]}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                />
            );
        }
        for (let i = 0; i <= height / gridSize; i++) {
            lines.push(
                <Line
                    key={`h-${i}`}
                    points={[0, i * gridSize, width, i * gridSize]}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={1}
                />
            );
        }
        return lines;
    };

    // Snap position to grid
    const snapToGrid = (val) => {
        const gridSize = CANVAS_DEFAULTS.gridSize;
        return Math.round(val / gridSize) * gridSize;
    };

    // Handle drag end on fixture
    const handleDragEnd = (fixtureId, e) => {
        const newX = snapToGrid(e.target.x());
        const newY = snapToGrid(e.target.y());
        e.target.x(newX);
        e.target.y(newY);
        onFixtureDrag(fixtureId, newX, newY);
    };

    // Handle stage click to deselect (only if not dragging)
    const handleStageClick = (e) => {
        if (isDraggingStage) return;
        if (e.target === e.target.getStage() || e.target.attrs.id === 'background') {
            onFixtureSelect(null);
        }
    };

    // Sync position after stage pan drag
    const handleStageDragEnd = (e) => {
        // Only update if the stage itself was dragged (not a fixture)
        if (e.target === stageRef.current) {
            setPosition(stageRef.current.position());
            setIsDraggingStage(false);
        }
    };

    const handleStageDragStart = (e) => {
        if (e.target === stageRef.current) {
            setIsDraggingStage(true);
        }
    };

    // Right-click context menu
    const handleContextMenu = (fixtureId, e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        const containerRect = stage.container().getBoundingClientRect();
        setContextMenu({
            mouseX: containerRect.left + e.evt.offsetX,
            mouseY: containerRect.top + e.evt.offsetY,
        });
        setContextFixtureId(fixtureId);
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
        setContextFixtureId(null);
    };

    const handleContextAction = (action) => {
        if (!contextFixtureId) return;
        const fixture = fixtures.find((f) => f.id === contextFixtureId);
        if (!fixture) return;

        switch (action) {
            case 'rotate45':
                onFixtureUpdate(contextFixtureId, { rotation: ((fixture.rotation || 0) + 45) % 360 });
                break;
            case 'rotate90':
                onFixtureUpdate(contextFixtureId, { rotation: ((fixture.rotation || 0) + 90) % 360 });
                break;
            case 'delete':
                onFixtureDelete(contextFixtureId);
                break;
            case 'duplicate':
                onFixtureDuplicate(contextFixtureId);
                break;
            default:
                break;
        }
        handleCloseContextMenu();
    };

    // Drop handler for drag-from-palette
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const fixtureType = e.dataTransfer.getData('fixtureType');
        if (!fixtureType || !FIXTURE_TYPES[fixtureType]) return;

        const stage = stageRef.current;
        stage.setPointersPositions(e);
        const pointer = stage.getPointerPosition();
        const x = snapToGrid((pointer.x - position.x) / scale);
        const y = snapToGrid((pointer.y - position.y) / scale);

        onFixtureAdd(fixtureType, x, y);
    }, [onFixtureAdd, position, scale]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Render a single fixture on canvas
    const renderFixture = (fixture) => {
        const config = FIXTURE_TYPES[fixture.type];
        if (!config) return null;

        const isSelected = fixture.id === selectedFixtureId;
        const size = 30;

        return (
            <Group
                key={fixture.id}
                x={fixture.x}
                y={fixture.y}
                rotation={fixture.rotation || 0}
                draggable
                onClick={() => onFixtureSelect(fixture.id)}
                onTap={() => onFixtureSelect(fixture.id)}
                onDragEnd={(e) => handleDragEnd(fixture.id, e)}
                onContextMenu={(e) => handleContextMenu(fixture.id, e)}
            >
                {/* Beam cone (shown when selected) */}
                {isSelected && (config.category === 'moving-head' || config.category === 'wash') && (
                    <Line
                        points={[0, 0, -size * 1.5, size * 3, size * 1.5, size * 3]}
                        closed
                        fill={`${config.color}15`}
                        stroke={`${config.color}40`}
                        strokeWidth={1}
                    />
                )}

                {/* Glow when selected */}
                {isSelected && (
                    <Circle
                        radius={size + 8}
                        fill={`${config.color}20`}
                        stroke={config.color}
                        strokeWidth={2}
                        shadowColor={config.color}
                        shadowBlur={15}
                        shadowOpacity={0.6}
                    />
                )}

                {/* Fixture shape */}
                {config.category === 'moving-head' ? (
                    <RegularPolygon
                        sides={3}
                        radius={size}
                        fill={config.color}
                        opacity={0.85}
                        stroke={isSelected ? '#fff' : config.color}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                ) : config.category === 'strobe' ? (
                    <RegularPolygon
                        sides={6}
                        radius={size * 0.8}
                        fill={config.color}
                        opacity={0.85}
                        stroke={isSelected ? '#fff' : config.color}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                ) : (
                    <Circle
                        radius={size * 0.7}
                        fill={config.color}
                        opacity={0.85}
                        stroke={isSelected ? '#fff' : config.color}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                )}

                {/* Center dot */}
                <Circle radius={3} fill="#fff" opacity={0.9} />

                {/* Label */}
                <Text
                    text={fixture.label || config.name}
                    fontSize={10}
                    fill="#fff"
                    opacity={0.8}
                    y={size + 4}
                    align="center"
                    width={80}
                    offsetX={40}
                />
            </Group>
        );
    };

    // Fixture count summary
    const fixtureCountSummary = () => {
        const counts = {};
        fixtures.forEach((f) => {
            const name = FIXTURE_TYPES[f.type]?.name || f.type;
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => `${name}: ${count}`)
            .join('  |  ');
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                flex: 1,
                position: 'relative',
                background: CANVAS_DEFAULTS.background,
                overflow: 'hidden',
                minHeight: 600,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 1,
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable
                onWheel={handleWheel}
                onClick={handleStageClick}
                onTap={handleStageClick}
                onDragStart={handleStageDragStart}
                onDragEnd={handleStageDragEnd}
                style={{ cursor: isDraggingStage ? 'grabbing' : 'default' }}
            >
                {/* Background layer */}
                <Layer>
                    <Rect
                        id="background"
                        x={0}
                        y={0}
                        width={CANVAS_DEFAULTS.width}
                        height={CANVAS_DEFAULTS.height}
                        fill={CANVAS_DEFAULTS.background}
                    />
                    {bgImage && (
                        <Rect
                            x={0}
                            y={0}
                            width={CANVAS_DEFAULTS.width}
                            height={CANVAS_DEFAULTS.height}
                            fillPatternImage={bgImage}
                            fillPatternScaleX={CANVAS_DEFAULTS.width / (bgImage.width || 1)}
                            fillPatternScaleY={CANVAS_DEFAULTS.height / (bgImage.height || 1)}
                        />
                    )}
                    {renderGrid()}
                </Layer>

                {/* Fixtures layer */}
                <Layer>
                    {fixtures.map(renderFixture)}
                </Layer>
            </Stage>

            {/* Fixture count summary */}
            {fixtures.length > 0 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: 1,
                        px: 2,
                        py: 0.5,
                    }}
                >
                    <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.7rem' }}>
                        {fixtureCountSummary()} — Total: {fixtures.length}
                    </Typography>
                </Box>
            )}

            {/* Right-click context menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
                slotProps={{
                    paper: {
                        sx: {
                            background: '#2a2a3e',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                        },
                    },
                }}
            >
                <MenuItem onClick={() => handleContextAction('rotate45')}>
                    <ListItemIcon><RotateRightIcon sx={{ color: '#aaa' }} /></ListItemIcon>
                    <ListItemText>Rotate 45°</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleContextAction('rotate90')}>
                    <ListItemIcon><Rotate90DegreesCwIcon sx={{ color: '#aaa' }} /></ListItemIcon>
                    <ListItemText>Rotate 90°</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleContextAction('duplicate')}>
                    <ListItemIcon><ContentCopyIcon sx={{ color: '#aaa' }} /></ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleContextAction('delete')}>
                    <ListItemIcon><DeleteIcon sx={{ color: '#e57373' }} /></ListItemIcon>
                    <ListItemText sx={{ color: '#e57373' }}>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default StageCanvas;
