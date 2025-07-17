import { Box, Typography } from '@mui/material';

export default function LoadingOverlay() {
  return (
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />
      <Box sx={styles.loadingText}>
        <Typography sx={{ fontSize: '24px', fontWeight: '600' }}>Loading</Typography>
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#000',
  },
  loadingText: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
    animation: 'blink 2.5s infinite',
    '@keyframes blink': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.3 },
      '100%': { opacity: 1 }
    }
  }
};
