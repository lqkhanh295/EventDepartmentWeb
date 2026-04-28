import React from 'react';
import { Box, Typography } from '@mui/material';
import { GlassCard } from '../Common';

const PositionCard = ({ title, quantity, duties, requirements }) => (
    <GlassCard style={{ padding: '20px', marginBottom: '16px' }} tilt={false}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                {title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
                {quantity}
            </Typography>
        </Box>
        {duties && (
            <Box sx={{ mb: requirements ? 1.5 : 0 }}>
                <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Nhiệm vụ
                </Typography>
                <Typography variant="body2" sx={{ color: '#ddd', mt: 0.5, lineHeight: 1.6 }}>
                    {duties}
                </Typography>
            </Box>
        )}
        {requirements && (
            <Box>
                <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Yêu cầu
                </Typography>
                <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                    {requirements}
                </Typography>
            </Box>
        )}
    </GlassCard>
);

export default PositionCard;
