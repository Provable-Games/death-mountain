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
    fontSize: '15px',
    lineHeight: '1.2',
    textAlign: 'center',
    fontWeight: 'bold',
    opacity: 0,
  },
};
