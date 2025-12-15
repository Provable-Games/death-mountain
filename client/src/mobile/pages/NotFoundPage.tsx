import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDungeon } from '@/dojo/useDungeon';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const dungeon = useDungeon();

  const handleGoToDeathMountain = () => {
    navigate(`/${dungeon.id}`);
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.content}>
        <Typography sx={styles.title}>
          DUNGEON NOT FOUND
        </Typography>
        <Typography sx={styles.subtitle}>
          The path you seek does not exist in this realm
        </Typography>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleGoToDeathMountain}
          sx={styles.button}
        >
          Back to Death Mountain
        </Button>
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)',
    color: '#d0c98d',
    px: 2,
  },
  content: {
    textAlign: 'center',
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    mb: 2,
    letterSpacing: 0.5,
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    wordBreak: 'break-word',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '1rem',
    mb: 4,
    opacity: 0.8,
    lineHeight: 1.5,
  },
  button: {
    backgroundColor: '#d0c98d',
    color: '#111111',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#fff',
    },
  },
}; 