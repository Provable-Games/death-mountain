import { useDungeon } from '@/dojo/useDungeon';
import { useGameStore } from '@/stores/gameStore';
import { screenVariants } from '@/utils/animations';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function QuestCompletedScreen() {
  const { gameId, adventurer, quest } = useGameStore();
  const navigate = useNavigate();
  const dungeon = useDungeon();

  const shareMessage = `I completed Quest ${quest?.id} in Loot Survivor 2! Want to see how I did it? Watch my replay here: lootsurvivor.io/watch/${gameId} 🗡️⚔️ @provablegames @lootsurvivor`;

  const backToCampaign = () => {
    // Store completed quest in localStorage
    if (quest) {
      const completedQuests = JSON.parse(localStorage.getItem('completedQuests') || '[]');
      if (!completedQuests.includes(quest.id)) {
        completedQuests.push(quest.id);
        localStorage.setItem('completedQuests', JSON.stringify(completedQuests));
      }
    }

    navigate(`/${dungeon.id}/campaign?chapter=${quest?.chapterId}`, { replace: true });
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={screenVariants}
      style={styles.container}
    >
      <Box sx={styles.content}>
        <Typography variant="h2" sx={styles.title}>
          Quest Completed!
        </Typography>

        <Box sx={styles.statsContainer}>
          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Final Score</Typography>
            <Typography sx={styles.statValue}>{adventurer?.xp || 0}</Typography>
          </Box>
        </Box>

        <Box sx={styles.messageContainer}>
          <Typography sx={styles.message}>
            Congratulations, brave adventurer! You have successfully completed Quest {quest?.id}. Your legend grows stronger with each victory.
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
            onClick={backToCampaign}
            sx={styles.campaignButton}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(17, 17, 17, 0.95)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '40px 20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
    textAlign: 'center',
    fontSize: '2.5rem',
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
    gap: 1,
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    minWidth: '200px',
  },
  statLabel: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
  },
  statValue: {
    color: '#80FF00',
    fontSize: '2rem',
    fontFamily: 'VT323, monospace',
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: '20px',
    background: 'rgba(128, 255, 0, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(128, 255, 0, 0.1)',
    width: '100%',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '1.1rem',
    fontFamily: 'VT323, monospace',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  buttonContainer: {
    display: 'flex',
    gap: 2,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    fontSize: '1.2rem',
    fontWeight: 'bold',
    height: '42px',
    color: '#80FF00',
    borderColor: 'rgba(128, 255, 0, 0.3)',
    '&:hover': {
      borderColor: 'rgba(128, 255, 0, 0.5)',
      backgroundColor: 'rgba(128, 255, 0, 0.1)',
    },
  },
  campaignButton: {
    flex: 1,
    fontSize: '1.2rem',
    fontWeight: 'bold',
    height: '42px',
    background: 'rgba(128, 255, 0, 0.15)',
    color: '#80FF00',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    '&:hover': {
      background: 'rgba(128, 255, 0, 0.25)',
    },
  },
};
