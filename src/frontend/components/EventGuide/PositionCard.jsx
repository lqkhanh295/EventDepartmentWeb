import React from 'react';
import { Box, Typography } from '@mui/material';

const PositionCard = ({ title, quantity, duties, requirements }) => (
    <Box
        sx={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 1.5,
            p: 2.5,
            mb: 2
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                {title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
                {quantity}
            </Typography>
        </Box>
        {duties && (
            <Box sx={{ mb: requirements ? 1.5 : 0 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Nhiệm vụ
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mt: 0.5, lineHeight: 1.6 }}>
                    {duties}
                </Typography>
            </Box>
        )}
        {requirements && (
            <Box>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Yêu cầu
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                    {requirements}
                </Typography>
            </Box>
        )}
    </Box>
);

export default PositionCard;
