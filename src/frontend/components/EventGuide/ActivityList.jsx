import React from 'react';
import { Box } from '@mui/material';

const ActivityList = ({ activities }) => (
    <Box component="ol" sx={{ p: 0, m: 0, listStyle: 'none' }}>
        {activities.map((activity, idx) => (
            <Box
                component="li"
                key={idx}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    py: 0.75
                }}
            >
                <Box
                    sx={{
                        color: '#666',
                        mr: 1.5,
                        minWidth: 28,
                        textAlign: 'right',
                        flexShrink: 0,
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                    }}
                >
                    {idx + 1}.
                </Box>
                <Box
                    sx={{ color: '#999', fontSize: '0.9rem', lineHeight: 1.6 }}
                >
                    {activity}
                </Box>
            </Box>
        ))}
    </Box>
);

export default ActivityList;
