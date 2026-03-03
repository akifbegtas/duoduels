import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duoduels.app',
  appName: 'DuoDuels',
  webDir: 'public',
  ...(process.env.CAP_SERVER_URL
    ? {
        server: {
          url: process.env.CAP_SERVER_URL,
          cleartext: process.env.CAP_SERVER_URL.startsWith('http://')
        }
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0B0E14',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0B0E14'
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'DuoDuels',
    backgroundColor: '#0B0E14'
  },
  android: {
    backgroundColor: '#0B0E14'
  }
};

export default config;
