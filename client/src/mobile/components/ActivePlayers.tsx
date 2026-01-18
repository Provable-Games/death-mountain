import { useDungeon } from "@/dojo/useDungeon";
import { useGameTokens } from "@/dojo/useGameTokens";
import { calculateLevel } from "@/utils/game";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ActivePlayers() {
  const navigate = useNavigate();
  const dungeon = useDungeon();
  const { getActivePlayersCount, getPlayerNames } = useGameTokens();
  const [playersOnline, setPlayersOnline] = useState<any[] | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [showActivePlayers, setShowActivePlayers] = useState(false);

  useEffect(() => {
    const fetchPlayersCount = async () => {
      const data = await getActivePlayersCount();
      if (data !== null) {
        setPlayersOnline(data);
      }
    };

    // Fetch immediately
    fetchPlayersCount();

    // Refetch every 30 seconds
    const interval = setInterval(fetchPlayersCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch player names after we have the players data
  useEffect(() => {
    if (!playersOnline || playersOnline.length === 0) return;

    const fetchNames = async () => {
      const adventurerIds = playersOnline.map((p: any) => parseInt(p.adventurer_id));
      const namesMap = await getPlayerNames(adventurerIds);
      setPlayerNames(namesMap);
    };

    fetchNames();
  }, [playersOnline]);

  if (playersOnline === null) {
    return null;
  }

  // Filter out dead players and sort by level (highest first)
  const alivePlayers = playersOnline
    .filter((player: any) => {
      const health = player.details?.adventurer?.health || 0;
      return health > 0;
    })
    .sort((a: any, b: any) => {
      const xpA = a.details?.adventurer?.xp || 0;
      const xpB = b.details?.adventurer?.xp || 0;
      return calculateLevel(xpB) - calculateLevel(xpA);
    });

  const uniquePlayerCount = new Set(Object.values(playerNames)).size;

  return (
    <Box sx={{ position: "relative" }}>
      {/* Clickable Indicator */}
      <Box
        onClick={() => setShowActivePlayers(!showActivePlayers)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          cursor: "pointer",
          py: 0.5,
          px: 1,
          borderRadius: "6px",
          transition: "all 0.2s ease",
          "&:active": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "#4caf50",
            boxShadow: "0 0 6px rgba(76, 175, 80, 0.8)",
            animation: "pulse 2s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": {
                opacity: 1,
                boxShadow: "0 0 6px rgba(76, 175, 80, 0.8)",
              },
              "50%": {
                opacity: 0.6,
                boxShadow: "0 0 3px rgba(76, 175, 80, 0.4)",
              },
            },
          }}
        />
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.9)",
            letterSpacing: 0.2,
          }}
        >
          {uniquePlayerCount} {uniquePlayerCount === 1 ? "survivor" : "survivors"} playing
        </Typography>
        {showActivePlayers ? (
          <ExpandLessIcon sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }} />
        )}
      </Box>

      {/* Expandable List (drops down) */}
      <Collapse
        in={showActivePlayers}
        sx={{
          position: "absolute",
          top: "100%",
          left: 0,
          zIndex: 100,
          mt: 0.5,
        }}
      >
        <Box
          sx={{
            bgcolor: "#111",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
            maxHeight: 280,
            width: 220,
            overflowY: "auto",
          }}
        >
          {alivePlayers.length === 0 ? (
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "rgba(255, 255, 255, 0.5)",
                textAlign: "center",
                py: 2,
              }}
            >
              No active games
            </Typography>
          ) : (
            alivePlayers.map((player: any) => {
              const adventurer = player.details?.adventurer;
              const adventurerId = parseInt(player.adventurer_id);
              const xp = adventurer?.xp || 0;
              const health = adventurer?.health || 0;
              const level = calculateLevel(xp);
              const hexKey = `0x${adventurerId.toString(16).padStart(16, '0')}`;
              const name = playerNames[hexKey];

              return (
                <Box
                  key={player.adventurer_id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    pr: 0.5,
                    py: 1,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {name || `Adventurer #${adventurerId}`}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      Lvl {level} · {health} HP
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowActivePlayers(false);
                      navigate(`/${dungeon.id}/watch?id=${adventurerId}`);
                    }}
                    sx={{
                      color: "#fff",
                      p: 0.5,
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              );
            })
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
