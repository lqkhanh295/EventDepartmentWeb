// TetDecorations - Minimalist Tet (Vietnamese Lunar New Year) floating decorations
// Uses pure CSS shapes — no emojis, no images
import React, { useMemo } from 'react';
import { Box } from '@mui/material';

// Minimalist SVG icons (inline, tiny)
const PetalIcon = ({ size = 14, color = '#FDA4AF', opacity = 0.7 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity }}>
        <ellipse cx="12" cy="10" rx="5" ry="9" fill={color} transform="rotate(-30 12 12)" />
        <ellipse cx="12" cy="10" rx="5" ry="9" fill={color} transform="rotate(30 12 12)" opacity={0.6} />
    </svg>
);

const LanternIcon = ({ size = 20, color = '#DC2626' }) => (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28" fill="none">
        <line x1="10" y1="0" x2="10" y2="5" stroke="#F59E0B" strokeWidth="1.5" />
        <rect x="7" y="3" width="6" height="3" rx="1" fill="#F59E0B" />
        <ellipse cx="10" cy="15" rx="7" ry="9" fill={color} opacity={0.85} />
        <ellipse cx="10" cy="15" rx="4" ry="9" fill={color} opacity={0.5} />
        <line x1="10" y1="24" x2="10" y2="28" stroke="#F59E0B" strokeWidth="1" />
    </svg>
);

const SparkIcon = ({ size = 10, color = '#F59E0B' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <line x1="8" y1="0" x2="8" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <line x1="13.5" y1="2.5" x2="2.5" y2="13.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
);

const CONFIGS = {
    login: {
        petals: 12,
        lanterns: 3,
        sparks: 6,
    },
    dashboard: {
        petals: 6,
        lanterns: 2,
        sparks: 3,
    },
    minimal: {
        petals: 4,
        lanterns: 1,
        sparks: 2,
    }
};

const TetDecorations = ({ variant = 'dashboard' }) => {
    const config = CONFIGS[variant] || CONFIGS.dashboard;

    const elements = useMemo(() => {
        const items = [];

        // Falling petals
        for (let i = 0; i < config.petals; i++) {
            const left = Math.random() * 100;
            const delay = Math.random() * 8;
            const duration = 6 + Math.random() * 6;
            const size = 10 + Math.random() * 10;
            // eslint-disable-next-line no-unused-vars
            const drift = -30 + Math.random() * 60;
            items.push(
                <Box
                    key={`petal-${i}`}
                    sx={{
                        position: 'fixed',
                        left: `${left}%`,
                        top: '-30px',
                        animation: `tet-fall ${duration}s linear ${delay}s infinite`,
                        '--tet-drift': `${drift}px`,
                        zIndex: 0,
                        pointerEvents: 'none',
                        willChange: 'transform, opacity',
                    }}
                >
                    <PetalIcon size={size} color={i % 3 === 0 ? '#FDA4AF' : i % 3 === 1 ? '#FCA5A5' : '#FECDD3'} />
                </Box>
            );
        }

        // Floating lanterns
        for (let i = 0; i < config.lanterns; i++) {
            const left = 5 + (i * 35) + Math.random() * 20;
            const delay = Math.random() * 4;
            const size = 16 + Math.random() * 10;
            items.push(
                <Box
                    key={`lantern-${i}`}
                    sx={{
                        position: 'fixed',
                        left: `${left}%`,
                        top: `${10 + Math.random() * 15}%`,
                        animation: `tet-float 5s ease-in-out ${delay}s infinite`,
                        zIndex: 0,
                        pointerEvents: 'none',
                        willChange: 'transform',
                        opacity: 0.5,
                    }}
                >
                    <LanternIcon size={size} color={i % 2 === 0 ? '#DC2626' : '#B91C1C'} />
                </Box>
            );
        }

        // Sparkling stars
        for (let i = 0; i < config.sparks; i++) {
            const left = 10 + Math.random() * 80;
            const top = 10 + Math.random() * 80;
            const delay = Math.random() * 5;
            const size = 6 + Math.random() * 8;
            items.push(
                <Box
                    key={`spark-${i}`}
                    sx={{
                        position: 'fixed',
                        left: `${left}%`,
                        top: `${top}%`,
                        animation: `tet-sparkle 3s ease-in-out ${delay}s infinite`,
                        zIndex: 0,
                        pointerEvents: 'none',
                        willChange: 'transform, opacity',
                    }}
                >
                    <SparkIcon size={size} color={i % 2 === 0 ? '#F59E0B' : '#FBBF24'} />
                </Box>
            );
        }

        return items;
    }, [config]);

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'hidden',
            }}
        >
            {elements}
        </Box>
    );
};

export default TetDecorations;
