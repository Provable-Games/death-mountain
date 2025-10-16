import { useDynamicConnector } from "@/contexts/starknet";
import { ChainId } from '@/utils/networkConfig';
import { getContractByName } from "@dojoengine/core";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TheatersIcon from '@mui/icons-material/Theaters';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, IconButton, Pagination, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useGameTokenRanking, useGameTokens } from "metagame-sdk/sql";
import { useNavigate } from "react-router-dom";
import { addAddressPadding } from "starknet";
import { useController } from "@/contexts/controller";
import { useEffect, useState } from "react";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const navigate = useNavigate();
  const { address } = useController();
  const { currentNetworkConfig } = useDynamicConnector();

  const [playerBestGame, setPlayerBestGame] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleChange = (event: any, newValue: number) => {
    goToPage(newValue - 1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const GAME_TOKEN_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    currentNetworkConfig.namespace,
    "game_token_systems"
  )?.address;
  let mintedByAddress = currentNetworkConfig.chainId === ChainId.WP_PG_SLOT ? GAME_TOKEN_ADDRESS : addAddressPadding(currentNetworkConfig.dungeon);
  let settings_id = currentNetworkConfig.chainId === ChainId.WP_PG_SLOT ? 0 : undefined;

  const {
    loading,
    games,
    pagination: {
      currentPage,
      totalPages,
      goToPage,
    },
  } = useGameTokens({
    pagination: {
      pageSize: 10,
    },
    sortBy: "score",
    sortOrder: "desc",
    mintedByAddress,
    settings_id,
    owner: activeTab === 1 ? address : undefined,
  });

  const { games: playerBestGames } = useGameTokens({
    owner: address,
    limit: 1,
    sortBy: "score",
    sortOrder: "desc",
    mintedByAddress,
    settings_id,
  });

  let tokenResult = useGameTokenRanking({
    tokenId: playerBestGames[0]?.token_id || 0,
    mintedByAddress,
    settings_id,
  });

  useEffect(() => {
    if (address && tokenResult.ranking) {
      setPlayerBestGame(tokenResult.ranking);
    }
  }, [tokenResult.ranking]);

  const watchGame = (gameId: number) => {
    navigate(`/survivor/watch?id=${gameId}`);
  };

  return (
    <motion.div
      key="adventurers-list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ width: "100%" }}
    >
      <Box sx={styles.adventurersHeader}>
        <Button
          variant="text"
          onClick={onBack}
          sx={styles.backButton}
          startIcon={<ArrowBackIcon />}
        >
          Leaderboard
        </Button>

        {playerBestGame && <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box textAlign={'center'}>
            <Typography color='secondary'>Your Rank: {playerBestGame.rank}</Typography>
          </Box>

          <EmojiEventsIcon color='secondary' fontSize='small' />
        </Box>}
      </Box>

      <Box sx={styles.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={styles.tabs}
        >
          <Tab label="All" sx={styles.tab} />
          <Tab label="My Games" sx={styles.tab} />
        </Tabs>
      </Box>

      <Box sx={styles.listContainer}>
        {(!games || games.length === 0) ? (
          <Typography sx={{ textAlign: "center", py: 2 }}>
            Loading...
          </Typography>
        ) : games.map((game: any, index: number) => (
          <Box sx={styles.listItem} key={game.token_id}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                maxWidth: "30vw",
                flex: 1,
              }}
            >
              <Box textAlign={'center'} px={1}>
                <Typography>{currentPage * 10 + index + 1}.</Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  overflow: "hidden",
                }}
              >
                {loading
                  ? <Skeleton variant="text" sx={{ fontSize: '12px' }} />
                  : <Typography
                    color="primary"
                    lineHeight={1}
                    sx={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {game.player_name}
                  </Typography>}
                <Typography
                  color="secondary"
                  sx={{ fontSize: "12px", opacity: 0.8 }}
                >
                  ID: #{game.token_id}
                </Typography>
              </Box>
            </Box>

            <Box textAlign={'center'} display={'flex'} alignItems={'center'} gap={1}>
              <Typography>{game.score || 0} xp</Typography>

              {/* <Box textAlign={'center'}>
                {game.game_over ? (
                  <IconButton onClick={() => watchGame(game.token_id)}>
                    <TheatersIcon fontSize='small' color='primary' />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => watchGame(game.token_id)}>
                    <VisibilityIcon fontSize='small' color='primary' />
                  </IconButton>
                )}
              </Box> */}
            </Box>
          </Box>
        ))}

        {games.length > 0 && <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', my: '2px' }}>
          <Pagination count={totalPages} shape="rounded" color='primary' size='small' page={currentPage + 1} onChange={handleChange} />
        </Box>}
      </Box>
    </motion.div>
  );
}

const styles = {
  adventurersHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    mb: 0.5,
    pr: 1,
    boxSizing: "border-box",
  },
  backButton: {
    minWidth: "auto",
    px: 1,
  },
  tabsContainer: {
    width: "100%",
    mb: 1,
  },
  tabs: {
    minHeight: "20px",
    "& .MuiTabs-indicator": {
      backgroundColor: "primary.main",
    },
  },
  tab: {
    padding: "5px 0px",
    minHeight: "20px",
    color: "text.primary",
    fontSize: "12px",
    opacity: 0.7,
    "&.Mui-selected": {
      color: "primary.main",
      opacity: 1,
    },
    "&:hover": {
      opacity: 0.9,
    },
  },
  listContainer: {
    width: "100%",
    maxHeight: "340px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    mt: 1,
    pr: 0.5,
    overflowY: "auto",
  },
  listItem: {
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 3,
    px: "5px !important",
    pl: "8px !important",
    flexShrink: 0,
    background: "rgba(24, 40, 24, 0.3)",
    border: "1px solid rgba(8, 62, 34, 0.5)",
    borderRadius: "4px",
  },
};
