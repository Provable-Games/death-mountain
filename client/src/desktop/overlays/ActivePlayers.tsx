import { useDungeon } from "@/dojo/useDungeon";
import { useGameTokens } from "@/dojo/useGameTokens";
import { calculateLevel } from "@/utils/game";
import { getMenuLeftOffset } from "@/utils/utils";
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
  const [left, setLeft] = useState(getMenuLeftOffset());
  const [playersOnline, setPlayersOnline] = useState<any[] | null>(null);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [showActivePlayers, setShowActivePlayers] = useState(false);

  useEffect(() => {
    function handleResize() {
      setLeft(getMenuLeftOffset());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      // Parse as decimal - adventurer_id is a decimal string
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
    <Box
      sx={{
        position: "absolute",
        bottom: 24,
        left: `${left + 32}px`,
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
        width: 270,
      }}
    >
      {/* Expandable List */}
      <Collapse in={showActivePlayers}>
        <Box
          sx={{
            bgcolor: "rgba(18, 32, 18, 0.95)",
            border: "1px solid rgba(208, 201, 141, 0.3)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            backdropFilter: "blur(10px)",
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {alivePlayers.length === 0 ? (
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "rgba(208, 201, 141, 0.6)",
                textAlign: "center",
                py: 2,
              }}
            >
              No active games
            </Typography>
          ) : (
            alivePlayers.map((player: any) => {
              const adventurer = player.details?.adventurer;
              // Parse as decimal - adventurer_id is a decimal string
              const adventurerId = parseInt(player.adventurer_id);
              const xp = adventurer?.xp || 0;
              const health = adventurer?.health || 0;
              const level = calculateLevel(xp);
              // Look up name using the hex key format
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
                    pr: '2px',
                    py: 1,
                    borderBottom: "1px solid rgba(208, 201, 141, 0.1)",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                    "&:hover": {
                      bgcolor: "rgba(208, 201, 141, 0.05)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: "#d0c98d",
                      }}
                    >
                      {name || `Adventurer #${adventurerId}`}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: "rgba(208, 201, 141, 0.6)",
                      }}
                    >
                      Lvl {level} · {health} HP
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/${dungeon.id}/watch?id=${adventurerId}`)}
                    sx={{
                      color: "#d0c98d",
                      "&:hover": {
                        bgcolor: "rgba(208, 201, 141, 0.1)",
                      },
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              );
            })
          )}
        </Box>
      </Collapse>

      {/* Clickable Indicator */}
      <Box
        onClick={() => setShowActivePlayers(!showActivePlayers)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          bgcolor: "rgba(24, 40, 24, 0.7)",
          border: "1px solid rgba(208, 201, 141, 0.25)",
          borderRadius: showActivePlayers ? "0 0 8px 8px" : "8px",
          backdropFilter: "blur(6px)",
          px: 1.5,
          py: 0.75,
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "rgba(24, 40, 24, 0.85)",
            borderColor: "rgba(208, 201, 141, 0.4)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#4caf50",
              boxShadow: "0 0 8px rgba(76, 175, 80, 0.8)",
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": {
                  opacity: 1,
                  boxShadow: "0 0 8px rgba(76, 175, 80, 0.8)",
                },
                "50%": {
                  opacity: 0.6,
                  boxShadow: "0 0 4px rgba(76, 175, 80, 0.4)",
                },
              },
            }}
          />
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "rgba(208, 201, 141, 0.9)",
              letterSpacing: 0.3,
            }}
          >
            {uniquePlayerCount} {uniquePlayerCount === 1 ? "survivor" : "survivors"} playing
          </Typography>
        </Box>
        {showActivePlayers ? (
          <ExpandMoreIcon sx={{ fontSize: 18, color: "rgba(208, 201, 141, 0.7)" }} />
        ) : (
          <ExpandLessIcon sx={{ fontSize: 18, color: "rgba(208, 201, 141, 0.7)" }} />
        )}
      </Box>
    </Box>
  );
}
