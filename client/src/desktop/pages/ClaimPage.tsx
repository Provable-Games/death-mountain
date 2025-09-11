import RewardsOverlay from '@/dungeons/beasts/RewardsOverlay';
import { useStarknetApi } from '@/api/starknet';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { calculateLevel } from '@/utils/game';


export default function ClaimPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [adventurerLevel, setAdventurerLevel] = useState(0);
  const game_id = Number(searchParams.get("id"));
  const { getGameState } = useStarknetApi();


  const getState = async (gameId: number) => {
    let gameState = await getGameState(gameId);
    setAdventurerLevel(calculateLevel(gameState?.adventurer?.xp || 0));
  };

  useEffect(() => {
    if (!game_id || isNaN(game_id)) {
      navigate('/survivor', { replace: true });
    } else {
      getState(game_id!);
    }
  }, [game_id]);

  const handleClose = () => {
    navigate('/survivor', { replace: true });
  };

  return (
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />
      <RewardsOverlay gameId={game_id!} adventurerLevel={adventurerLevel} onClose={handleClose} />
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