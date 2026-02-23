import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duoduels.app',
  appName: 'DuoDuels',
  webDir: 'public',
  server: {
    // Production'da bunu kaldır, sadece local test için
    // url: 'http://localhost:3000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f0c29',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f0c29'
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'DuoDuels',
    backgroundColor: '#0f0c29'
  },
  android: {
    backgroundColor: '#0f0c29'
  }
};

export default config;
