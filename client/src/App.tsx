import Box from '@mui/material/Box';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Route, Routes, } from "react-router-dom";

import { ControllerProvider, useController } from '@/contexts/controller';
import { SoundProvider } from '@/desktop/contexts/Sound';
import { SoundProvider as MobileSoundProvider } from '@/mobile/contexts/Sound';
import { GameDirector } from '@/desktop/contexts/GameDirector';
import { GameDirector as MobileGameDirector } from '@/mobile/contexts/GameDirector';
import { useUIStore } from '@/stores/uiStore';
import { isBrowser, isMobile } from 'react-device-detect';
import CustomizeGame from './mobile/components/CustomizeGame';
import CustomizeGameList from './mobile/components/CustomizeGameList';
import Header from './mobile/components/Header';
import { desktopRoutes, mobileRoutes } from './utils/routes';
import { desktopTheme, mobileTheme } from './utils/themes';
import { StatisticsProvider } from './contexts/Statistics';
import TermsOfServiceModal from '@/desktop/components/TermsOfServiceModal';
import TermsOfServiceScreen from '@/mobile/containers/TermsOfServiceScreen';

function AppContent() {
  const { useMobileClient } = useUIStore();
  const { showTermsOfService, acceptTermsOfService } = useController();
  const shouldShowMobile = isMobile || (isBrowser && useMobileClient);

  return (
    <>
      {!shouldShowMobile && showTermsOfService && (
        <TermsOfServiceModal open={showTermsOfService} onAccept={acceptTermsOfService} />
      )}
      {shouldShowMobile && showTermsOfService && (
        <TermsOfServiceScreen onAccept={acceptTermsOfService} />
      )}

      {!shouldShowMobile && (
        <ThemeProvider theme={desktopTheme}>
          <SoundProvider>
            <GameDirector>
              <Box className='main'>

                <Routes>
                  {desktopRoutes.map((route, index) => {
                    return <Route key={index} path={route.path} element={route.content} />
                  })}
                </Routes>

              </Box>
            </GameDirector>
          </SoundProvider>
        </ThemeProvider>
      )}

      {shouldShowMobile && (
        <ThemeProvider theme={mobileTheme}>
          <MobileSoundProvider>
            <Box className='bgImage'>
              <MobileGameDirector>
                <Box className='main'>
                  <Header />

                  <Routes>
                    {mobileRoutes.map((route, index) => {
                      return <Route key={index} path={route.path} element={route.content} />
                    })}
                  </Routes>

                  <CustomizeGameList />
                  <CustomizeGame />
                </Box>
              </MobileGameDirector>
            </Box>
          </MobileSoundProvider>
        </ThemeProvider>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <StyledEngineProvider injectFirst>
        <SnackbarProvider anchorOrigin={{ vertical: 'top', horizontal: 'center' }} preventDuplicate autoHideDuration={3000}>
          <ControllerProvider>
            <StatisticsProvider>
              <AppContent />
            </StatisticsProvider>
          </ControllerProvider>
        </SnackbarProvider>
      </StyledEngineProvider>
    </BrowserRouter >
  );
}

export default App;
