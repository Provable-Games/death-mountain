import { Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useController } from "@/contexts/controller";
import { useGameTokens } from "@/dojo/useGameTokens";
import {
  useGameTokens as useMetagameTokens,
  GameTokenData,
} from "metagame-sdk";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WatchIcon from "@mui/icons-material/Watch";
import { calculateLevel } from "@/utils/game";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getContractByName } from "@dojoengine/core";
import { useDojoConfig } from "@/contexts/starknet";

interface AdventurersListProps {
  onBack: () => void;
}

export default function AdventurersList({ onBack }: AdventurersListProps) {
  const navigate = useNavigate();
  const { address } = useController();
  const { fetchAdventurerData } = useGameTokens();
  const dojoConfig = useDojoConfig();
  const namespace = dojoConfig.namespace;
  const GAME_TOKEN_ADDRESS = getContractByName(
    dojoConfig.manifest,
    namespace,
    "game_token_systems"
  )?.address;
  const { data: gamesData } = useMetagameTokens({
    gameAddresses: [GAME_TOKEN_ADDRESS],
    owner: address,
  });
  const [gameTokens, setGameTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeDead, setIncludeDead] = useState(false);

  useEffect(() => {
    async function fetchAdventurers() {
      if (!gamesData) return;

      let games = await fetchAdventurerData(gamesData);

      if (!includeDead) {
        games = games.filter((game: any) => !game.dead && !game.expired);
      }

      setGameTokens(
        games.sort((a: any, b: any) => b.adventurer_id - a.adventurer_id)
      );
      setLoading(false);
    }
    fetchAdventurers();
  }, [gamesData]);

  const handleResumeGame = (gameId: number) => {
    navigate(`/survivor/play?id=${gameId}`);
  };

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
          My Adventurers
        </Button>
      </Box>

      <Box sx={styles.listContainer}>
        {loading ? (
          <Typography sx={{ textAlign: "center", py: 2 }}>
            Loading...
          </Typography>
        ) : gameTokens.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 2 }}>
            No adventurers found
          </Typography>
        ) : (
          gameTokens.map((game: any, index: number) => (
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
              <Box sx={styles.listItem}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    maxWidth: "30vw",
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "left",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
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
                    <Typography
                      color="secondary"
                      sx={{ fontSize: "12px", opacity: 0.8 }}
                    >
                      ID: #{game.adventurer_id}
                    </Typography>
                  </Box>
                </Box>

                {game.xp ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minWidth: "55px",
                    }}
                  >
                    <Typography
                      fontSize="13px"
                      lineHeight={1.2}
                      color="secondary"
                    >
                      Lvl: {calculateLevel(game.xp)}
                    </Typography>
                    <Typography fontSize="13px" lineHeight={1.2}>
                      HP: {game.health}
                    </Typography>
                  </Box>
                ) : (
                  <Typography fontSize="13px" color="secondary" flex={1}>
                    New
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
                  {game.available_at !== 0 && (
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

                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ width: "40px", height: "40px" }}
                  onClick={() => handleResumeGame(game.adventurer_id)}
                  disabled={game.available_at > Date.now()}
                >
                  <ArrowForwardIcon fontSize="small" />
                </Button>
              </Box>
            </motion.div>
          ))
        )}
      </Box>
    </motion.div>
  );
}

const styles = {
  adventurersHeader: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    mb: 1,
  },
  backButton: {
    minWidth: "auto",
    px: 1,
  },
  listContainer: {
    width: "100%",
    maxHeight: "550px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflowY: "auto",
    pr: 0.5,
  },
  listItem: {
    height: "52px",
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
