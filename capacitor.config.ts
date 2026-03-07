import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexus.ide',
  appName: 'Nexus IDE',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
