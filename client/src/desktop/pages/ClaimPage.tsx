import RewardsOverlay from '@/dungeons/beasts/RewardsOverlay';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ClaimPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const game_id = Number(searchParams.get("id"));

  useEffect(() => {
    if (!game_id || isNaN(game_id)) {
      navigate('/survivor', { replace: true });
    }
  }, [game_id]);

  const handleClose = () => {
    navigate('/survivor', { replace: true });
  };

  return (
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />
      <RewardsOverlay gameId={game_id!} adventurerLevel={10} onClose={handleClose} />
    </Box>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100dvw',
    height: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
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
    opacity: 0.5,
  },
};