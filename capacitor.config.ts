import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elasticsearch.manager',
  appName: 'ES Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      '*'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1890ff",
      androidSplashResourceName: "splash",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  }
};

export default config;