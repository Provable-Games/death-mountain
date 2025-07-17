import { Typography, keyframes } from '@mui/material';
import { useEffect, useState } from 'react';

interface AnimatedTextProps {
  text: string;
}

export default function AnimatedText({ text }: AnimatedTextProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [text]);

  return (
    <Typography
      key={key}
      variant="h6"
      sx={{
        ...styles.combatLogText,
        animation: `${combatTextAnimation} 0.15s ease-out forwards`,
      }}
    >
      {text}
    </Typography>
  );
}

const combatTextAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const styles = {
  combatLogText: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    lineHeight: '1.2',
    fontSize: '1.0rem',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
    textAlign: 'center',
    opacity: 0,
  },
};
