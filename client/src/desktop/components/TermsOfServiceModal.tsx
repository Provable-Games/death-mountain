import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';

interface TermsOfServiceModalProps {
  open: boolean;
  onAccept: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ open, onAccept }) => {
  const [scroll, setScroll] = useState<'paper' | 'body'>('paper');

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('termsOfServiceAccepted', 'true');
    }
    onAccept();
  };


  return (
    <Dialog
      open={open}
      onClose={() => { }}
      scroll={scroll}
      sx={styles.dialog}
      disableEscapeKeyDown
      fullWidth
    >
      <DialogContent sx={styles.content}>
        <Typography sx={styles.title}>Loot Survivor 2 - Terms of Service</Typography>

        <Typography sx={styles.text}>
          Effective Date: September 10, 2025
        </Typography>

        <Typography sx={styles.text}>
          These Terms of Service ("Terms") govern your access to and use of the Loot Survivor 2 game ("Game"), including any related websites, smart contracts, tokens, and services (collectively, the "Services"). The Game is created and operated by Provable Labs Ltd., a company incorporated in the British Virgin Islands ("Provable Labs", "we", "our", or "us").
        </Typography>

        <Typography sx={styles.text}>
          By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, you may not participate in Loot Survivor 2.
        </Typography>

        <Typography sx={styles.sectionTitle}>1. Eligibility</Typography>
        <Box component="ul" sx={styles.list}>
          <li>You must be at least 18 years old, or the age of majority in your jurisdiction, to participate.</li>
          <li>You are solely responsible for ensuring that your participation in Loot Survivor 2 complies with all laws and regulations in your jurisdiction.</li>
          <li>You may not participate if you are a resident of, or accessing the Services from, any jurisdiction where participation would be unlawful.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>2. Game Mechanics</Typography>
        <Box component="ul" sx={styles.list}>
          <li>Loot Survivor 2 operates entirely on blockchain-based immutable smart contracts.</li>
          <li>Provable Labs cannot modify, update, reverse, or otherwise interfere with the rules of the Game once deployed.</li>
          <li>Participation in the Game involves interaction with the SURVIVOR token and blockchain transactions.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>3. Risk of Loss</Typography>
        <Typography sx={styles.text}>
          All transactions and gameplay actions in Loot Survivor 2 are final and irreversible.
        </Typography>
        <Typography sx={styles.text}>
          There are no refunds, reversals, chargebacks, or compensation mechanisms.
        </Typography>
        <Typography sx={styles.text}>
          You acknowledge and accept the full risk of loss, including but not limited to:
        </Typography>
        <Box component="ul" sx={styles.list}>
          <li>Loss of tokens (including SURVIVOR).</li>
          <li>Financial loss due to smart contract behavior, game outcomes, or your own mistakes.</li>
          <li>Potential volatility in the value of any tokens.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>4. No Warranties</Typography>
        <Box component="ul" sx={styles.list}>
          <li>The Services are provided "as is" and "as available."</li>
          <li>Provable Labs makes no warranties, express or implied, regarding the Game, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</li>
          <li>Provable Labs does not guarantee that the Game will be error-free, uninterrupted, secure, or available at all times.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>5. No Recourse</Typography>
        <Box component="ul" sx={styles.list}>
          <li>By participating in Loot Survivor 2, you waive all rights to claims or recourse against Provable Labs, the DAO, or any associated entities or individuals.</li>
          <li>Provable Labs bears no responsibility for losses, damages, or disputes that arise from your participation.</li>
          <li>You are solely responsible for safeguarding your wallet, private keys, and security practices.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>6. Prohibited Conduct</Typography>
        <Typography sx={styles.text}>
          You agree not to engage in any activity that:
        </Typography>
        <Box component="ul" sx={styles.list}>
          <li>Violates these Terms or applicable law.</li>
          <li>Seeks to exploit vulnerabilities, manipulate, or interfere with the Game or its smart contracts.</li>
          <li>Attempts to gain unauthorized access to systems, accounts, or data.</li>
          <li>Harasses or harms other participants.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>7. Intellectual Property (CC0)</Typography>
        <Box component="ul" sx={styles.list}>
          <li>Loot Survivor 2 and its related creative works are released under the Creative Commons CC0 Public Domain Dedication.</li>
          <li>This means you are free to copy, modify, distribute, and use the content of Loot Survivor 2, even for commercial purposes, without asking permission.</li>
          <li>Provable Labs makes no claim of copyright, trademark, or other intellectual property rights over the Loot Survivor 2 creative works.</li>
          <li>This does not apply to third-party content, smart contract code, or trademarks that may be referenced in connection with Loot Survivor 2.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>8. Limitation of Liability</Typography>
        <Typography sx={styles.text}>
          To the maximum extent permitted by law:
        </Typography>
        <Box component="ul" sx={styles.list}>
          <li>Provable Labs shall not be liable for any indirect, incidental, consequential, or special damages, including but not limited to lost profits, lost tokens, or data loss.</li>
          <li>Total liability for any claims arising from participation shall not exceed the amount you directly paid to access the Services (if any).</li>
        </Box>

        <Typography sx={styles.sectionTitle}>9. Governing Law & Dispute Resolution</Typography>
        <Box component="ul" sx={styles.list}>
          <li>These Terms shall be governed by and construed under the laws of the British Virgin Islands.</li>
          <li>Any disputes arising out of these Terms shall be resolved exclusively in the courts of the British Virgin Islands.</li>
          <li>You agree to submit to the personal jurisdiction of such courts.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>10. Changes to the Terms</Typography>
        <Box component="ul" sx={styles.list}>
          <li>Provable Labs may update these Terms at any time by posting the revised version.</li>
          <li>Continued participation in Loot Survivor 2 after updates constitutes acceptance of the new Terms.</li>
        </Box>

        <Typography sx={styles.sectionTitle}>11. Acknowledgment</Typography>
        <Typography sx={styles.text}>
          By participating in Loot Survivor 2, you confirm that you have read, understood, and agreed to these Terms, and that you accept all risks and responsibilities associated with participation.
        </Typography>

        <Button sx={styles.acceptButton} onClick={handleAccept}>
          I Accept the Terms of Service
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceModal;

const styles = {
  dialog: {
    '& .MuiDialog-paper': {
      background: 'rgba(14, 24, 14, 0.95)',
      backdropFilter: 'blur(8px)',
      border: '2px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      maxWidth: '800px',
      width: '90%',
      color: '#d0c98d',
      fontFamily: 'Cinzel, Georgia, serif',
    },
  },
  content: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: '70vh',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '4px',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.5)',
      },
    },
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#e8d7b9',
  },
  text: {
    fontSize: '1rem',
    lineHeight: 1.6,
    marginBottom: '10px',
    color: '#c5b89c',
  },
  list: {
    my: 0,
    paddingLeft: '20px',
    '& li': {
      marginBottom: '8px',
      color: '#c5b89c',
    },
  },
  acceptButton: {
    background: 'linear-gradient(135deg, rgba(24, 40, 24, 1) 0%, rgba(34, 60, 34, 1) 100%)',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '8px',
    padding: '12px 40px',
    fontSize: '1.1rem',
    fontFamily: 'Cinzel, Georgia, serif',
    color: '#d0c98d',
    fontWeight: 'bold',
    textTransform: 'none',
    alignSelf: 'center',
    marginTop: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, rgba(34, 60, 34, 1) 0%, rgba(44, 80, 44, 1) 100%)',
      border: '2px solid rgba(255, 255, 255, 0.4)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
};
