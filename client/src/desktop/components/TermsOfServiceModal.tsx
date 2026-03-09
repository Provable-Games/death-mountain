import { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";

interface TermsOfServiceModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TermsOfServiceModal = ({
  open,
  onAccept,
  onDecline,
}: TermsOfServiceModalProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleAccept = () => {
    if (hasAgreed) {
      if (typeof window !== "undefined") {
        localStorage.setItem("termsOfServiceAccepted", "true");
      }
      onAccept();
      setHasAgreed(false);
    }
  };

  const handleDecline = () => {
    setHasAgreed(false);
    onDecline();
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          bgcolor: "rgba(18, 18, 24, 0.98)",
          border: { xs: "none", sm: "1px solid rgba(255,255,255,0.08)" },
          borderRadius: { xs: 0, sm: "16px" },
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
          maxWidth: { xs: "100%", sm: 480 },
          m: { xs: 0, sm: 2 },
          pb: { xs: "env(safe-area-inset-bottom)", sm: 0 },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem", color: "white" }}>
          Loot Survivor - Terms of Service
        </Typography>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Introduction */}
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.7)",
            mb: 2,
            lineHeight: 1.6,
          }}
        >
          Effective Date: September 10, 2025
        </Typography>

        {/* Terms Content */}
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 2,
            p: 2,
            maxHeight: 324,
            overflowY: "auto",
            mb: 1,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 3,
            },
          }}
        >
          <Typography
            component="div"
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              "& strong": {
                color: "rgba(255,255,255,0.9)",
                fontWeight: 600,
              },
              "& ul": {
                margin: "8px 0",
                paddingLeft: "20px",
              },
              "& li": {
                marginBottom: "6px",
              },
            }}
          >
            These Terms of Service ("Terms") govern your access to and use of
            the Loot Survivor game ("Game"), including any related websites,
            smart contracts, tokens, and services (collectively, the
            "Services"). The Game is created and operated by Provable Labs Ltd.,
            a company incorporated in the British Virgin Islands ("Provable
            Labs", "we", "our", or "us").
            <br />
            <br />
            By accessing or using the Services, you agree to be bound by these
            Terms. If you do not agree, you may not participate in Loot Survivor
            2.
            <br />
            <br />
            <strong>1. Eligibility</strong>
            <ul>
              <li>
                You must be at least 18 years old, or the age of majority in
                your jurisdiction, to participate.
              </li>
              <li>
                You are solely responsible for ensuring that your participation
                in Loot Survivor complies with all laws and regulations in
                your jurisdiction.
              </li>
              <li>
                You may not participate if you are a resident of, or accessing
                the Services from, any jurisdiction where participation would be
                unlawful.
              </li>
            </ul>
            <strong>2. Game Mechanics</strong>
            <ul>
              <li>
                Loot Survivor operates entirely on blockchain-based immutable
                smart contracts.
              </li>
              <li>
                Provable Labs cannot modify, update, reverse, or otherwise
                interfere with the rules of the Game once deployed.
              </li>
              <li>
                Participation in the Game involves interaction with the SURVIVOR
                token and blockchain transactions.
              </li>
            </ul>
            <strong>3. Risk of Loss</strong>
            <br />
            All transactions and gameplay actions in Loot Survivor are final
            and irreversible.
            <br />
            <br />
            There are no refunds, reversals, chargebacks, or compensation
            mechanisms.
            <br />
            <br />
            You acknowledge and accept the full risk of loss, including but not
            limited to:
            <ul>
              <li>Loss of tokens (including SURVIVOR).</li>
              <li>
                Financial loss due to smart contract behavior, game outcomes, or
                your own mistakes.
              </li>
              <li>Potential volatility in the value of any tokens.</li>
            </ul>
            <strong>4. No Warranties</strong>
            <ul>
              <li>The Services are provided "as is" and "as available."</li>
              <li>
                Provable Labs makes no warranties, express or implied, regarding
                the Game, including but not limited to warranties of
                merchantability, fitness for a particular purpose, or
                non-infringement.
              </li>
              <li>
                Provable Labs does not guarantee that the Game will be
                error-free, uninterrupted, secure, or available at all times.
              </li>
            </ul>
            <strong>5. No Recourse</strong>
            <ul>
              <li>
                By participating in Loot Survivor, you waive all rights to
                claims or recourse against Provable Labs, the DAO, or any
                associated entities or individuals.
              </li>
              <li>
                Provable Labs bears no responsibility for losses, damages, or
                disputes that arise from your participation.
              </li>
              <li>
                You are solely responsible for safeguarding your wallet, private
                keys, and security practices.
              </li>
            </ul>
            <strong>6. Prohibited Conduct</strong>
            <br />
            You agree not to engage in any activity that:
            <ul>
              <li>Violates these Terms or applicable law.</li>
              <li>
                Seeks to exploit vulnerabilities, manipulate, or interfere with
                the Game or its smart contracts.
              </li>
              <li>
                Attempts to gain unauthorized access to systems, accounts, or
                data.
              </li>
              <li>Harasses or harms other participants.</li>
            </ul>
            <strong>7. Intellectual Property (CC0)</strong>
            <ul>
              <li>
                Loot Survivor and its related creative works are released
                under the Creative Commons CC0 Public Domain Dedication.
              </li>
              <li>
                This means you are free to copy, modify, distribute, and use the
                content of Loot Survivor, even for commercial purposes,
                without asking permission.
              </li>
              <li>
                Provable Labs makes no claim of copyright, trademark, or other
                intellectual property rights over the Loot Survivor creative
                works.
              </li>
              <li>
                This does not apply to third-party content, smart contract code,
                or trademarks that may be referenced in connection with Loot
                Survivor 2.
              </li>
            </ul>
            <strong>8. Limitation of Liability</strong>
            <br />
            To the maximum extent permitted by law:
            <ul>
              <li>
                Provable Labs shall not be liable for any indirect, incidental,
                consequential, or special damages, including but not limited to
                lost profits, lost tokens, or data loss.
              </li>
              <li>
                Total liability for any claims arising from participation shall
                not exceed the amount you directly paid to access the Services
                (if any).
              </li>
            </ul>
            <strong>9. Governing Law & Dispute Resolution</strong>
            <ul>
              <li>
                These Terms shall be governed by and construed under the laws of
                the British Virgin Islands.
              </li>
              <li>
                Any disputes arising out of these Terms shall be resolved
                exclusively in the courts of the British Virgin Islands.
              </li>
              <li>
                You agree to submit to the personal jurisdiction of such courts.
              </li>
            </ul>
            <strong>10. Changes to the Terms</strong>
            <ul>
              <li>
                Provable Labs may update these Terms at any time by posting the
                revised version.
              </li>
              <li>
                Continued participation in Loot Survivor after updates
                constitutes acceptance of the new Terms.
              </li>
            </ul>
            <strong>11. Acknowledgment</strong>
            <br />
            By participating in Loot Survivor, you confirm that you have read,
            understood, and agreed to these Terms, and that you accept all risks
            and responsibilities associated with participation.
          </Typography>
        </Box>

        {/* Agreement Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              sx={{
                color: "rgba(255,255,255,0.4)",
                "&.Mui-checked": {
                  color: "primary.main",
                },
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}
            >
              I have read and agree to the Terms of Service
            </Typography>
          }
          sx={{ mb: 1 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleDecline}
            fullWidth
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.4)",
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            onClick={handleAccept}
            disabled={!hasAgreed}
            fullWidth
            sx={{
              background: hasAgreed
                ? "linear-gradient(135deg, #F77349 0%, #D55A34 100%)"
                : undefined,
              "&:disabled": {
                bgcolor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Accept & Continue
          </Button>
        </Box>

        {/* Help Text */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            mt: 2,
            fontSize: "0.75rem",
          }}
        >
          By declining, your wallet will be disconnected.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceModal;
