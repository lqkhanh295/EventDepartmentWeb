import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, SpotLight, useTexture, Box } from '@react-three/drei';
import { FIXTURE_TYPES } from './fixtureConfig';

// --- Textured Floor Component ---
const StageFloor = ({ venueWidth, venueHeight, venueBackground }) => {
    // Try to load texture if URL exists
    const texture = useTexture(venueBackground || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='); // Transparent fallback

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[venueWidth, venueHeight]} />
            {venueBackground ? (
                <meshStandardMaterial map={texture} />
            ) : (
                <meshStandardMaterial color="#333333" />
            )}
        </mesh>
    );
};

// --- Single 3D Fixture Component ---
const Fixture3D = ({ fixture, centerOffsetX, centerOffsetY, isSelected, onSelect }) => {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef();

    // Pulse selected fixture gently — hook must be called unconditionally
    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        meshRef.current.scale.setScalar(
            isSelected ? 1 + Math.sin(clock.elapsedTime * 4) * 0.06 : 1
        );
    });

    const config = FIXTURE_TYPES[fixture.type];
    if (!config) return null;

    const PIXELS_PER_METER = 50;
    const xMeters = (fixture.x - centerOffsetX) / PIXELS_PER_METER;
    const zMeters = (fixture.y - centerOffsetY) / PIXELS_PER_METER;
    // posZ = user-defined height (meters); default: pars on floor, others on truss at 5m
    const defaultY = (fixture.type === 'parcob' || fixture.type === 'parled') ? 0 : 5;
    const yMeters = fixture.posZ !== undefined ? fixture.posZ : defaultY;

    // Pan/Tilt → SpotLight target offset
    const panRad = ((fixture.panAngle || 0) * Math.PI) / 180;
    const tiltRad = ((fixture.tiltAngle || 0) * Math.PI) / 180;
    const targetX = Math.sin(panRad) * 5;
    const targetY = -5 + Math.sin(tiltRad) * 3;
    const targetZ = Math.cos(panRad) * 2;

    const color = config.color;
    const bodyColor = isSelected ? '#ffffff' : hovered ? '#aaaaaa' : '#111111';

    const rot3dX = ((fixture.rot3dX || 0) * Math.PI) / 180;
    // 2D rotation maps to Y axis (top-down spin), combined with 3D Y tweak
    const rot3dY = (((fixture.rot3dY || 0) + (fixture.rotation || 0)) * Math.PI) / 180;
    const rot3dZ = ((fixture.rot3dZ || 0) * Math.PI) / 180;

    return (
        <group position={[xMeters, yMeters, zMeters]} rotation={[rot3dX, rot3dY, rot3dZ]}>
            {/* Clickable fixture body */}
            <Box
                ref={meshRef}
                args={[0.3, 0.4, 0.3]}
                position={[0, 0.2, 0]}
                onClick={(e) => { e.stopPropagation(); onSelect(fixture.id); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <meshStandardMaterial
                    color={bodyColor}
                    emissive={isSelected ? color : hovered ? color : '#000000'}
                    emissiveIntensity={isSelected ? 0.6 : hovered ? 0.3 : 0}
                />
            </Box>

            {/* Selection ring */}
            {isSelected && (
                <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.35, 0.45, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>
            )}

            {/* Volumetric SpotLight effect for Moving Heads / Wash */}
            {['katana', 'beam', 'parled', 'parcob'].includes(fixture.type) && (
                <SpotLight
                    color={color}
                    position={[0, 0, 0]}
                    angle={fixture.type === 'beam' ? 0.1 : 0.6}
                    penumbra={0.5}
                    attenuation={15}
                    anglePower={5}
                    intensity={10}
                    distance={15}
                    castShadow
                    target-position={[targetX, targetY, targetZ]}
                />
            )}

            {/* For Blinder or Strobe - just point light */}
            {['ledStrobe', 'blinder'].includes(fixture.type) && (
                <pointLight color={color} intensity={5} distance={10} position={[0, -0.5, 0]} />
            )}
        </group>
    );
};

// --- Main 3D Canvas ---
const Stage3DPreview = ({ fixtures, venueSettings, selectedFixtureId, onFixtureSelect }) => {
    const { venueWidth = 20, venueHeight = 15, venueBackground } = venueSettings || {};

    const PIXELS_PER_METER = 50;
    const centerOffsetX = (venueWidth * PIXELS_PER_METER) / 2;
    const centerOffsetY = (venueHeight * PIXELS_PER_METER) / 2;

    return (
        <div style={{ width: '100%', height: '100%', background: '#0a0a0a' }}>
            <Canvas
                shadows
                camera={{ position: [0, 10, 15], fov: 50 }}
                onPointerMissed={() => onFixtureSelect && onFixtureSelect(null)}
            >
                <ambientLight intensity={0.2} />
                <fog attach="fog" args={['#0a0a0a', 10, 40]} />

                <Suspense fallback={null}>
                    <StageFloor
                        venueWidth={venueWidth}
                        venueHeight={venueHeight}
                        venueBackground={venueBackground}
                    />
                </Suspense>

                <Suspense fallback={null}>
                    {fixtures.map((fixture) => (
                        <Fixture3D
                            key={fixture.id}
                            fixture={fixture}
                            centerOffsetX={centerOffsetX}
                            centerOffsetY={centerOffsetY}
                            isSelected={fixture.id === selectedFixtureId}
                            onSelect={(id) => onFixtureSelect && onFixtureSelect(id)}
                        />
                    ))}
                </Suspense>

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
            </Canvas>
        </div>
    );
};

export default Stage3DPreview;
