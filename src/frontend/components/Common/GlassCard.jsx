import React, { useRef, useState } from 'react';

const GlassCard = ({ children, className = '', tilt = true, ...props }) => {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Mouse coords for Spotlight
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (tilt) {
      // Basic tilt logic (3-5 deg max)
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -4; // Max -4 ~ 4 deg
      const rotateY = ((x - centerX) / centerX) * 4;  // Max 4 ~ -4 deg

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`,
        transition: 'transform 0.1s ease-out'
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (tilt) {
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: 'transform 0.5s ease-out'
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`bento-glass ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...tiltStyle,
      }}
      {...props}
    >
      {/* Spotlight Effect overlay */}
      {isHovered && (
        <div
          className="bento-spotlight"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.08), transparent 40%)`,
            zIndex: 1, // Above background, below content
            pointerEvents: 'none',
            borderRadius: 'var(--bento-radius-outer)',
          }}
        />
      )}
      <div className="bento-inner-content" style={{ position: 'relative', zIndex: 2, height: '100%' }}>
         {children}
      </div>
    </div>
  );
};

export default GlassCard;