import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { Card, CardContent, Typography, Box } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const QuickActionCard = ({ title, description, onClick, index = 0 }) => {
  const [hovered, setHovered] = useState(false);
  const springProps = useSpring({
    transform: hovered ? 'translateY(-6px)' : 'translateY(0px)',
    boxShadow: hovered
      ? '0 12px 32px rgba(255, 215, 0, 0.2)'
      : '0 0px 0px rgba(255, 215, 0, 0)',
    config: { tension: 300, friction: 20 }
  });

  const arrowSpring = useSpring({
    transform: hovered ? 'translateX(6px)' : 'translateX(0px)',
    color: hovered ? '#FFD700' : '#999',
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
      <animated.div style={{ ...springProps, height: '100%' }}>
        <Card
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          component={motion.div}
          whileTap={{ scale: 0.98 }}
          sx={{
            cursor: 'pointer',
            background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid',
            borderColor: hovered ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            height: '100%',
            transition: 'background 0.3s ease, border-color 0.3s ease'
          }}
        >
          <CardContent sx={{ p: 3.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: '#FFFFFF',
                  fontSize: '1.1rem',
                  letterSpacing: '0.2px',
                  flex: 1
                }}
              >
                {title}
              </Typography>
              <animated.div style={arrowSpring}>
                <ArrowForwardIcon
                  className="arrow-icon"
                  sx={{ fontSize: 20, ml: 1 }}
                />
              </animated.div>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: '#B3B3B3',
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}
            >
              {description}
            </Typography>
          </CardContent>
        </Card>
      </animated.div>
    </motion.div>
  );
};

export default QuickActionCard;