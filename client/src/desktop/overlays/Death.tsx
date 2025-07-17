import { OBSTACLE_NAMES } from '@/constants/obstacle';
import { useGameStore } from '@/stores/gameStore';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function DeathOverlay() {
  const { gameId, adventurer, exploreLog, battleEvent, beast, quest } = useGameStore();
  const navigate = useNavigate();

  const deathEvent = battleEvent || exploreLog.find(event => event.type === 'obstacle');

  let deathMessage = '';
  if (deathEvent?.type === 'obstacle') {
    deathMessage = `${OBSTACLE_NAMES[deathEvent.obstacle?.id!]} hit your ${deathEvent.obstacle?.location} for ${deathEvent.obstacle?.damage} damage ${deathEvent.obstacle?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  } else if (deathEvent?.type === 'beast_attack') {
    deathMessage = `${beast?.name} attacked your ${battleEvent?.attack?.location} for ${battleEvent?.attack?.damage} damage ${battleEvent?.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  } else if (deathEvent?.type === 'ambush') {
    deathMessage = `${beast?.name} ambushed your ${battleEvent?.attack?.location} for ${battleEvent?.attack?.damage} damage ${battleEvent?.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  }

  const shareMessage = `I fell to the mist in Loot Survivor after reaching ${adventurer?.xp || 0} XP. Want to see how I did it? Watch my replay here: lootsurvivor.io/watch/${gameId} 🗡️⚔️ @provablegames @lootsurvivor`;

  const backToMenu = () => {
    if (quest) {
      navigate(`/survivor/campaign?chapter=${quest.chapterId}`, { replace: true });
    } else {
      navigate('/survivor', { replace: true });
    }
  };

  return (
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />

      <Box sx={styles.content}>
        <Typography variant="h2" sx={styles.title}>
          DEATH
        </Typography>

        <Box sx={styles.statsContainer}>
          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Final Score</Typography>
            <Typography sx={styles.statValue}>{adventurer?.xp || 0}</Typography>
          </Box>
        </Box>

        {deathEvent && (
          <Box sx={styles.deathCauseContainer}>
            <Typography sx={styles.deathCauseTitle}>Cause of Death</Typography>
            <Typography sx={styles.deathMessage}>{deathMessage}</Typography>
          </Box>
        )}

        <Box sx={styles.messageContainer}>
          <Typography sx={styles.message}>
            Your quest for loot ends here, brave adventurer. The mist has claimed you, but your legend will live on in the halls of the fallen.
          </Typography>
        </Box>

        <Box sx={styles.buttonContainer}>
          {/* <Button
            variant="outlined"
            component="a"
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            sx={styles.shareButton}
          >
            Share on X
          </Button> */}
          <Button
            variant="contained"
            onClick={backToMenu}
            sx={styles.restartButton}
          >
            Play Again
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
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
  content: {
    width: '600px',
    padding: '24px',
    border: '2px solid #083e22',
    borderRadius: '12px',
    background: 'rgba(24, 40, 24, 0.55)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  title: {
    color: '#d0c98d',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(208, 201, 141, 0.3)',
    textAlign: 'center',
    fontSize: '2rem',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    boxSizing: 'border-box',
    gap: 1,
    background: 'rgba(24, 40, 24, 0.8)',
    borderRadius: '12px',
    border: '2px solid #083e22',
    minWidth: '200px',
  },
  statLabel: {
    color: '#d0c98d',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  statValue: {
    color: '#d0c98d',
    fontSize: '1.5rem',
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 'bold',
  },
  deathCauseContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    background: 'rgba(80, 0, 0, 0.9)',
    borderRadius: '12px',
    border: '2px solid #ff0000',
    width: '100%',
  },
  deathCauseTitle: {
    color: '#ff3333',
    fontFamily: 'Cinzel, Georgia, serif',
    marginBottom: '8px',
    fontWeight: 'bold',
    opacity: 0.9,
  },
  deathMessage: {
    color: '#ff3333',
    fontSize: '1rem',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: '20px',
    boxSizing: 'border-box',
    background: 'rgba(24, 40, 24, 0.8)',
    borderRadius: '12px',
    border: '2px solid #083e22',
    width: '100%',
  },
  message: {
    color: '#d0c98d',
    fontSize: '1rem',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  shareButton: {
    minWidth: '250px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  restartButton: {
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(24, 40, 24, 1)',
    minWidth: '250px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
    '&:hover': {
      border: '2px solid rgba(34, 60, 34, 1)',
      background: 'rgba(34, 60, 34, 1)',
    },
  },
  buttonText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontWeight: 600,
    fontSize: '1.1rem',
    color: '#d0c98d',
    letterSpacing: '1px',
    lineHeight: 1.6,
  },
};
