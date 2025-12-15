import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoToDeathMountain = () => {
    navigate('/');
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
          variant="outlined"
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
  },
  content: {
    textAlign: 'center',
    maxWidth: 500,
    px: 4,
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    mb: 2,
    letterSpacing: 1,
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    wordBreak: 'break-word',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '1.2rem',
    mb: 4,
    opacity: 0.8,
    lineHeight: 1.5,
  },
  button: {
    borderColor: '#d0c98d',
    color: '#d0c98d',
    '&:hover': {
      borderColor: '#fff',
      color: '#fff',
      backgroundColor: 'rgba(208, 201, 141, 0.1)',
    },
  },
}; 