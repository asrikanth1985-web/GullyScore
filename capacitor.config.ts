
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gullyscore.cricket.v2',
  appName: 'GullyScore',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
