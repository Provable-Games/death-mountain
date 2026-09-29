import { useFollowStore, FollowedPlayer } from '@/stores/followStore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useMemo } from 'react';

interface FollowingListProps {
  variant?: 'compact' | 'full';
}

export default function FollowingList({ variant = 'compact' }: FollowingListProps) {
  const { followedPlayers, unfollowPlayer, getFollowedCount } = useFollowStore();

  const sortedPlayers = useMemo(() => {
    return Object.values(followedPlayers).sort(
      (a: FollowedPlayer, b: FollowedPlayer) => b.followedAt - a.followedAt
    );
  }, [followedPlayers]);

  const count = getFollowedCount();

  if (count === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography color="secondary" sx={{ fontSize: '14px' }}>
          You are not following any players yet.
        </Typography>
        <Typography color="secondary" sx={{ fontSize: '12px', mt: 1, opacity: 0.7 }}>
          Click the heart icon next to a player's name to follow them.
        </Typography>
      </Box>
    );
  }

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {variant === 'full' && (
        <Typography color="secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
          Following {count} player{count !== 1 ? 's' : ''}
        </Typography>
      )}

      {sortedPlayers.map((player) => (
        <Box
          key={player.address}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: variant === 'compact' ? 0.5 : 1,
            px: 1,
            background: 'rgba(24, 40, 24, 0.3)',
            border: '1px solid rgba(8, 62, 34, 0.5)',
            borderRadius: '4px',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Typography
              color="primary"
              sx={{
                fontSize: variant === 'compact' ? '12px' : '14px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: variant === 'compact' ? '100px' : '150px',
              }}
            >
              {player.name}
            </Typography>
            <Typography
              color="secondary"
              sx={{ fontSize: '10px', opacity: 0.7 }}
            >
              {truncateAddress(player.address)}
            </Typography>
          </Box>

          <Tooltip title="Unfollow" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => unfollowPlayer(player.address)}
              sx={{
                padding: '4px',
                color: 'rgba(208, 201, 141, 0.5)',
                '&:hover': {
                  color: '#f44336',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                },
              }}
              aria-label="Unfollow player"
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}
