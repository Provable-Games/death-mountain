import { useGameStore } from '@/stores/gameStore';
import { useMarketStore } from '@/stores/marketStore';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Tooltip } from '@mui/material';
import { useEffect } from 'react';

interface BottomNavProps {
  activeNavItem: 'GAME' | 'CHARACTER' | 'MARKET' | 'SETTINGS';
  setActiveNavItem: (item: 'GAME' | 'CHARACTER' | 'MARKET' | 'SETTINGS') => void;
}

export default function BottomNav({ activeNavItem, setActiveNavItem }: BottomNavProps) {
  const { adventurer, marketItemIds, newMarket, setNewMarket, setNewInventoryItems } = useGameStore();

  const { cart, inProgress, clearCart, setInProgress } = useMarketStore();

  useEffect(() => {
    if (inProgress) {
      if (cart.items.length > 0) {
        setNewInventoryItems(cart.items.map(item => item.id));
        setActiveNavItem('CHARACTER');
      } else {
        setActiveNavItem('GAME');
      }

      setInProgress(false);
    }

    clearCart();
  }, [marketItemIds, adventurer?.gold, adventurer?.stats?.charisma]);

  const isMarketAvailable = adventurer?.beast_health === 0 && adventurer?.stat_upgrades_available === 0;
  const marketTooltipText = adventurer?.beast_health! > 0
    ? 'Not available during battle'
    : adventurer?.stat_upgrades_available! > 0
      ? 'Not available during stat selection'
      : '';

  const navItems = [
    {
      key: 'GAME',
      icon: <img src={'/images/mobile/play.png'} alt="Game" style={{ height: 32 }} />,
      onClick: () => setActiveNavItem('GAME'),
      active: activeNavItem === 'GAME'
    },
    {
      key: 'CHARACTER',
      icon: <img src={'/images/mobile/adventurer.png'} alt="Adventurer" style={{ height: 32 }} />,
      onClick: () => setActiveNavItem('CHARACTER'),
      active: activeNavItem === 'CHARACTER'
    },
    {
      key: 'MARKET',
      icon: <img src={'/images/mobile/market.png'} alt="Market" style={{ height: 32 }} />,
      onClick: () => { setActiveNavItem('MARKET'); setNewMarket(false); },
      active: activeNavItem === 'MARKET',
      hasNew: newMarket,
      disabled: !isMarketAvailable,
      tooltip: marketTooltipText
    },
    {
      key: 'SETTINGS',
      icon: <SettingsIcon sx={{
        height: 24,
        width: 24,
        opacity: 1,
        color: 'rgba(128, 255, 0, 1)'
      }} />,
      onClick: () => setActiveNavItem('SETTINGS'),
      active: activeNavItem === 'SETTINGS',
      tooltip: 'Settings'
    }
  ];

  return (
    <>
      <Box sx={styles.navContainer}>
        <Box sx={styles.mainNavItems}>
          {navItems.slice(0, 3).map((item) => {
            return item.tooltip ? (
              <Tooltip
                key={item.key}
                title={item.tooltip}
              >
                <Box
                  sx={{
                    ...styles.navItem,
                    opacity: item.disabled ? 0.3 : item.active ? 1 : 0.7,
                    cursor: item.disabled ? 'default' : 'pointer',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': item.disabled ? {} : {
                      opacity: 1,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={item.disabled ? undefined : item.onClick}
                >
                  <Box
                    sx={{
                      ...styles.navIcon,
                      backgroundColor: item.active ? 'rgba(128, 255, 0, 0.1)' : 'transparent',
                      border: `1px solid ${item.active ? 'rgba(128, 255, 0, 0.2)' : 'rgba(128, 255, 0, 0.1)'}`,
                      boxShadow: item.active ? '0 0 10px rgba(128, 255, 0, 0.2)' : 'none',
                      '&:hover': item.disabled ? {} : {
                        backgroundColor: 'rgba(128, 255, 0, 0.15)',
                        border: '1px solid rgba(128, 255, 0, 0.3)',
                        boxShadow: '0 0 15px rgba(128, 255, 0, 0.3)'
                      }
                    }}
                  >
                    {item.icon}
                    {item.key === 'MARKET' && item.hasNew && (
                      <Box sx={styles.newIndicator}>!</Box>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            ) : (
              <Box
                key={item.key}
                sx={{
                  ...styles.navItem,
                  opacity: item.active ? 1 : 0.7,
                  cursor: 'pointer'
                }}
                onClick={item.onClick}
              >
                <Box
                  sx={{
                    ...styles.navIcon,
                    backgroundColor: item.active ? 'rgba(128, 255, 0, 0.1)' : 'transparent',
                    border: `1px solid ${item.active ? 'rgba(128, 255, 0, 0.2)' : 'rgba(128, 255, 0, 0.1)'}`,
                    boxShadow: item.active ? '0 0 10px rgba(128, 255, 0, 0.2)' : 'none',
                  }}
                >
                  {item.icon}
                  {item.key === 'MARKET' && item.hasNew && (
                    <Box sx={styles.newIndicator}>!</Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
        <Box sx={styles.settingsContainer}>
          <Box
            sx={{
              ml: 1,
              ...styles.navItem,
              opacity: navItems[3].active ? 1 : 0.5,
              cursor: 'pointer',
              '&:hover': {
                opacity: 1
              }
            }}
            onClick={navItems[3].onClick}
          >
            {navItems[3].icon}
          </Box>
        </Box>
      </Box>
    </>
  );
}

const styles = {
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '64px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    boxSizing: 'border-box',
    zIndex: 1000,
  },
  mainNavItems: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: '32px',
    flex: 1,
  },
  settingsContainer: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    pb: 0.5,
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'all 0.2s ease',
    position: 'relative',
    '&:hover': {
      opacity: 1,
      transform: 'translateY(-2px)'
    }
  },
  navIcon: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(128, 255, 0, 0.15)',
      border: '1px solid rgba(128, 255, 0, 0.3)',
      boxShadow: '0 0 15px rgba(128, 255, 0, 0.3)'
    }
  },
  newIndicator: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 14,
    height: 14,
    background: 'radial-gradient(circle, #80FF00 60%, #2d3c00 100%)',
    borderRadius: '50%',
    border: '2px solid #222',
    boxShadow: '0 0 8px #80FF00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#222',
    fontWeight: 'bold',
    zIndex: 2
  }
};
