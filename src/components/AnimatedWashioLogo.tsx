import React, { useState } from 'react';
import logoImg from '/logo.png';

interface AnimatedWashioLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const AnimatedWashioLogo: React.FC<AnimatedWashioLogoProps> = ({
  size = 64,
  className = '',
  onClick,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`animated-logo-container ${className} ${isPressed ? 'pressed' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <div className="logo-glow" />
      <img
        src={logoImg}
        alt="WASHIO"
        className="logo-image"
        style={{ width: size, height: size }}
      />
      <div className="shimmer-overlay" />
      <div className="sparkle sparkle-1">✦</div>
      <div className="sparkle sparkle-2">✦</div>
      <div className="sparkle sparkle-3">✦</div>
      {isPressed && <div className="ripple" />}
    </div>
  );
};

export default AnimatedWashioLogo;
