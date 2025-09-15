import React from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface TermsOfServiceScreenProps {
  onAccept: () => void;
}

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({
  onAccept,
}) => {
  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("termsOfServiceAccepted", "true");
    }
    onAccept();
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
            LOOT SURVIVOR 2 - TERMS OF SERVICE
          </Typography>
        </Box>

        <Box sx={styles.content}>
          <Box sx={styles.section}>
            <Typography sx={styles.text}>
              EFFECTIVE DATE: SEPTEMBER 10, 2025
            </Typography>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.text}>
              These Terms of Service ("Terms") govern your access to and use of
              the Loot Survivor 2 game ("Game"), including any related websites,
              smart contracts, tokens, and services (collectively, the
              "Services"). The Game is created and operated by Provable Labs
              Ltd., a company incorporated in the British Virgin Islands
              ("Provable Labs", "we", "our", or "us").
            </Typography>
            <Typography sx={styles.text}>
              By accessing or using the Services, you agree to be bound by these
              Terms. If you do not agree, you may not participate in Loot
              Survivor 2.
            </Typography>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>1. ELIGIBILITY</Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>2. GAME MECHANICS</Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>3. RISK OF LOSS</Typography>
            <Typography sx={styles.text}>
              All transactions and gameplay actions in Loot Survivor 2 are final
              and irreversible.
            </Typography>
            <Typography sx={styles.text}>
              There are no refunds, reversals, chargebacks, or compensation
              mechanisms.
            </Typography>
            <Typography sx={styles.text}>
              You acknowledge and accept the full risk of loss, including but
              not limited to:
            </Typography>
            <Box component="ul" sx={styles.list}>
              <li>Loss of tokens (including SURVIVOR).</li>
              <li>
                Financial loss due to smart contract behavior, game outcomes, or
                your own mistakes.
              </li>
              <li>Potential volatility in the value of any tokens.</li>
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>4. NO WARRANTIES</Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>5. NO RECOURSE</Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              6. PROHIBITED CONDUCT
            </Typography>
            <Typography sx={styles.text}>
              You agree not to engage in any activity that:
            </Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              7. INTELLECTUAL PROPERTY (CC0)
            </Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              8. LIMITATION OF LIABILITY
            </Typography>
            <Typography sx={styles.text}>
              To the maximum extent permitted by law:
            </Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              9. GOVERNING LAW & DISPUTE RESOLUTION
            </Typography>
            <Box component="ul" sx={styles.list}>
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
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              10. CHANGES TO THE TERMS
            </Typography>
            <Box component="ul" sx={styles.list}>
              <li>
                Provable Labs may update these Terms at any time by posting the
                revised version.
              </li>
              <li>
                Continued participation in Loot Survivor 2 after updates
                constitutes acceptance of the new Terms.
              </li>
            </Box>
          </Box>

          <Box sx={styles.section}>
            <Typography sx={styles.sectionTitle}>11. ACKNOWLEDGMENT</Typography>
            <Typography sx={styles.text}>
              By participating in Loot Survivor 2, you confirm that you have
              read, understood, and agreed to these Terms, and that you accept
              all risks and responsibilities associated with participation.
            </Typography>
          </Box>
        </Box>

        <Box sx={styles.footer}>
          <Button
            sx={styles.acceptButton}
            onClick={handleAccept}
            variant="contained"
          >
            I ACCEPT THE TERMS
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

export default TermsOfServiceScreen;

const styles = {
  container: {
    width: "100%",
    height: "100dvh", // Use dynamic viewport height for mobile browsers
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0a0a0a",
    color: "#80FF00",
    fontFamily: "VT323, monospace",
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
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  header: {
    padding: "20px",
    borderBottom: "2px solid #80FF00",
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: "1px",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    paddingBottom: "100px",
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#0a0a0a",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#80FF00",
      borderRadius: "4px",
    },
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#80FF00",
  },
  text: {
    fontSize: "16px",
    lineHeight: 1.5,
    marginBottom: "10px",
    color: "#ffffff",
  },
  list: {
    paddingLeft: "20px",
    marginBottom: "10px",
    "& li": {
      marginBottom: "8px",
      fontSize: "16px",
      color: "#ffffff",
    },
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0a0a0a",
    borderTop: "2px solid #80FF00",
    padding: "20px",
    paddingBottom: "max(20px, env(safe-area-inset-bottom))", // Account for iPhone notch/home indicator
    display: "flex",
    justifyContent: "center",
  },
  acceptButton: {
    width: "90%",
    maxWidth: "300px",
    padding: "15px",
    backgroundColor: "#80FF00",
    color: "#0a0a0a",
    fontSize: "20px",
    fontWeight: "bold",
    fontFamily: "VT323, monospace",
    border: "2px solid #80FF00",
    borderRadius: "4px",
    letterSpacing: "1px",
    "&:hover": {
      backgroundColor: "#0a0a0a",
      color: "#80FF00",
    },
    "&:active": {
      transform: "scale(0.98)",
    },
  },
};
