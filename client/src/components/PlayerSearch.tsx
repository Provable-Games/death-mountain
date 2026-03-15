import { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  InputBase,
  CircularProgress,
  Typography,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from 'notistack';
import { addAddressPadding } from 'starknet';
import { useFollowStore } from '@/stores/followStore';
import { useController } from '@/contexts/controller';
import { usePlayerSearch, PlayerSearchResult } from '@/hooks/usePlayerSearch';

export default function PlayerSearch() {
  const { address: currentUserAddress } = useController();
  const { followPlayer, isFollowing } = useFollowStore();
  const { enqueueSnackbar } = useSnackbar();
  const { loading, results, error, searchPlayers, clearResults } = usePlayerSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Filter out current user from results
  const filteredResults = results.filter((result) => {
    if (!currentUserAddress) return true;
    const normalizedOwner = addAddressPadding(result.owner).toLowerCase();
    const normalizedCurrentUser = addAddressPadding(currentUserAddress).toLowerCase();
    return normalizedOwner !== normalizedCurrentUser;
  });

  // Debug logging
  console.log('[PlayerSearch UI] Current state - loading:', loading, 'error:', error, 'results:', results.length, 'filtered:', filteredResults.length, 'hasSearched:', hasSearched);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    console.log('[PlayerSearch UI] Triggering search for:', searchQuery);
    setHasSearched(true);
    const results = await searchPlayers(searchQuery);
    console.log('[PlayerSearch UI] Search complete, results:', results);
  }, [searchQuery, searchPlayers]);

  const handleFollow = useCallback((result: PlayerSearchResult) => {
    const normalizedAddress = addAddressPadding(result.owner).toLowerCase();
    followPlayer(normalizedAddress, result.player_name);
    enqueueSnackbar(`Now following ${result.player_name}`, { variant: 'success' });
  }, [followPlayer, enqueueSnackbar]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
      clearResults();
      setHasSearched(false);
    }
  }, [handleSearch, clearResults]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    clearResults();
    setHasSearched(false);
  }, [clearResults]);

  const truncateAddress = (address: string) => {
    const padded = addAddressPadding(address);
    return `${padded.slice(0, 6)}...${padded.slice(-4)}`;
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            color: isOpen ? 'primary.main' : 'rgba(208, 201, 141, 0.7)',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'rgba(208, 201, 141, 0.1)',
            },
          }}
          aria-label="Search for player to follow"
        >
          <PersonAddIcon sx={{ fontSize: 18 }} />
        </IconButton>
        {!isOpen && (
          <Typography
            color="secondary"
            sx={{ fontSize: '12px', opacity: 0.7, cursor: 'pointer' }}
            onClick={() => setIsOpen(true)}
          >
            Search player to follow
          </Typography>
        )}
      </Box>

      <Collapse in={isOpen}>
        <Box sx={{ mt: 1 }}>
          <Box sx={styles.searchContainer}>
            <InputBase
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter player name..."
              autoFocus
              sx={styles.searchInput}
              inputProps={{
                'aria-label': 'Search for player by name',
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {loading ? (
                <CircularProgress size={16} sx={{ color: 'primary.main' }} />
              ) : (
                <IconButton
                  size="small"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  sx={styles.iconButton}
                  aria-label="Search"
                >
                  <SearchIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={handleClose}
                sx={styles.iconButton}
                aria-label="Close search"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {hasSearched && (
            <Box sx={styles.resultsContainer}>
              {error ? (
                <Typography color="error" sx={{ fontSize: '12px', textAlign: 'center', py: 1 }}>
                  {error}
                </Typography>
              ) : filteredResults.length === 0 ? (
                <Typography color="secondary" sx={{ fontSize: '12px', textAlign: 'center', py: 1 }}>
                  No players found matching "{searchQuery}"
                </Typography>
              ) : (
                filteredResults.map((result) => {
                  const normalizedOwner = addAddressPadding(result.owner).toLowerCase();
                  const alreadyFollowing = isFollowing(normalizedOwner);

                  return (
                    <Box key={result.owner} sx={styles.resultItem}>
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Typography
                          color="primary"
                          sx={{
                            fontSize: '13px',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
                          {result.player_name}
                        </Typography>
                        <Typography color="secondary" sx={{ fontSize: '10px', opacity: 0.7 }}>
                          {truncateAddress(result.owner)}
                        </Typography>
                      </Box>
                      {alreadyFollowing ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                          <Typography sx={{ fontSize: '11px', color: '#4caf50' }}>
                            Following
                          </Typography>
                        </Box>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleFollow(result)}
                          sx={{
                            padding: '4px',
                            color: '#e91e63',
                            '&:hover': {
                              backgroundColor: 'rgba(233, 30, 99, 0.1)',
                            },
                          }}
                          aria-label={`Follow ${result.player_name}`}
                        >
                          <PersonAddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

const styles = {
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    padding: '4px 8px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(208, 201, 141, 0.3)',
    borderRadius: '4px',
  },
  searchInput: {
    flex: 1,
    fontSize: '13px',
    color: '#d0c98d',
    '& input': {
      padding: 0,
    },
    '& input::placeholder': {
      color: 'rgba(208, 201, 141, 0.5)',
      opacity: 1,
    },
  },
  iconButton: {
    padding: '2px',
    color: 'rgba(208, 201, 141, 0.7)',
    '&:hover': {
      color: '#d0c98d',
      backgroundColor: 'rgba(208, 201, 141, 0.1)',
    },
    '&.Mui-disabled': {
      color: 'rgba(208, 201, 141, 0.3)',
    },
  },
  resultsContainer: {
    mt: 1,
    maxHeight: '150px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: 'rgba(24, 40, 24, 0.3)',
    border: '1px solid rgba(8, 62, 34, 0.5)',
    borderRadius: '4px',
  },
};
