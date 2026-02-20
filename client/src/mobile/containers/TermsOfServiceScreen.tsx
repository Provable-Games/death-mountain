import React, { useState } from "react";
import { Box, Button, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { motion } from "framer-motion";

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface TermsOfServiceScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({
  onAccept,
  onDecline,
}) => {
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
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      style={styles.container as any}
    >
      <Box sx={styles.innerContainer}>
        <Box sx={styles.header}>
          <Typography sx={styles.title}>
            Loot Survivor 2 - Terms of Service
          </Typography>
        </Box>

        <Box sx={styles.content}>
          <Typography sx={styles.effectiveDate}>
            Effective Date: September 10, 2025
          </Typography>

          <Box sx={styles.scrollableContent}>
            <Typography
              component="div"
              sx={styles.termsText}
            >
              These Terms of Service ("Terms") govern your access to and use of
              the Loot Survivor 2 game ("Game"), including any related websites,
              smart contracts, tokens, and services (collectively, the
              "Services"). The Game is created and operated by Provable Labs
              Ltd., a company incorporated in the British Virgin Islands
              ("Provable Labs", "we", "our", or "us").
              <br />
              <br />
              By accessing or using the Services, you agree to be bound by these
              Terms. If you do not agree, you may not participate in Loot
              Survivor 2.
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
                  in Loot Survivor 2 complies with all laws and regulations in
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
                  Loot Survivor 2 operates entirely on blockchain-based immutable
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
              All transactions and gameplay actions in Loot Survivor 2 are final
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
                  By participating in Loot Survivor 2, you waive all rights to
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
                  Loot Survivor 2 and its related creative works are released
                  under the Creative Commons CC0 Public Domain Dedication.
                </li>
                <li>
                  This means you are free to copy, modify, distribute, and use the
                  content of Loot Survivor 2, even for commercial purposes,
                  without asking permission.
                </li>
                <li>
                  Provable Labs makes no claim of copyright, trademark, or other
                  intellectual property rights over the Loot Survivor 2 creative
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
                  Continued participation in Loot Survivor 2 after updates
                  constitutes acceptance of the new Terms.
                </li>
              </ul>
              <strong>11. Acknowledgment</strong>
              <br />
              By participating in Loot Survivor 2, you confirm that you have read,
              understood, and agreed to these Terms, and that you accept all risks
              and responsibilities associated with participation.
            </Typography>
          </Box>
        </Box>

        <Box sx={styles.footer}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  "&.Mui-checked": {
                    color: "#F77349",
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
                I have read and agree to the Terms of Service
              </Typography>
            }
            sx={{ mb: 1.5, mx: 0 }}
          />

          <Box sx={styles.buttonContainer}>
            <Button
              sx={styles.declineButton}
              onClick={handleDecline}
              variant="outlined"
            >
              Decline
            </Button>
            <Button
              sx={{
                ...styles.acceptButton,
                background: hasAgreed
                  ? "linear-gradient(135deg, #F77349 0%, #D55A34 100%)"
                  : "rgba(255,255,255,0.1)",
                color: hasAgreed ? "#fff" : "rgba(255,255,255,0.3)",
              }}
              onClick={handleAccept}
              disabled={!hasAgreed}
              variant="contained"
            >
              Accept & Continue
            </Button>
          </Box>

          <Typography sx={styles.helpText}>
            By declining, your wallet will be disconnected.
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

export default TermsOfServiceScreen;

const styles = {
  container: {
    width: "100%",
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(18, 18, 24, 0.98)",
    color: "#fff",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  innerContainer: {
    width: "100%",
    maxWidth: "800px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "env(safe-area-inset-top, 0px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: 600,
    textAlign: "center",
    color: "#fff",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
  },
  effectiveDate: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "12px",
    lineHeight: 1.6,
  },
  scrollableContent: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "12px",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255,255,255,0.2)",
      borderRadius: "3px",
    },
  },
  termsText: {
    fontSize: "0.85rem",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.6)",
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
  },
  footer: {
    backgroundColor: "rgba(18, 18, 24, 0.98)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "16px 20px",
    paddingBottom: "max(16px, env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  buttonContainer: {
    display: "flex",
    gap: "12px",
    width: "100%",
  },
  declineButton: {
    flex: 1,
    padding: "12px",
    borderColor: "rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.9rem",
    fontWeight: 500,
    textTransform: "none",
    borderRadius: "8px",
    "&:hover": {
      borderColor: "rgba(255,255,255,0.4)",
      backgroundColor: "rgba(255,255,255,0.05)",
    },
  },
  acceptButton: {
    flex: 1,
    padding: "12px",
    fontSize: "0.9rem",
    fontWeight: 500,
    textTransform: "none",
    borderRadius: "8px",
    "&:disabled": {
      backgroundColor: "rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.3)",
    },
  },
  helpText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    marginTop: "12px",
    fontSize: "0.75rem",
  },
};
