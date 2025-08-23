import { OBSTACLE_NAMES } from '@/constants/obstacle';
import { useGameStore } from '@/stores/gameStore';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function DeathOverlay() {
  const { gameId, exploreLog, battleEvent, beast, quest, collectableCount } = useGameStore();
  const navigate = useNavigate();

  const finalBattleEvent = battleEvent || exploreLog.find(event => event.type === 'obstacle');

  let battleMessage = '';
  if (finalBattleEvent?.type === 'obstacle') {
    battleMessage = `${OBSTACLE_NAMES[finalBattleEvent.obstacle?.id!]} hit your ${finalBattleEvent.obstacle?.location} for ${finalBattleEvent.obstacle?.damage} damage ${finalBattleEvent.obstacle?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  } else if (finalBattleEvent?.type === 'beast_attack') {
    battleMessage = `${beast?.name} attacked your ${battleEvent?.attack?.location} for ${battleEvent?.attack?.damage} damage ${battleEvent?.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  } else if (finalBattleEvent?.type === 'ambush') {
    battleMessage = `${beast?.name} ambushed your ${battleEvent?.attack?.location} for ${battleEvent?.attack?.damage} damage ${battleEvent?.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  }

  const shareMessage = collectableCount > 0 
    ? `I fought bravely in Death Mountain and collected ${collectableCount} ${collectableCount === 1 ? 'beast' : 'beasts'}! Want to see my journey? Watch my replay here: lootsurvivor.io/watch/${gameId} 🗡️⚔️ @provablegames @lootsurvivor`
    : `I fought bravely in Death Mountain but couldn't collect any beasts. Want to see my journey? Watch my replay here: lootsurvivor.io/watch/${gameId} 🗡️⚔️ @provablegames @lootsurvivor`;

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
          GAME OVER
        </Typography>

        <Box sx={styles.statsContainer}>
          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Beasts Collected</Typography>
            <Typography sx={styles.statValue}>{collectableCount}</Typography>
          </Box>
        </Box>

        {finalBattleEvent && (
          <Box sx={styles.battleCauseContainer}>
            <Typography sx={styles.battleCauseTitle}>Final Encounter</Typography>
            <Typography sx={styles.battleMessage}>{battleMessage}</Typography>
          </Box>
        )}

        <Box sx={styles.messageContainer}>
          <Typography sx={styles.message}>
            {collectableCount > 0 
              ? `You've proven your worth in Death Mountain by collecting ${collectableCount} ${collectableCount === 1 ? 'beast' : 'beasts'}. Your victories will echo through the halls of the great adventurers.`
              : `Though you fought valiantly in Death Mountain, the beasts proved too elusive this time. The mountain awaits your return, adventurer.`
            }
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
  battleCauseContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    background: 'rgba(80, 40, 0, 0.9)',
    borderRadius: '12px',
    border: '2px solid #ff6600',
    width: '100%',
  },
  battleCauseTitle: {
    color: '#ff9933',
    fontFamily: 'Cinzel, Georgia, serif',
    marginBottom: '8px',
    fontWeight: 'bold',
    opacity: 0.9,
  },
  battleMessage: {
    color: '#ff9933',
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
