import { BEAST_SPECIAL_NAME_LEVEL_UNLOCK } from '@/constants/beast';
import { OBSTACLE_NAMES } from '@/constants/obstacle';
import { useDynamicConnector } from '@/contexts/starknet';
import { useDungeon } from '@/dojo/useDungeon';
import { useSystemCalls } from '@/dojo/useSystemCalls';
import { useGameStore } from '@/stores/gameStore';
import { useAnalytics } from '@/utils/analytics';
import { ChainId } from '@/utils/networkConfig';
import { getContractByName } from '@dojoengine/core';
import ShareIcon from '@mui/icons-material/Share';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useGameTokenRanking } from 'metagame-sdk/sql';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addAddressPadding } from 'starknet';

export default function DeathOverlay() {
  const dungeon = useDungeon();
  const { currentNetworkConfig } = useDynamicConnector();
  const { gameId, exploreLog, battleEvent, beast, adventurer, spectating } = useGameStore();
  const { refreshDungeonStats } = useSystemCalls();
  const navigate = useNavigate();
  const { playerDiedEvent } = useAnalytics();

  const finalBattleEvent = battleEvent || exploreLog.find(event => event.type === 'obstacle');
  let collectableCount = parseInt(localStorage.getItem(`beast_collected_${gameId}`) || "0");

  let battleMessage = '';
  if (finalBattleEvent?.type === 'obstacle') {
    battleMessage = `${OBSTACLE_NAMES[finalBattleEvent.obstacle?.id!]} hit your ${finalBattleEvent.obstacle?.location} for ${finalBattleEvent.obstacle?.damage} damage ${finalBattleEvent.obstacle?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  } else if (finalBattleEvent?.type === 'beast_attack') {
    battleMessage = `${beast?.name} attacked your ${battleEvent?.attack?.location} for ${battleEvent?.attack?.damage} damage ${battleEvent?.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  } else if (finalBattleEvent?.type === 'ambush') {
    battleMessage = `${beast?.name} ambushed your ${battleEvent?.attack?.location} for ${battleEvent?.attack?.damage} damage ${battleEvent?.attack?.critical_hit ? 'CRITICAL HIT!' : ''}`;
  }

  const shareMessage =
    finalBattleEvent?.type === "obstacle"
      ? `I got a score of ${adventurer?.xp
      } in Loot Survivor 2: ${dungeon.name}. \n\n💀 ${OBSTACLE_NAMES[finalBattleEvent.obstacle?.id!]
      } ended my journey. \n\n@provablegames @lootsurvivor`
      : `I got a score of ${adventurer?.xp} in Loot Survivor 2: ${dungeon.name}. \n\n💀 A ${beast?.name} ended my journey. \n\n@provablegames @lootsurvivor`;

  const backToMenu = () => {
    navigate(`/${dungeon.id}`, { replace: true });
  };

  useEffect(() => {
    if (
      !spectating && dungeon.id === "survivor" && beast && beast.level >= BEAST_SPECIAL_NAME_LEVEL_UNLOCK
      && !beast.isCollectable && currentNetworkConfig.beasts
    ) {
      refreshDungeonStats(beast, 10000);
    }
  }, []);

  useEffect(() => {
    if (!spectating && gameId && adventurer) {
      playerDiedEvent({
        adventurerId: gameId,
        xp: adventurer.xp,
      });
    }
  }, [gameId, adventurer]);

  const GAME_TOKEN_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    currentNetworkConfig.namespace,
    "game_token_systems"
  )?.address;

  let tokenResult = useGameTokenRanking({
    tokenId: gameId!,
    mintedByAddress: currentNetworkConfig.chainId === ChainId.WP_PG_SLOT ? GAME_TOKEN_ADDRESS : addAddressPadding(dungeon.address),
    settings_id: currentNetworkConfig.chainId === ChainId.WP_PG_SLOT ? 0 : undefined
  });

  return (
    <Box sx={styles.container}>
      <Box sx={[styles.imageContainer, { backgroundImage: `url('/images/start.png')` }]} />

      <Box sx={styles.content}>
        <Typography variant="h2" sx={styles.title}>
          GAME OVER
        </Typography>

        <Box sx={styles.statsContainer}>
          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Final Score</Typography>
            <Box sx={styles.scoreRow}>
              <Typography sx={styles.statValue}>{tokenResult.ranking?.score || adventurer?.xp || 0}</Typography>
              <IconButton
                component="a"
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`}
                target="_blank"
                sx={styles.shareIconButton}
                size="small"
              >
                <ShareIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={styles.statCard}>
            <Typography sx={styles.statLabel}>Rank</Typography>
            <Typography sx={styles.statValue}>{tokenResult.ranking?.rank || 0}</Typography>
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

        <Box sx={styles.secondaryButtonContainer}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/${dungeon.id}/watch?id=${gameId}`)}
            sx={styles.shareButton}
          >
            Watch Replay
          </Button>
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
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  shareIconButton: {
    color: 'rgba(208, 201, 141, 0.7)',
    padding: '4px',
    position: 'absolute',
    right: 0,
    '&:hover': {
      color: '#d0c98d',
      backgroundColor: 'rgba(208, 201, 141, 0.1)',
    },
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
  secondaryButtonContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  claimButton: {
    background: 'linear-gradient(135deg, #ffe082 0%, #ffb300 100%)',
    color: '#1a1a1a',
    minWidth: '300px',
    height: '56px',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    boxShadow: '0 0 20px rgba(255, 224, 130, 0.3)',
    '&:hover': {
      background: 'linear-gradient(135deg, #ffb300 0%, #ff8800 100%)',
      boxShadow: '0 0 30px rgba(255, 224, 130, 0.6)',
    },
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
    },
  },
  shareButton: {
    minWidth: '150px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  claimRewardButton: {
    border: '2px solid rgba(208, 201, 141, 0.6)',
    background: 'rgba(24, 40, 24, 1)',
    color: '#d0c98d',
    minWidth: '150px',
    height: '48px',
    justifyContent: 'center',
    borderRadius: '8px',
    fontWeight: 'bold',
    boxShadow: '0 0 20px rgba(208, 201, 141, 0.4), 0 0 40px rgba(208, 201, 141, 0.2)',
    animation: 'claimRewardGlow 2s ease-in-out infinite',
    '&:hover': {
      background: 'rgba(34, 60, 34, 1)',
      border: '2px solid rgba(208, 201, 141, 0.8)',
      boxShadow: '0 0 30px rgba(208, 201, 141, 0.6), 0 0 60px rgba(208, 201, 141, 0.3)',
      transform: 'scale(1.02)',
    },
    '@keyframes claimRewardGlow': {
      '0%, 100%': {
        boxShadow: '0 0 20px rgba(208, 201, 141, 0.4), 0 0 40px rgba(208, 201, 141, 0.2)',
      },
      '50%': {
        boxShadow: '0 0 30px rgba(208, 201, 141, 0.6), 0 0 60px rgba(208, 201, 141, 0.4)',
      },
    },
  },
  restartButton: {
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(24, 40, 24, 1)',
    minWidth: '150px',
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
