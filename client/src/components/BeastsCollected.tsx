import { useGameTokens } from '@/dojo/useGameTokens';
import { LinearProgress, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useEffect } from 'react';

export default function BeastsCollected() {
  const { countBeasts } = useGameTokens();
  const [collected, setCollected] = useState(0);
  const total = 93150;

  useEffect(() => {
    const fetchBeasts = async () => {
      const result = await countBeasts();
      setCollected((result - 75) || 0);
    };

    fetchBeasts();
  }, []);

  const percentage = (collected / total) * 100;

  return (
    <Stack spacing={0.5} sx={{ width: '100%', mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: 0.5 }}>
          Beasts Collected
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
          {collected.toLocaleString()} / {total.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{
        width: '99%',
        height: 12,
        borderRadius: 6,
        border: '2px solid #d0c98d50', // gold border
        background: '#16281a', // dark green background
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            '& .MuiLinearProgress-bar': {
              background: '#ffe082', // yellow progress
              borderRadius: 6,
            },
          }}
        />
      </Box>
    </Stack>
  );
}