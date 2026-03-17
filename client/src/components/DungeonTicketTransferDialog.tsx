import { useController } from "@/contexts/controller";
import { useDungeon } from "@/dojo/useDungeon";
import { NETWORKS } from "@/utils/networkConfig";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAccount } from "@starknet-react/core";
import { AnimatePresence, motion } from "framer-motion";
import { useSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { CallData } from "starknet";

interface Recipient {
  input: string;
  address: string | null;
  username: string | null;
  resolving: boolean;
  error: string | null;
}

interface DungeonTicketTransferDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function DungeonTicketTransferDialog({
  open,
  onClose,
}: DungeonTicketTransferDialogProps) {
  const { account } = useAccount();
  const { tokenBalances } = useController();
  const dungeon = useDungeon();
  const { enqueueSnackbar } = useSnackbar();

  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [amount, setAmount] = useState("1");
  const [sending, setSending] = useState(false);

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

  const totalToSend = recipients.length * Number(amount || 0);
  // const hasEnoughBalance = dungeonTicketCount >= totalToSend && totalToSend > 0;
  const hasEnoughBalance = true;

  const isStarknetAddress = (input: string) => {
    return /^0x[0-9a-fA-F]{1,64}$/.test(input.trim());
  };

  const resolveRecipient = useCallback(
    async (input: string): Promise<Recipient> => {
      const trimmed = input.trim();
      if (!trimmed) {
        return {
          input: trimmed,
          address: null,
          username: null,
          resolving: false,
          error: "Empty input",
        };
      }

      if (isStarknetAddress(trimmed)) {
        return {
          input: trimmed,
          address: trimmed,
          username: null,
          resolving: false,
          error: null,
        };
      }

      // Treat as Cartridge Controller username
      try {
        const { lookupUsernames } = await import("@cartridge/controller");
        const result = await lookupUsernames([trimmed]);
        const address = result.get(trimmed);
        if (address) {
          return {
            input: trimmed,
            address,
            username: trimmed,
            resolving: false,
            error: null,
          };
        } else {
          return {
            input: trimmed,
            address: null,
            username: trimmed,
            resolving: false,
            error: "Username not found",
          };
        }
      } catch {
        return {
          input: trimmed,
          address: null,
          username: trimmed,
          resolving: false,
          error: "Failed to resolve username",
        };
      }
    },
    []
  );

  const addRecipients = useCallback(async () => {
    const rawInputs = recipientInput
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawInputs.length === 0) return;

    // De-duplicate within the batch (by lowercase input)
    const seen = new Set<string>();
    const uniqueInputs: string[] = [];
    let batchDuplicates = 0;
    for (const input of rawInputs) {
      const key = input.toLowerCase();
      if (seen.has(key)) {
        batchDuplicates++;
      } else {
        seen.add(key);
        uniqueInputs.push(input);
      }
    }

    // Filter out inputs that already exist in the recipients list
    const existingKeys = new Set(
      recipients.map((r) => (r.input || "").toLowerCase())
    );
    const newInputs: string[] = [];
    let existingDuplicates = 0;
    for (const input of uniqueInputs) {
      if (existingKeys.has(input.toLowerCase())) {
        existingDuplicates++;
      } else {
        newInputs.push(input);
      }
    }

    const totalDuplicates = batchDuplicates + existingDuplicates;
    if (totalDuplicates > 0) {
      enqueueSnackbar(
        `${totalDuplicates} duplicate${totalDuplicates > 1 ? "s" : ""} removed`,
        {
          variant: "info",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        }
      );
    }

    if (newInputs.length === 0) {
      setRecipientInput("");
      return;
    }

    // Add placeholders
    const placeholders: Recipient[] = newInputs.map((input) => ({
      input,
      address: null,
      username: null,
      resolving: true,
      error: null,
    }));
    setRecipients((prev) => [...prev, ...placeholders]);
    setRecipientInput("");

    // Resolve all
    const resolved = await Promise.all(newInputs.map(resolveRecipient));

    // After resolution, check for address-level duplicates
    // (two different usernames resolving to the same address)
    setRecipients((prev) => {
      const existing = prev.slice(0, prev.length - newInputs.length);
      const existingAddresses = new Set(
        existing
          .filter((r) => r.address)
          .map((r) => r.address!.toLowerCase())
      );

      let addressDuplicates = 0;
      const deduped: Recipient[] = [];
      const newAddresses = new Set<string>();

      for (const r of resolved) {
        if (r.address) {
          const addrKey = r.address.toLowerCase();
          if (existingAddresses.has(addrKey) || newAddresses.has(addrKey)) {
            addressDuplicates++;
            continue;
          }
          newAddresses.add(addrKey);
        }
        deduped.push(r);
      }

      if (addressDuplicates > 0) {
        enqueueSnackbar(
          `${addressDuplicates} duplicate address${addressDuplicates > 1 ? "es" : ""} resolved and removed`,
          {
            variant: "info",
            anchorOrigin: { vertical: "top", horizontal: "center" },
          }
        );
      }

      return [...existing, ...deduped];
    });
  }, [recipientInput, resolveRecipient, recipients, enqueueSnackbar]);

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTransfer = async () => {
    if (!account || !dungeon.ticketAddress) return;

    const validRecipients = recipients.filter((r) => r.address && !r.error);
    if (validRecipients.length === 0) {
      enqueueSnackbar("No valid recipients", {
        variant: "warning",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
      return;
    }

    const amountNum = Number(amount);
    if (amountNum <= 0 || !Number.isInteger(amountNum)) {
      enqueueSnackbar("Invalid amount", {
        variant: "warning",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
      return;
    }

    setSending(true);
    try {
      const calls = validRecipients.map((recipient) => ({
        contractAddress: dungeon.ticketAddress!,
        entrypoint: "transfer",
        calldata: CallData.compile([
          recipient.address!,
          amountNum * 1e18,
          "0",
        ]),
      }));

      await account.execute(calls);

      enqueueSnackbar(
        `Transferred ${amountNum} ticket${amountNum > 1 ? "s" : ""} to ${validRecipients.length} recipient${validRecipients.length > 1 ? "s" : ""}`,
        {
          variant: "success",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        }
      );

      setRecipients([]);
      setAmount("1");
      onClose();
    } catch (error: any) {
      console.error("Transfer failed:", error);
      enqueueSnackbar(error?.message || "Transfer failed", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    } finally {
      setSending(false);
    }
  };

  const allValid = recipients.length > 0 && recipients.every((r) => r.address && !r.error && !r.resolving);

  return (
    <AnimatePresence>
      {open && (
        <Box sx={styles.overlay} onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={styles.modal}>
              <Box sx={styles.modalGlow} />
              <IconButton onClick={onClose} sx={styles.closeBtn} size="small">
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>

              <Box sx={styles.header}>
                <Box sx={styles.titleContainer}>
                  <Typography sx={styles.title}>TRANSFER TICKETS</Typography>
                  <Box sx={styles.titleUnderline} />
                </Box>
                <Typography sx={styles.subtitle}>
                  Send dungeon tickets to other players
                </Typography>
              </Box>

              <Box sx={styles.content}>
                {/* Balance display */}
                <Box sx={styles.balanceRow}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <img
                      src="/images/dungeon_ticket.png"
                      alt="Dungeon Ticket"
                      style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <Typography sx={styles.balanceLabel}>
                      Your Balance
                    </Typography>
                  </Box>
                  <Typography sx={styles.balanceValue}>
                    {dungeonTicketCount}
                  </Typography>
                </Box>

                {/* Amount input */}
                <Box sx={{ mb: 2 }}>
                  <Typography sx={styles.fieldLabel}>
                    Amount per recipient
                  </Typography>
                  <TextField
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) setAmount(val);
                    }}
                    fullWidth
                    size="small"
                    placeholder="1"
                    sx={styles.textField}
                    slotProps={{
                      htmlInput: { min: 1 },
                    }}
                  />
                </Box>

                {/* Recipients input */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={styles.fieldLabel}>Recipients</Typography>
                    {recipientInput.trim() && (
                      <Typography sx={styles.fieldHint}>
                        {recipientInput.split(/[,\n]+/).filter((s) => s.trim()).length} entered
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={styles.fieldHint}>
                    Paste usernames or addresses — one per line, or
                    comma-separated
                  </Typography>
                  <TextField
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    maxRows={8}
                    placeholder={"username1\nusername2\n0x04a...3f2"}
                    sx={styles.textField}
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={addRecipients}
                    disabled={!recipientInput.trim()}
                    startIcon={<PersonAddIcon sx={{ fontSize: 18 }} />}
                    sx={styles.addRecipientsButton}
                  >
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: "#d0c98d" }}>
                      Add Recipients
                    </Typography>
                  </Button>
                </Box>

                {/* Recipients list */}
                {recipients.length > 0 && (
                  <Box sx={styles.recipientsList}>
                    {recipients.map((recipient, index) => (
                      <Box key={index} sx={styles.recipientRow}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              ...styles.recipientName,
                              color: recipient.error
                                ? "#f44336"
                                : recipient.resolving
                                  ? "rgba(208, 201, 141, 0.5)"
                                  : "#d0c98d",
                            }}
                            noWrap
                          >
                            {recipient.resolving
                              ? `Resolving ${recipient.input}...`
                              : recipient.error
                                ? `${recipient.input} - ${recipient.error}`
                                : recipient.username
                                  ? `${recipient.username}`
                                  : `${recipient.input.slice(0, 8)}...${recipient.input.slice(-6)}`}
                          </Typography>
                          {recipient.username && recipient.address && (
                            <Typography sx={styles.recipientAddress} noWrap>
                              {recipient.address.slice(0, 8)}...
                              {recipient.address.slice(-6)}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeRecipient(index)}
                          sx={styles.removeButton}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Summary */}
                {recipients.length > 0 && (
                  <Box sx={styles.summary}>
                    <Typography sx={styles.summaryText}>
                      Sending {Number(amount || 0)} ticket
                      {Number(amount || 0) !== 1 ? "s" : ""} each to{" "}
                      {recipients.filter((r) => r.address && !r.error).length}{" "}
                      recipient
                      {recipients.filter((r) => r.address && !r.error).length !==
                      1
                        ? "s"
                        : ""}
                    </Typography>
                    <Typography
                      sx={{
                        ...styles.summaryTotal,
                        color: hasEnoughBalance ? "#4caf50" : "#f44336",
                      }}
                    >
                      Total: {totalToSend} ticket
                      {totalToSend !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                )}

                {/* Transfer button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleTransfer}
                  disabled={!allValid || !hasEnoughBalance || sending}
                  sx={styles.transferButton}
                >
                  <Typography sx={styles.transferButtonText}>
                    {sending
                      ? "Sending..."
                      : !hasEnoughBalance && recipients.length > 0
                        ? "Insufficient Balance"
                        : "Transfer"}
                  </Typography>
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    bgcolor: "rgba(0, 0, 0, 0.5)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  modal: {
    width: "420px",
    maxWidth: "90dvw",
    maxHeight: "85dvh",
    p: 0,
    borderRadius: 3,
    background: "linear-gradient(145deg, #1a2f1a 0%, #0f1f0f 100%)",
    border: "2px solid rgba(208, 201, 141, 0.4)",
    boxShadow:
      "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(208, 201, 141, 0.1)",
    position: "relative",
    overflow: "auto",
  },
  modalGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(45deg, transparent 30%, rgba(208, 201, 141, 0.02) 50%, transparent 70%)",
    pointerEvents: "none",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    color: "#d0c98d",
    background: "rgba(208, 201, 141, 0.1)",
    border: "1px solid rgba(208, 201, 141, 0.2)",
    "&:hover": {
      background: "rgba(208, 201, 141, 0.2)",
      transform: "scale(1.1)",
    },
    transition: "all 0.2s ease",
    zIndex: 10,
  },
  header: {
    textAlign: "center" as const,
    p: 3,
    pb: 2,
    borderBottom: "1px solid rgba(208, 201, 141, 0.2)",
  },
  titleContainer: {
    position: "relative",
    mb: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1.5,
    textShadow: "0 2px 8px rgba(208, 201, 141, 0.3)",
  },
  titleUnderline: {
    width: 80,
    height: 2,
    background: "linear-gradient(90deg, transparent, #d0c98d, transparent)",
    mx: "auto",
    borderRadius: 1,
    mt: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFD700",
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  content: {
    p: 3,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  balanceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: 1.5,
    mb: 2,
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(208, 201, 141, 0.15)",
    borderRadius: 1,
  },
  balanceLabel: {
    fontSize: "0.85rem",
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  fieldLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: 0.5,
    color: "#d0c98d",
    mb: 0.5,
  },
  fieldHint: {
    fontSize: "0.7rem",
    color: "rgba(208, 201, 141, 0.5)",
    mb: 1,
    letterSpacing: 0.3,
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(208, 201, 141, 0.2)",
      borderRadius: 1,
      fontSize: "0.85rem",
      color: "#d0c98d",
      "& fieldset": { border: "none" },
      "&:hover": {
        borderColor: "rgba(208, 201, 141, 0.4)",
      },
      "&.Mui-focused": {
        borderColor: "#d0c98d",
      },
    },
    "& .MuiOutlinedInput-input": {
      color: "#d0c98d",
      "&::placeholder": {
        color: "rgba(208, 201, 141, 0.3)",
        opacity: 1,
      },
    },
  },
  addRecipientsButton: {
    mt: 1,
    height: "32px",
    borderColor: "rgba(208, 201, 141, 0.3)",
    "&:hover": {
      borderColor: "rgba(208, 201, 141, 0.5)",
      background: "rgba(208, 201, 141, 0.08)",
    },
    "&.Mui-disabled": {
      borderColor: "rgba(208, 201, 141, 0.1)",
    },
  },
  recipientsList: {
    display: "flex",
    flexDirection: "column",
    gap: 0.5,
    maxHeight: 180,
    overflowY: "auto",
    mb: 1,
    "&::-webkit-scrollbar": {
      width: 4,
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(208, 201, 141, 0.3)",
      borderRadius: 2,
    },
  },
  recipientRow: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    p: 1,
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(208, 201, 141, 0.1)",
    borderRadius: 1,
  },
  recipientName: {
    fontSize: "0.8rem",
    fontWeight: 500,
    letterSpacing: 0.3,
  },
  recipientAddress: {
    fontSize: "0.7rem",
    color: "rgba(208, 201, 141, 0.4)",
    letterSpacing: 0.3,
  },
  removeButton: {
    color: "rgba(208, 201, 141, 0.5)",
    padding: "4px",
    "&:hover": {
      color: "#f44336",
      background: "rgba(244, 67, 54, 0.1)",
    },
  },
  summary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: 1.5,
    mb: 2,
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(208, 201, 141, 0.15)",
    borderRadius: 1,
  },
  summaryText: {
    fontSize: "0.8rem",
    color: "rgba(208, 201, 141, 0.8)",
    letterSpacing: 0.3,
  },
  summaryTotal: {
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  transferButton: {
    background: "#d0c98d",
    color: "#1a2f1a",
    py: 1.2,
    borderRadius: 1,
    fontWeight: 700,
    letterSpacing: 0.5,
    "&:hover": {
      background: "#e6df9a",
      boxShadow: "0 4px 12px rgba(208, 201, 141, 0.3)",
    },
    "&:active": {
      transform: "translateY(1px)",
    },
    "&.Mui-disabled": {
      background: "rgba(208, 201, 141, 0.2)",
      color: "rgba(26, 47, 26, 0.5)",
    },
    transition: "all 0.2s ease",
  },
  transferButtonText: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: "inherit",
  },
};
