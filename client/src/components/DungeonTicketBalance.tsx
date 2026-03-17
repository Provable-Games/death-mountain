import { useController } from "@/contexts/controller";
import { useDungeon } from "@/dojo/useDungeon";
import { NETWORKS } from "@/utils/networkConfig";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useAccount } from "@starknet-react/core";
import { useMemo } from "react";

interface DungeonTicketBalanceProps {
  onTransfer?: () => void;
}

export default function DungeonTicketBalance({
  onTransfer,
}: DungeonTicketBalanceProps) {
  const { account } = useAccount();
  const { tokenBalances } = useController();
  const dungeon = useDungeon();

  const paymentTokens = useMemo(() => {
    return NETWORKS.SN_MAIN.paymentTokens || [];
  }, []);

  const dungeonTicketCount = useMemo(() => {
    const dungeonTicketToken = paymentTokens.find(
      (token: any) => token.address === dungeon.ticketAddress
    );
    return dungeonTicketToken
      ? Number(tokenBalances[dungeonTicketToken.name])
      : 0;
  }, [paymentTokens, tokenBalances, dungeon.ticketAddress]);

  if (!account) return null;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.row}>
        <Box sx={styles.ticketInfo}>
          <img
            src="/images/dungeon_ticket.png"
            alt="Dungeon Ticket"
            style={{ width: 24, height: 24, objectFit: "contain" }}
          />
          <Typography sx={styles.label}>Dungeon Tickets</Typography>
        </Box>
        <Typography sx={styles.balance}>{dungeonTicketCount}</Typography>
      </Box>

      <Button
        variant="outlined"
        fullWidth
        size="small"
        onClick={onTransfer}
        sx={styles.transferButton}
      >
        <Typography sx={styles.buttonText}>Transfer</Typography>
      </Button>
    </Box>
  );
}

const styles = {
  container: {
    width: "100%",
    border: "1px solid #d0c98d30",
    borderRadius: "5px",
    padding: "10px",
    background: "rgba(24, 40, 24, 0.3)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketInfo: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  balance: {
    fontSize: "0.85rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  transferButton: {
    height: "30px",
    borderColor: "rgba(208, 201, 141, 0.3)",
    "&:hover": {
      borderColor: "rgba(208, 201, 141, 0.6)",
      backgroundColor: "rgba(208, 201, 141, 0.05)",
    },
  },
  buttonText: {
    fontSize: "0.8rem",
    fontWeight: 500,
    letterSpacing: 0.5,
    color: "#d0c98d",
  },
};
