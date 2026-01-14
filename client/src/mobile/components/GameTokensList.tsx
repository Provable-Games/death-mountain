import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { useGameTokens } from "@/dojo/useGameTokens";
import { calculateLevel } from "@/utils/game";
import { ChainId } from "@/utils/networkConfig";
import { getContractByName } from "@dojoengine/core";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TheatersIcon from "@mui/icons-material/Theaters";
import WatchIcon from "@mui/icons-material/Watch";
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useGameTokens as useMetagameTokens } from "metagame-sdk/sql";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addAddressPadding } from "starknet";

export default function GameTokensList() {
  const { fetchAdventurerData } = useGameTokens();
  const { account } = useController();
  const navigate = useNavigate();
  const dungeon = useDungeon();

  const [gameTokens, setGameTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  const { currentNetworkConfig } = useDynamicConnector();
  const namespace = currentNetworkConfig.namespace;
  const GAME_TOKEN_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    namespace,
    "game_token_systems"
  )?.address;

  const { games: gamesData } = useMetagameTokens({
    mintedByAddress:
      currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
        ? GAME_TOKEN_ADDRESS
        : addAddressPadding(dungeon.address),
    owner: account?.address,
    limit: 10000,
  });

  useEffect(() => {
    async function fetchAdventurers() {
      if (!gamesData) return;

      let games = await fetchAdventurerData(gamesData);

      setGameTokens(
        games.sort((a: any, b: any) => b.adventurer_id - a.adventurer_id)
      );
      setLoading(false);
    }
    fetchAdventurers();
  }, [gamesData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Filter games based on active tab
  const filteredGames = gameTokens.filter((game: any) => {
    const isCompleted = game.dead || game.expired;
    return activeTab === 0 ? !isCompleted : isCompleted;
  });

  function handleResumeGame(gameId: number) {
    navigate(`/${dungeon.id}/play?id=${gameId}`);
  }

  function handleWatchGame(gameId: number) {
    navigate(`/${dungeon.id}/watch?id=${gameId}`);
  }

  const renderTimeRemaining = (timestamp: number) => {
    const hours = Math.max(
      0,
      Math.floor((timestamp - Date.now()) / (1000 * 60 * 60))
    );
    const minutes = Math.max(
      0,
      Math.floor(((timestamp - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))
    );

    return (
      <>
        {hours > 0 && (
          <>
            <Typography color="primary" sx={{ fontSize: "13px" }}>
              {hours}
            </Typography>
            <Typography color="primary" sx={{ fontSize: "13px", ml: "2px" }}>
              h
            </Typography>
          </>
        )}
        <Typography
          color="primary"
          sx={{ fontSize: "13px", ml: hours > 0 ? "4px" : "0px" }}
        >
          {minutes}
        </Typography>
        <Typography color="primary" sx={{ fontSize: "13px", ml: "2px" }}>
          m
        </Typography>
      </>
    );
  };

  if (loading) {
    return (
      <Typography sx={{ textAlign: "center", py: 2 }}>Loading...</Typography>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={styles.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={styles.tabs}
        >
          <Tab label="Active" sx={styles.tab} />
          <Tab label="Completed" sx={styles.tab} />
        </Tabs>
      </Box>

      <Box sx={styles.listContainer}>
        {filteredGames.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 2, opacity: 0.7 }}>
            No {activeTab === 0 ? "active" : "completed"} games
          </Typography>
        ) : (
          filteredGames.map((game: any, index: number) => (
            <motion.div
              key={game.adventurer_id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1,
                delay: index * 0.1,
              }}
            >
              <Box
                key={game.adventurer_id}
                sx={styles.listItem}
                className="container"
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    maxWidth: "30vw",
                    flex: 1,
                  }}
                >
                  <img
                    src={"/images/mobile/adventurer.png"}
                    alt="Adventurer"
                    style={{ width: "32px", height: "32px" }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "left",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="h6"
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
                    </Typography>

                    <Typography color="text.secondary" noWrap>
                      ID: #{game.adventurer_id}
                    </Typography>
                  </Box>
                </Box>

                {game.xp ? (
                  <Stack direction="column" flex={1} minWidth="55px">
                    <Typography variant="body2" lineHeight={1.2} color="#EDCF33">
                      Lvl: {calculateLevel(game.xp)}
                    </Typography>
                    <Typography variant="body2" lineHeight={1.1}>
                      HP: {game.health}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="#EDCF33" flex={1}>
                    New Game
                  </Typography>
                )}

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    width: "50px",
                  }}
                >
                  {(game.available_at > 0 || game.expires_at > 0) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                      {game.available_at < Date.now() ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <AccessTimeIcon
                            color="primary"
                            sx={{ fontSize: "16px", mr: "3px" }}
                          />
                          {renderTimeRemaining(game.expires_at)}
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <WatchIcon
                            color="primary"
                            sx={{ fontSize: "16px", mr: "3px" }}
                          />
                          {renderTimeRemaining(game.available_at)}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                <Stack direction="row" spacing={1}>
                  {activeTab === 0 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={styles.resumeButton}
                      onClick={() => handleResumeGame(game.adventurer_id)}
                      disabled={game.available_at > Date.now()}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={styles.resumeButton}
                      onClick={() => handleWatchGame(game.adventurer_id)}
                    >
                      <TheatersIcon fontSize="small" />
                    </Button>
                  )}
                </Stack>
              </Box>
            </motion.div>
          ))
        )}
      </Box>
    </Box>
  );
}

const styles = {
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
    maxHeight: "365px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    pr: 0.5,
    overflowY: "auto",
  },
  listItem: {
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
    p: "5px !important",
    flexShrink: 0,
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    background: "rgba(128, 255, 0, 0.1)",
    border: "1px solid rgba(128, 255, 0, 0.2)",
    p: "2px 5px",
  },
  statLabel: {
    color: "rgba(128, 255, 0, 0.7)",
    fontSize: "0.85rem",
    fontFamily: "VT323, monospace",
    lineHeight: 1,
  },
  statValue: {
    color: "#80FF00",
    fontSize: "0.9rem",
    fontFamily: "VT323, monospace",
    fontWeight: "bold",
    lineHeight: 1,
  },
  resumeButton: {
    width: "50px",
    height: "34px",
    fontSize: "12px",
    "&.Mui-disabled": {
      backgroundColor: "rgba(128, 255, 0, 0.1)",
      color: "rgba(128, 255, 0, 0.3)",
      border: "1px solid rgba(128, 255, 0, 0.2)",
    },
  },
};
