import { useController } from "@/contexts/controller";
import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { calculateLevel } from "@/utils/game";
import { ChainId } from '@/utils/networkConfig';
import { getContractByName } from "@dojoengine/core";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import TheatersIcon from '@mui/icons-material/Theaters';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, CircularProgress, IconButton, InputBase, Pagination, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useGameTokenRanking, useGameTokens } from "metagame-sdk/sql";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addAddressPadding } from "starknet";

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const navigate = useNavigate();
  const { address } = useController();
  const dungeon = useDungeon();
  const { currentNetworkConfig } = useDynamicConnector();
  const { updatePlayerName } = useSystemCalls();

  const [playerBestGame, setPlayerBestGame] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [localNameOverrides, setLocalNameOverrides] = useState<Record<number, string>>({});

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const GAME_TOKEN_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    currentNetworkConfig.namespace,
    "game_token_systems"
  )?.address;

  let mintedByAddress = currentNetworkConfig.chainId === ChainId.WP_PG_SLOT ? GAME_TOKEN_ADDRESS : addAddressPadding(dungeon.address);
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
    gameAddresses: [currentNetworkConfig.gameAddress],
    settings_id,
    owner: activeTab === 1 ? address : undefined,
  });

  const handleChange = useCallback((event: any, newValue: number) => {
    goToPage(newValue - 1);
  }, [goToPage]);

  const { games: playerBestGames } = useGameTokens({
    owner: address,
    limit: 1,
    sortBy: "score",
    sortOrder: "desc",
    mintedByAddress,
    gameAddresses: [currentNetworkConfig.gameAddress],
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

  const watchGame = useCallback((gameId: number) => {
    navigate(`/${dungeon.id}/watch?id=${gameId}`);
  }, [navigate, dungeon.id]);

  const startEditing = useCallback((game: any) => {
    setEditingGameId(game.token_id);
    setEditingName(localNameOverrides[game.token_id] ?? game.player_name ?? "");
  }, [localNameOverrides]);

  const cancelEditing = useCallback(() => {
    setEditingGameId(null);
    setEditingName("");
  }, []);

  const saveNewName = useCallback(async (tokenId: number) => {
    if (!editingName.trim()) {
      cancelEditing();
      return;
    }

    const newName = editingName.trim();
    setIsSaving(true);
    try {
      await updatePlayerName(tokenId, newName);
      setLocalNameOverrides(prev => ({ ...prev, [tokenId]: newName }));
      cancelEditing();
    } catch (error) {
      console.error("Error updating player name:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editingName, cancelEditing, updatePlayerName]);

  const isOwner = useCallback((game: any) => {
    if (!address || !game.owner) return false;
    return addAddressPadding(game.owner).toLowerCase() === addAddressPadding(address).toLowerCase();
  }, [address]);

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
            <Typography color='secondary' sx={{ fontSize: "13px" }}>
              Your Rank: {playerBestGame.rank}
            </Typography>
          </Box>
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
                  flex: 1,
                }}
              >
                {editingGameId === game.token_id ? (
                  <Box sx={styles.editContainer}>
                    <InputBase
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveNewName(game.token_id);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      autoFocus
                      disabled={isSaving}
                      sx={styles.editInput}
                      inputProps={{
                        maxLength: 31,
                      }}
                    />
                    <Box sx={styles.editActions}>
                      {isSaving ? (
                        <CircularProgress size={16} sx={{ color: '#d0c98d' }} />
                      ) : (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => saveNewName(game.token_id)}
                            sx={styles.editActionButton}
                          >
                            <CheckIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={cancelEditing}
                            sx={styles.editActionButton}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={styles.nameContainer}>
                    {loading ? <Skeleton variant="text" sx={{ fontSize: '12px' }} /> : (
                      <Typography
                        color="primary"
                        lineHeight={1}
                        sx={{
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "85px",
                          overflow: "hidden",
                        }}
                      >
                        {localNameOverrides[game.token_id] ?? game.player_name}
                      </Typography>
                    )}
                    {isOwner(game) && !loading && (
                      <IconButton
                        size="small"
                        onClick={() => startEditing(game)}
                        sx={styles.editIcon}
                      >
                        <EditIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    )}
                  </Box>
                )}
                <Typography
                  color="secondary"
                  sx={{ fontSize: "12px", opacity: 0.8 }}
                >
                  ID: #{game.token_id}
                </Typography>
              </Box>
            </Box>

            <Box textAlign={'center'} display={'flex'} alignItems={'center'} gap={1}>
              <Box>
                <Typography lineHeight={1}>{game.score || 0} xp</Typography>
                <Typography
                  color="secondary"
                  sx={{ fontSize: "12px", opacity: 0.8 }}
                >
                  Lvl: {calculateLevel(game.score)}
                </Typography>
              </Box>

              <Box textAlign={'center'}>
                {game.game_over ? (
                  <IconButton onClick={() => watchGame(game.token_id)}>
                    <TheatersIcon fontSize='small' color='primary' />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => watchGame(game.token_id)}>
                    <VisibilityIcon fontSize='small' color='primary' />
                  </IconButton>
                )}
              </Box>
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
    maxHeight: "550px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflowY: "auto",
    pr: 0.5,
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
  nameContainer: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
  },
  editIcon: {
    padding: "2px",
    color: "rgba(208, 201, 141, 0.5)",
    "&:hover": {
      color: "#d0c98d",
      backgroundColor: "rgba(208, 201, 141, 0.1)",
    },
  },
  editContainer: {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
  },
  editInput: {
    fontSize: "13px",
    color: "#d0c98d",
    padding: "2px 6px",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(208, 201, 141, 0.4)",
    borderRadius: "3px",
    maxWidth: "80px",
    "& input": {
      padding: 0,
    },
    "&.Mui-focused": {
      borderColor: "#d0c98d",
    },
  },
  editActions: {
    display: "flex",
    alignItems: "center",
    gap: 0,
  },
  editActionButton: {
    padding: "2px",
    color: "#d0c98d",
    "&:hover": {
      backgroundColor: "rgba(208, 201, 141, 0.15)",
    },
  },
};
