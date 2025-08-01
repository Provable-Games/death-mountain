import Box from '@mui/material/Box';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter, Route, Routes, } from "react-router-dom";

import { ControllerProvider } from '@/contexts/controller';
import { SoundProvider } from '@/contexts/Sound';
import { GameDirector } from '@/desktop/contexts/GameDirector';
import { GameDirector as MobileGameDirector } from '@/mobile/contexts/GameDirector';
import { useUIStore } from '@/stores/uiStore';
import { isBrowser, isMobile } from 'react-device-detect';
import GameSettings from './mobile/components/GameSettings';
import GameSettingsList from './mobile/components/GameSettingsList';
import Header from './mobile/components/Header';
import { desktopRoutes, mobileRoutes } from './utils/routes';
import { desktopTheme, mobileTheme } from './utils/themes';
import { StatisticsProvider } from './contexts/Statistics';

function App() {
  const { useMobileClient } = useUIStore();
  const shouldShowMobile = isMobile || (isBrowser && useMobileClient);

  return (
    <BrowserRouter>
      <StyledEngineProvider injectFirst>
        <SnackbarProvider anchorOrigin={{ vertical: 'top', horizontal: 'center' }} preventDuplicate autoHideDuration={3000}>
          <ControllerProvider>
            <StatisticsProvider>

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
                  <Box className='bgImage'>
                    <SoundProvider>
                      <MobileGameDirector>
                        <Box className='main'>
                          <Header />

                          <Routes>
                            {mobileRoutes.map((route, index) => {
                              return <Route key={index} path={route.path} element={route.content} />
                            })}
                          </Routes>

                          <GameSettingsList />
                          <GameSettings />
                        </Box>
                      </MobileGameDirector>
                    </SoundProvider>
                  </Box>
                </ThemeProvider>
              )}

            </StatisticsProvider>
          </ControllerProvider>
        </SnackbarProvider>
      </StyledEngineProvider>
    </BrowserRouter>
  );
}

export default App;
