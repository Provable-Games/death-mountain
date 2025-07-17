import { useController } from '@/contexts/controller';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GameTokensList from '../components/GameTokensList';

export default function LandingPage() {
  const { address, playAsGuest, login } = useController();
  const navigate = useNavigate();

  const handleStartGame = async () => {
    if (address) {
      navigate(`/survivor/play`)
    } else {
      login();
    }
  };

  return (
    <>
      <Box sx={styles.container}>
        <Box sx={styles.logoContainer}>
          <img src={'/images/mobile/logo.png'} alt='logo' width='100%' />
        </Box>

        <Box className='container' sx={{ width: '100%', gap: 2, textAlign: 'center' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleStartGame}
            startIcon={<img src={'/images/mobile/dice.png'} alt='dice' height='20px' />}
          >
            <Typography variant='h5' color='#111111'>
              {address ? 'Play now' : 'Login'}
            </Typography>
          </Button>

          {/* {!address && (
            <>
              <Box sx={styles.orDivider}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography sx={styles.orText}>or</Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.3)' }} />
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ textAlign: 'center', justifyContent: 'center', height: '36px' }}
                onClick={() => {
                  playAsGuest()
                }}
              >
                <Typography sx={{ fontSize: '0.8rem' }}>Play as Guest</Typography>
              </Button>
            </>
          )} */}

          {address && <>
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <ArrowDropDownIcon color='primary' />
              <Typography variant='h4' color='primary'>
                Adventurers
              </Typography>
              <ArrowDropDownIcon color='primary' />
            </Box>

            <GameTokensList />
          </>}
        </Box>
      </Box>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    height: 'calc(100dvh - 120px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '10px',
    margin: '0 auto',
    gap: 2
  },
  logoContainer: {
    maxWidth: '70%',
    mb: 2
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    justifyContent: 'center',
    margin: '10px 0'
  },
  orText: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.3)',
    margin: '0 10px'
  },
};