import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, onClick, index = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const springProps = useSpring({
    transform: hovered && onClick ? 'translateY(-4px)' : 'translateY(0px)',
    boxShadow: hovered && onClick
      ? '0 8px 24px rgba(255, 215, 0, 0.15)'
      : '0 0px 0px rgba(255, 215, 0, 0)',
    config: { tension: 300, friction: 20 }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1]
      }}
      style={{ height: '100%' }}
    >
      <animated.div style={springProps} style={{ height: '100%' }}>
        <Card
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          component={motion.div}
          whileTap={onClick ? { scale: 0.98 } : {}}
          sx={{
            cursor: onClick ? 'pointer' : 'default',
            background: hovered && onClick ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid',
            borderColor: hovered && onClick ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            height: '100%',
            transition: 'background 0.3s ease, border-color 0.3s ease'
          }}
        >
          <CardContent sx={{ p: 3.5 }}>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#B3B3B3',
                  mb: 1.5,
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontSize: { xs: '1.875rem', sm: '2.25rem' },
                  lineHeight: 1.2
                }}
              >
                {value}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </animated.div>
    </motion.div>
  );
};

export default StatCard;
