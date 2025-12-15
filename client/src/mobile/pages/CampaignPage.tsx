import { Chapter, fetchCampaign, Quest } from '@/dojo/useQuests';
import { useGameStore } from '@/stores/gameStore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import BookIcon from '@mui/icons-material/MenuBook';
import { Box, Button, CircularProgress, IconButton, Paper, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDungeon } from '@/dojo/useDungeon';

export default function CampaignPage() {
  const navigate = useNavigate();
  const dungeon = useDungeon();
  const [searchParams] = useSearchParams();
  const { setQuest } = useGameStore();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: number]: string }>({});
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaign = await fetchCampaign(1);
        // Get completed quests from localStorage
        const completedQuests = JSON.parse(localStorage.getItem('completedQuests') || '[]');

        // Update quest status based on completed quests
        const updatedCampaign = campaign.map(chapter => ({
          ...chapter,
          quests: chapter.quests.map(quest => ({
            ...quest,
            isLocked: quest.requiredQuestId ? !completedQuests.includes(quest.requiredQuestId) : false
          }))
        }));

        setChapters(updatedCampaign);

        // Check for chapter parameter in URL
        const chapterId = searchParams.get('chapter');
        if (chapterId) {
          const chapter = updatedCampaign.find(c => c.id === parseInt(chapterId));
          if (chapter && !chapter.isLocked) {
            setSelectedChapter(chapter);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();
      const newTimeRemaining: { [key: number]: string } = {};

      chapters.forEach(chapter => {
        if (chapter.unlockTime && chapter.unlockTime > now) {
          const remaining = chapter.unlockTime - now;
          const days = Math.floor(remaining / (24 * 3600000));
          const hours = Math.floor((remaining % (24 * 3600000)) / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);

          if (days > 0) {
            newTimeRemaining[chapter.id] = `${days}d ${hours}h ${minutes}m`;
          } else {
            newTimeRemaining[chapter.id] = `${hours}h ${minutes}m ${seconds}s`;
          }
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [chapters]);

  const handleChapterSelect = (chapter: Chapter) => {
    if (!chapter.isLocked) {
      setSelectedChapter(chapter);
      setSelectedQuest(null);
      // Update URL with selected chapter
      navigate(`/${dungeon.id}/campaign?chapter=${chapter.id}`, { replace: true });
    }
  };

  const handleQuestSelect = (quest: Quest) => {
    if (!quest.isLocked) {
      setSelectedQuest(quest);
    }
  };

  const isQuestCompleted = (questId: number) => {
    const completedQuests = JSON.parse(localStorage.getItem('completedQuests') || '[]');
    return completedQuests.includes(questId);
  };

  const handleStartQuest = () => {
    if (selectedQuest) {
      setQuest({
        id: selectedQuest.id,
        chapterId: selectedChapter!.id,
        targetScore: selectedQuest.targetScore,
      });
      navigate(`/${dungeon.id}/play?settingsId=${selectedQuest.settingsId}`);
    }
  };

  const handleBackToChapters = () => {
    setSelectedChapter(null);
    setSelectedQuest(null);
    navigate(`/${dungeon.id}/campaign`, { replace: true });
  };

  const renderChapterStatus = (chapter: Chapter) => {
    if (!chapter.isLocked) return null;

    return (
      <Box sx={styles.statusContainer}>
        {chapter.requiredChapterId && (
          <Box sx={styles.lockContainer}>
            <LockIcon sx={styles.lockIcon} />
            <Typography variant="body2" sx={styles.lockText}>
              Complete Chapter {chapter.requiredChapterId}
            </Typography>
          </Box>
        )}
        {chapter.unlockTime && timeRemaining[chapter.id] && (
          <Box sx={styles.timerContainer}>
            <AccessTimeIcon sx={styles.timerIcon} />
            <Typography variant="body2" sx={styles.timerText}>
              Unlocks in {timeRemaining[chapter.id]}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.bookContainer}>
        <Box sx={styles.bookHeader}>
          <BookIcon sx={styles.bookIcon} />
          <Typography variant="h3" sx={styles.title}>
            Campaign Demo
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress sx={styles.loadingSpinner} />
            <Typography variant="h6" sx={styles.loadingText}>
              Loading Campaign...
            </Typography>
          </Box>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedChapter ? (
              <motion.div
                key="chapters"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={styles.chaptersContainer}>
                  {chapters.map((chapter: Chapter) => (
                    <motion.div
                      key={chapter.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Paper
                        sx={{
                          ...styles.chapterCard,
                          ...(chapter.isLocked && styles.lockedChapter)
                        }}
                        onClick={() => handleChapterSelect(chapter)}
                      >
                        <Box sx={styles.chapterContent}>
                          <Box sx={styles.chapterHeader}>
                            <Typography variant="h5" sx={styles.chapterTitle}>
                              {chapter.title}
                            </Typography>
                            {renderChapterStatus(chapter)}
                          </Box>
                          <Box sx={styles.chapterBody}>
                            <Box sx={styles.chapterImageContainer}>
                              <img
                                src={chapter.chapterImage}
                                alt="Chapter Beast"
                                style={styles.chapterImage}
                              />
                            </Box>
                            <Typography variant="body1" sx={styles.chapterDescription}>
                              {chapter.description}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="quests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={styles.questsView}>
                  <Box sx={styles.questsHeader}>
                    <IconButton
                      onClick={handleBackToChapters}
                      sx={styles.backButton}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" sx={styles.questsTitle}>
                      {selectedChapter.title}
                    </Typography>
                  </Box>
                  <Box sx={styles.questsList}>
                    {selectedChapter.quests.map((quest: Quest, index: number) => (
                      <motion.div
                        key={quest.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Paper
                          sx={{
                            ...styles.questCard,
                            ...(selectedQuest?.id === quest.id && styles.selectedQuest),
                            ...(quest.isLocked && styles.lockedQuest),
                          }}
                          onClick={() => handleQuestSelect(quest)}
                        >
                          <Box sx={styles.questContent}>
                            <Box sx={styles.questHeader}>
                              <Box sx={styles.questTitleContainer}>
                                <Typography variant="h6" sx={styles.questTitle}>
                                  Quest {quest.id}: {quest.title}
                                </Typography>
                                {isQuestCompleted(quest.id) && (
                                  <CheckCircleIcon sx={styles.checkIcon} />
                                )}
                              </Box>
                              {quest.isLocked && (
                                <Box sx={styles.lockContainer}>
                                  <LockIcon sx={styles.lockIcon} />
                                  <Typography variant="body2" sx={styles.lockText}>
                                    Complete Quest {quest.requiredQuestId}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <Box sx={styles.beastContainer}>
                              <Box sx={styles.beastImageContainer}>
                                <img
                                  src={quest.beastImage}
                                  alt="Quest Beast"
                                  style={styles.beastImage}
                                />
                              </Box>
                              <Typography variant="body1" sx={styles.questDescription}>
                                {quest.description}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {selectedQuest && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px',
              background: 'linear-gradient(to top, rgba(17, 17, 17, 0.95), rgba(17, 17, 17, 0.8), transparent)',
              zIndex: 10,
            }}
          >
            <Box sx={styles.actionContainer}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartQuest}
                sx={styles.startButton}
              >
                Begin Quest
              </Button>
            </Box>
          </motion.div>
        )}
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    width: isMobile ? '100%' : '450px',
    maxWidth: '100vw',
    height: isMobile ? '100dvh' : 'calc(100dvh - 50px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: isMobile ? '8px' : '12px',
    pr: 0,
    boxSizing: 'border-box',
    gap: 2,
    background: 'rgba(17, 17, 17, 0.95)',
    border: isMobile ? 'none' : '3px solid rgba(34, 34, 34, 1)',
    overflow: 'hidden',
    margin: '0 auto',
  },
  bookContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? 1 : 2,
    overflowY: 'auto',
    overflowX: 'hidden',
    pr: isMobile ? '4px' : '8px',
    boxSizing: 'border-box',
  },
  bookHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  bookIcon: {
    color: '#80FF00',
    fontSize: '2rem',
  },
  title: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
    textAlign: 'center',
    fontSize: isMobile ? '1.4rem' : '1.8rem',
  },
  chaptersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    padding: '10px 0 10px',
  },
  chapterCard: {
    width: '100%',
    padding: isMobile ? '12px' : '16px',
    boxSizing: 'border-box',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.08), rgba(128, 255, 0, 0.03))',
    borderRadius: isMobile ? '8px' : '12px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.12), rgba(128, 255, 0, 0.05))',
    },
  },
  chapterContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  chapterHeader: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 1,
    gap: 1,
  },
  chapterTitle: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
    fontSize: '1.2rem',
  },
  chapterBody: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
  },
  chapterImageContainer: {
    width: isMobile ? '80px' : '100px',
    height: isMobile ? '80px' : '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  chapterImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    filter: 'drop-shadow(0 0 8px rgba(128, 255, 0, 0.3))',
  },
  chapterDescription: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.9rem',
    fontFamily: 'VT323, monospace',
    flex: 1,
  },
  selectedChapter: {
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.15), rgba(128, 255, 0, 0.08))',
    border: '1px solid rgba(128, 255, 0, 0.4)',
    boxShadow: '0 0 20px rgba(128, 255, 0, 0.2)',
    '& $chapterImageContainer': {
      border: '1px solid rgba(128, 255, 0, 0.4)',
      boxShadow: '0 0 10px rgba(128, 255, 0, 0.2)',
    },
  },
  lockedChapter: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  questsView: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
    overflow: 'hidden'
  },
  questsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    marginBottom: 1,
  },
  backButton: {
    color: '#80FF00',
    padding: '4px',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.1)',
    },
  },
  questsTitle: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
    fontSize: '1.4rem',
  },
  questsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    paddingBottom: '80px',
  },
  questCard: {
    padding: isMobile ? '8px' : '12px',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.06), rgba(128, 255, 0, 0.02))',
    borderRadius: isMobile ? '8px' : '10px',
    border: '1px solid rgba(128, 255, 0, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.1), rgba(128, 255, 0, 0.04))',
    },
  },
  questContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  questHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 1,
    gap: 1,
  },
  questTitle: {
    color: '#80FF00',
    fontWeight: 'bold',
    textShadow: '0 0 6px rgba(128, 255, 0, 0.3)',
    fontSize: '1rem',
  },
  questDescription: {
    color: 'rgba(128, 255, 0, 0.7)',
    fontSize: '0.85rem',
    fontFamily: 'VT323, monospace',
  },
  lockContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    padding: '2px 6px',
    background: 'rgba(237, 207, 51, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(237, 207, 51, 0.2)',
  },
  lockIcon: {
    color: '#EDCF33',
    fontSize: '1rem',
  },
  lockText: {
    color: '#EDCF33',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  },
  actionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    maxWidth: '450px',
    margin: '0 auto',
  },
  startButton: {
    padding: isMobile ? '6px 20px' : '8px 24px',
    fontSize: isMobile ? '1rem' : '1.1rem',
    fontFamily: 'VT323, monospace',
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.9), rgba(128, 255, 0, 0.7))',
    '&:hover': {
      background: 'linear-gradient(145deg, rgba(128, 255, 0, 1), rgba(128, 255, 0, 0.8))',
    },
    width: isMobile ? '160px' : '200px',
  },
  beastContainer: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
  },
  beastImageContainer: {
    width: isMobile ? '60px' : '80px',
    height: isMobile ? '60px' : '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  beastImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    filter: 'drop-shadow(0 0 8px rgba(128, 255, 0, 0.3))',
  },
  selectedQuest: {
    background: 'linear-gradient(145deg, rgba(128, 255, 0, 0.12), rgba(128, 255, 0, 0.06))',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    boxShadow: '0 0 15px rgba(128, 255, 0, 0.15)',
    '& $beastImageContainer': {
      border: '1px solid rgba(128, 255, 0, 0.4)',
      boxShadow: '0 0 10px rgba(128, 255, 0, 0.2)',
    },
  },
  lockedQuest: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
    marginTop: 0.5,
    flexWrap: 'wrap',
  },
  timerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    padding: '2px 6px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  timerIcon: {
    color: '#80FF00',
    fontSize: '1rem',
  },
  timerText: {
    color: '#80FF00',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
    width: '100%',
  },
  loadingSpinner: {
    color: '#80FF00',
  },
  loadingText: {
    color: '#80FF00',
    fontFamily: 'VT323, monospace',
    textShadow: '0 0 8px rgba(128, 255, 0, 0.3)',
  },
  videoModal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    padding: isMobile ? '16px' : '24px',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: isMobile ? '100%' : '800px',
    background: 'rgba(0, 0, 0, 0.95)',
    borderRadius: isMobile ? '8px' : '12px',
    padding: isMobile ? '12px' : '20px',
    boxShadow: '0 0 10px rgba(128, 255, 0, 0.3)',
    border: '1px solid rgba(128, 255, 0, 0.3)',
    maxHeight: isMobile ? '80vh' : '90vh',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    maxHeight: isMobile ? 'calc(80vh - 40px)' : 'calc(90vh - 40px)',
    objectFit: 'contain' as const,
  },
  closeButton: {
    position: 'absolute',
    top: isMobile ? '4px' : '24px',
    right: isMobile ? '4px' : '24px',
    color: '#80FF00',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: isMobile ? '4px' : '8px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    zIndex: 2,
  },
  questTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  checkIcon: {
    color: '#80FF00',
    fontSize: '1.5rem',
  },
  completedContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    padding: '2px 6px',
    background: 'rgba(128, 255, 0, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(128, 255, 0, 0.2)',
  },
  completedText: {
    color: '#80FF00',
    fontSize: '0.8rem',
    fontFamily: 'VT323, monospace',
  }
};
