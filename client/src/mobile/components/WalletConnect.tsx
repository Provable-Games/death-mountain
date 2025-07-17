import { useController } from '@/contexts/controller';
import { ellipseAddress } from '@/utils/utils';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Button } from '@mui/material';

function WalletConnect() {
  const { account, address, isPending, playerName, login, openProfile } = useController()

  return (
    <>
      {account && address
        ? <Button
          loading={!playerName}
          onClick={() => openProfile()}
          startIcon={<SportsEsportsIcon />}
          color='primary'
          variant='contained'
          size='small'
          sx={{ minWidth: '100px' }}
        >
          {playerName ? playerName : ellipseAddress(address, 4, 4)}
        </Button>

        : <Button
          loading={isPending}
          variant='contained'
          color='secondary'
          onClick={() => login()}
          size='small'
          startIcon={<SportsEsportsIcon />}
          sx={{ minWidth: '100px' }}
        >
          Log In
        </Button>
      }
    </>
  );
}

export default WalletConnect
