import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SectionAccordion = ({ id, title, color, expanded, handleChange, children }) => (
    <Accordion
        expanded={expanded === id}
        onChange={handleChange(id)}
        sx={{
            background: '#121212',
            border: '1px solid #2a2a2a',
            borderRadius: '2px !important',
            mb: 1.5,
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
                borderColor: color
            }
        }}
    >
        <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#666' }} />}
            sx={{ py: 0.5 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 3, height: 20, background: color, borderRadius: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#fff' }}>
                    {title}
                </Typography>
            </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 3 }}>
            {children}
        </AccordionDetails>
    </Accordion>
);

export default SectionAccordion;
