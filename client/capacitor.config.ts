import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'io.lootsurvivor.mobile',
    appName: 'Loot Survivor 2',
    webDir: 'dist',
    server: {
        hostname: "loot-survivor",
        androidScheme: "https",
        iosScheme: "capacitor",
    },
};

export default config;
