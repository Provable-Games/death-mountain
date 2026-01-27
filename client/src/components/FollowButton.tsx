import { useFollowStore } from '@/stores/followStore';
import { useController } from '@/contexts/controller';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { IconButton, Tooltip } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { addAddressPadding } from 'starknet';

interface FollowButtonProps {
  playerAddress: string;
  playerName: string;
  size?: 'small' | 'medium';
}

export default function FollowButton({ playerAddress, playerName, size = 'small' }: FollowButtonProps) {
  const { address: currentUserAddress } = useController();
  const { followPlayer, unfollowPlayer, isFollowing } = useFollowStore();

  const normalizedPlayerAddress = useMemo(
    () => addAddressPadding(playerAddress).toLowerCase(),
    [playerAddress]
  );

  const normalizedCurrentAddress = useMemo(
    () => currentUserAddress ? addAddressPadding(currentUserAddress).toLowerCase() : null,
    [currentUserAddress]
  );

  const isSelf = normalizedCurrentAddress === normalizedPlayerAddress;
  const following = isFollowing(normalizedPlayerAddress);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelf) return;

      if (following) {
        unfollowPlayer(normalizedPlayerAddress);
      } else {
        followPlayer(normalizedPlayerAddress, playerName);
      }
    },
    [following, isSelf, normalizedPlayerAddress, playerName, followPlayer, unfollowPlayer]
  );

  // Don't show follow button for self
  if (isSelf) {
    return null;
  }

  const tooltipTitle = following ? 'Unfollow player' : 'Follow player';

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          padding: '2px',
          color: following ? '#e91e63' : 'rgba(208, 201, 141, 0.5)',
          '&:hover': {
            color: following ? '#c2185b' : '#e91e63',
            backgroundColor: 'rgba(233, 30, 99, 0.1)',
          },
        }}
        aria-label={tooltipTitle}
      >
        {following ? (
          <FavoriteIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />
        ) : (
          <FavoriteBorderIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
